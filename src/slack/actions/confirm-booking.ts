import { WebClient } from '@slack/web-api';
import { PrismaClient } from '@prisma/client';
import { atlasClient } from '../../services/atlas';
import { fluxaClient } from '../../services/fluxa';

const prisma = new PrismaClient();

export async function handleConfirmBooking(client: WebClient, body: any) {
  const orderId = body.actions[0].value;
  const userId = body.user.id;
  const channelId = body.channel.id;
  const messageTs = body.message.ts;

  try {
    // 查找订单
    const order = await prisma.tempOrder.findUnique({
      where: { id: orderId },
    });

    if (!order || order.slackUserId !== userId) {
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: '❌ Order not found or unauthorized.',
      });
      return;
    }

    if (!order.sessionId) {
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: '❌ Session expired. Please search again.',
      });
      return;
    }

    // 更新消息显示"处理中"
    await client.chat.update({
      channel: channelId,
      ts: messageTs,
      text: '⏳ Creating order...',
      blocks: [],
    });

    // TODO: 这里需要从Slack用户获取乘客信息
    // 简化版本:使用mock数据
    const passengerInfo = {
      firstName: 'Cynthia',
      lastName: 'Xu',
      gender: 'F' as const,
      birthDate: '1990-01-01',
      nationality: 'CN',
      passportNumber: 'E12345678',
      passportExpiry: '2030-12-31',
    };

    const contactInfo = {
      email: 'cynthia@fluxapay.xyz',
      phone: '+8613800138000',
    };

    // 创建Atlas订单
    const { orderNo } = await atlasClient.createOrder({
      sessionId: order.sessionId,
      passenger: passengerInfo,
      contact: contactInfo,
    });

    // 更新订单
    await prisma.tempOrder.update({
      where: { id: orderId },
      data: {
        atlasOrderNo: orderNo,
        status: 'ordering',
      },
    });

    const flight = order.flightData as any;

    // 创建USDC支付链接
    const paymentLink = await fluxaClient.createPaymentLink({
      amount: flight.price,
      currency: flight.currency,
      description: `Flight ${flight.airline}${flight.flightNumber}`,
      metadata: {
        orderId,
        atlasOrderNo: orderNo,
        userId,
      },
    });

    // 保存支付链接ID
    await prisma.tempOrder.update({
      where: { id: orderId },
      data: {
        paymentLinkId: paymentLink.id,
        status: 'paying',
      },
    });

    // 上传二维码图片到Slack
    const qrImageBuffer = Buffer.from(
      paymentLink.qrCode.replace(/^data:image\/png;base64,/, ''),
      'base64'
    );

    const uploadResult = await client.files.uploadV2({
      channel_id: channelId,
      file: qrImageBuffer,
      filename: 'payment-qr.png',
      title: 'Payment QR Code',
      initial_comment: `💳 *Order Created!*\n\n` +
        `Order #: \`${orderNo}\`\n` +
        `Amount: $${flight.price} ${flight.currency}\n\n` +
        `Please scan the QR code to pay with USDC (Base network)\n\n` +
        `⏱️ Payment valid for 15 minutes`,
    });

    // 发送支付说明
    await client.chat.postMessage({
      channel: channelId,
      text: `Or send USDC to:\n\`${process.env.FLUXA_WALLET_ADDRESS}\`\nAmount: ${flight.price} USDC`,
      thread_ts: uploadResult.file?.shares?.public?.[channelId]?.[0]?.ts,
    });

    // 启动支付监听(轮询)
    startPaymentPolling(orderId, paymentLink.id, client, channelId);
  } catch (error: any) {
    console.error('Confirm booking error:', error);
    await client.chat.postMessage({
      channel: channelId,
      text: `❌ Booking failed: ${error.message}`,
    });
  }
}

/**
 * 轮询支付状态
 */
function startPaymentPolling(
  orderId: string,
  paymentLinkId: string,
  client: WebClient,
  channelId: string
) {
  const maxAttempts = 90; // 15分钟 (每10秒一次)
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;

    try {
      const payment = await fluxaClient.checkPayment(paymentLinkId);

      if (payment.paid) {
        clearInterval(interval);

        // 更新订单状态
        await prisma.tempOrder.update({
          where: { id: orderId },
          data: { status: 'paid' },
        });

        // 通知用户
        await client.chat.postMessage({
          channel: channelId,
          text: '✅ Payment confirmed! Processing ticket...',
        });

        // 调用Atlas支付接口
        const order = await prisma.tempOrder.findUnique({
          where: { id: orderId },
        });

        if (order?.atlasOrderNo) {
          await atlasClient.pay(order.atlasOrderNo);
          
          await client.chat.postMessage({
            channel: channelId,
            text: '⏳ Ticket being issued... You will be notified when ready.',
          });
        }
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        await client.chat.postMessage({
          channel: channelId,
          text: '⏰ Payment timeout. Order cancelled.',
        });
      }
    } catch (error) {
      console.error('Payment polling error:', error);
    }
  }, 10000); // 每10秒检查一次
}

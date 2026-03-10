import { WebClient } from '@slack/web-api';
import { PrismaClient } from '@prisma/client';
import { atlasClient } from '../../services/atlas';

const prisma = new PrismaClient();

export async function handleSelectFlight(client: WebClient, body: any) {
  const orderId = body.actions[0].value;
  const userId = body.user.id;
  const channelId = body.channel.id;

  try {
    // 查找临时订单
    const order = await prisma.tempOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: '❌ Order expired or not found. Please search again.',
      });
      return;
    }

    if (order.slackUserId !== userId) {
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: '❌ This is not your order.',
      });
      return;
    }

    // 验证价格
    await client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: '⏳ Verifying price...',
    });

    const verification = await atlasClient.verify(order.routingId);

    if (!verification.isValid) {
      await client.chat.postMessage({
        channel: channelId,
        text: '❌ Price changed or flight unavailable. Please search again.',
      });
      await prisma.tempOrder.delete({ where: { id: orderId } });
      return;
    }

    // 更新订单状态
    await prisma.tempOrder.update({
      where: { id: orderId },
      data: {
        sessionId: verification.sessionId,
        status: 'verified',
      },
    });

    const flight = order.flightData as any;

    // 显示订单确认
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📋 Confirm Your Booking',
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Flight*\n${flight.airline}${flight.flightNumber}`,
          },
          {
            type: 'mrkdwn',
            text: `*Route*\n${flight.origin} → ${flight.destination}`,
          },
          {
            type: 'mrkdwn',
            text: `*Departure*\n${new Date(flight.departureTime).toLocaleString('zh-CN')}`,
          },
          {
            type: 'mrkdwn',
            text: `*Price*\n$${flight.price} ${flight.currency}`,
          },
        ],
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '📝 *Note:* We will use your saved passenger details. Payment via USDC on Base network.',
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Confirm Booking',
            },
            style: 'primary',
            value: orderId,
            action_id: 'confirm_booking',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '❌ Cancel',
            },
            style: 'danger',
            value: orderId,
            action_id: 'cancel_booking',
          },
        ],
      },
    ];

    await client.chat.postMessage({
      channel: channelId,
      blocks,
    });
  } catch (error: any) {
    console.error('Select flight error:', error);
    await client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: `❌ Error: ${error.message}`,
    });
  }
}

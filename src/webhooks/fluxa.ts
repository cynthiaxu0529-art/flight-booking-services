import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * FluxA支付Webhook (备用,主要用轮询)
 */
export async function handleFluxaWebhook(req: Request, res: Response) {
  try {
    const { payment_link_id, tx_hash, status, amount } = req.body;

    console.log('FluxA webhook:', { payment_link_id, status });

    if (status !== 'paid') {
      return res.json({ received: true });
    }

    // 查找订单
    const order = await prisma.tempOrder.findFirst({
      where: { paymentLinkId: payment_link_id },
    });

    if (!order) {
      console.error('Order not found for payment:', payment_link_id);
      return res.status(404).json({ error: 'Order not found' });
    }

    // 更新订单状态
    await prisma.tempOrder.update({
      where: { id: order.id },
      data: {
        status: 'paid',
      },
    });

    console.log('Payment confirmed:', { orderId: order.id, txHash: tx_hash });

    res.json({ received: true });
  } catch (error: any) {
    console.error('FluxA webhook error:', error);
    res.status(500).json({ error: error.message });
  }
}

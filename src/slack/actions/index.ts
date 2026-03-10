import { App } from '@slack/bolt';
import { handleSelectFlight } from './select-flight';
import { handleConfirmBooking } from './confirm-booking';

export function setupActions(app: App) {
  // 用户点击"选择"按钮
  app.action('select_flight', async ({ ack, body, client }) => {
    await ack();
    await handleSelectFlight(client, body);
  });

  // 用户点击"确认下单"按钮
  app.action('confirm_booking', async ({ ack, body, client }) => {
    await ack();
    await handleConfirmBooking(client, body);
  });

  // 用户点击"取消"按钮
  app.action('cancel_booking', async ({ ack, body, client }) => {
    await ack();
    
    const payload = body as any;
    const orderId = payload.actions[0].value;

    // 删除临时订单
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.tempOrder.delete({ where: { id: orderId } });

    await client.chat.update({
      channel: payload.channel.id,
      ts: payload.message.ts,
      text: '❌ Booking cancelled',
      blocks: [],
    });
  });
}

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WebClient } from '@slack/web-api';
import { reimbursementClient } from '../services/reimbursement';
import { config } from '../config';

const prisma = new PrismaClient();
const slackClient = new WebClient(config.slack.botToken);

export async function handleAtlasWebhook(req: Request, res: Response) {
  try {
    const { orderNo, pnr, ticketURL, status } = req.body;

    console.log('Atlas webhook:', { orderNo, pnr, status });

    if (status !== 'ticketed') {
      return res.json({ received: true });
    }

    // 查找订单
    const order = await prisma.tempOrder.findFirst({
      where: { atlasOrderNo: orderNo },
    });

    if (!order) {
      console.error('Order not found:', orderNo);
      return res.status(404).json({ error: 'Order not found' });
    }

    const flight = order.flightData as any;

    // 创建报销单
    try {
      const reimbursement = await reimbursementClient.createFlightReimbursement({
        atlas_order_no: orderNo,
        pnr,
        flight: {
          airline: flight.airline,
          flight_number: flight.flightNumber,
          origin: flight.origin,
          destination: flight.destination,
          departure_time: flight.departureTime,
          arrival_time: flight.arrivalTime,
          passenger: {
            name: 'Cynthia Xu', // TODO: 从订单获取
            passport: 'E12345678',
          },
        },
        payment: {
          amount: flight.price,
          currency: flight.currency,
          method: 'usdc_base',
          tx_hash: undefined, // TODO: 从支付记录获取
        },
        attachments: ticketURL ? [
          {
            type: 'eticket',
            url: ticketURL,
          },
        ] : [],
      });

      // 更新订单状态
      await prisma.tempOrder.update({
        where: { id: order.id },
        data: { status: 'completed' },
      });

      // 发送Slack通知
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '✅ Ticket Issued Successfully!',
            emoji: true,
          },
        },
        { type: 'divider' },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*PNR*\n\`${pnr}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Order #*\n\`${orderNo}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Flight*\n${flight.airline}${flight.flightNumber}`,
            },
            {
              type: 'mrkdwn',
              text: `*Route*\n${flight.origin} → ${flight.destination}`,
            },
          ],
        },
        { type: 'divider' },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📎 *Reimbursement Auto-Generated*\nID: \`${reimbursement.reimbursement_id}\`\nStatus: ${reimbursement.status}`,
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Reimbursement',
            },
            url: `${config.reimbursement.apiUrl.replace('/api', '')}/reimbursements/${reimbursement.reimbursement_id}`,
            action_id: 'view_reimbursement',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '📄 *Itinerary PDF*',
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Download',
            },
            url: reimbursement.itinerary_url,
            action_id: 'download_itinerary',
          },
        },
      ];

      await slackClient.chat.postMessage({
        channel: order.slackChannel,
        blocks,
      });

      res.json({ received: true, reimbursement_id: reimbursement.reimbursement_id });
    } catch (error: any) {
      console.error('Reimbursement creation error:', error);
      
      // 仍然通知用户出票成功
      await slackClient.chat.postMessage({
        channel: order.slackChannel,
        text: `✅ Ticket issued!\nPNR: ${pnr}\n\n⚠️ Note: Auto-reimbursement failed. Please create manually.`,
      });

      res.status(500).json({ error: error.message });
    }
  } catch (error: any) {
    console.error('Atlas webhook error:', error);
    res.status(500).json({ error: error.message });
  }
}

import { WebClient } from '@slack/web-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function handleStatus(client: WebClient, command: any) {
  try {
    // 查询用户的订单
    const orders = await prisma.tempOrder.findMany({
      where: {
        slackUserId: command.user_id,
        status: {
          in: ['ordering', 'paying', 'completed'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    if (orders.length === 0) {
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: '📭 You have no active orders.',
      });
      return;
    }

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📋 Your Flight Orders',
        },
      },
    ];

    for (const order of orders) {
      const flight = order.flightData as any;
      const statusEmoji = {
        ordering: '📝',
        paying: '💳',
        completed: '✅',
      }[order.status] || '❓';

      blocks.push(
        { type: 'divider' },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${statusEmoji} *${flight.origin} → ${flight.destination}*\n` +
                  `Status: ${order.status}\n` +
                  `Price: $${flight.price} ${flight.currency}\n` +
                  `Created: ${order.createdAt.toLocaleString('zh-CN')}`,
          },
        }
      );

      if (order.atlasOrderNo) {
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Order #: ${order.atlasOrderNo}`,
            },
          ],
        });
      }
    }

    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      blocks,
    });
  } catch (error: any) {
    console.error('Status error:', error);
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: `❌ Error fetching orders: ${error.message}`,
    });
  }
}

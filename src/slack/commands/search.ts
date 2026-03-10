import { WebClient } from '@slack/web-api';
import { SlackCommandMiddlewareArgs } from '@slack/bolt';
import { atlasClient } from '../../services/atlas';
import { PrismaClient } from '@prisma/client';
import { config } from '../../config';

const prisma = new PrismaClient();

export async function handleSearch(
  client: WebClient,
  command: any,
  args: string[]
) {
  if (args.length < 3) {
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: '❌ Usage: `/flight search <origin> <dest> <date>`\n' +
            'Example: `/flight search PEK SIN 2026-03-15`',
    });
    return;
  }

  const [origin, destination, date] = args;

  // 显示搜索中消息
  await client.chat.postEphemeral({
    channel: command.channel_id,
    user: command.user_id,
    text: `🔍 Searching flights from ${origin} to ${destination} on ${date}...`,
  });

  try {
    // 调用Atlas API搜索
    const flights = await atlasClient.search({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate: date,
    });

    if (flights.length === 0) {
      await client.chat.postMessage({
        channel: command.channel_id,
        text: `😔 No flights found for ${origin} → ${destination} on ${date}`,
      });
      return;
    }

    // 构建Slack消息blocks
    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `✈️ Flights: ${origin} → ${destination}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `📅 ${date} | Found ${flights.length} options`,
          },
        ],
      },
      { type: 'divider' },
    ];

    // 为每个航班创建一个section
    for (let i = 0; i < Math.min(flights.length, 5); i++) {
      const flight = flights[i];
      
      // 保存临时订单
      const tempOrder = await prisma.tempOrder.create({
        data: {
          slackUserId: command.user_id,
          slackChannel: command.channel_id,
          routingId: flight.routingIdentifier,
          flightData: flight as any,
          status: 'searching',
          expiresAt: new Date(Date.now() + config.orderTimeout),
        },
      });

      // 格式化时间
      const depTime = new Date(flight.departureTime).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const arrTime = new Date(flight.arrivalTime).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const stopsText = flight.stops === 0 ? '直飞' : `${flight.stops}次中转`;

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${i + 1}️⃣ ${flight.airline}${flight.flightNumber}* ${flight.stops === 0 ? '⭐' : ''}\n` +
                `🛫 出发: ${origin} ${depTime}\n` +
                `🛬 到达: ${destination} ${arrTime}\n` +
                `⏱️ ${stopsText} | 💰 $${flight.price} ${flight.currency}`,
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '选择',
          },
          style: 'primary',
          value: tempOrder.id,
          action_id: 'select_flight',
        },
      });
    }

    // 添加提示
    blocks.push(
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '💡 点击"选择"按钮继续预订 | 价格有效期15分钟',
          },
        ],
      }
    );

    await client.chat.postMessage({
      channel: command.channel_id,
      blocks,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    await client.chat.postMessage({
      channel: command.channel_id,
      text: `❌ Search failed: ${error.message}`,
    });
  }
}

import { App } from '@slack/bolt';
import { handleSearch } from './search';
import { handleStatus } from './status';

export function setupCommands(app: App) {
  // /flight search <origin> <dest> <date>
  app.command('/flight', async ({ command, ack, client }) => {
    await ack();

    const args = command.text.trim().split(/\s+/);
    const subcommand = args[0]?.toLowerCase();

    try {
      switch (subcommand) {
        case 'search':
          await handleSearch(client, command, args.slice(1));
          break;
        case 'status':
          await handleStatus(client, command);
          break;
        default:
          await client.chat.postEphemeral({
            channel: command.channel_id,
            user: command.user_id,
            text: '❌ Unknown command. Usage:\n' +
                  '• `/flight search <origin> <dest> <date>` - Search flights\n' +
                  '• `/flight status` - Check your orders',
          });
      }
    } catch (error: any) {
      console.error('Command error:', error);
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `❌ Error: ${error.message}`,
      });
    }
  });
}

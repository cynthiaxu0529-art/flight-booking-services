import 'dotenv/config';
import { App, ExpressReceiver } from '@slack/bolt';
import { setupCommands } from './slack/commands';
import { setupActions } from './slack/actions';
import { setupWebhooks } from './webhooks';
import { cleanupExpiredOrders } from './services/cleanup';

// Express receiver for webhook endpoints
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

// Slack App
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

// Setup Slack commands
setupCommands(app);

// Setup Slack interactive actions
setupActions(app);

// Setup webhooks (Atlas, FluxA)
setupWebhooks(receiver.app);

// Cleanup expired orders every 5 minutes
setInterval(() => {
  cleanupExpiredOrders().catch(console.error);
}, 5 * 60 * 1000);

// Start server
const port = process.env.PORT || 3000;

(async () => {
  await app.start(port);
  console.log(`⚡️ Flight Booking Service is running on port ${port}`);
})();

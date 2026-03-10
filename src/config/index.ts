export const config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN!,
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
    appToken: process.env.SLACK_APP_TOKEN,
  },
  atlas: {
    apiUrl: process.env.ATLAS_API_URL || 'https://sandbox.atriptech.com/api',
    clientId: process.env.ATLAS_CLIENT_ID!,
    clientSecret: process.env.ATLAS_CLIENT_SECRET!,
  },
  fluxa: {
    apiKey: process.env.FLUXA_WALLET_API_KEY!,
    walletAddress: process.env.FLUXA_WALLET_ADDRESS!,
  },
  reimbursement: {
    apiUrl: process.env.REIMBURSEMENT_API_URL || 'https://reimburse.fluxapay.xyz/api',
    apiKey: process.env.REIMBURSEMENT_API_KEY!,
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
  },
  // 订单超时时间 (15分钟)
  orderTimeout: 15 * 60 * 1000,
};

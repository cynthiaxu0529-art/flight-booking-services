# Flight Booking Service

Slack Bot for Atlas API flight booking with USDC payments and auto-reimbursement.

## Features

- 🔍 Search flights via Slack commands
- 💳 USDC payment (Base network)
- 📋 Auto-generate reimbursement in FluxA system
- 📄 Auto-generate itinerary PDF
- ✅ Real-time booking status updates

## Architecture

```
Slack Bot → Atlas API → USDC Payment → Reimbursement API
```

## Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL (optional - for temp order storage)
- Slack workspace with admin access
- Atlas API credentials
- FluxA Wallet API key
- Reimbursement system API key

### 2. Create Slack App

1. Go to https://api.slack.com/apps
2. Create New App → From scratch
3. Add Bot Token Scopes:
   - `chat:write`
   - `commands`
   - `files:write`
   - `users:read`
4. Install app to workspace
5. Copy Bot Token and Signing Secret

### 3. Add Slash Command

Settings → Slash Commands → Create New Command

- Command: `/flight`
- Request URL: `https://your-domain.com/slack/events`
- Description: `Search and book flights`
- Usage Hint: `search <origin> <dest> <date>`

### 4. Enable Interactive Components

Settings → Interactivity & Shortcuts

- Request URL: `https://your-domain.com/slack/events`

### 5. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 6. Install Dependencies

```bash
npm install
```

### 7. Setup Database (Optional)

```bash
npm run db:push
```

### 8. Start Development Server

```bash
npm run dev
```

### 9. Expose Local Server (for development)

```bash
# Using ngrok
ngrok http 3000

# Update Slack App URLs with ngrok URL
```

## Usage

### Search Flights

```
/flight search PEK SIN 2026-03-15
```

### Check Order Status

```
/flight status
```

## API Integration

### Atlas API

Base URL: `https://sandbox.atriptech.com/api`

Endpoints used:
- `POST /search` - Search flights
- `POST /verify` - Verify price
- `POST /order` - Create order
- `POST /pay` - Pay order

### FluxA Wallet API

Endpoints used:
- `POST /payment-links` - Create payment link
- `GET /payment-links/:id` - Check payment status

### Reimbursement API

Base URL: `https://reimburse.fluxapay.xyz/api`

Endpoints used:
- `POST /reimbursements/flights` - Create flight reimbursement

## Webhooks

### Atlas Webhook

Endpoint: `POST /webhooks/atlas/ticket-issued`

Payload:
```json
{
  "orderNo": "ATL20260310001",
  "pnr": "ABC123",
  "ticketURL": "https://...",
  "status": "ticketed"
}
```

### FluxA Webhook

Endpoint: `POST /webhooks/fluxa/payment`

Payload:
```json
{
  "payment_link_id": "pl_xxx",
  "tx_hash": "0xabc...",
  "status": "paid",
  "amount": 280
}
```

## Deployment

### Option 1: Vercel

```bash
npm install -g vercel
vercel deploy
```

Add environment variables in Vercel dashboard.

### Option 2: Railway

```bash
railway up
```

### Option 3: Docker

```bash
docker build -t flight-booking-service .
docker run -p 3000:3000 --env-file .env flight-booking-service
```

## Development

### Project Structure

```
src/
├── config/           # Configuration
├── services/         # External API clients
│   ├── atlas.ts
│   ├── fluxa.ts
│   └── reimbursement.ts
├── slack/
│   ├── commands/     # Slash command handlers
│   └── actions/      # Button action handlers
├── webhooks/         # Webhook handlers
└── index.ts          # Entry point
```

### Testing

```bash
# Test search
curl -X POST http://localhost:3000/webhooks/test-search \
  -H "Content-Type: application/json" \
  -d '{"origin": "PEK", "destination": "SIN", "date": "2026-03-15"}'
```

## Troubleshooting

### Slack command not working

1. Check Request URL is correct and accessible
2. Verify Signing Secret matches
3. Check Slack app is installed to workspace

### Payment not detected

1. Check FluxA webhook is configured
2. Verify wallet address is correct
3. Check payment polling is running

### Reimbursement creation failed

1. Verify Reimbursement API key
2. Check API endpoint is accessible
3. Review webhook logs

## License

MIT

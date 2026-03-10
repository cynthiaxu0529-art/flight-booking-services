#!/bin/bash

echo "🚀 Starting Flight Booking Service (Development Mode)"
echo ""
echo "📋 Pre-flight checklist:"
echo ""
echo "  1. ✓ .env configured with Slack + Atlas credentials"
echo "  2. ✓ Run in another terminal: ngrok http 3000"
echo "  3. ✓ Update Slack App URLs with ngrok URL"
echo ""
echo "─────────────────────────────────────────────────────"
echo ""
echo "📡 Server starting on http://localhost:3000"
echo ""
echo "🔗 After ngrok starts, update these URLs in Slack App:"
echo "   • Slash Commands: https://YOUR-NGROK-URL/slack/events"
echo "   • Interactivity: https://YOUR-NGROK-URL/slack/events"
echo ""
echo "─────────────────────────────────────────────────────"
echo ""

npm run dev

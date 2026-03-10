#!/bin/bash

echo "🚀 Setting up Flight Booking Service..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy env file if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your credentials"
fi

# Setup database (optional)
read -p "Do you want to setup PostgreSQL database? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️  Setting up database..."
    npm run db:push
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your API credentials"
echo "2. Create Slack App and add slash command /flight"
echo "3. Run 'npm run dev' to start development server"
echo "4. Use ngrok to expose local server for Slack webhooks"
echo ""

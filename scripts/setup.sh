#!/usr/bin/env bash
# ExitStorm — Quick Setup Script
set -euo pipefail

echo "⚡ ExitStorm Setup"
echo "=================="
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required (>=18). Install: https://nodejs.org"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required (>=9). Install: npm install -g pnpm"; exit 1; }

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required (found v${NODE_VERSION})"
  exit 1
fi

echo "✅ Node.js $(node -v)"
echo "✅ pnpm $(pnpm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo ""

# Build packages
echo "🔨 Building packages..."
pnpm build
echo ""

# Create data directory
mkdir -p data
echo "📁 Created data/ directory"

# Copy env files
if [ ! -f apps/discord-bot/.env ]; then
  cp apps/discord-bot/.env.example apps/discord-bot/.env
  echo "📋 Copied apps/discord-bot/.env.example → .env"
  echo "   ⚠️  Edit apps/discord-bot/.env with your bot token"
else
  echo "📋 apps/discord-bot/.env already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit apps/discord-bot/.env with your BOT_TOKEN"
echo "  2. Add OPENAI_API_KEY or ANTHROPIC_API_KEY for financial analysis"
echo "  3. Run: pnpm bot:dev"
echo ""

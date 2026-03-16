#!/usr/bin/env bash
# Run database migrations
set -euo pipefail

DB_PATH="${1:-data/contributions.db}"

echo "⚡ ExitStorm — Database Migration"
echo "  Database: $DB_PATH"
echo ""

pnpm --filter @exitstorm/db migrate -- "$DB_PATH"

echo ""
echo "✅ Migrations complete"

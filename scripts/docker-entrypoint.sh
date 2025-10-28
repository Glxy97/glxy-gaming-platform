#!/bin/sh
set -e

echo "Starting GLXY Gaming application..."
echo "Database schema is already synchronized"
echo "Starting Next.js server..."

# Start the Next.js server (not standalone)
cd /app
echo "Starting with next start"
exec node node_modules/next/dist/bin/next start -p "${PORT:-3000}"

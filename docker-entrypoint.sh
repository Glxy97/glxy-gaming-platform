#!/bin/sh
set -e

echo "🚀 Starting GLXY Gaming Platform..."

# Warte auf Datenbank
echo "⏳ Waiting for database..."
# Extrahiere Host aus DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -E 's/.*@([^:]+):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed -E 's/.*:([0-9]+)\/.*/\1/')

for i in $(seq 1 30); do
    if nc -z -v -w1 ${DB_HOST} ${DB_PORT} 2>/dev/null; then
        echo "✅ Database is ready!"
        break
    fi
    echo "Waiting for database connection attempt $i/30..."
    sleep 2
done

# Führe Migrationen aus
echo "📦 Running database migrations..."
npx prisma migrate deploy || echo "⚠️ Migrations failed or not needed"

# Generiere Prisma Client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Setup completed!"

# Starte die Anwendung
echo "🎮 Starting Next.js application on port ${PORT:-3001}..."
exec node server.js
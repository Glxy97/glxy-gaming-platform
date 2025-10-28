#!/bin/bash
# ============================================
# 🖥️ GLXY Gaming - Development Starter
# ============================================

echo "🚀 GLXY Gaming - Development Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker ist nicht gestartet!"
    echo "   Bitte starte Docker Desktop und versuche es erneut."
    exit 1
fi

echo "✅ Docker läuft"
echo ""

# Start Docker services
echo "📦 Starte PostgreSQL & Redis..."
docker-compose -f docker-compose.local.yml up -d

# Wait for services
echo "⏳ Warte auf Datenbank..."
sleep 5

# Check if services are healthy
echo "🔍 Prüfe Services..."
docker-compose -f docker-compose.local.yml ps

echo ""
echo "✅ Docker Services gestartet!"
echo ""
echo "📊 Database: postgresql://localhost:5432/glxy_gaming_dev"
echo "📊 Redis:    redis://localhost:6379"
echo ""
echo "🔧 Nächste Schritte:"
echo "   1. npm install           (falls noch nicht geschehen)"
echo "   2. npx prisma migrate deploy  (Datenbank initialisieren)"
echo "   3. npm run dev           (Development Server starten)"
echo ""
echo "🌐 App wird verfügbar sein auf: http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

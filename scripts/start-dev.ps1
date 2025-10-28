# ============================================
# 🖥️ GLXY Gaming - Development Starter (Windows)
# ============================================

Write-Host "🚀 GLXY Gaming - Development Environment" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker läuft" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker ist nicht gestartet!" -ForegroundColor Red
    Write-Host "   Bitte starte Docker Desktop und versuche es erneut." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Start Docker services
Write-Host "📦 Starte PostgreSQL & Redis..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml up -d

# Wait for services
Write-Host "⏳ Warte auf Datenbank..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if services are healthy
Write-Host "🔍 Prüfe Services..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml ps

Write-Host ""
Write-Host "✅ Docker Services gestartet!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Database: postgresql://localhost:5432/glxy_gaming_dev" -ForegroundColor White
Write-Host "📊 Redis:    redis://localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Nächste Schritte:" -ForegroundColor Cyan
Write-Host "   1. npm install           (falls noch nicht geschehen)" -ForegroundColor White
Write-Host "   2. npx prisma migrate deploy  (Datenbank initialisieren)" -ForegroundColor White
Write-Host "   3. npm run dev           (Development Server starten)" -ForegroundColor White
Write-Host ""
Write-Host "🌐 App wird verfügbar sein auf: http://localhost:3000" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

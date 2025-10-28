# ===============================================================================
# GLXY Gaming Platform - Environment Setup Script (Windows PowerShell)
# ===============================================================================
# Dieses Script generiert sichere Secrets und erstellt .env.local
# VERWENDUNG: .\setup-env.ps1
# ===============================================================================

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host " GLXY Gaming Platform - Sichere Environment Setup" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# Prüfe ob .env.local bereits existiert
if ((Test-Path ".env.local") -and -not $Force) {
    Write-Host "⚠️  .env.local existiert bereits!" -ForegroundColor Yellow
    Write-Host ""
    $confirmation = Read-Host "Möchtest du sie überschreiben? (y/N)"
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-Host "❌ Abgebrochen. Verwende -Force Parameter um zu überschreiben." -ForegroundColor Red
        exit 1
    }
}

# Funktion: Generiere sicheren Random String
function Generate-SecureSecret {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

Write-Host "🔐 Generiere sichere Secrets..." -ForegroundColor Green
Write-Host ""

$NEXTAUTH_SECRET = Generate-SecureSecret
$JWT_SECRET = Generate-SecureSecret
$SOCKET_IO_SECRET = Generate-SecureSecret
$API_ENCRYPTION_KEY = Generate-SecureSecret
$SESSION_ENCRYPTION_KEY = Generate-SecureSecret
$CSRF_SECRET = Generate-SecureSecret
$COOKIE_SECRET = Generate-SecureSecret
$POSTGRES_PASSWORD = Generate-SecureSecret -Length 32
$REDIS_PASSWORD = Generate-SecureSecret -Length 32

Write-Host "✅ Secrets generiert!" -ForegroundColor Green
Write-Host ""

# Interaktive Eingabe für OAuth (Optional)
Write-Host "📝 OAuth Konfiguration (Optional - Enter drücken um zu überspringen)" -ForegroundColor Yellow
Write-Host ""

$GOOGLE_CLIENT_ID = Read-Host "Google Client ID (optional)"
$GOOGLE_CLIENT_SECRET = ""
if ($GOOGLE_CLIENT_ID) {
    $GOOGLE_CLIENT_SECRET = Read-Host "Google Client Secret"
}

$GITHUB_CLIENT_ID = Read-Host "GitHub Client ID (optional)"
$GITHUB_CLIENT_SECRET = ""
if ($GITHUB_CLIENT_ID) {
    $GITHUB_CLIENT_SECRET = Read-Host "GitHub Client Secret"
}

Write-Host ""
Write-Host "📧 SMTP Konfiguration (Optional - Enter drücken um zu überspringen)" -ForegroundColor Yellow
Write-Host ""

$SMTP_HOST = Read-Host "SMTP Host (z.B. smtp.gmail.com, optional)"
$SMTP_PORT = "587"
$SMTP_USER = ""
$SMTP_PASS = ""

if ($SMTP_HOST) {
    $SMTP_USER = Read-Host "SMTP Benutzer (E-Mail)"
    $SMTP_PASS = Read-Host "SMTP Passwort/App-Password"
}

Write-Host ""
Write-Host "👤 Admin Konfiguration" -ForegroundColor Yellow
Write-Host ""

$ADMIN_EMAILS = Read-Host "Admin E-Mail Adressen (komma-separiert)"

# Erstelle .env.local
Write-Host ""
Write-Host "📝 Erstelle .env.local..." -ForegroundColor Green

$envContent = @"
# ===============================================================================
# GLXY Gaming Platform - Local Development Environment
# ===============================================================================
# AUTOMATISCH GENERIERT von setup-env.ps1
# Erstellt am: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ===============================================================================

# ===== CORE SETTINGS =====
NODE_ENV=development
DOMAIN=localhost

# ===== NEXTAUTH AUTHENTICATION =====
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=$JWT_SECRET

# ===== DATABASE (PostgreSQL) =====
DATABASE_URL=postgresql://glxy_user:$POSTGRES_PASSWORD@localhost:5432/glxy_gaming?schema=public
POSTGRES_USER=glxy_user
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=glxy_gaming

# ===== REDIS CACHE =====
REDIS_URL=redis://default:$REDIS_PASSWORD@localhost:6379
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_HOST=localhost
REDIS_PORT=6379

"@

# OAuth (nur wenn konfiguriert)
if ($GOOGLE_CLIENT_ID) {
    $envContent += @"

# ===== GOOGLE OAUTH =====
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
"@
}

if ($GITHUB_CLIENT_ID) {
    $envContent += @"

# ===== GITHUB OAUTH =====
GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET
"@
}

$envContent += @"

# ===== SOCKET.IO (Real-time Gaming) =====
SOCKET_IO_SECRET=$SOCKET_IO_SECRET
SOCKET_IO_PORT=3001
SOCKET_IO_CORS_ORIGIN=http://localhost:3000,http://localhost

# ===== ENCRYPTION KEYS =====
API_ENCRYPTION_KEY=$API_ENCRYPTION_KEY
SESSION_ENCRYPTION_KEY=$SESSION_ENCRYPTION_KEY
CSRF_SECRET=$CSRF_SECRET
COOKIE_SECRET=$COOKIE_SECRET

"@

# SMTP (nur wenn konfiguriert)
if ($SMTP_HOST) {
    $envContent += @"

# ===== SMTP/EMAIL =====
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
"@
}

$envContent += @"

# ===== SENTRY (Deaktiviert für Development) =====
DISABLE_SENTRY=true
SENTRY_ENVIRONMENT=development

# ===== ADMIN CONFIGURATION =====
ADMIN_EMAILS=$ADMIN_EMAILS
ADMIN_USER_IDS=

# ===== PUBLIC ENVIRONMENT VARIABLES =====
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_SOCKET_PATH=/api/socket/io

# ===============================================================================
# SECURITY NOTES:
# - Diese Datei enthält ECHTE SECRETS und darf NIEMALS committed werden
# - Sie ist in .gitignore eingetragen
# - Für Production verwende Docker Secrets oder Umgebungsvariablen
# ===============================================================================
"@

# Schreibe .env.local
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host "✅ .env.local erfolgreich erstellt!" -ForegroundColor Green
Write-Host ""

# Backup der Secrets (optional, sicher gespeichert)
$backupPath = ".env.local.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item ".env.local" $backupPath
Write-Host "📦 Backup erstellt: $backupPath" -ForegroundColor Cyan
Write-Host ""

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host " ✅ Setup abgeschlossen!" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nächste Schritte:" -ForegroundColor Yellow
Write-Host "1. Prüfe .env.local und passe Werte an (falls nötig)" -ForegroundColor White
Write-Host "2. Starte PostgreSQL: docker-compose up -d postgres" -ForegroundColor White
Write-Host "3. Starte Redis: docker-compose up -d redis" -ForegroundColor White
Write-Host "4. Führe Migrations aus: npm run db:migrate" -ForegroundColor White
Write-Host "5. Starte Development Server: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  WICHTIG: Teile .env.local NIEMALS öffentlich!" -ForegroundColor Red
Write-Host ""

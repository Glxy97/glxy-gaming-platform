#!/bin/bash

# ============================================
# = CREDENTIAL ROTATION SCRIPT - GLXY GAMING
# ============================================
# Dieses Script rotiert alle Sicherheits-Credentials
# und invalidiert die alten OAuth-Apps

echo "🔒 GLXY Gaming - Credential Rotation Script"
echo "==========================================="
echo ""
echo "⚠️  WICHTIG: Dieses Script rotiert ALLE Credentials!"
echo "   - Alle Sessions werden invalidiert"
echo "   - OAuth Apps müssen neu konfiguriert werden"
echo "   - Server muss neu gestartet werden"
echo ""
read -p "Fortfahren? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Abgebrochen."
    exit 1
fi

# Backup der aktuellen .env Datei
BACKUP_FILE=".env.production.backup-$(date +%Y%m%d-%H%M%S)"
if [ -f ".env.production" ]; then
    cp .env.production "$BACKUP_FILE"
    echo "✅ Backup erstellt: $BACKUP_FILE"
fi

# Neue Secrets generieren
echo ""
echo "🔐 Generiere neue Secrets..."
echo ""

generate_secret() {
    openssl rand -base64 32 2>/dev/null || openssl rand -base64 32
}

# Secrets generieren
NEXTAUTH_SECRET=$(generate_secret)
JWT_SECRET=$(generate_secret)
SOCKET_IO_SECRET=$(generate_secret)
API_ENCRYPTION_KEY=$(generate_secret)
SESSION_ENCRYPTION_KEY=$(generate_secret)
CSRF_SECRET=$(generate_secret)
COOKIE_SECRET=$(generate_secret)

# Optional: Neue Datenbank-Passwörter
read -p "Auch Datenbank-Passwörter rotieren? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    POSTGRES_PASSWORD=$(generate_secret)
    REDIS_PASSWORD=$(generate_secret)
    echo "✅ Neue Datenbank-Passwörter generiert"
fi

# Ausgabe der neuen Secrets
echo ""
echo "📋 Neue Secrets (für .env.production oder .env.local):"
echo "======================================================="
echo ""
echo "# === SECURITY SECRETS ($(date +%Y-%m-%d)) ==="
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "JWT_SECRET=$JWT_SECRET"
echo "SOCKET_IO_SECRET=$SOCKET_IO_SECRET"
echo "API_ENCRYPTION_KEY=$API_ENCRYPTION_KEY"
echo "SESSION_ENCRYPTION_KEY=$SESSION_ENCRYPTION_KEY"
echo "CSRF_SECRET=$CSRF_SECRET"
echo "COOKIE_SECRET=$COOKIE_SECRET"

if [ ! -z "$POSTGRES_PASSWORD" ]; then
    echo ""
    echo "# === DATABASE PASSWORDS ($(date +%Y-%m-%d)) ==="
    echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
    echo "REDIS_PASSWORD=$REDIS_PASSWORD"
    echo ""
    # URL-encode Redis password for connection string
    REDIS_PASSWORD_ENCODED=$(echo -n "$REDIS_PASSWORD" | sed 's/+/%2B/g' | sed 's/\//%2F/g')
    echo "# Redis URL (encoded):"
    echo "REDIS_URL=redis://:${REDIS_PASSWORD_ENCODED}@redis:6379"
fi

echo ""
echo "======================================================="
echo ""
echo "⚠️  NÄCHSTE SCHRITTE:"
echo "   1. OAuth Apps bei Google/GitHub invalidieren und neu erstellen"
echo "   2. Neue Credentials in .env.local speichern (NICHT in .env.production!)"
echo "   3. Server neu starten: docker-compose restart"
echo "   4. Alle User müssen sich neu einloggen"
echo ""
echo "📚 OAuth Dokumentation:"
echo "   - Google: https://console.cloud.google.com/"
echo "   - GitHub: https://github.com/settings/developers"
echo ""
echo "✅ Script abgeschlossen."
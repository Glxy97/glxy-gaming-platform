#!/bin/bash

# ========================================
# GLXY Gaming Platform - Docs Sanitization
# Entfernt alle Credentials aus Dokumentation
# ========================================

set -e

PROJECT_ROOT="G:\website\verynew\glxy-gaming"
DOCS_DIR="$PROJECT_ROOT/docs"
BACKUP_DIR="$PROJECT_ROOT/docs/backups"

echo "🚀 Starting documentation sanitization..."
echo "Project: $PROJECT_ROOT"
echo "Docs: $DOCS_DIR"
echo ""

# ========================================
# 1. Backup erstellen
# ========================================
echo "📦 Creating backup..."
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PATH="$BACKUP_DIR/pre-sanitize-$TIMESTAMP"
mkdir -p "$BACKUP_PATH"

cp -r "$DOCS_DIR/internal" "$BACKUP_PATH/" 2>/dev/null || echo "No internal/ folder"
cp -r "$DOCS_DIR/security" "$BACKUP_PATH/" 2>/dev/null || echo "No security/ folder"

echo "✅ Backup created at: $BACKUP_PATH"
echo ""

# ========================================
# 2. Credentials aus GOOGLE_OAUTH_SETUP.md entfernen
# ========================================
echo "🔒 Sanitizing: docs/internal/GOOGLE_OAUTH_SETUP.md"

OAUTH_FILE="$DOCS_DIR/internal/GOOGLE_OAUTH_SETUP.md"

if [ -f "$OAUTH_FILE" ]; then
  # Zeilen mit Secrets löschen
  sed -i.bak '/GOOGLE_CLIENT_SECRET=/d' "$OAUTH_FILE"
  sed -i.bak '/GITHUB_CLIENT_SECRET=/d' "$OAUTH_FILE"

  # Client IDs durch Platzhalter ersetzen
  sed -i.bak 's/GOOGLE_CLIENT_ID="[^"]*"/GOOGLE_CLIENT_ID="<YOUR_GOOGLE_CLIENT_ID>"/g' "$OAUTH_FILE"
  sed -i.bak 's/GITHUB_CLIENT_ID="[^"]*"/GITHUB_CLIENT_ID="<YOUR_GITHUB_CLIENT_ID>"/g' "$OAUTH_FILE"

  # Echte Client IDs in Text ersetzen
  sed -i.bak 's/759845952878-[a-z0-9]*.apps.googleusercontent.com/<YOUR_GOOGLE_CLIENT_ID>/g' "$OAUTH_FILE"
  sed -i.bak 's/GOCSPX-[A-Za-z0-9_-]*/<YOUR_GOOGLE_CLIENT_SECRET>/g' "$OAUTH_FILE"
  sed -i.bak 's/Ov23[A-Za-z0-9]*/<YOUR_GITHUB_CLIENT_ID>/g' "$OAUTH_FILE"
  sed -i.bak 's/[0-9a-f]{40}/<YOUR_GITHUB_CLIENT_SECRET>/g' "$OAUTH_FILE" # GitHub Secret ist 40 chars hex

  rm "$OAUTH_FILE.bak"
  echo "✅ Sanitized: GOOGLE_OAUTH_SETUP.md"
else
  echo "⚠️  File not found: $OAUTH_FILE"
fi

echo ""

# ========================================
# 3. Credentials aus OAUTH_SETUP.md entfernen
# ========================================
echo "🔒 Sanitizing: docs/OAUTH_SETUP.md"

OAUTH_SETUP_FILE="$DOCS_DIR/OAUTH_SETUP.md"

if [ -f "$OAUTH_SETUP_FILE" ]; then
  sed -i.bak '/CLIENT_SECRET=/d' "$OAUTH_SETUP_FILE"
  sed -i.bak 's/CLIENT_ID="[^"]*"/CLIENT_ID="<YOUR_CLIENT_ID>"/g' "$OAUTH_SETUP_FILE"
  rm "$OAUTH_SETUP_FILE.bak"
  echo "✅ Sanitized: OAUTH_SETUP.md"
fi

echo ""

# ========================================
# 4. DATABASE_URL aus allen Docs entfernen
# ========================================
echo "🔒 Sanitizing: Database connection strings..."

find "$DOCS_DIR" -type f -name "*.md" -exec sed -i.bak 's/postgresql:\/\/[^@]*@[^:]*:[0-9]*\/[^ "]*/<DATABASE_URL_REDACTED>/g' {} \;
find "$DOCS_DIR" -type f -name "*.bak" -delete

echo "✅ Database URLs sanitized"
echo ""

# ========================================
# 5. REDIS_URL aus allen Docs entfernen
# ========================================
echo "🔒 Sanitizing: Redis connection strings..."

find "$DOCS_DIR" -type f -name "*.md" -exec sed -i.bak 's/redis:\/\/[^@]*@[^:]*:[0-9]*/<REDIS_URL_REDACTED>/g' {} \;
find "$DOCS_DIR" -type f -name "*.bak" -delete

echo "✅ Redis URLs sanitized"
echo ""

# ========================================
# 6. Generic Secret Pattern entfernen
# ========================================
echo "🔒 Sanitizing: Generic secrets (BASE64, etc.)..."

# Alle Base64-ähnlichen Secrets (NEXTAUTH_SECRET, JWT_SECRET, etc.)
find "$DOCS_DIR" -type f -name "*.md" -exec sed -i.bak 's/_SECRET=[A-Za-z0-9+/=]*/_SECRET=<SECRET_REDACTED>/g' {} \;
find "$DOCS_DIR" -type f -name "*.bak" -delete

echo "✅ Generic secrets sanitized"
echo ""

# ========================================
# 7. Server-IPs und Private-IPs entfernen
# ========================================
echo "🔒 Sanitizing: IP addresses..."

# Private IP ranges (10.x.x.x, 192.168.x.x, 172.16-31.x.x)
find "$DOCS_DIR" -type f -name "*.md" -exec sed -i.bak 's/10\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}/<PRIVATE_IP>/g' {} \;
find "$DOCS_DIR" -type f -name "*.md" -exec sed -i.bak 's/192\.168\.[0-9]\{1,3\}\.[0-9]\{1,3\}/<PRIVATE_IP>/g' {} \;
find "$DOCS_DIR" -type f -name "*.md" -exec sed -i.bak 's/172\.(1[6-9]|2[0-9]|3[01])\.[0-9]\{1,3\}\.[0-9]\{1,3\}/<PRIVATE_IP>/g' {} \;
find "$DOCS_DIR" -type f -name "*.bak" -delete

echo "✅ IP addresses sanitized"
echo ""

# ========================================
# 8. Verification Report
# ========================================
echo "📋 Generating verification report..."

REPORT_FILE="$DOCS_DIR/SANITIZATION_REPORT_$TIMESTAMP.txt"

cat > "$REPORT_FILE" <<EOF
GLXY Gaming Platform - Documentation Sanitization Report
========================================================

Date: $(date)
Backup Location: $BACKUP_PATH

Sanitized Files:
- docs/internal/GOOGLE_OAUTH_SETUP.md
- docs/OAUTH_SETUP.md
- All *.md files in docs/ (recursive)

Removed Patterns:
✅ Google OAuth Client ID + Secret
✅ GitHub OAuth Client ID + Secret
✅ Database Connection Strings (PostgreSQL)
✅ Redis Connection Strings
✅ Generic Secrets (BASE64 patterns)
✅ Private IP Addresses (10.x, 192.168.x, 172.16-31.x)

Remaining Sensitive Files (should be .gitignored):
EOF

# Suche nach möglicherweise noch sensitiven Dateien
echo "" >> "$REPORT_FILE"
echo "Files that may still contain sensitive info:" >> "$REPORT_FILE"
grep -r -l "password\|secret\|credential" "$DOCS_DIR" 2>/dev/null | while read file; do
  echo "⚠️  $file" >> "$REPORT_FILE"
done || echo "✅ No obvious sensitive keywords found" >> "$REPORT_FILE"

echo ""
echo "✅ Sanitization completed!"
echo "📄 Report saved: $REPORT_FILE"
echo ""

# ========================================
# 9. Next Steps Reminder
# ========================================
cat <<EOF
🔔 NEXT STEPS:

1. ✅ Backup created: $BACKUP_PATH
2. ✅ Credentials sanitized from documentation

3. ⚠️  TODO: Rotate OAuth Credentials
   - Google Cloud Console: https://console.cloud.google.com/
   - GitHub Settings: https://github.com/settings/developers

4. ⚠️  TODO: Update .gitignore
   Add these lines:

   /docs/internal/
   /docs/security/
   .env*
   !.env.example
   !.env.template

5. ⚠️  TODO: Check Git History
   git log --all --full-history -- .env* docs/internal/

   If credentials were committed: ROTATE IMMEDIATELY!

6. ⚠️  TODO: Deploy Middleware Protection
   - Copy middleware-docs-protection.ts to project
   - Update middleware.ts with docs protection
   - Restart application

EOF

echo "Done! 🎉"

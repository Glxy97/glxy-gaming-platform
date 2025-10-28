#!/usr/bin/env node
/**
 * GLXY Gaming Platform - Production Secret Generator
 * Generiert sichere, produktionstaugliche Secrets für alle kritischen Komponenten
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 GLXY Gaming Platform - Production Secret Generator');
console.log('====================================================\n');

// Sichere Secret-Generierung
function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('base64url');
}

function generatePassword(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Generiere alle kritischen Secrets
const secrets = {
  // Database Credentials
  DB_PASSWORD: generatePassword(32),
  DB_USER: `glxy_${crypto.randomBytes(4).toString('hex')}`,
  
  // Redis Credentials  
  REDIS_PASSWORD: generatePassword(32),
  
  // Application Secrets
  NEXTAUTH_SECRET: generateSecureSecret(64),
  JWT_SECRET: generateSecureSecret(48),
  
  // API Keys
  API_ENCRYPTION_KEY: generateSecureSecret(32),
  SESSION_ENCRYPTION_KEY: generateSecureSecret(32),
  
  // Security Keys
  CSRF_SECRET: generateSecureSecret(32),
  COOKIE_SECRET: generateSecureSecret(32),
  
  // Sentry Integration
  SENTRY_AUTH_TOKEN: generateSecureSecret(40),
  
  // Socket.IO Security
  SOCKET_IO_SECRET: generateSecureSecret(32)
};

console.log('✅ Generated Secure Secrets:');
console.log('============================\n');

// Erstelle .env.production Template
const envProduction = `# ===================================================
# GLXY Gaming Platform - PRODUCTION Environment
# ===================================================
# 🚨 KRITISCH: Diese Datei enthält ECHTE Production Secrets!
# NIEMALS in Git committen oder öffentlich teilen!
# Generiert am: ${new Date().toISOString()}
# ===================================================

# ===================================================
# APPLICATION CONFIGURATION
# ===================================================
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1

# Public URLs (ANPASSEN FÜR DEINE DOMAIN!)
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_WS_URL=wss://your-domain.com

# ===================================================
# DATABASE CONFIGURATION (POSTGRESQL)
# ===================================================

# PRODUCTION Database URL - ANPASSEN!
# Format: postgresql://username:password@host:port/database
DATABASE_URL=postgresql://${secrets.DB_USER}:${secrets.DB_PASSWORD}@your-db-host:5432/glxy_gaming?sslmode=require&connect_timeout=15

# Separate DB Credentials
POSTGRES_DB=glxy_gaming
POSTGRES_USER=${secrets.DB_USER}
POSTGRES_PASSWORD=${secrets.DB_PASSWORD}

# ===================================================
# REDIS CONFIGURATION
# ===================================================
REDIS_URL=redis://:${secrets.REDIS_PASSWORD}@your-redis-host:6379
REDIS_PASSWORD=${secrets.REDIS_PASSWORD}
REDIS_HOST=your-redis-host
REDIS_PORT=6379

# ===================================================
# AUTHENTICATION & SECURITY
# ===================================================

# NextAuth Secret (64 bytes, base64url)
NEXTAUTH_SECRET=${secrets.NEXTAUTH_SECRET}
NEXTAUTH_URL=https://your-domain.com

# JWT Secret (48 bytes, base64url)
JWT_SECRET=${secrets.JWT_SECRET}

# Additional Security Keys
API_ENCRYPTION_KEY=${secrets.API_ENCRYPTION_KEY}
SESSION_ENCRYPTION_KEY=${secrets.SESSION_ENCRYPTION_KEY}
CSRF_SECRET=${secrets.CSRF_SECRET}
COOKIE_SECRET=${secrets.COOKIE_SECRET}

# ===================================================
# SOCKET.IO CONFIGURATION
# ===================================================
SOCKET_IO_SECRET=${secrets.SOCKET_IO_SECRET}
SOCKET_IO_PORT=3001
SOCKET_IO_CORS_ORIGIN=https://your-domain.com
SOCKET_IO_ADAPTER=redis

# ===================================================
# ERROR MONITORING (SENTRY)
# ===================================================
SENTRY_DSN=https://956c0b8a160702cbf43a9f4bbad0f1c8@o4509996266881024.ingest.de.sentry.io/4509996276187216
SENTRY_ORG=glxy-project
SENTRY_PROJECT=glxy-gaming
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
SENTRY_DEBUG=false
SENTRY_AUTH_TOKEN=${secrets.SENTRY_AUTH_TOKEN}

# ===================================================
# SECURITY CONFIGURATION
# ===================================================
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
ENABLE_SECURITY_HEADERS=true
FORCE_HTTPS=true
BCRYPT_ROUNDS=12

# Account Lockout Settings
ACCOUNT_LOCKOUT_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=1800000

# ===================================================
# PERFORMANCE & MONITORING
# ===================================================
ENABLE_LOGGING=true
LOG_LEVEL=info
ENABLE_METRICS=true

# Database Connection Pool
DATABASE_POOL_SIZE=10
DATABASE_POOL_TIMEOUT=30000

# Caching
ENABLE_REDIS_CACHE=true
CACHE_TTL=3600

# ===================================================
# OPTIONAL SERVICES
# ===================================================

# Email Service (falls benötigt)
# SMTP_HOST=smtp.your-provider.com
# SMTP_PORT=587
# SMTP_USER=your-email@domain.com
# SMTP_PASS=your-email-password

# File Storage (falls benötigt)
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# AWS_REGION=eu-central-1
# AWS_S3_BUCKET=glxy-gaming-uploads

# ===================================================
# END OF PRODUCTION CONFIGURATION
# ===================================================
`;

// Schreibe .env.production
const envPath = path.join(__dirname, '../.env.production');
fs.writeFileSync(envPath, envProduction);

console.log('Database User:', secrets.DB_USER);
console.log('Database Password:', '***MASKED***');
console.log('Redis Password:', '***MASKED***');
console.log('NextAuth Secret:', '***MASKED***');
console.log('JWT Secret:', '***MASKED***');
console.log('\n🔒 Secrets Summary:');
console.log('==================');
console.log('- Database Password: 32 chars, mixed case + symbols');
console.log('- Redis Password: 32 chars, mixed case + symbols'); 
console.log('- NextAuth Secret: 64 bytes, base64url encoded');
console.log('- JWT Secret: 48 bytes, base64url encoded');
console.log('- Additional Keys: 32 bytes each, base64url encoded');

console.log('\n📁 Files Created:');
console.log('=================');
console.log('✅', envPath);

console.log('\n🚨 WICHTIGE NÄCHSTE SCHRITTE:');
console.log('=============================');
console.log('1. Kopiere .env.production zu .env auf deinem Server');
console.log('2. Passe die URLs und Hosts in .env an (your-domain.com, your-db-host, etc.)');
console.log('3. Sichere diese Secrets an einem sicheren Ort!');
console.log('4. NIEMALS diese Secrets in Git committen!');

console.log('\n✅ Production Secrets erfolgreich generiert!');

// Erstelle auch Security Checklist
const securityChecklistPath = path.join(__dirname, '../PRODUCTION_SECURITY_CHECKLIST.md');
const securityChecklist = `# GLXY Gaming Platform - Production Security Checklist

## 🔐 Pre-Deployment Security Checklist

### ✅ Secrets & Authentication

- [ ] ✅ Production secrets generiert (siehe .env.production)
- [ ] 🔄 Domain URLs in .env.production angepasst  
- [ ] 🔄 Database Host in .env.production angepasst
- [ ] 🔄 Redis Host in .env.production angepasst
- [ ] 🔄 Sentry DSN konfiguriert
- [ ] 🔄 Secrets sicher gespeichert (Password Manager)

### 🛡️ Database Security

- [ ] 🔄 PostgreSQL User mit minimalen Rechten erstellt
- [ ] 🔄 Database Firewall konfiguriert (nur App Server Zugriff)  
- [ ] 🔄 SSL/TLS für DB Verbindung aktiviert
- [ ] 🔄 Database Backup Strategy implementiert
- [ ] 🔄 Database Monitoring aktiviert

### 🔒 Redis Security

- [ ] 🔄 Redis Password authentication aktiviert
- [ ] 🔄 Redis Firewall konfiguriert
- [ ] 🔄 Redis CONFIG commands disabled
- [ ] 🔄 Redis persistence konfiguriert

### 🌐 Network Security

- [ ] 🔄 HTTPS/SSL Zertifikat installiert
- [ ] 🔄 HTTP → HTTPS Redirect aktiviert
- [ ] 🔄 Firewall Rules konfiguriert (nur 80, 443, SSH)
- [ ] 🔄 SSH Key-based Auth (Password Auth disabled)
- [ ] 🔄 Fail2ban installiert und konfiguriert

### 📊 Monitoring & Logging

- [ ] ✅ Sentry Error Monitoring konfiguriert
- [ ] 🔄 Server Monitoring (CPU, RAM, Disk) aktiviert
- [ ] 🔄 Application Logs konfiguriert
- [ ] 🔄 Security Log Monitoring aktiviert
- [ ] 🔄 Backup Monitoring aktiviert

### 🚀 Application Security

- [ ] ✅ Rate Limiting aktiviert
- [ ] ✅ Security Headers konfiguriert
- [ ] ✅ Input Validation mit Zod
- [ ] ✅ CSRF Protection aktiviert
- [ ] ✅ Account Lockout Mechanismus
- [ ] ✅ Password Hashing (bcrypt 12 rounds)

### 🔧 Server Hardening

- [ ] 🔄 OS Updates installiert
- [ ] 🔄 Unnötige Services deaktiviert
- [ ] 🔄 User Permissions minimiert
- [ ] 🔄 File Permissions gesetzt
- [ ] 🔄 Log Rotation konfiguriert

### 📋 Deployment Checklist

- [ ] 🔄 Production Build erstellt (\`npm run build\`)
- [ ] 🔄 Environment Variables gesetzt
- [ ] 🔄 Database Migration getestet
- [ ] 🔄 Health Checks funktional
- [ ] 🔄 Rollback Plan vorbereitet

## 🚨 KRITISCHE SECURITY TODOS

### SOFORT ERLEDIGEN:
1. **URLs anpassen** in .env.production
2. **Database & Redis Hosts** konfigurieren  
3. **SSL Zertifikat** installieren
4. **Firewall Rules** aktivieren

### NACH DEPLOYMENT:
1. **Security Scan** durchführen
2. **Penetration Test** beauftragen
3. **Monitoring Alerts** testen
4. **Backup Recovery** testen

---

**Generiert am:** ${new Date().toISOString()}
**Version:** 1.0.0
**Letzte Aktualisierung:** ${new Date().toLocaleDateString('de-DE')}
`;

fs.writeFileSync(securityChecklistPath, securityChecklist);
console.log('✅', securityChecklistPath);
console.log('\n🛡️ Security Checklist erstellt für systematische Härtung!');
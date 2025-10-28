# 🔌 Port Configuration - GLXY Gaming Platform

**Datum**: 04.10.2025
**Status**: ✅ Konfiguriert für parallelen Betrieb

---

## 📊 Port-Übersicht

| Environment | Port | URL | Status |
|-------------|------|-----|--------|
| **Development** | 3000 | http://localhost:3000 | ✅ Aktiv |
| **Production** | 3001 | http://localhost:3001 | ✅ Konfiguriert |

**WICHTIG**: Beide können **parallel** laufen! 🎉

---

## 🖥️ Development (Port 3000)

### Configuration
```bash
# .env.development
NODE_ENV=development
PORT=3000
NEXTAUTH_URL=http://localhost:3000
```

### Starten
```bash
npm run dev
```

### Erwarteter Output
```
   ▲ Next.js 15.5.3
   - Local:        http://localhost:3000  ← DEV PORT
   - Network:      http://100.124.80.13:3000
```

---

## 🚀 Production (Port 3001)

### Configuration
```bash
# .env.production
NODE_ENV=production
PORT=3001
NEXTAUTH_URL=https://glxy.at
# Lokaler Test: http://localhost:3001
```

### Starten (Lokal)
```bash
# Build erstellen
npm run build

# Production Server starten
NODE_ENV=production npm start
```

### Erwarteter Output
```
🚀 GLXY Gaming Platform ready on http://localhost:3001  ← PROD PORT
🌍 Environment: production
```

---

## 🐳 Docker Production

### Docker Compose
```yaml
# docker/docker-compose.yml
services:
  app:
    ports:
      - "3001:3001"  # Production Port
    environment:
      - PORT=3001
      - NODE_ENV=production
```

### Starten
```bash
docker-compose up -d
```

### Zugriff
```
http://localhost:3001
```

---

## 🔄 Paralleler Betrieb

**Beide Server gleichzeitig laufen lassen:**

### Terminal 1 - Development
```bash
npm run dev
# → http://localhost:3000
```

### Terminal 2 - Production (Local Test)
```bash
npm run build
NODE_ENV=production npm start
# → http://localhost:3001
```

**Kein Konflikt!** ✅

---

## ⚙️ Wie funktioniert das?

### server.ts
```typescript
const port = parseInt(process.env.PORT || '3000', 10)
```

### Port-Auswahl
1. Liest `PORT` aus Environment
2. Fallback auf `3000` wenn nicht gesetzt
3. Development: `.env.development` → PORT=3000
4. Production: `.env.production` → PORT=3001

---

## 🧪 Testing

### Development Server testen
```bash
curl http://localhost:3000/api/health
```

### Production Server testen
```bash
curl http://localhost:3001/api/health
```

---

## 🔒 Firewall / Security

### Lokale Entwicklung
```
Port 3000: Nur localhost (Development)
Port 3001: Nur localhost (Production Test)
```

### Production Server (glxy.at)
```
Port 3001: Hinter Nginx Reverse Proxy
External:  Port 80/443 (HTTPS)
Internal:  Port 3001 (Node.js)
```

---

## 🐛 Troubleshooting

### Port 3000 bereits belegt?
```bash
# Prozess finden
netstat -ano | findstr ":3000"

# Prozess beenden
taskkill /F /PID <PID>

# Server neu starten
npm run dev
```

### Port 3001 bereits belegt?
```bash
# Prozess finden
netstat -ano | findstr ":3001"

# Prozess beenden
taskkill /F /PID <PID>

# Server neu starten
NODE_ENV=production npm start
```

### Beide Ports belegt?
```bash
# Alle Node Prozesse beenden (VORSICHT!)
taskkill /F /IM node.exe

# Server neu starten
npm run dev  # Port 3000
```

---

## 📋 Checkliste für neuen Server

### Development Setup
- [ ] `.env.development` hat `PORT=3000`
- [ ] `npm run dev` startet auf Port 3000
- [ ] OAuth Callback URL: `http://localhost:3000/api/auth/callback/*`

### Production Setup
- [ ] `.env.production` hat `PORT=3001`
- [ ] Docker Compose konfiguriert `3001:3001`
- [ ] Nginx Proxy auf Port 3001 zeigt
- [ ] OAuth Callback URL: `https://glxy.at/api/auth/callback/*`

---

## 🎯 Best Practices

### 1. Port-Naming
```
Development: 3000 (Standard Next.js)
Production:  3001 (Test), 80/443 (Live)
Testing:     3002 (CI/CD)
```

### 2. Environment Variables
```bash
# IMMER explizit setzen
PORT=3000  # Development
PORT=3001  # Production
```

### 3. Docker Port Mapping
```yaml
ports:
  - "3001:3001"  # host:container
```

### 4. Nginx Reverse Proxy
```nginx
upstream nextjs_backend {
  server localhost:3001;
}

server {
  listen 80;
  server_name glxy.at;

  location / {
    proxy_pass http://nextjs_backend;
  }
}
```

---

## 📚 Referenzen

- `.env.development` - Development Port Config
- `.env.production` - Production Port Config
- `server.ts:14` - Port Reading Logic
- `docker/docker-compose.yml` - Docker Port Mapping

---

## ✅ Status

**Development (3000)**: ✅ Aktiv und läuft
**Production (3001)**: ✅ Konfiguriert und bereit

**Paralleler Betrieb**: ✅ Möglich ohne Konflikte

---

**Version**: 1.0
**Last Updated**: 04.10.2025, 13:10 Uhr

**GLXY Gaming Platform** - Professional Port Management 🔌

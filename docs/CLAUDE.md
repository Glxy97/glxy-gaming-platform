# CLAUDE.md - GLXY Gaming Platform

## Projektübersicht

**GLXY Gaming Platform** ist eine moderne Gaming-Plattform mit Next.js 15, React 19, TypeScript und PostgreSQL. Die Plattform bietet Multiplayer-Gaming, umfangreiche Tools, Social Features und erweiterte Sicherheitsfunktionen.

## Technologie-Stack (Aktuell)

### Core Framework
- **Next.js**: 15.5.3 (App Router, Server Components)
- **React**: 19.0.0 (mit React Server Components)
- **TypeScript**: 5.6.3
- **Node.js**: Custom Express Server mit Socket.IO

### Datenbank & Caching
- **PostgreSQL**: Hauptdatenbank mit Prisma ORM (6.16.2)
- **Redis**: ioredis 5.4.1 für Caching, Sessions, Real-time Gaming
- **Prisma**: Type-safe ORM mit Schema-Migrationen

### Authentifizierung & Sicherheit
- **NextAuth.js**: 5.0.0-beta.25 (Credentials, OAuth)
- **Multi-Factor Authentication**: TOTP mit otplib
- **Verschlüsselung**: bcryptjs + custom crypto-util
- **Rate Limiting**: Redis-basiert
- **Security Headers**: CSP, CSRF-Schutz

### UI & Styling
- **Tailwind CSS**: 3.4.17 mit tailwindcss-animate
- **Radix UI**: Vollständige Komponenten-Suite
- **Framer Motion**: 11.11.17 für Animationen
- **Lucide React**: 0.453.0 für Icons

### Real-time & Multiplayer
- **Socket.IO**: 4.8.0 (Client & Server)
- **Custom Game State Manager**: Redis-basiert
- **Multiplayer Handler**: Optimiert für niedrige Latenz

## Environment Configuration

Das Projekt nutzt eine professionelle Environment-Struktur mit getrennten Konfigurationen:

### Environment Files
```
.env.development    # Lokale Entwicklung (localhost, Windows)
.env.production     # Production Server (Docker, Linux)
.env.local          # Lokale Overrides (NICHT in Git!)
```

### .env.development (Lokale Entwicklung)
- **Database**: `localhost:5432` (lokales PostgreSQL)
- **Redis**: `localhost:6379` (lokales Redis)
- **URLs**: `http://localhost:3000`
- **OAuth**: Development Credentials
- **Secrets**: Development Keys (mit `-dev` Suffix)

**Setup für lokale Entwicklung:**
```bash
# 1. PostgreSQL installieren (Windows)
# Download: https://www.postgresql.org/download/windows/

# 2. Redis installieren (Windows)
# Download: https://github.com/microsoftarchive/redis/releases

# ODER: Docker verwenden
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=yourpass --name glxy-db postgres
docker run -d -p 6379:6379 --name glxy-redis redis

# 3. Database initialisieren
npm run db:migrate
npm run db:seed

# 4. Development starten
npm run dev
```

### .env.production (Docker/Server)
- **Database**: `db:5432` (Docker Container Name)
- **Redis**: `redis:6379` (Docker Container Name)
- **URLs**: `https://glxy.at`
- **OAuth**: Production Credentials (MÜSSEN angepasst werden!)
- **Secrets**: Production Keys (MÜSSEN neu generiert werden!)

**Setup für Production:**
```bash
# 1. Secrets generieren
openssl rand -base64 32  # Für NEXTAUTH_SECRET
openssl rand -base64 32  # Für JWT_SECRET
openssl rand -base64 32  # Für SOCKET_IO_SECRET

# 2. OAuth Apps erstellen
# Google: https://console.cloud.google.com/
# GitHub: https://github.com/settings/developers
# Callback URL: https://yourdomain.com/api/auth/callback/{provider}

# 3. Docker Deploy
docker-compose up -d

# 4. Database Migration
docker-compose exec app npm run db:migrate
```

### .env.local (Optional)
Für persönliche Overrides ohne Git-Commit:
```bash
# Überschreibt Werte aus .env.development oder .env.production
DATABASE_URL=postgresql://custom@localhost:5432/custom_db
```

### Wichtige Hinweise
- `.env.local` wird NIEMALS committed (in .gitignore)
- `.env.development` und `.env.production` sind Templates und werden committed
- In Production MÜSSEN alle Secrets neu generiert werden!
- OAuth Credentials müssen für Production-Domain neu erstellt werden

## Projekt-Struktur

```
/opt/glxy-gaming/
├── app/                    # Next.js App Router
│   ├── api/               # 46 API Routes
│   │   ├── admin/         # Admin-Features (MFA, Database)
│   │   ├── auth/          # Authentication & OAuth
│   │   ├── games/         # Gaming APIs (Stats, Multiplayer)
│   │   ├── cache/         # Cache-Management
│   │   ├── security-scan/ # Sicherheits-Tools
│   │   └── theme/         # Theme-Management
│   ├── games/             # 8 Gaming-Seiten
│   │   ├── chess/         # Schach-Spiel
│   │   ├── connect4/      # Vier Gewinnt
│   │   ├── tetris/        # Tetris
│   │   ├── tictactoe/     # Tic-Tac-Toe
│   │   ├── fps/           # First-Person Shooter
│   │   ├── racing/        # Racing-Game
│   │   └── uno/           # UNO
│   ├── tools/             # 10 Entwickler-Tools
│   │   ├── ai-analyzer/   # AI-Code-Analyse
│   │   ├── security-scanner/ # Security-Scanner
│   │   ├── server-monitor/ # Server-Monitoring
│   │   └── password-generator/ # Passwort-Generator
│   ├── admin/             # Admin-Interface
│   ├── console03-09-97/   # Retro-Console Interface
│   └── multiplayer/       # Multiplayer-Lobby
├── components/            # React-Komponenten
│   ├── ui/               # Shadcn/UI Komponenten
│   ├── games/            # Game-spezifische Komponenten
│   ├── layout/           # Layout-Komponenten
│   └── multiplayer/      # Multiplayer-UI
├── lib/                  # Core Libraries (40+ Module)
│   ├── auth.ts           # NextAuth Konfiguration
│   ├── auth-security.ts  # Erweiterte Auth-Sicherheit
│   ├── db.ts             # Prisma Client
│   ├── redis.ts          # Redis Client + Cache
│   ├── socket-server.ts  # Socket.IO Server
│   ├── advanced-encryption.ts # Verschlüsselung
│   ├── security-*.ts     # Sicherheits-Module
│   └── game-state-manager.ts # Gaming State
└── prisma/               # Datenbank
    ├── schema.prisma     # Aktuelle DB-Schema
    └── migrations/       # Migrationen
```

## API-Endpunkte (46 Routen)

### Authentication & User Management
```
POST   /api/auth/[...nextauth]        # NextAuth.js Handler
POST   /api/auth/check-username       # Username-Verfügbarkeit
POST   /api/auth/create-oauth-user    # OAuth-Benutzer erstellen
POST   /api/signup                    # Benutzerregistrierung
GET    /api/verify-email              # Email-Verifizierung
GET    /api/profile                   # Benutzerprofil
PUT    /api/user/profile              # Profil aktualisieren
GET    /api/user/achievements         # Errungenschaften
GET    /api/users/search              # Benutzer suchen
```

### Gaming & Multiplayer
```
GET    /api/games/stats               # Gaming-Statistiken
POST   /api/games/connect4            # Connect4 Game Logic
POST   /api/games/tetris              # Tetris Game Logic
POST   /api/games/tictactoe           # TicTacToe Game Logic
GET    /api/leaderboards              # Ranglisten
POST   /api/rooms/create              # Spielraum erstellen
POST   /api/rooms/join                # Raum beitreten
POST   /api/rooms/leave               # Raum verlassen
GET    /api/rooms/list                # Öffentliche Räume
GET    /api/spectate/[roomId]         # Spiel beobachten
POST   /api/matchmaking/queue         # Matchmaking
```

### Social & Communication
```
GET    /api/friends                   # Freunde-Liste
GET    /api/friends/[id]              # Spezifischer Freund
GET    /api/notifications             # Benachrichtigungen
POST   /api/tournaments               # Turniere
POST   /api/tournaments/[id]/join     # Turnier beitreten
```

### Admin & Security
```
POST   /api/admin/mfa/create          # MFA Setup
POST   /api/admin/mfa/verify          # MFA Verifikation
POST   /api/admin/mfa/disable         # MFA Deaktivieren
GET    /api/admin/database/performance # DB Performance
POST   /api/security-scan             # Security Scanner
GET    /api/rate-limit                # Rate Limit Status
POST   /api/csp-violations            # CSP Violation Reports
```

### System & Utilities
```
GET    /api/health                    # Health Check
GET    /api/cache/stats               # Cache-Statistiken
GET    /api/metrics                   # System-Metriken
POST   /api/ai-analyzer               # AI-Code-Analyse
POST   /api/analyze                   # Code-Analyse
POST   /api/chatbot                   # AI-Chatbot
GET    /api/theme/active              # Aktives Theme
PUT    /api/theme/presets/[name]      # Theme-Preset
POST   /api/errors                    # Error Reporting
```

## Sicherheitsarchitektur

### Multi-Layer Security
1. **Input Validation**: Zod-basierte Schema-Validierung
2. **Rate Limiting**: Redis-basiertes Rate Limiting pro IP/User
3. **Account Security**: Automatisches Lockout nach Failed Logins
4. **MFA Support**: TOTP-basierte Zwei-Faktor-Authentifizierung
5. **Encryption**: bcrypt + custom AES-Verschlüsselung
6. **CSP Headers**: Strict Content Security Policy
7. **CSRF Protection**: Token-basierter CSRF-Schutz

### Security Modules
```typescript
lib/auth-security.ts           # Core Auth Security
lib/advanced-encryption.ts    # AES/RSA Encryption
lib/security-middleware.ts    # Request Security
lib/input-validation-security.ts # Input Sanitization
lib/application-security-controls.ts # App-Level Controls
lib/secure-communication.ts   # Secure WebSocket/HTTP
```

## Entwicklungsworkflow

### Verfügbare Scripts
```bash
npm run dev              # Development Server (Next.js + Socket.IO)
npm run dev:turbo        # Development mit Turbo Mode
npm run build            # Production Build
npm run start            # Production Server
npm run lint             # ESLint Code-Qualität
npm run typecheck        # TypeScript-Validierung
npm run test             # Jest Unit Tests
npm run test:watch       # Jest Watch Mode
npm run test:coverage    # Coverage Report
npm run e2e              # Playwright E2E Tests
npm run seed             # Database Seeding
npm run verify           # Full System Verification
```

### Build-Konfiguration
- **Standalone Output**: Aktiviert für Docker-Deployment
- **TypeScript Checks**: Temporär deaktiviert (Memory-Probleme)
- **Sentry**: Temporär deaktiviert
- **Console Logs**: Entfernt in Production (außer Errors)

## Gaming-Features

### Verfügbare Spiele
1. **Chess** - Vollständiges Schachspiel mit AI
2. **Connect4** - Vier Gewinnt Multiplayer
3. **Tetris** - Klassisches Tetris
4. **TicTacToe** - Tic-Tac-Toe mit AI
5. **FPS** - 3D First-Person Shooter
6. **Racing** - 3D Racing Game
7. **UNO** - Kartenspiel UNO

### Multiplayer-System
- **Real-time Communication**: Socket.IO
- **Game State Management**: Redis-basiert
- **Room System**: Erstellen, Beitreten, Verlassen
- **Spectator Mode**: Live-Spiel-Beobachtung
- **Matchmaking**: Automatisches Pairing

## Developer Tools (10 Tools)

1. **AI Analyzer** - KI-gestützte Code-Analyse
2. **Security Scanner** - Automatische Vulnerability Scans
3. **Server Monitor** - Live Server-Monitoring
4. **Password Generator** - Sichere Passwort-Generierung
5. **Hash Calculator** - Verschiedene Hash-Algorithmen
6. **JSON Validator** - JSON Schema-Validierung
7. **Website Analyzer** - SEO & Performance Analysis
8. **Chess Analyzer** - Schach-Position Analyse
9. **Chatbot** - AI-Chatbot Interface

## Performance & Caching

### Redis-Strategien
```typescript
// Cache-Keys
user:${userId}:profile     # Benutzerprofile
game:${gameId}:state       # Spielzustände
leaderboard:global         # Globale Ranglisten
session:${sessionId}       # User-Sessions
rateLimit:${ip}           # Rate Limiting
```

### Database-Optimierungen
- **Connection Pooling**: Prisma-optimiert
- **Query Optimization**: Indexed Queries
- **Migration System**: Custom Migration Scripts

## AI-Integration

### Claude-spezifische Konfigurationen
```javascript
// .claude/settings.local.json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(docker *)",
      "WebFetch(domain:glxy.at)",
      "Read(//tmp/**)"
    ]
  }
}
```

### Verfügbare Commands

#### Kurze Shell-Aliases (nach Setup)
```bash
# Setup einmalig ausführen
bash scripts/setup-aliases.sh

# Dann verfügbar:
gdev        # 🚀 Development Server (npm run dev:full)
gbuild      # 🔨 Full Build + Tests (npm run build:full)
gtest       # 🧪 Complete Test Suite (npm run test:full)
gsec        # 🔒 Security Scan (npm run security:scan)
gdeploy     # 🚢 Production Deploy (npm run deploy:prod)
gdb         # 🗄️ Database Setup (migrate + seed)
```

#### Erweiterte npm Scripts
```bash
npm run dev:full        # Development Server
npm run build:full      # TypeScript + Lint + Tests + Build
npm run test:full       # Unit + Coverage + E2E Tests
npm run security:scan   # Security Vulnerability Scan
npm run deploy:prod     # Production Deployment
npm run db:migrate      # Database Migrations
npm run db:seed         # Database Seeding
```

## Häufige Entwicklungsaufgaben

### Neue API-Route hinzufügen
1. Erstelle `app/api/[route]/route.ts`
2. Implementiere Handler mit NextAuth-Check
3. Füge Zod-Validierung hinzu
4. Teste mit `/api/health` Pattern

### Neues Game integrieren
1. Erstelle `app/games/[game]/page.tsx`
2. Füge Socket.IO Handler hinzu
3. Implementiere Game State in Redis
4. Erstelle UI-Komponenten

### Security-Feature hinzufügen
1. Erweitere `lib/auth-security.ts`
2. Füge Middleware hinzu
3. Teste Rate Limiting
4. Update Security Headers

## Production-Deployment

### Docker-Stack
- **PostgreSQL**: Persistent Volume
- **Redis**: Memory-optimiert
- **Next.js**: Standalone Build
- **Nginx**: Reverse Proxy

### Monitoring
- Health Checks auf `/api/health`
- Performance Metrics auf `/api/metrics`
- Error Reporting über `/api/errors`

## Coding-Standards

### TypeScript
- Strict Mode aktiviert
- Zod für Runtime-Validierung
- Interface-basierte API-Contracts

### Security-First
- Alle Inputs validieren
- Rate Limiting auf API-Level
- Prinzip der minimalen Privilegien

### Performance
- Server Components wo möglich
- Redis-Caching für häufige Queries
- Lazy Loading für große Komponenten

---

**Version**: Aktuell (September 2024)
**Next.js**: 15.5.3 | **React**: 19.0.0 | **Node.js**: 18+

## Was noch fehlt / WIP

### Web-Adobe Integration (FormTool Pro Web Companion)
- **Status**: Noch nicht integriert
- **Lokation**: `G:\website\verynew\WEB_ADOBE`
- **Ziel**: Vollständige Integration in die GLXY Gaming Platform
- **Umfang**:
  - Prisma-Modelle für PDF-Formular-Management (`PdfDocument`, `PdfField`)
  - Next.js-Routen mit geschütztem `/web-adobe` Bereich
  - FastAPI-Backend-Service für PDF-Verarbeitung (OCR, AI-Vorschläge)
  - Docker-Container mit Traefik/Nginx-Anbindung
  - React+Vite Frontend-Integration (PDF.js Viewer, Feld-Editor)
  - DataPad REST-API Integration für Feldverwaltung
  - Authentifizierung über bestehendes NextAuth-System
- **Roadmap**: 10-Phasen Integrationsplan erstellt, Start mit Phase 2
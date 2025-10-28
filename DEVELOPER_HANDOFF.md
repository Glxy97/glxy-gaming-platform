# GLXY Gaming Platform - Developer Handoff Documentation

## 📋 Projekt-Übersicht

**Projekt:** GLXY Gaming Platform
**Domain:** https://glxy.at
**Typ:** Next.js 15 Full-Stack Gaming-Plattform mit OAuth, Multiplayer-Games, PDF-Editor
**Status:** Production (aktiv deployed)

## 🛠️ Tech Stack

### Core Framework
- **Next.js:** 15.5.3 (App Router, Server Components, Server Actions)
- **React:** 18+ (Server & Client Components)
- **TypeScript:** 5.x (strict mode)
- **Node.js:** 20.19.5 (LTS)

### Database & Cache
- **PostgreSQL:** 16.10 (Primary Database)
- **Prisma ORM:** 6.17.0 (Type-safe DB queries)
- **Redis:** 7.4.5 (Session Cache, Rate Limiting)

### Authentication
- **NextAuth.js:** v5 (OAuth 2.0 + Credentials)
- **Providers:** Google, GitHub, Email/Password
- **Security:** bcryptjs, JWT sessions, PKCE flow

### UI/UX
- **Styling:** Tailwind CSS 3.x
- **Components:** Radix UI, shadcn/ui
- **Icons:** Lucide React
- **Animations:** Framer Motion

### Real-time & WebSocket
- **Socket.IO:** Multiplayer game state synchronization
- **Event System:** Custom pub/sub for game rooms

### PDF Processing
- **pdf-lib:** PDF manipulation
- **canvas:** Server-side rendering
- **pdfjs-dist:** PDF parsing

### Deployment
- **Container:** Docker (multi-stage build)
- **Registry:** GitHub Container Registry (ghcr.io)
- **Server:** Hetzner VPS (Ubuntu/Alpine)
- **Reverse Proxy:** nginx-proxy (SSL/TLS)
- **Orchestration:** Docker Compose

### Development
- **Package Manager:** npm
- **Linting:** ESLint (Next.js config)
- **Testing:** (Setup pending)
- **Hot Reload:** Next.js Fast Refresh

## 📁 Projektstruktur

```
glxy-gaming/
├── app/                          # Next.js App Router (Routes)
│   ├── (auth)/                   # Auth-Gruppe (Sign-in, Sign-up)
│   ├── api/                      # API Routes (REST + Server Actions)
│   │   ├── auth/[...nextauth]/   # NextAuth Endpoints
│   │   ├── admin/                # Admin APIs
│   │   ├── games/                # Game State APIs
│   │   ├── pdf/                  # PDF Processing
│   │   └── web-adobe/            # Adobe-Integration
│   ├── admin/                    # Admin Dashboard
│   ├── dashboard/                # User Dashboard
│   ├── games/                    # Game Pages (Chess, Tetris, etc.)
│   ├── profile/                  # User Profile
│   ├── web-adobe/                # PDF Editor (Protected)
│   ├── web-adobe-demo/           # Public PDF Demo
│   ├── layout.tsx                # Root Layout
│   ├── page.tsx                  # Homepage
│   └── globals.css               # Global Styles
│
├── components/                   # Reusable React Components
│   ├── ui/                       # shadcn/ui Base Components
│   ├── games/                    # Game-specific Components
│   ├── admin/                    # Admin Components
│   └── layout/                   # Layout Components (Header, Footer)
│
├── lib/                          # Shared Libraries & Utilities
│   ├── auth.ts                   # NextAuth Configuration ⚠️ WICHTIG
│   ├── db.ts                     # Prisma Client Instance
│   ├── redis.ts                  # Redis Client
│   ├── rate-limit.ts             # Rate Limiting Logic
│   ├── error-handling.ts         # Error Handling + Sentry
│   └── utils.ts                  # Helper Functions
│
├── prisma/                       # Database Schema & Migrations
│   ├── schema.prisma             # Database Models ⚠️ WICHTIG
│   └── migrations/               # Migration History
│
├── public/                       # Static Assets
│   ├── images/                   # Images
│   ├── fonts/                    # Custom Fonts
│   └── favicon.ico
│
├── middleware.ts                 # Next.js Edge Middleware (Auth Check)
├── next.config.js                # Next.js Configuration ⚠️ WICHTIG
├── tailwind.config.ts            # Tailwind CSS Config
├── tsconfig.json                 # TypeScript Config
├── package.json                  # Dependencies
├── Dockerfile                    # Production Docker Build ⚠️ WICHTIG
├── docker-compose.prod.yml       # Production Compose ⚠️ WICHTIG
├── docker-compose.yml            # Local Development Compose
└── docker-entrypoint.sh          # Container Startup Script

⚠️ WICHTIG = Kritische Config-Files für Deployment/Auth
```

## 🔑 Wichtige Dateien im Detail

### 1. `lib/auth.ts` - NextAuth v5 Configuration
```typescript
// OAuth Providers: Google, GitHub, Credentials
// Session Strategy: JWT (30 Tage)
// Cookie Naming: authjs.* (NextAuth v5 Convention)
// Security: PKCE, Account Lockout, Email Verification
// ACHTUNG: allowDangerousEmailAccountLinking = false (Security Fix)
```

### 2. `middleware.ts` - Route Protection
```typescript
// Protected Routes: /web-adobe, /dashboard, /profile, /admin
// Public Routes: /auth/*, /web-adobe-demo, /api/auth/*
// Cookie Check: authjs.session-token (NextAuth v5)
```

### 3. `prisma/schema.prisma` - Database Models
```prisma
// Hauptmodelle:
// - User (Auth + Profile)
// - Account (OAuth Accounts)
// - Session (NextAuth Sessions)
// - GameSession, GameMove (Multiplayer)
// - Document, FormField (PDF Editor)
// - FriendRequest, Notification (Social)
```

### 4. `next.config.js` - Next.js Config
```javascript
// output: 'standalone' (Docker)
// serverExternalPackages: Prisma, Canvas, PDF
// experimental: optimizeCss, optimizePackageImports
// compiler: removeConsole in production
```

### 5. `Dockerfile` - Multi-Stage Build
```dockerfile
// Stage 1: deps → npm ci + native deps (cairo, pango)
// Stage 2: builder → Prisma generate + next build
// Stage 3: production → Minimal runtime (non-root user)
```

## 🌍 Environment Variables

### Production (.env.production oder docker-compose)
```bash
# Database
DATABASE_URL="postgresql://glxy_admin:***@postgres:5432/glxy_gaming"

# Redis
REDIS_URL="redis://redis:6379"

# NextAuth
NEXTAUTH_URL="https://glxy.at"
NEXTAUTH_SECRET="***"  # Geheim! 32+ Zeichen
AUTH_TRUST_HOST="true"  # Für Proxies wichtig!

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Optional
NODE_ENV="production"
DISABLE_SENTRY="false"  # true zum Deaktivieren
```

### Development (.env.local)
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/glxy_dev"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-min-32-chars"
# OAuth: Optional für lokale Tests
```

## 🚀 Development Setup

### 1. Prerequisites
```bash
# Node.js 20.x LTS
node --version  # v20.19.5

# Docker Desktop (für DB & Redis)
docker --version

# Git
git --version
```

### 2. Installation
```bash
# Repository clonen
git clone <repo-url>
cd glxy-gaming

# Dependencies installieren
npm install --legacy-peer-deps

# .env.local erstellen (siehe oben)
cp .env.example .env.local
# → Anpassen mit eigenen Werten!
```

### 3. Database Setup
```bash
# Docker Services starten (PostgreSQL + Redis)
docker-compose up -d

# Prisma Schema in DB pushen
npx prisma db push

# Optional: Seed-Daten
npx prisma db seed

# Prisma Studio (DB Admin UI)
npx prisma studio
```

### 4. Development Server
```bash
# Next.js Dev Server starten
npm run dev

# → http://localhost:3000

# Alternativ: Mit Prisma Studio parallel
npm run dev & npx prisma studio
```

## 📦 Build & Deployment

### Lokaler Build (Test)
```bash
# TypeScript prüfen
npm run typecheck

# Linting
npm run lint

# Production Build
npm run build

# Production Server testen
npm start
```

### Docker Build (Production)
```bash
# Image bauen
docker build -t ghcr.io/glxy97/acobe_web_glxy_site:latest .

# Image pushen (Registry Login benötigt)
docker push ghcr.io/glxy97/acobe_web_glxy_site:latest
```

### Production Deployment
```bash
# SSH auf Server
ssh root@glxy.at

# In Projekt-Verzeichnis
cd /opt/glxy-gaming

# Neues Image pullen
docker-compose -f docker-compose.prod.yml pull app

# Container neu starten
docker stop glxy-gaming-app
docker rm glxy-gaming-app
docker-compose -f docker-compose.prod.yml up -d app

# Logs prüfen
docker logs glxy-gaming-app --follow
```

## 🔒 Security Best Practices

### ✅ Implementiert
- JWT Sessions (httpOnly, secure cookies)
- CSRF Protection (sameSite: strict für State-Cookie)
- PKCE Flow für OAuth
- Account Lockout (5 failed attempts → 15 min lock)
- Email Verification vor Login
- Rate Limiting (Redis-basiert)
- Helmet Security Headers
- allowDangerousEmailAccountLinking = false

### ⚠️ To-Do
- OAuth Secrets aus Git-History entfernen
- Secrets in Vault/Secret Manager migrieren
- 2FA/MFA für Admin-Accounts
- Content Security Policy (CSP) verschärfen
- SQL Injection Tests (Prisma schützt bereits)

## 🎨 Code Conventions

### TypeScript
```typescript
// Strict Mode aktiviert
// Keine 'any' ohne guten Grund
// Interfaces für Props, Types für Unions
// Async/Await statt Promises

// ✅ Gut
interface UserProps {
  id: string
  name: string
}

// ❌ Vermeiden
const user: any = { ... }
```

### React Components
```typescript
// Server Components (default in App Router)
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}

// Client Components (nur wenn nötig)
'use client'
import { useState } from 'react'
export function InteractiveButton() { ... }
```

### API Routes
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Auth-Check
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Logic
    const data = await prisma.user.findMany()
    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
```

### Prisma Queries
```typescript
// lib/db.ts - Singleton Pattern
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Usage
import { prisma } from '@/lib/db'
const users = await prisma.user.findMany()
```

## 🐛 Debugging & Logging

### Development
```bash
# Next.js Dev-Logs (Console)
npm run dev

# Prisma Query-Logs
# .env: DATABASE_URL mit ?query_log=true

# Docker Logs (Container)
docker logs glxy-db --follow
docker logs glxy-redis --follow
```

### Production
```bash
# SSH auf Server
ssh root@glxy.at

# Application Logs
docker logs glxy-gaming-app --follow --tail 100

# Nginx Logs
docker exec nginx-proxy cat /var/log/nginx/access.log

# Database Logs
docker logs glxy-gaming-db --tail 50
```

## 🔗 Wichtige Links

### Dokumentation
- Next.js 15: https://nextjs.org/docs
- NextAuth.js v5: https://authjs.dev
- Prisma: https://www.prisma.io/docs
- Tailwind CSS: https://tailwindcss.com/docs

### Repository & Deployment
- GitHub: (Repo-URL einfügen)
- Registry: ghcr.io/glxy97/acobe_web_glxy_site
- Production: https://glxy.at
- Admin Panel: https://glxy.at/admin

### Monitoring (Optional)
- Sentry: (Falls aktiviert)
- Database: Prisma Studio (lokaler Port)

## 📝 Aktuelle TODOs & Known Issues

### Critical
- [ ] OAuth Secrets rotieren (Google Console + GitHub)
- [ ] Failed Prisma Migration fixen (20251004072231_init)

### High Priority
- [ ] Testing Setup (Jest + Playwright)
- [ ] Error Boundary für Client Components
- [ ] Rate Limiting für API Routes erweitern

### Medium Priority
- [ ] User Avatar Upload
- [ ] Email Template System
- [ ] Admin Dashboard Analytics

### Low Priority
- [ ] Dark Mode Toggle
- [ ] Internationalization (i18n)
- [ ] PWA Support

## 🤝 Contribution Guidelines

### Git Workflow
```bash
# Feature Branch erstellen
git checkout -b feature/mein-feature

# Commits
git add .
git commit -m "feat: Beschreibung des Features"

# Push
git push origin feature/mein-feature

# Pull Request erstellen
# → Review durch Team
```

### Commit Convention
```
feat: Neues Feature
fix: Bugfix
docs: Dokumentation
style: Code-Formatierung
refactor: Code-Refactoring
test: Tests hinzufügen
chore: Build/Config-Änderungen
```

## 📞 Kontakt & Support

**Maintainer:** (Dein Name/Team)
**Email:** (Support-Email)
**Issues:** (GitHub Issues URL)

---

**Letzte Aktualisierung:** 2025-10-10
**Dokumentversion:** 1.0
**Projekt-Status:** ✅ Production-Ready

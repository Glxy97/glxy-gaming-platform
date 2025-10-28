# AI Builder Briefing - GLXY Gaming Platform

> **Copy-Paste Ready:** Dieses Dokument direkt an einen AI Builder (Claude, ChatGPT, etc.) weitergeben.

---

## Projekt-Kontext

Du arbeitest an der **GLXY Gaming Platform** (https://glxy.at) - einer Next.js 15 Full-Stack Gaming-Plattform mit OAuth-Authentifizierung, Multiplayer-Games und PDF-Editor.

**Wichtig:** Das Projekt läuft bereits in Production. Alle Änderungen müssen production-ready sein.

## Tech Stack (Wichtigste)

```typescript
Framework:    Next.js 15.5.3 (App Router)
Language:     TypeScript (strict mode)
Database:     PostgreSQL 16 + Prisma ORM 6.17
Cache:        Redis 7.4.5
Auth:         NextAuth.js v5 (JWT Sessions)
UI:           Tailwind CSS + shadcn/ui + Radix UI
Real-time:    Socket.IO (Multiplayer)
Deploy:       Docker (ghcr.io registry) → Hetzner VPS
```

## Ordnerstruktur (Essentials)

```
glxy-gaming/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (REST + Server Actions)
│   ├── (pages)/           # Page Routes
│   └── layout.tsx         # Root Layout
├── components/            # React Components
│   └── ui/               # shadcn/ui Base Components
├── lib/                   # Shared Libraries
│   ├── auth.ts           ⚠️ NextAuth Config (NICHT ÄNDERN ohne Review!)
│   ├── db.ts             # Prisma Client
│   └── redis.ts          # Redis Client
├── prisma/
│   └── schema.prisma     ⚠️ Database Models (Migrations nötig bei Änderung!)
├── middleware.ts          ⚠️ Auth Middleware (Edge Runtime)
└── next.config.js         ⚠️ Next.js Config (standalone build)
```

## Wichtige Regeln & Constraints

### 🚨 NIEMALS ÄNDERN (ohne explizite Anweisung):
1. **`lib/auth.ts`** - NextAuth v5 Config (OAuth ist kritisch!)
2. **`middleware.ts`** - Auth-Checks (Security-relevant)
3. **`prisma/schema.prisma`** - Database Schema (Migration-Prozess!)
4. **Environment Variables** - Production Secrets niemals committen
5. **`next.config.js`** - `output: 'standalone'` muss bleiben (Docker!)

### ✅ Code Conventions:
- **Server Components First:** Nur `'use client'` wenn wirklich nötig
- **TypeScript Strict:** Keine `any` ohne guten Grund
- **Prisma für DB:** Niemals raw SQL (außer extreme Performance-Fälle)
- **Error Handling:** Immer try/catch + sinnvolle Error Messages
- **Naming:** camelCase (JS/TS), PascalCase (Components), kebab-case (Files)

### 🔐 Security:
- **Session-Check:** `const session = await auth()` für geschützte Actions
- **Input Validation:** Zod oder manuell, niemals ungefilterte User-Inputs
- **Rate Limiting:** Für alle Public APIs implementieren
- **CSRF:** NextAuth v5 macht das automatisch (State-Cookie)

## Prisma Database Models (Wichtigste)

```prisma
// User + Auth
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  username        String?   @unique
  password        String    // bcryptjs hash
  emailVerified   DateTime?
  loginAttempts   Int       @default(0)
  lockedUntil     DateTime?
  accounts        Account[] // OAuth Accounts
  sessions        Session[]
}

// OAuth Accounts (GitHub, Google)
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String  // oauth, credentials
  provider          String  // github, google
  providerAccountId String
  // ... OAuth tokens
}

// Game Sessions (Multiplayer)
model GameSession {
  id          String   @id @default(cuid())
  gameType    String   // chess, tictactoe, etc.
  players     String[] // User IDs
  status      String   // waiting, active, finished
  currentTurn String?
  moves       GameMove[]
}

// PDF Documents (Web Adobe)
model Document {
  id          String      @id @default(cuid())
  userId      String
  filename    String
  status      String      // uploaded, processing, ready
  fields      FormField[] // Detected PDF form fields
}
```

## Authentication Flow (NextAuth v5)

```typescript
// Server Component / Server Action
import { auth } from '@/lib/auth'

export default async function ProtectedPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  return <div>Hallo {session.user.email}</div>
}

// API Route
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ...
}
```

## Database Queries (Prisma)

```typescript
import { prisma } from '@/lib/db'

// ✅ Gut: Type-safe
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' },
  select: { id: true, email: true, username: true }
})

// ✅ Gut: Relations
const userWithGames = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    gameSessions: { where: { status: 'active' } }
  }
})

// ❌ Vermeiden: Raw SQL
// Nur in absoluten Ausnahmefällen!
```

## Deployment-Prozess

```bash
# 1. Code ändern → Git Commit
git add .
git commit -m "feat: Neue Funktion"

# 2. Docker Build (lokal oder CI/CD)
cd glxy-gaming
docker build -t ghcr.io/glxy97/acobe_web_glxy_site:latest .

# 3. Push zu Registry
docker push ghcr.io/glxy97/acobe_web_glxy_site:latest

# 4. Production Deployment (SSH auf Server)
ssh root@glxy.at
cd /opt/glxy-gaming
docker-compose -f docker-compose.prod.yml pull app
docker stop glxy-gaming-app && docker rm glxy-gaming-app
docker-compose -f docker-compose.prod.yml up -d app

# 5. Logs prüfen
docker logs glxy-gaming-app --follow
```

## Environment Variables (Production)

```bash
# WICHTIG: Niemals echte Secrets committen!
# Diese Variablen sind auf dem Server gesetzt:

DATABASE_URL="postgresql://glxy_admin:***@postgres:5432/glxy_gaming"
REDIS_URL="redis://redis:6379"
NEXTAUTH_URL="https://glxy.at"
NEXTAUTH_SECRET="***"  # Min. 32 Zeichen
AUTH_TRUST_HOST="true" # Für nginx-proxy wichtig!
GOOGLE_CLIENT_ID="***"
GOOGLE_CLIENT_SECRET="***"
GITHUB_CLIENT_ID="***"
GITHUB_CLIENT_SECRET="***"
```

## Häufige Tasks & Lösungen

### Neue API Route erstellen
```typescript
// app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    // 1. Auth Check
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate Input
    const body = await req.json()
    if (!body.field) {
      return NextResponse.json({ error: 'Missing field' }, { status: 400 })
    }

    // 3. Business Logic
    const result = await prisma.myModel.create({
      data: { userId: session.user.id, ...body }
    })

    // 4. Return Response
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API Error]', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
```

### Neue Page erstellen
```typescript
// app/my-page/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function MyPage() {
  // Server Component - Auth-Check
  const session = await auth()
  if (!session) redirect('/auth/signin')

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold">Meine Page</h1>
      <p>Hallo {session.user.email}</p>
    </div>
  )
}
```

### Neue Prisma Model hinzufügen
```prisma
// prisma/schema.prisma
model MyNewModel {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String
  createdAt DateTime @default(now())

  @@index([userId])
}

// User-Model erweitern:
model User {
  // ... existing fields
  myModels MyNewModel[]
}
```

```bash
# Dann Migration erstellen:
npx prisma migrate dev --name add_my_new_model

# Prisma Client neu generieren:
npx prisma generate

# In Production:
npx prisma migrate deploy
```

### Client Component mit State
```typescript
// components/my-interactive-component.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function MyInteractiveComponent() {
  const [count, setCount] = useState(0)

  const handleClick = async () => {
    // API Call
    const res = await fetch('/api/my-endpoint', {
      method: 'POST',
      body: JSON.stringify({ count })
    })
    const data = await res.json()
    setCount(data.newCount)
  }

  return (
    <div>
      <p>Count: {count}</p>
      <Button onClick={handleClick}>Increment</Button>
    </div>
  )
}
```

## Debugging Tipps

```bash
# Lokale Logs
npm run dev  # Terminal-Output beachten

# Production Logs
ssh root@glxy.at
docker logs glxy-gaming-app --follow --tail 100

# Database prüfen
npx prisma studio  # Öffnet GUI auf localhost:5555

# Redis prüfen
docker exec -it glxy-gaming-redis redis-cli
> KEYS *
> GET key-name
```

## Known Issues & Workarounds

1. **Prisma Client Edge Error:**
   - Lösung: `serverExternalPackages: ['@prisma/client']` in `next.config.js`

2. **Canvas in Docker:**
   - Lösung: Native Dependencies im Dockerfile (cairo, pango)

3. **OAuth Cookie Issues:**
   - Lösung: `AUTH_TRUST_HOST=true` + `sameSite: 'strict'` für State-Cookie

4. **Failed Migration:**
   - Aktuell: `20251004072231_init` ist failed
   - Workaround: `npx prisma migrate resolve --applied 20251004072231_init`

## Weitere Ressourcen

- Vollständige Dokumentation: `DEVELOPER_HANDOFF.md`
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- NextAuth v5: https://authjs.dev

---

**Bei Fragen:**
1. Prüfe `DEVELOPER_HANDOFF.md` für Details
2. Prüfe existierenden Code für Patterns
3. Google/Stack Overflow für Framework-Fragen
4. Frage den User bei Architektur-Entscheidungen

**Golden Rule:**
> Wenn du unsicher bist, ob eine Änderung Breaking Changes verursacht: **FRAGE ERST!**

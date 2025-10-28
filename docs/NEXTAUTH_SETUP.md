# NextAuth v5 Authentication Setup

Vollständige Implementierung der NextAuth v5 (Beta 25) Authentifizierung für das GLXY Gaming Projekt.

## Übersicht

Das Projekt verwendet NextAuth v5 mit folgenden Hauptkomponenten:

- **Prisma Adapter** für Datenbank-gestützte Session-Verwaltung
- **Credentials Provider** mit bcryptjs für sichere Passwort-Authentifizierung
- **JWT-basierte Sessions** mit 30 Tagen Gültigkeit
- **Account Lockout** nach 5 fehlgeschlagenen Login-Versuchen
- **E-Mail-Verifikation** vor dem ersten Login

## Dateistruktur

```
glxy-gaming/
├── lib/
│   └── auth.ts                          # NextAuth Hauptkonfiguration
├── app/
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts             # NextAuth API Route Handler
├── middleware.ts                         # Route Protection Middleware
└── types/
    └── next-auth.d.ts                   # TypeScript Type Extensions
```

## Komponenten

### 1. lib/auth.ts

Hauptkonfigurationsdatei für NextAuth mit:

- **Prisma Adapter**: Verbindet NextAuth mit der PostgreSQL-Datenbank
- **Credentials Provider**: E-Mail/Passwort-Authentifizierung
- **Security Features**:
  - Account Lockout nach 5 fehlgeschlagenen Versuchen (15 Min. Sperre)
  - E-Mail-Verifikationsprüfung
  - Passwort-Hashing mit bcryptjs
  - Login-Attempt-Tracking
  - Last-Login-Timestamp-Update

**Verwendung:**

```typescript
import { auth, signIn, signOut } from '@/lib/auth'

// In Server Components
const session = await auth()

// In API Routes
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
```

### 2. app/api/auth/[...nextauth]/route.ts

API Route Handler für alle NextAuth-Anfragen:

- `GET /api/auth/signin` - Sign-In Seite
- `POST /api/auth/signin` - Login verarbeiten
- `GET /api/auth/signout` - Sign-Out
- `GET /api/auth/session` - Aktuelle Session abrufen
- `GET /api/auth/csrf` - CSRF Token
- `GET /api/auth/providers` - Verfügbare Provider

### 3. middleware.ts

Next.js Middleware für Route Protection:

**Geschützte Routes:**
- `/web-adobe/*` (außer `/web-adobe/demo`)
- `/dashboard/*`
- `/profile/*`
- `/admin/*`

**Öffentliche Routes:**
- `/auth/*` (Login, Register, etc.)
- `/web-adobe/demo`
- `/api/auth/*` (NextAuth APIs)
- Statische Dateien

**Funktionsweise:**
```typescript
// Nicht authentifizierte Benutzer werden zu /auth/signin umgeleitet
// mit callbackUrl für Rückkehr nach Login
```

### 4. types/next-auth.d.ts

TypeScript Type Extensions für:

- **Session Interface**: Fügt `id`, `username` zum User-Objekt hinzu
- **User Interface**: Erweitert um Security-Felder
- **JWT Interface**: Custom JWT Token-Felder

## Verwendung

### Server Components (App Router)

```typescript
import { auth } from '@/lib/auth'

export default async function ProfilePage() {
  const session = await auth()

  if (!session) {
    return <div>Nicht angemeldet</div>
  }

  return (
    <div>
      <h1>Willkommen, {session.user.email}</h1>
      <p>User ID: {session.user.id}</p>
    </div>
  )
}
```

### Client Components

```typescript
'use client'

import { useSession } from 'next-auth/react'

export default function ProfileClient() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Lädt...</div>
  }

  if (!session) {
    return <div>Nicht angemeldet</div>
  }

  return (
    <div>
      <h1>Willkommen, {session.user.email}</h1>
      <p>Username: {session.user.username}</p>
    </div>
  )
}
```

### Sign In/Sign Out

```typescript
import { signIn, signOut } from '@/lib/auth'

// Server Action
async function handleSignIn(formData: FormData) {
  'use server'

  await signIn('credentials', {
    email: formData.get('email'),
    password: formData.get('password'),
    redirectTo: '/dashboard'
  })
}

async function handleSignOut() {
  'use server'

  await signOut({ redirectTo: '/' })
}
```

### API Routes (App Router)

```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    user: session.user,
    message: 'Authenticated request'
  })
}
```

## Prisma Schema

Die Authentifizierung nutzt folgende Prisma-Modelle:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String?   @unique
  password      String
  emailVerified DateTime?
  loginAttempts Int?      @default(0)
  lockedUntil   DateTime?
  lastLogin     DateTime?
  // ... weitere Felder
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  // ... OAuth Felder
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
}
```

## Umgebungsvariablen

Benötigte Variablen in `.env`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/glxy_gaming"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # Generiere mit: openssl rand -base64 32

# Optional: OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Security Features

### Account Lockout
- Nach 5 fehlgeschlagenen Login-Versuchen
- 15 Minuten Sperrzeit
- Automatische Zurücksetzung bei erfolgreichem Login

### E-Mail-Verifikation
- Benutzer müssen E-Mail verifizieren vor erstem Login
- Verhindert Spam-Accounts
- Überprüfung erfolgt in `authorize()` Funktion

### Password Hashing
- bcryptjs mit automatischem Salt
- Passwörter werden niemals im Klartext gespeichert
- Sichere Vergleichsfunktion verhindert Timing-Attacken

### JWT Session
- 30 Tage Gültigkeit
- Sichere HTTP-only Cookies
- Automatische Session-Erneuerung

## Fehlerbehandlung

NextAuth wirft spezifische Fehler, die im Frontend abgefangen werden können:

```typescript
try {
  await signIn('credentials', {
    email: 'user@example.com',
    password: 'password123',
    redirect: false
  })
} catch (error) {
  // Fehler-Handling
  if (error.message.includes('Account gesperrt')) {
    // Account locked
  } else if (error.message.includes('E-Mail-Adresse nicht verifiziert')) {
    // Email not verified
  } else {
    // Invalid credentials
  }
}
```

## Testing

### Session Check
```typescript
import { auth } from '@/lib/auth'

describe('Authentication', () => {
  it('should return null for unauthenticated users', async () => {
    const session = await auth()
    expect(session).toBeNull()
  })
})
```

## Migration von bestehenden Systemen

Falls bereits eine alte NextAuth-Konfiguration existiert:

1. **Prisma Adapter aktualisieren**
   ```bash
   npm install @auth/prisma-adapter
   npm uninstall @next-auth/prisma-adapter  # alte Version entfernen
   ```

2. **Import-Pfade aktualisieren**
   ```typescript
   // Alt
   import { PrismaAdapter } from '@next-auth/prisma-adapter'

   // Neu
   import { PrismaAdapter } from '@auth/prisma-adapter'
   ```

3. **NextAuth Konfiguration**
   ```typescript
   // Alt (v4)
   export default NextAuth({ ... })

   // Neu (v5)
   export const { handlers, auth, signIn, signOut } = NextAuth({ ... })
   ```

## Troubleshooting

### Problem: "NEXTAUTH_URL is not defined"
**Lösung:** Füge `NEXTAUTH_URL` in `.env` hinzu

### Problem: "Prisma Client not found"
**Lösung:**
```bash
npx prisma generate
npx prisma migrate deploy
```

### Problem: Sessions funktionieren nicht
**Lösung:** Überprüfe dass:
- Prisma Schema die benötigten Modelle hat
- Database Migrations ausgeführt wurden
- NEXTAUTH_SECRET gesetzt ist

### Problem: Middleware leitet ständig um
**Lösung:** Überprüfe die Route-Matching-Logik in `middleware.ts`

## Best Practices

1. **Verwende Server Components** wo möglich für bessere Performance
2. **Implementiere Rate Limiting** auf der API-Ebene
3. **Validiere Input** auf Server-Seite zusätzlich zu Client-Validierung
4. **Logge Security Events** für Monitoring
5. **Verwende HTTPS** in Production
6. **Rotiere NEXTAUTH_SECRET** regelmäßig

## Weiterführende Ressourcen

- [NextAuth v5 Dokumentation](https://authjs.dev/getting-started/introduction)
- [Prisma NextAuth Adapter](https://authjs.dev/reference/adapter/prisma)
- [NextAuth Callbacks](https://authjs.dev/reference/core#callbacks)
- [Security Best Practices](https://authjs.dev/getting-started/deployment)

## Support

Bei Problemen oder Fragen:
1. Überprüfe die Logs (`console.log` in `lib/auth.ts`)
2. Teste mit `debug: true` in NextAuth Config
3. Überprüfe Prisma Studio für Datenbank-State

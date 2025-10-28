# NextAuth v5 Quick Start Guide

Schnelleinstieg für die NextAuth v5 Authentifizierung im GLXY Gaming Projekt.

## Installation abgeschlossen

Die folgenden Komponenten wurden bereits konfiguriert:

### Dateien erstellt/aktualisiert

1. **G:\website\verynew\glxy-gaming\lib\auth.ts**
   - NextAuth v5 Hauptkonfiguration
   - Prisma Adapter Integration
   - Credentials Provider mit bcryptjs
   - Security Features (Account Lockout, E-Mail-Verifikation)

2. **G:\website\verynew\glxy-gaming\app\api\auth\[...nextauth]\route.ts**
   - NextAuth API Route Handler
   - GET/POST Handler für alle Auth-Requests

3. **G:\website\verynew\glxy-gaming\middleware.ts**
   - Route Protection Middleware
   - Automatische Umleitung zu /auth/signin für geschützte Routes

4. **G:\website\verynew\glxy-gaming\types\next-auth.d.ts**
   - TypeScript Type Extensions
   - Session, User, JWT Interface Extensions

## Nächste Schritte

### 1. Umgebungsvariablen konfigurieren

Erstelle/aktualisiere `.env`:

```bash
# NextAuth Configuration (ERFORDERLICH)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Database (bereits vorhanden)
DATABASE_URL="postgresql://glxy_user:secure_password_2024@localhost:5432/glxy_gaming"
```

**WICHTIG:** Generiere ein sicheres NEXTAUTH_SECRET:

```bash
# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])

# Linux/Mac
openssl rand -base64 32

# Online
# https://generate-secret.vercel.app/32
```

### 2. Prisma Migrationen ausführen

Das Prisma Schema enthält bereits alle benötigten Modelle (User, Account, Session, VerificationToken).

Führe die Migrationen aus:

```bash
# Prisma Client generieren
npx prisma generate

# Migrationen ausführen
npx prisma migrate deploy

# Optional: Prisma Studio öffnen zur Überprüfung
npx prisma studio
```

### 3. Alte Abhängigkeiten entfernen

Das Projekt hat noch das alte `@next-auth/prisma-adapter` Paket installiert. Entferne es:

```bash
npm uninstall @next-auth/prisma-adapter
```

Die neue Version `@auth/prisma-adapter` ist bereits installiert und wird verwendet.

### 4. TypeScript Überprüfung

Führe eine TypeScript-Prüfung durch:

```bash
npm run typecheck
```

Falls Fehler auftreten, überprüfe:
- Import-Pfade in bestehenden Dateien
- Type Extensions in `types/next-auth.d.ts`

### 5. Entwicklungsserver starten

Starte den Development Server:

```bash
npm run dev
```

Die Anwendung läuft auf: http://localhost:3000

## Verwendungsbeispiele

### In Server Components

```typescript
// app/dashboard/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Willkommen, {session.user.email}</p>
      <p>User ID: {session.user.id}</p>
      <p>Username: {session.user.username}</p>
    </div>
  )
}
```

### In Client Components

```typescript
// app/components/UserProfile.tsx
'use client'

import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'

export default function UserProfile() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Lädt...</div>
  }

  if (!session) {
    return <a href="/auth/signin">Anmelden</a>
  }

  return (
    <div>
      <p>Angemeldet als: {session.user.email}</p>
      <button onClick={() => signOut()}>Abmelden</button>
    </div>
  )
}
```

### Server Actions

```typescript
// app/auth/actions.ts
'use server'

import { signIn, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function handleSignIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    redirect('/dashboard')
  } catch (error) {
    return { error: error.message }
  }
}

export async function handleSignOut() {
  await signOut({ redirectTo: '/' })
}
```

### API Routes

```typescript
// app/api/user/route.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    user: session.user,
  })
}
```

## Protected Routes

Die folgenden Routes sind automatisch geschützt durch `middleware.ts`:

- `/web-adobe/*` (außer `/web-adobe/demo`)
- `/dashboard/*`
- `/profile/*`
- `/admin/*`

Nicht authentifizierte Benutzer werden automatisch zu `/auth/signin` umgeleitet mit einem `callbackUrl` Parameter.

## Testing

### Manueller Test

1. Erstelle einen Test-User in der Datenbank (mit verifizierter E-Mail):

```sql
INSERT INTO users (id, email, username, password, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'cltest123',
  'test@example.com',
  'testuser',
  '$2a$10$YourHashedPasswordHere',  -- bcrypt Hash
  NOW(),
  NOW(),
  NOW()
);
```

Oder verwende Prisma Studio:
```bash
npx prisma studio
```

2. Navigiere zu: http://localhost:3000/auth/signin

3. Logge dich mit den Test-Credentials ein

4. Überprüfe, dass du zu `/dashboard` weitergeleitet wirst

### Integration Tests

```typescript
// tests/auth.test.ts
import { auth } from '@/lib/auth'

describe('NextAuth Authentication', () => {
  it('should return session for authenticated user', async () => {
    const session = await auth()
    expect(session).toBeDefined()
    expect(session?.user.id).toBeDefined()
  })

  it('should protect /dashboard route', async () => {
    // Test logic
  })
})
```

## Fehlerbehebung

### Problem: "NEXTAUTH_URL is not defined"
**Lösung:** Füge `NEXTAUTH_URL=http://localhost:3000` zu `.env` hinzu

### Problem: "Prisma Client not initialized"
**Lösung:**
```bash
npx prisma generate
```

### Problem: Sessions werden nicht gespeichert
**Lösung:**
- Überprüfe DATABASE_URL
- Führe Prisma Migrationen aus
- Überprüfe ob User Table existiert

### Problem: Middleware leitet ständig zu /auth/signin um
**Lösung:**
- Überprüfe ob Session Cookie gesetzt wird
- Überprüfe NEXTAUTH_SECRET
- Überprüfe Middleware Matcher Config

### Problem: "Invalid credentials" trotz korrekter Daten
**Lösung:**
- Überprüfe ob `emailVerified` gesetzt ist (nicht NULL)
- Überprüfe Password Hash in Datenbank
- Aktiviere Debug-Modus: `debug: true` in `lib/auth.ts`

## Security Checklist

- [ ] NEXTAUTH_SECRET generiert und gesetzt
- [ ] NEXTAUTH_URL auf Production-Domain gesetzt
- [ ] HTTPS in Production aktiviert
- [ ] Rate Limiting auf Login-Endpoint
- [ ] E-Mail-Verifikation aktiviert
- [ ] Account Lockout funktioniert
- [ ] Password-Hashing mit bcryptjs
- [ ] Session-Cookies sind httpOnly
- [ ] CORS korrekt konfiguriert

## Production Deployment

Vor dem Production Deployment:

1. **Umgebungsvariablen aktualisieren:**
```bash
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
DATABASE_URL="your-production-db-url"
```

2. **Security Headers aktivieren** (bereits in middleware.ts)

3. **HTTPS erzwingen:**
```typescript
// lib/auth.ts
cookies: {
  sessionToken: {
    options: {
      secure: true  // Nur HTTPS
    }
  }
}
```

4. **Logging deaktivieren:**
```typescript
// lib/auth.ts
debug: false
```

5. **Rate Limiting implementieren** (z.B. mit `express-rate-limit`)

## Weitere Konfiguration

### OAuth Provider hinzufügen (optional)

```typescript
// lib/auth.ts
import GoogleProvider from 'next-auth/providers/google'

providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  // ... existing providers
]
```

### Custom Sign-In Page

Die Sign-In Page ist bereits auf `/auth/signin` konfiguriert.

Erstelle die Page:
```typescript
// app/auth/signin/page.tsx
import { SignInForm } from '@/components/auth/SignInForm'

export default function SignInPage() {
  return (
    <div>
      <h1>Anmelden</h1>
      <SignInForm />
    </div>
  )
}
```

### Session Provider für Client Components

```typescript
// app/providers.tsx
'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

```typescript
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

## Hilfreiche Commands

```bash
# Prisma
npx prisma studio              # Datenbank GUI öffnen
npx prisma migrate dev         # Neue Migration erstellen
npx prisma migrate deploy      # Migrationen ausführen
npx prisma generate           # Client generieren

# Development
npm run dev                   # Dev Server starten
npm run typecheck            # TypeScript prüfen
npm run lint                 # ESLint ausführen

# Testing
npm run test                 # Unit Tests
npm run test:e2e            # E2E Tests
```

## Support

Bei Problemen oder Fragen:
- Siehe [NEXTAUTH_SETUP.md](./NEXTAUTH_SETUP.md) für detaillierte Dokumentation
- Aktiviere Debug-Modus: `debug: true` in `lib/auth.ts`
- Überprüfe NextAuth Logs in Console
- Teste mit Prisma Studio

## Weitere Ressourcen

- [NextAuth v5 Dokumentation](https://authjs.dev)
- [Prisma Dokumentation](https://www.prisma.io/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

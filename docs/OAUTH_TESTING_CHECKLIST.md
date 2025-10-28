# OAuth Testing Checklist

Systematische Test-Anleitung für GitHub und Google OAuth Integration.

## Pre-Flight Checks

### 1. Environment Setup

- [ ] `.env.local` existiert und enthält alle erforderlichen Variablen
- [ ] `NEXTAUTH_SECRET` ist gesetzt (min. 32 Zeichen)
- [ ] `NEXTAUTH_URL` entspricht der aktuellen Domain
- [ ] `GITHUB_CLIENT_ID` und `GITHUB_CLIENT_SECRET` sind gesetzt
- [ ] `GOOGLE_CLIENT_ID` und `GOOGLE_CLIENT_SECRET` sind gesetzt
- [ ] `DATABASE_URL` zeigt auf laufende PostgreSQL-Datenbank

### 2. Database Schema

- [ ] Prisma Schema enthält `Account` Model
- [ ] Prisma Schema enthält `Session` Model
- [ ] Prisma Schema enthält `VerificationToken` Model
- [ ] Prisma Migrations wurden ausgeführt (`npm run db:migrate`)
- [ ] Database ist erreichbar (Test: `npm run db:status` oder direkter Connection-Test)

### 3. OAuth Provider Setup

**GitHub:**
- [ ] OAuth App in GitHub erstellt
- [ ] Callback URL konfiguriert: `http://localhost:3000/api/auth/callback/github`
- [ ] Client ID kopiert
- [ ] Client Secret generiert und kopiert

**Google:**
- [ ] Google Cloud Projekt erstellt
- [ ] OAuth Consent Screen konfiguriert
- [ ] OAuth Client ID erstellt (Web Application)
- [ ] Authorized JavaScript origins: `http://localhost:3000`
- [ ] Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- [ ] Test Users hinzugefügt (bei External App)

---

## Development Testing

### Phase 1: Server Start

```bash
npm run dev
```

**Erwartete Console Logs:**
```
[NextAuth] OAuth Configuration Warnings: (falls Provider fehlen)
  - GitHub OAuth credentials not configured
  - Google OAuth credentials not configured

ODER (wenn alles konfiguriert):
> Ready in X ms
```

**Tests:**
- [ ] Server startet ohne Errors
- [ ] Keine OAuth Configuration Warnings (wenn Provider konfiguriert)
- [ ] NextAuth Routes erreichbar

### Phase 2: Sign-In Page

**URL:** `http://localhost:3000/auth/signin`

**UI Tests:**
- [ ] Seite lädt ohne Errors
- [ ] Email/Password Form ist sichtbar
- [ ] "Mit Google anmelden" Button ist sichtbar
- [ ] "Mit GitHub anmelden" Button ist sichtbar
- [ ] Buttons sind nicht disabled (außer während Loading)
- [ ] Divider "oder" zwischen Credentials und OAuth

### Phase 3: GitHub OAuth Flow

#### Test 1: Erfolgreicher Login (neuer User)

**Schritte:**
1. Klicke "Mit GitHub anmelden"
2. Browser redirected zu GitHub
3. Autorisiere GLXY Gaming
4. Redirect zurück zur App

**Erwartetes Verhalten:**
- [ ] Button zeigt Loading Spinner während Redirect
- [ ] GitHub Authorization Page wird geöffnet
- [ ] Nach Authorization: Redirect zurück zur App
- [ ] User wird zu `/auth/signin` redirected
- [ ] User wird automatisch zum Dashboard weitergeleitet

**Console Logs prüfen:**
```
[NextAuth] User signed in: user@example.com via github (isNewUser: true)
[NextAuth] New user registered: user@example.com via github
[NextAuth] Account linked: github for user user@example.com
```

**Database prüfen:**
```sql
-- User wurde erstellt
SELECT id, email, name, username, "emailVerified", "lastLogin"
FROM users
WHERE email = 'dein-github-email@example.com';

-- OAuth Account verknüpft
SELECT provider, "providerAccountId", "userId"
FROM accounts
WHERE provider = 'github';
```

**Erwartete Daten:**
- [ ] User existiert in `users` Tabelle
- [ ] `email` = GitHub Email
- [ ] `name` = GitHub Name
- [ ] `username` = GitHub Login
- [ ] `emailVerified` ist gesetzt (nicht NULL)
- [ ] `lastLogin` ist aktuelles Datum
- [ ] Account existiert in `accounts` Tabelle
- [ ] `provider` = "github"
- [ ] `providerAccountId` = GitHub User ID

#### Test 2: Wiederholter Login (existierender User)

**Schritte:**
1. Logout vom Dashboard
2. Gehe zu `/auth/signin`
3. Klicke "Mit GitHub anmelden"
4. Authorization erfolgt automatisch (bereits authorized)

**Erwartetes Verhalten:**
- [ ] Kein neuer User wird erstellt
- [ ] `lastLogin` wird aktualisiert
- [ ] Redirect zu Dashboard

**Console Logs:**
```
[NextAuth] User signed in: user@example.com via github (isNewUser: false)
```

**Database prüfen:**
```sql
SELECT "lastLogin" FROM users WHERE email = 'dein-github-email@example.com';
-- lastLogin sollte auf aktuelles Datum aktualisiert sein
```

#### Test 3: Account Linking (Email bereits vorhanden)

**Voraussetzung:** User mit gleicher Email existiert bereits (Credentials Login)

**Schritte:**
1. Registriere User mit Email `test@example.com` via Credentials
2. Logout
3. Klicke "Mit GitHub anmelden" (GitHub Account hat gleiche Email)

**Erwartetes Verhalten (Development):**
- [ ] Login erfolgreich (wegen `allowDangerousEmailAccountLinking: true`)
- [ ] Beide Accounts verknüpft
- [ ] User kann sich mit Credentials ODER GitHub anmelden

**Database prüfen:**
```sql
-- Ein User, mehrere Accounts
SELECT * FROM accounts WHERE "userId" = 'user-id';
-- Sollte 2 Einträge zeigen: credentials + github
```

**WICHTIG:** In Production sollte dies fehlschlagen oder manuelle Bestätigung erfordern!

#### Test 4: Fehlerbehandlung

**Test 4a: GitHub OAuth App deaktiviert**
- [ ] Deaktiviere OAuth App in GitHub
- [ ] Versuche Login
- [ ] Erwarte: Error-Toast mit "OAuth-Fehler"

**Test 4b: Falsche Callback URL**
- [ ] Ändere `NEXTAUTH_URL` zu falscher Domain
- [ ] Versuche Login
- [ ] Erwarte: GitHub Error "redirect_uri_mismatch"

**Test 4c: Ungültiges Secret**
- [ ] Ändere `GITHUB_CLIENT_SECRET` zu falschem Wert
- [ ] Versuche Login
- [ ] Erwarte: OAuth Callback Error

---

### Phase 4: Google OAuth Flow

#### Test 1: Erfolgreicher Login (neuer User)

**Schritte:**
1. Klicke "Mit Google anmelden"
2. Browser redirected zu Google
3. Wähle Google Account
4. Bei "External" App: Klicke "Continue" (trotz Warnung)
5. Autorisiere GLXY Gaming

**Erwartetes Verhalten:**
- [ ] Button zeigt Loading Spinner
- [ ] Google Account Selection wird geöffnet
- [ ] Bei External App: Warnung "App not verified" - IGNORIEREN
- [ ] Permissions Screen: Email, Profile, OpenID
- [ ] Nach Authorization: Redirect zurück
- [ ] User wird zum Dashboard weitergeleitet

**Console Logs:**
```
[NextAuth] User signed in: user@gmail.com via google (isNewUser: true)
[NextAuth] New user registered: user@gmail.com via google
[NextAuth] Account linked: google for user user@gmail.com
```

**Database prüfen:**
```sql
SELECT id, email, name, username, "emailVerified"
FROM users
WHERE email = 'deine@gmail.com';

SELECT provider, "providerAccountId"
FROM accounts
WHERE provider = 'google';
```

**Erwartete Daten:**
- [ ] User in `users` Tabelle
- [ ] `email` = Google Email
- [ ] `name` = Google Name
- [ ] `username` = Erster Teil der Email (vor @)
- [ ] `emailVerified` ist gesetzt
- [ ] Account in `accounts` mit `provider` = "google"

#### Test 2: Wiederholter Login

**Schritte:**
1. Logout
2. Klicke "Mit Google anmelden"
3. Google redirected automatisch (bereits authorized)

**Erwartetes Verhalten:**
- [ ] Sofortiger Redirect (kein Permissions Screen)
- [ ] `lastLogin` aktualisiert
- [ ] Dashboard wird geladen

#### Test 3: Fehlerbehandlung

**Test 3a: Nicht autorisierter Test User**
- [ ] Google Account verwenden, der NICHT in Test Users ist
- [ ] Erwarte: Google Error "Access blocked"
- [ ] Lösung: User zu Test Users hinzufügen ODER App veröffentlichen

**Test 3b: Scopes fehlen**
- [ ] OAuth Consent Screen: Entferne `userinfo.email` Scope
- [ ] Versuche Login
- [ ] Erwarte: Error (Email benötigt)

---

## Integration Testing

### Test 1: Multi-Provider für gleichen User

**Scenario:** User registriert mit Credentials, linkt danach GitHub und Google

**Schritte:**
1. Registriere via Credentials: `test@example.com`
2. Logout
3. Login mit GitHub (gleiche Email)
4. Logout
5. Login mit Google (gleiche Email)

**Erwartetes Verhalten:**
- [ ] Ein User in Database
- [ ] Drei Accounts verknüpft (credentials, github, google)
- [ ] User kann sich mit allen drei Methoden anmelden

**Database Validation:**
```sql
SELECT COUNT(*) FROM accounts WHERE "userId" = 'user-id';
-- Sollte 3 sein
```

### Test 2: Session Management

**Tests:**
- [ ] Session wird nach OAuth Login erstellt
- [ ] Session bleibt nach Browser-Refresh bestehen
- [ ] Session enthält `user.id`, `user.email`, `user.username`
- [ ] Session läuft nach 30 Tagen ab (JWT maxAge)

**Code zum Testen:**
```typescript
// In beliebiger Page
const session = await auth()
console.log(session.user) // Sollte alle Felder enthalten
```

### Test 3: Username Setup (OAuth ohne Username)

**Scenario:** Neuer OAuth User braucht Username

**Schritte:**
1. Erstelle neuen Google Account (oder lösche bestehenden User)
2. Login via Google OAuth
3. Check: Wird User zu `/auth/setup-username` redirected?

**Erwartetes Verhalten:**
- [ ] OAuth Login erfolgreich
- [ ] Token hat `needsUsernameSetup = true`
- [ ] User wird zu Username Setup redirected
- [ ] Nach Username-Eingabe: Redirect zu Dashboard

---

## Security Testing

### Test 1: CSRF Protection

**Test:**
- [ ] Versuche, OAuth Callback ohne State-Parameter aufzurufen
- [ ] Erwarte: NextAuth Error "CSRF token mismatch"

**NextAuth v5 hat built-in CSRF Protection!**

### Test 2: Rate Limiting

**Test:** (wenn implementiert)
- [ ] Versuche 10 OAuth Logins in kurzer Zeit
- [ ] Erwarte: Rate Limit Error nach X Versuchen

### Test 3: Account Lockout

**Test:**
- [ ] OAuth Login sollte Account Lockout NICHT auslösen
- [ ] Nur Credentials Login mit falschem Passwort sollte Lockout triggern

### Test 4: Email Verification Bypass

**Test:**
- [ ] User mit unverifizierter Email via Credentials
- [ ] Login via OAuth mit gleicher Email
- [ ] Check: `emailVerified` sollte automatisch gesetzt werden

**Database Check:**
```sql
SELECT "emailVerified" FROM users WHERE email = 'test@example.com';
-- Sollte Datum haben, nicht NULL
```

---

## Production Pre-Flight Checklist

### 1. Environment Configuration

- [ ] Separate OAuth Apps für Production erstellt
- [ ] Production Callback URLs konfiguriert
- [ ] `NEXTAUTH_SECRET` ist ANDERS als Development
- [ ] `NEXTAUTH_URL` = Production Domain (HTTPS!)
- [ ] `allowDangerousEmailAccountLinking` ist `false` in Production

### 2. Security

- [ ] HTTPS erzwungen (keine HTTP Redirects)
- [ ] CSP Headers konfiguriert
- [ ] Rate Limiting aktiviert
- [ ] OAuth Error Monitoring eingerichtet
- [ ] Client Secrets sicher gespeichert (Secrets Manager)

### 3. OAuth Provider Settings

**GitHub:**
- [ ] Callback URL: `https://yourdomain.com/api/auth/callback/github`
- [ ] Homepage URL: `https://yourdomain.com`

**Google:**
- [ ] Authorized Origins: `https://yourdomain.com`
- [ ] Redirect URIs: `https://yourdomain.com/api/auth/callback/google`
- [ ] OAuth Consent Screen: **Published** (nicht Testing Mode)
- [ ] Privacy Policy URL eingetragen
- [ ] Terms of Service URL eingetragen

### 4. Database

- [ ] Production Database Backups aktiviert
- [ ] Connection Pooling konfiguriert
- [ ] Database Performance Monitoring
- [ ] Sensitive Data encrypted at rest

---

## Troubleshooting Guide

### Problem: OAuth Button disabled

**Ursachen:**
1. OAuth Credentials fehlen in `.env.local`
2. Provider wird nicht in `lib/auth.ts` gepusht

**Lösung:**
```bash
# Check Environment Variables
node -e "console.log(process.env.GITHUB_CLIENT_ID)"
node -e "console.log(process.env.GOOGLE_CLIENT_ID)"

# Sollten Werte zurückgeben, nicht undefined
```

### Problem: "Configuration Error" bei Login

**Ursache:** `NEXTAUTH_SECRET` fehlt

**Lösung:**
```bash
# Generate Secret
openssl rand -hex 32

# Füge zu .env.local hinzu
NEXTAUTH_SECRET=generated-secret-here
```

### Problem: Redirect Loop nach OAuth Login

**Ursachen:**
1. `NEXTAUTH_URL` stimmt nicht mit tatsächlicher URL überein
2. Session wird nicht korrekt gesetzt

**Debug:**
```typescript
// In lib/auth.ts
debug: true, // Aktiviere NextAuth Debug Logs

// Check Session
const session = await auth()
console.log('Session:', session)
```

### Problem: Database Fehler nach OAuth Login

**Ursache:** Prisma Models fehlen oder Migrations nicht ausgeführt

**Lösung:**
```bash
# Run Migrations
npm run db:migrate

# Reset Database (WARNING: Löscht Daten!)
npm run db:reset
npm run db:seed
```

---

## Success Criteria

OAuth Integration gilt als erfolgreich, wenn:

- [ ] GitHub Login funktioniert für neue und bestehende User
- [ ] Google Login funktioniert für neue und bestehende User
- [ ] Account Linking funktioniert (Development)
- [ ] Sessions werden korrekt erstellt und persistent
- [ ] User-Daten werden in Database gespeichert
- [ ] Email wird automatisch verifiziert bei OAuth
- [ ] Kein Memory Leak bei wiederholten Logins
- [ ] Error Handling funktioniert korrekt
- [ ] Console Logs zeigen erwartete Events
- [ ] Alle Security Checks bestanden
- [ ] Production Deployment erfolgreich getestet

---

**Version:** 1.0
**Datum:** 2025-10-07
**Maintainer:** GLXY Gaming Security Team

# OAuth Authentication Fix - GLXY Gaming Platform

**Datum:** 2025-10-10
**Problem:** Google & GitHub OAuth Login funktionierten nicht auf Production (glxy.at)
**Status:** ✅ GELÖST

---

## 🔴 Ursprüngliches Problem

### Symptome
- **Google OAuth:** `ERR_CONNECTION_CLOSED` beim Callback
- **GitHub OAuth:** `OAuthAccountNotLinked` Fehler
- Browser-Fehler: Verbindung wurde geschlossen bevor sie hergestellt wurde

### Fehlermeldungen
```
https://glxy.at/api/auth/callback/google?code=...
ERR_CONNECTION_CLOSED

nginx-proxy logs:
"GET /api/auth/callback/google HTTP/1.1" 000 0 "-"
Status 000 = Connection closed immediately
```

---

## 🔍 Root Cause Analysis

### Problem 1: Environment Variable Mismatch (KRITISCH)
**Container hatte NextAuth v4 Naming, aber Code verwendet v5:**

```bash
# ❌ Container Environment (ALT):
NEXTAUTH_URL=https://glxy.at
NEXTAUTH_SECRET=glxy_nextauth_secret_key_2024

# ✅ NextAuth v5 erwartet (NEU):
AUTH_URL=https://glxy.at
AUTH_SECRET=glxy_nextauth_secret_key_2024
```

**Ergebnis:** NextAuth konnte Konfiguration nicht finden → Configuration Error

---

### Problem 2: Fehlende trustHost Konfiguration
NextAuth v5 benötigt `trustHost: true` für Proxy-Umgebungen (nginx, Docker).

**File:** `lib/auth.ts`

```typescript
// ❌ VORHER (fehlte):
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { ... }
})

// ✅ NACHHER (mit trustHost):
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  trustHost: true, // Required for proxies (nginx, docker)
  session: { ... }
})
```

---

### Problem 3: Cookie Name Mismatch
Middleware prüfte auf NextAuth v4 Cookie-Namen.

**File:** `middleware.ts`

```typescript
// ❌ VORHER (NextAuth v4):
const sessionToken =
  request.cookies.get('next-auth.session-token')?.value ||
  request.cookies.get('__Secure-next-auth.session-token')?.value

// ✅ NACHHER (NextAuth v5):
const sessionToken =
  request.cookies.get('authjs.session-token')?.value ||
  request.cookies.get('__Secure-authjs.session-token')?.value
```

---

### Problem 4: Security - allowDangerousEmailAccountLinking
GitHub OAuth gab "OAuthAccountNotLinked" wenn Email bereits mit Google registriert war.

**Grund:** Security-Fix verhindert automatisches Account-Linking (gewünscht!)

---

## ✅ Angewendete Lösungen

### Fix 1: Environment Variables auf Production Server aktualisiert

**File:** `/opt/glxy-gaming/docker-compose.prod.yml`

```yaml
environment:
  # ❌ VORHER:
  - NEXTAUTH_URL=https://glxy.at
  - NEXTAUTH_SECRET=glxy_nextauth_secret_key_2024

  # ✅ NACHHER:
  - AUTH_URL=https://glxy.at
  - AUTH_SECRET=glxy_nextauth_secret_key_2024
  - AUTH_TRUST_HOST=true
```

**Befehle:**
```bash
ssh root@glxy.at
cd /opt/glxy-gaming
sed -i 's/NEXTAUTH_URL=/AUTH_URL=/g' docker-compose.prod.yml
sed -i 's/NEXTAUTH_SECRET=/AUTH_SECRET=/g' docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d app
```

---

### Fix 2: trustHost in auth.ts hinzugefügt

**File:** `lib/auth.ts` (Zeile 212)

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  trustHost: true, // ← NEU: Required for proxies (nginx, docker)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // ... rest of config
})
```

---

### Fix 3: Cookie Namen in middleware.ts aktualisiert

**File:** `middleware.ts` (Zeilen 50-53)

```typescript
// NextAuth v5 Cookie Names
const sessionToken =
  request.cookies.get('authjs.session-token')?.value ||
  request.cookies.get('__Secure-authjs.session-token')?.value
```

---

### Fix 4: Security Hardening (bereits implementiert)

**Files:** `lib/auth.ts` (Zeilen 175, 195)

```typescript
// Google Provider
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  allowDangerousEmailAccountLinking: false, // ← Security: Prevent auto-linking
})

// GitHub Provider
GithubProvider({
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  allowDangerousEmailAccountLinking: false, // ← Security: Prevent auto-linking
})
```

**Hinweis:** "OAuthAccountNotLinked" ist gewünschtes Security-Feature!

---

## 📝 Deployment Checklist

### Bei zukünftigen OAuth-Problemen:

1. **Environment Variables prüfen:**
   ```bash
   docker exec glxy-gaming-app printenv | grep -E '^AUTH_|^GOOGLE_|^GITHUB_'
   ```

   **Muss enthalten:**
   - `AUTH_URL=https://glxy.at`
   - `AUTH_SECRET=...` (32+ Zeichen)
   - `AUTH_TRUST_HOST=true`
   - `GOOGLE_CLIENT_ID=...`
   - `GOOGLE_CLIENT_SECRET=...`
   - `GITHUB_CLIENT_ID=...`
   - `GITHUB_CLIENT_SECRET=...`

2. **Code-Konfiguration prüfen (`lib/auth.ts`):**
   ```typescript
   // Muss vorhanden sein:
   trustHost: true
   ```

3. **Cookie-Namen prüfen (`middleware.ts`):**
   ```typescript
   // NextAuth v5 verwendet:
   'authjs.session-token'
   '__Secure-authjs.session-token'
   ```

4. **OAuth Callback URLs in Provider Consoles:**
   - **Google:** https://console.cloud.google.com/apis/credentials
   - **GitHub:** https://github.com/settings/developers
   - **Callback URL:** `https://glxy.at/api/auth/callback/{provider}`

5. **Container neu starten nach Änderungen:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d app
   docker logs glxy-gaming-app --tail 50
   ```

---

## 🧪 Testing

### OAuth Flow testen:

```bash
# 1. Health Check
curl https://glxy.at/api/health
# Erwartung: 200 OK

# 2. OAuth Callback Test (mit Dummy-Code)
curl -v "https://glxy.at/api/auth/callback/google?code=test&scope=email+profile"
# Erwartung: 302 Redirect (nicht 000 oder 500)

# 3. Container Logs prüfen
docker logs glxy-gaming-app --tail 50
# Erwartung: Keine "Configuration" Errors
```

### Manueller Test:
1. Öffne https://glxy.at
2. Klicke "Sign in with Google"
3. Autorisiere in Google
4. **Erwartung:** Erfolgreicher Login → Redirect zu Dashboard/Profile

---

## ⚠️ Known Issues & Workarounds

### Issue: "OAuthAccountNotLinked" bei GitHub Login

**Symptom:**
- Google Login funktioniert
- GitHub Login zeigt: "OAuth-Fehler: OAuthAccountNotLinked"

**Ursache:**
- User hat sich bereits mit Google registriert (z.B. `user@example.com`)
- Versucht jetzt GitHub-Login mit derselben Email
- Security-Feature verhindert automatisches Linking

**Lösungen:**

**Option A: Production-Ready (empfohlen)**
1. User meldet sich mit Google an
2. Im Profil: "GitHub-Account verbinden" Button
3. OAuth-Flow zum Verknüpfen bestehender Accounts

**Option B: Testing (temporär, weniger sicher)**
```typescript
// lib/auth.ts - NUR für Testing!
allowDangerousEmailAccountLinking: true
```

**Option C: Separate Test-Accounts**
- Google Login mit `test1@example.com`
- GitHub Login mit `test2@example.com`

---

## 🔒 Security Best Practices

### 1. Secrets Management
```bash
# NIEMALS committen:
.env.production
docker-compose.prod.yml (mit echten Secrets)

# Sicher speichern:
- Server: /opt/glxy-gaming/.env.production
- Backup: Verschlüsselter Password Manager
- CI/CD: GitHub Secrets / Vault
```

### 2. OAuth Secrets rotieren nach Leak
```bash
# Google Console
https://console.cloud.google.com/apis/credentials
# → Neues Client Secret generieren

# GitHub Apps
https://github.com/settings/apps
# → Generate new client secret

# Server updaten
docker-compose -f docker-compose.prod.yml down
# → .env.production bearbeiten
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Git History bereinigen (falls Secrets committed)
```bash
# Mit git-filter-repo
git filter-repo --path docker-compose.prod.yml --invert-paths
git filter-repo --path .env.production --invert-paths

# ODER: BFG Repo Cleaner
bfg --delete-files docker-compose.prod.yml
bfg --delete-files .env.production

# Force Push (VORSICHT!)
git push origin --force --all
```

---

## 📚 Referenzen

### NextAuth.js v5 Dokumentation
- Migration Guide: https://authjs.dev/guides/upgrade-to-v5
- Environment Variables: https://authjs.dev/reference/core#environment-variables
- Proxy Configuration: https://authjs.dev/reference/core#trusthost

### NextAuth.js v4 → v5 Breaking Changes
1. Environment Variables: `NEXTAUTH_*` → `AUTH_*`
2. Cookie Names: `next-auth.*` → `authjs.*`
3. `trustHost` ist jetzt **required** für Proxies
4. `allowDangerousEmailAccountLinking` default `false`

### Troubleshooting Commands
```bash
# Container Status
docker ps --filter name=glxy-gaming-app

# Container Environment
docker exec glxy-gaming-app printenv | grep AUTH

# Container Logs (live)
docker logs glxy-gaming-app --follow

# Nginx Proxy Logs
docker logs nginx-proxy --tail 100 | grep "/api/auth"

# Database Check
docker exec glxy-gaming-db psql -U glxy_admin -d glxy_gaming -c "SELECT email FROM \"User\";"
```

---

## 📋 Changed Files Summary

### Production Server (`/opt/glxy-gaming/`)
- ✅ `docker-compose.prod.yml` - Environment Variables aktualisiert

### Codebase (`G:\website\verynew\glxy-gaming\`)
- ✅ `lib/auth.ts` - `trustHost: true` hinzugefügt
- ✅ `middleware.ts` - Cookie-Namen auf v5 aktualisiert
- ✅ `components/layout/SiteHeader.tsx` - z-index fix für Dropdown

### Dokumentation (`G:\website\verynew\`)
- ✅ `docs/OAUTH_FIX_DOCUMENTATION.md` - Diese Datei
- ✅ `glxy-gaming/CHANGELOG.md` - Version 1.1.0 Entry
- ✅ `glxy-gaming/DEVELOPER_HANDOFF.md` - OAuth-Konfiguration dokumentiert

---

## ✅ Verification Checklist

Nach jedem OAuth-Fix folgende Checks durchführen:

- [ ] Environment Variables korrekt (`AUTH_*` statt `NEXTAUTH_*`)
- [ ] `trustHost: true` in `lib/auth.ts`
- [ ] Cookie-Namen `authjs.*` in `middleware.ts`
- [ ] OAuth Provider Callback URLs aktualisiert
- [ ] Container neugestartet
- [ ] Google Login funktioniert
- [ ] GitHub Login funktioniert (oder OAuthAccountNotLinked = Expected)
- [ ] Keine Errors in Container Logs
- [ ] nginx-proxy Status 200/302 (nicht 000/500)

---

**Dokumentiert von:** Claude (AI Assistant)
**Letzte Aktualisierung:** 2025-10-10
**Version:** 1.0

---

## 🆘 Support

Bei weiteren OAuth-Problemen:

1. Diese Dokumentation lesen
2. Checklist durchgehen
3. Container Logs prüfen: `docker logs glxy-gaming-app`
4. Environment Variables prüfen: `docker exec glxy-gaming-app printenv | grep AUTH`
5. Falls weiterhin Fehler: Issue mit vollständigen Logs erstellen

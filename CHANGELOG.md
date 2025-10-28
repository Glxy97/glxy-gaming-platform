# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

## [1.1.0] - 2025-10-10

### 🔒 Security Fixes (CRITICAL)

#### OAuth Authentication Security Hardening
**Kontext:** Nach Analyse durch Security-Agent wurden kritische Sicherheitslücken in der OAuth-Implementation identifiziert und behoben.

**Behobene Schwachstellen:**

1. **Cookie-Namen Mismatch (HIGH)**
   - **Problem:** Middleware prüfte auf `next-auth.session-token`, NextAuth v5 nutzt aber `authjs.session-token`
   - **Auswirkung:** Session-Checks schlugen fehl, geschützte Routen waren potentiell zugänglich
   - **Fix:** Cookie-Namen in `middleware.ts` auf NextAuth v5 Konvention aktualisiert
   - **Dateien:** `middleware.ts:52-53`
   ```typescript
   // Vorher (Falsch):
   request.cookies.get('next-auth.session-token')?.value

   // Nachher (Korrekt):
   request.cookies.get('authjs.session-token')?.value
   ```

2. **Unsicheres Account-Linking (HIGH)**
   - **Problem:** `allowDangerousEmailAccountLinking` war dynamisch basierend auf `NODE_ENV` gesetzt
   - **Auswirkung:** Account-Takeover-Angriffe möglich (auch in Development gefährlich)
   - **Fix:** Feature komplett deaktiviert für alle Umgebungen
   - **Dateien:** `lib/auth.ts:175, 195`
   ```typescript
   // Vorher:
   allowDangerousEmailAccountLinking: process.env.NODE_ENV === 'development'

   // Nachher:
   allowDangerousEmailAccountLinking: false
   ```

3. **CSRF-Schwachstelle in State-Cookie (MEDIUM)**
   - **Problem:** State-Cookie nutzte `sameSite: 'lax'` statt `'strict'`
   - **Auswirkung:** CSRF-Angriffe bei Top-Level Navigation möglich
   - **Fix:** State-Cookie auf `sameSite: 'strict'` mit 15-Minuten Expiration
   - **Dateien:** `lib/auth.ts:226-234`
   ```typescript
   state: {
     name: 'authjs.state',
     options: {
       httpOnly: true,
       sameSite: 'strict',  // Verschärft von 'lax'
       path: '/',
       secure: process.env.NODE_ENV === 'production',
       maxAge: 900, // 15 Minuten (neu)
     },
   }
   ```

4. **AUTH_TRUST_HOST Verifizierung**
   - **Status:** Bereits korrekt konfiguriert in `docker-compose.prod.yml:16`
   - **Wichtig für:** Reverse Proxy Setup (nginx-proxy)

### ✅ Verbesserungen

- **OAuth-Cookie-Konfiguration:** Explizite Cookie-Konfiguration für NextAuth v5 hinzugefügt
  - PKCE Code Verifier Cookie
  - State Cookie mit verstärkter Sicherheit
  - Session Token mit Production/Development Prefixes

### 📝 Dokumentation

- **Hinzugefügt:** `DEVELOPER_HANDOFF.md` - Vollständige Projekt-Dokumentation für Team-Onboarding
  - Tech Stack Übersicht
  - Ordnerstruktur mit Erklärungen
  - Setup & Deployment Guides
  - Code Conventions & Best Practices
  - Security Guidelines

- **Hinzugefügt:** `AI_BUILDER_BRIEFING.md` - Kompaktes Briefing für AI-Assistenten
  - Copy-Paste Ready Format
  - Essentials kompakt dargestellt
  - Code-Examples für häufige Tasks
  - Kritische Regeln & Constraints

- **Hinzugefügt:** `CHANGELOG.md` - Diese Datei

### 🚀 Deployment

- **Docker Image:** `ghcr.io/glxy97/acobe_web_glxy_site:latest`
  - Digest: `sha256:43ceed4fd9d7b944f1e69a8c9597c5ff5f04869fe228ea37170868bd049d5891`
  - Build Zeit: ~52 Sekunden
  - Image Größe: ~856 MB (komprimiert)

- **Production Deployment:** Erfolgreich deployed auf https://glxy.at
  - Container: `glxy-gaming-app` (healthy)
  - Startup Zeit: 295ms
  - Next.js: 15.5.3 (Ready)

### 🐛 Bekannte Issues

- **Prisma Migration Failed:** `20251004072231_init` migration ist in failed state
  - **Auswirkung:** Migrations-Warnungen beim Container-Start
  - **Status:** Application läuft trotzdem (Database Schema ist korrekt)
  - **Workaround:** `npx prisma migrate resolve --applied 20251004072231_init`
  - **TODO:** Migration-State in Production korrigieren

### ⚠️ Breaking Changes

**Keine Breaking Changes in dieser Version.**

Alle Änderungen sind abwärtskompatibel. Bestehende Sessions bleiben gültig.

### 🔄 Migration Guide

Für Deployment dieser Version:

```bash
# 1. Docker Image Pull
docker-compose -f docker-compose.prod.yml pull app

# 2. Container Restart
docker stop glxy-gaming-app
docker rm glxy-gaming-app
docker-compose -f docker-compose.prod.yml up -d app

# 3. Logs prüfen
docker logs glxy-gaming-app --follow

# 4. OAuth Login testen
# → https://glxy.at/auth/signin
```

**Keine zusätzlichen Schritte erforderlich.**

---

## [1.0.0] - 2025-10-04

### 🎉 Initial Production Release

- Next.js 15.5.3 Full-Stack Gaming Platform
- PostgreSQL 16 + Prisma ORM 6.17
- Redis 7.4.5 für Session Cache
- NextAuth.js v5 OAuth (Google, GitHub, Credentials)
- Docker-basiertes Deployment (Hetzner VPS)
- Multiplayer Games (Chess, Tetris, Tic-Tac-Toe, Connect4, etc.)
- PDF Editor (Web Adobe Integration)
- Admin Dashboard
- User Profile & Friends System
- Real-time WebSocket (Socket.IO)

---

## Semantic Versioning Guide

**Version Format:** `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking Changes (z.B. API-Änderungen, Schema-Changes)
- **MINOR:** Neue Features (abwärtskompatibel)
- **PATCH:** Bugfixes & Security Patches (abwärtskompatibel)

**Änderungstypen:**

- `🔒 Security` - Sicherheits-Fixes (CRITICAL)
- `✨ Features` - Neue Funktionen
- `🐛 Fixes` - Bugfixes
- `🚀 Performance` - Performance-Verbesserungen
- `📝 Dokumentation` - Dokumentations-Updates
- `♻️ Refactoring` - Code-Refactoring (ohne Funktionsänderung)
- `⚠️ Deprecated` - Bald entfernte Features
- `🗑️ Removed` - Entfernte Features

---

**Maintainer:** GLXY Gaming Team
**Letzte Aktualisierung:** 2025-10-10

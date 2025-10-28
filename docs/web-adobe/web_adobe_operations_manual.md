# Web Adobe Gesamtleitfaden (Wo, Was, Wie)

## 1. Ziel des Projekts
- Webbasierte Erweiterung von FormTool Pro, um PDF-Formulare online zu analysieren, zu bearbeiten und mit dem DataPad-Backend zu synchronisieren.
- Zugriff erfolgt ueber geschuetzte Routen (NextAuth Credentials) und kann spaeter in glxy.at eingebettet werden (`/web-adobe`).
- KI-Funktionen bleiben optional und funktionieren auch ohne API-Keys ueber robuste Fallbacks.

## 2. Ordneruebersicht & Pfade
| Pfad (relativ zu `FormTool_Pro_v3`) | Inhalt / Zweck |
| ----------------------------------- | -------------- |
| `WEB_ADOBE/frontend` | Vite/React-Prototyp fuer schnelle UI-Experimente (nur lokal) |
| `WEB_ADOBE/backend` | FastAPI + Celery Backend, Services, Worker, Tests |
| `WEB_ADOBE/prisma` | Gemeinsames Datenmodell (Form, FormField, SyncLog) |
| `WEB_ADOBE/nextjs` | Blueprint fuer Integration in bestehendes Next.js-Projekt |
| `WEB_ADOBE/infra` | Docker Compose, Traefik, Hetzner-Dokumentation |
| `WEB_ADOBE/docs` | Vision, Architektur, Roadmap, Integrationsleitfaeden |
| `WEB_ADOBE/NEXT_STEPS.md` | Kurzfristige Aufgabenliste |
| `WEB_ADOBE/glxy-gaming - Kopie/Windows_DEV` | Lokale Entwicklungsumgebung fuer den vorhandenen glxy-Stack |
| `WEB_ADOBE/glxy-gaming - Kopie/SERVER_PROD` | Produktionsstruktur mit Docker-/K8s-/Nginx-Assets und `.env.production` |
| `WEB_ADOBE/glxy-gaming - Kopie/shared` | Gemeinsame Dokumente, CI-Configs, Tools |

**Wichtig fuer den Server-Upload:** `G:\__Projekt\ADOBE_ACROBAT\Gemini_V2\Gem_v2\FormTool_Pro_v3\WEB_ADOBE\glxy-gaming - Kopie\SERVER_PROD`

## 3. Umgebungstrennung
- **Windows_DEV** (lokal):
  - Pfad: `WEB_ADOBE/glxy-gaming - Kopie/Windows_DEV`
  - Enthaelt Next.js-Quellcode, Prisma, Tests, Skripte und `.env.template` fuer lokale Entwicklung.
  - Hier werden Passworthashes mit `scripts/generate_web_adobe_hash.mjs` erzeugt.
- **SERVER_PROD** (Server):
  - Pfad: `WEB_ADOBE/glxy-gaming - Kopie/SERVER_PROD`
  - Enthaelt `env/.env.production` (ohne echte Secrets im Repo), Docker-/K8s-/Nginx-Konfigurationen, Log- und Backup-Ordner.
  - Wird 1:1 auf den Server synchronisiert.

## 4. Lokale Einrichtung (Windows_DEV)
1. **Voraussetzungen installieren:**
   - Node.js >= 20, npm oder pnpm
   - Python 3.11 (`python311`)
   - Docker Desktop (Postgres + Redis als Container)
2. **Environment fuellen:**
   - `WEB_ADOBE/glxy-gaming - Kopie/Windows_DEV/env/.env.template` nach `.env.local` kopieren.
   - Alle Platzhalter durch echte Werte ersetzen (keine TODOs uebrig lassen).
3. **Secrets erzeugen:**
   - Befehl: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - Werte eintragen fuer `NEXTAUTH_SECRET`, `JWT_SECRET`, `SOCKET_IO_SECRET`, etc.
4. **Web-Adobe-Passwort setzen:**
   - `cd WEB_ADOBE/glxy-gaming - Kopie/Windows_DEV`
   - `node scripts/generate_web_adobe_hash.mjs <dein-passwort>`
   - Ergebnis in `.env.local` als `WEB_ADOBE_CREDENTIAL_PASSWORD_HASH` eintragen.
   - Klartextpasswort entfernen (`WEB_ADOBE_CREDENTIAL_PASSWORD` leer lassen).
5. **Datenbank & Redis starten (Docker):**
   - `docker compose -f WEB_ADOBE/infra/deployment/docker-compose.yml up -d postgres redis`
6. **Backend starten:**
   ```bash
   cd WEB_ADOBE/backend
   python311 -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
7. **Frontend (Vite) starten:**
   ```bash
   cd WEB_ADOBE/frontend
   npm install
   npm run dev
   ```
8. **Login testen:** `http://localhost:5173` oeffnen und mit den `.env.local` Daten anmelden.
9. **Next.js Variante nutzen:**
   - Option A: Blueprint aus `WEB_ADOBE/nextjs` ins bestehende Next.js-Projekt kopieren.
   - Option B: Mit `glxy-gaming - Kopie/Windows_DEV/frontend` (Next.js 15) arbeiten.

## 5. Server-Bereitstellung (Hetzner)
1. **Ordner hochladen:** `WEB_ADOBE/glxy-gaming - Kopie/SERVER_PROD` nach `/opt/web-adobe` (oder Wunschpfad) kopieren.
2. **.env fuellen:**
   - `env/.env.production.template` nach `env/.env.production` kopieren.
   - Sicheres Passwort fuer `WEB_ADOBE_CREDENTIAL` erneut als Bcrypt-Hash eintragen.
   - Datenbank-/Redis-Credentials und alle Secrets mit `openssl rand -base64 32` generieren.
3. **Docker-Netzwerk sicherstellen:**
   - `docker network create glxy_net` (falls noch nicht vorhanden).
4. **Compose anpassen:**
   - In `infra/deployment/docker-compose.web-adobe.yml` ggf. Image-Namen, Domains (`glxy.at`), Labels pruefen.
   - `ALLOWED_ORIGINS` erweitern, falls weitere Domains.
5. **Container starten:**
   ```bash
   cd /opt/web-adobe/infra/deployment
   docker compose -f docker-compose.web-adobe.yml up -d --build
   ```
6. **Reverse Proxy (Traefik oder Nginx):**
   - Traefik Configs unter `infra/deployment/traefik/` oder
   - Nginx-Files unter `glxy-gaming - Kopie/SERVER_PROD/infra/nginx/nginx/conf.d/glxy.conf`
   - Route `/web-adobe` auf das Frontend leiten, HTTP Basic Auth optional.
7. **HTTPS aktivieren:**
   - Traefik Let's Encrypt oder vorhandene Zertifikate in `infra/ssl` ablegen.
8. **Tests:**
   - `curl -I https://glxy.at/web-adobe` sollte `401 Unauthorized` liefern (Passwortschutz).
   - Nach Login: Dashboard sichtbar, API `/web-adobe/api/health` liefert Status 200.
9. **Backups & Logs:**
   - `.env.production` regelmaessig in `backups/env/` duplizieren.
   - Docker/Traefik/Applogs unter `logs/` sammeln (Logrotate einrichten).

## 6. Next.js-Einbindung
- Pfad: `WEB_ADOBE/nextjs`
- Kopiere `app/web-adobe`, `components/web-adobe`, `lib`, `types` in dein Next.js Repo.
- Middleware (`middleware.ts`) mit `matcher: ['/web-adobe/:path*']` anlegen, damit NextAuth greift.
- Prisma Schema aus `WEB_ADOBE/prisma/schema.prisma` importieren und Migration laufen lassen (`npx prisma migrate deploy`).
- API Proxy: `NEXT_PUBLIC_WEB_ADOBE_API` auf `/web-adobe/api` verweisen oder direkt Prisma nutzen (Server Actions).

## 7. Umgang mit Secrets & Sicherheit
- `.env.local` und `.env.production` niemals committen; nur Templates bleiben im Repo.
- Web-Adobe-Zugang immer ueber Bcrypt-Hash (`WEB_ADOBE_CREDENTIAL_PASSWORD_HASH`).
- HTTPS erzwingen, bevor externe Nutzer Zugriff bekommen.
- DataPad Keys nur auf dem Server hinterlegen; offline-Modus liefert Mockdaten.
- Optionales AI erst aktivieren, wenn API Keys geklaert sind (`AI_PROVIDER`, `AI_API_KEY`).
- Regelmaessig Updates einspielen (`docker compose pull`, `npm audit`, `pip list --outdated`).

## 8. Wartung & Fehlerbehebung
- **Datenbankmigrationen:** `npx prisma migrate deploy` (Produktiv) / `npx prisma migrate dev` (Dev).
- **Celery Worker neu starten:** `docker compose restart web-adobe-worker`.
- **Uploads pruefen:** Volume `web_adobe_uploads` sichern (z. B. AWS S3/Hetzner Storage).
- **Logs kontrollieren:**
  - Backend: `docker logs web-adobe-api`
  - Worker: `docker logs web-adobe-worker`
  - Reverse Proxy: `SERVER_PROD/logs/logs/nginx/*.log`
- **Passwort aendern:** Neuen Hash generieren, in `.env.production` eintragen, Dienste neu starten.

## 9. Referenzen & naechste Schritte
- Detaildocs: `WEB_ADOBE/docs/architecture.md`, `WEB_ADOBE/docs/integration_glxy_stack.md`, `WEB_ADOBE/docs/roadmap.md`.
- Layperson-Anleitung: `WEB_ADOBE/docs/web_adobe_layperson_guide.txt` (Kurzfassung).
- TODO-Plan: `WEB_ADOBE/NEXT_STEPS.md` (offene Aufgaben fuer UI, Backend, Deploy).
- Empfehlung: Vor Produktivgang einen End-to-End-Test (Upload -> Analyse -> Feldmapping -> DataPad Sync) mit Testdaten durchspielen.

## 10. Kontakt / Ownership
- Technische Verantwortung: GLXY Admin Team (NextAuth, Prisma, Infrastruktur).
- Erweiterungen (KI, DataPad): FormTool Pro Team.
- Dokumentation laufend aktualisieren, sobald neue Services oder Secrets hinzukommen.

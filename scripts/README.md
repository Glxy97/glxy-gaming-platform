# 🚀 GLXY Gaming Platform – Script Toolkit

## Hauptbefehle

### `./scripts/deploy.sh`
- `deploy` – Production-Deployment mit Backup, Build und Docker-Restart.
- `dev` – Lokales Development-Setup (npm install, Prisma migrate, `npm run dev`).
- `rollback <timestamp>` – Wiederherstellen einer Sicherung aus `backups/`.
- `status` – Anzeige von Node/npm/Docker-Versionen, aktiver `.env.production` und verfügbaren Backups.

### `./scripts/fix-and-deploy.sh`
Führt TypeScript-Check, Linting und Build aus und ruft danach `deploy.sh deploy` auf. Bricht bei Fehlern nicht sofort ab, damit die Ausgaben sichtbar bleiben.

### `./scripts/typescript-quickfix.js`
Startet `eslint --fix` und `ts-prune`, um typische TS/ESLint-Baustellen schnell aufzuräumen. Ergebnisse werden direkt im Terminal ausgegeben.

## Unterstützende Utilities
- `check-typescript.js` – Führt `npx tsc --noEmit` aus und fasst Fehler verständlich zusammen.
- `test-typescript.js` – Alternative Kurzprüfung mit Top‑10 Fehlerliste.
- `scripts/switch-env.sh` – Erweiterter Environment-Switcher für `.env.development` und `.env.production` (siehe Skriptausgabe).
- `scripts/create-demo-users.ts` – Legt verifizierte Demo-Nutzer samt Spielstatistiken für Tests an.
- `scripts/test-db.ts` – Führt eine Verbindungskontrolle und Basisabfragen gegen die Produktionsdatenbank aus.

## Voraussetzungen
- Node.js 20+
- npm
- Docker & Docker Compose (für Production-Deployments)
- Gültige `.env.development` bzw. `.env.production`

## Typischer Workflow
1. `./scripts/switch-env.sh dev` – lokale Umgebung vorbereiten.
2. `npm run dev` – Entwicklung starten (alternativ `./scripts/deploy.sh dev`).
3. Vor Produktiv-Deployment: `./scripts/fix-and-deploy.sh` oder direkt `./scripts/deploy.sh deploy`.

## Logs & Backups
- Deploy-Logs: `logs/deploy.log`
- Automatische Backups: `backups/<timestamp>/`

Die Skripte sind bewusst shell-kompatibel (Bash) gehalten und prüfen vor kritischen Schritten, ob nötige Tools verfügbar sind.

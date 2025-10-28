# Integration mit bestehendem glxy.at Stack

## Ausgangsbasis
- **Next.js 15 / React 19** (App Router)
- **NextAuth** (AuthN/AuthZ)
- **Prisma** (DB-Abstraktion → PostgreSQL Schema `glxy_gaming_dev`)
- **Socket.IO** (Realtime)
- **Docker-Compose** auf Hetzner (Windows Host → Linux Engine)
- Services: `postgres`, `redis`, `nextjs`, `socketio` (ggf. kombiniert)

## Ziel: Web Adobe Modul
- Neue Oberflächen (`/web-adobe`) mit unseren UI-Komponenten
- Formular-/Feld-Datenhaltung kompatibel zu Prisma & Postgres
- Hintergrundanalyse (PDF/OCR/AI) durch zusätzlichen Worker

## Empfehlung: Architekturangleichung

### 1. Domain-Model in Prisma abbilden
- Prisma Schema (`schema.prisma`) um Tabellen erweitern:
  ```prisma
  model Form {
    id          Int        @id @default(autoincrement())
    title       String
    filename    String
    storagePath String
    status      FormStatus @default(DRAFT)
    checksum    String?    @unique
    createdAt   DateTime   @default(now())
    updatedAt   DateTime   @updatedAt
    fields      FormField[]
  }

  model FormField {
    id              Int      @id @default(autoincrement())
    form            Form     @relation(fields: [formId], references: [id])
    formId          Int
    pdfName         String
    displayLabel    String?
    groupName       String?
    fieldType       String   @default("text")
    required        Boolean  @default(false)
    validationRegex String?
    datapadFieldId  String?
    suggestions     Json?
    x               Float    @default(0)
    y               Float    @default(0)
    width           Float    @default(0)
    height          Float    @default(0)
    status          String   @default("draft")
    updatedAt       DateTime @updatedAt
  }

  enum FormStatus {
    DRAFT
    ANALYZING
    REVIEW
    SYNCED
    ERROR
  }
  ```
- Migration ausführen (`npx prisma migrate dev --name init_forms`).

### 2. Next.js Routen
- Neue App-Segmentstruktur:
  ```
  app/
    web-adobe/
      layout.tsx
      page.tsx            (Dashboard)
      forms/
        page.tsx          (Formübersicht)
        [formId]/page.tsx (Workspace)
      workflow/page.tsx
      settings/page.tsx
      api/
        forms/route.ts    (Proxy → FastAPI oder Direktzugriff via Prisma)
  ```
- Schutz über NextAuth Middleware (`middleware.ts` mit `matcher: ['/web-adobe/:path*']`).

### 3. Backend-Strategien
- **Variante A (nativ Next.js)**
  - PDF-Upload/Geschäftslogik direkt in Next.js-API-Routen mit Prisma.
  - Für CPU-intensive Tasks (OCR/AI) externen Worker (z. B. Node Worker + BullMQ) einsetzen.
- **Variante B (unser FastAPI-Backend)**
  - FastAPI bleibt zuständig für Upload, Analyse, DataPad-Sync.
  - Next.js-Routen agieren als Proxy (`app/api/web-adobe/*`), nutzen NextAuth-Session → Forward an FastAPI mit Bearer Token.
  - Prisma bleibt Single Source of Truth (FastAPI schreibt in Postgres; Prisma liest/ändert dieselben Tabellen).

### 4. Socket.IO Integration
- Channel `web-adobe:form:{id}` für Analyse/Synchronisationsstatus.
- Worker (FastAPI/Celery oder Node) sendet Events via Redis Pub/Sub → Socket.IO-Server broadcastet den Fortschritt.

### 5. Docker Compose Anpassung
```yaml
services:
  web-adobe-api:
    build: ./WEB_ADOBE/backend
    env_file: ./WEB_ADOBE/backend/.env
    environment:
      DATABASE_URL: postgresql://.../glxy_gaming_dev
      REDIS_URL: redis://redis:6379/0
    depends_on: [postgres, redis]

  web-adobe-worker:
    build: ./WEB_ADOBE/backend
    command: celery -A app.services.task_queue.celery_app worker --loglevel=info
    env_file: ./WEB_ADOBE/backend/.env
    depends_on: [web-adobe-api, redis]
```
- Traefik-Routen `/web-adobe/api` → `web-adobe-api`.

### 6. Sicherheit & Auth
- NextAuth Session → Token (JWT) erzeugen, an FastAPI übergeben.
- FastAPI überprüft Token-Signatur (gleicher Secret/Issuer). Python-Paket `python-jose` / `pyjwt` dafür nutzen.

### 7. DataPad & AI Optionalität
- `.env` Variable `AI_PROVIDER`, `AI_API_KEY` leer lassen → Backend fällt auf Heuristiken zurück.
- DataPad Keys per Secret Manager; ohne Key liefert Service Mock-Daten (siehe `datapad_service.py`).

## Aktionspunkte
1. Prisma Schema erweitern & migrieren.
2. Next.js Routen/Layouts aus Vite-Prototyp portieren.
3. Proxy/Backend-Integration festlegen (Variante A oder B).
4. Compose & Traefik updaten, Secrets setzen.
5. Socket.IO Hook für Worker-Events implementieren.
6. E2E-Test (Upload → Analyse → Mapping → Sync) durchspielen.
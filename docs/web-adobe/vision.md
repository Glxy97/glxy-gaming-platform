# Web Adobe Vision & Requirements

## Projektziel
Ein webbasiertes Pendant zu Adobe Acrobat DC mit AI-Unterstützung, das PDF-Formulare schneller analysiert, Formularfelder automatisch erkennt und sie direkt mit dem DataPad-Backend (Mobile Office) synchronisiert.

## Key Personas
- **Formdesigner**: Möchte PDFs hochladen, Felder automatisch erkennen lassen und die Zuordnung zu DataPad-Feldern prüfen/anpassen.
- **Reviewer**: Prüft Felddefinitionen, achtet auf Konsistenz, gibt Formular frei.
- **Integrator**: Exportiert/Synchronisiert fertige Formulare in DataPad, überwacht Status und Logs.

## Funktionsumfang (MVP)
1. **PDF-Upload & Rendering**
   - Drag & Drop Upload, Speicherung im Backend (z. B. S3/Hetzner Storage).
   - Browser-Rendering via PDF.js inkl. Zoom, Seitenwechsel.
2. **Felderkennung & AI-Hilfen**
   - Heuristik + OCR (PyMuPDF/Tesseract) für vorhandene Formularelemente.
   - AI-Modell (z. B. Claude/Gemini) schlägt Feldnamen, Gruppen, Validierungen vor.
3. **Feld-Editor**
   - Overlay zur Bearbeitung/Positionierung, Liste aller Felder, Massenbearbeitung.
   - Metadaten: interner Name, Anzeigename, Gruppenname, Typ, Validierung.
4. **DataPad-Integration**
   - REST-Connector mit Auth, Feld-Mapping-UI (bestehende DataPad-Feld-Sets laden).
   - Sync-Status pro Feld (neu, aktualisiert, Konflikt) + Fehlerbehandlung.
5. **Versionierung & Workflow**
   - Draft/Review/Published-Status, Änderungsverlauf, Im-/Export (JSON/CSV).
6. **Deployment & Hosting**
   - Hosting auf `glxy.at` (Hetzner). TLS, Auth (z. B. Keycloak/NextAuth), Logging/Monitoring.

## Erweiterte Ziele (Phase 2+)
- Kollaboratives Echtzeit-Editing (WebSockets/WebRTC).
- Automatische Testläufe (Feldvalidierung, Export-Simulation).
- Template-Bibliothek & Snippets für wiederkehrende Formularabschnitte.
- Reporting & Analytics (z. B. welche Felder wurden vom AI-Assistenten korrigiert).

## Systemübersicht
- **Frontend**: SPA (React + TypeScript + Vite) mit State-Management (Zustand/Recoil) und UI-Kit (MUI/Tailwind).
- **Backend API**: FastAPI (Python) oder Node (NestJS). Endpoints: Auth, PDF-Upload, Feldanalyse, DataPad-Sync, AI-Tasks.
- **AI Layer**: Abstraktion über Provider (Gemini/Claude). Prompt-/Response-Verarbeitung, Caching.
- **Worker Queue**: Celery/RQ (Python) oder BullMQ (Node) für OCR, AI Batch-Verarbeitung.
- **Storage**: PostgreSQL (Metadaten & Mapping), Object Storage (PDFs), Redis (Sessions/Queues).
- **Integrationen**: DataPad REST, optional Webhooks/Events.

## Offene Fragen
- Welche konkreten DataPad-APIs stehen zur Verfügung (Authentifizierung, Ratenlimits)?
- Welche Datenschutzvorgaben gelten für PDF-Inhalte (Verschlüsselung, Löschfristen)?
- Soll AI vollständig serverseitig laufen oder optional direkt im Browser (Client-Side LLMs / Edge)?
- Gibt es Bedarf für On-Premise-Deployment bei Kunden?

## Nächste Schritte
1. Proof-of-Concept für PDF-Upload + Rendering + einfache Feldanzeige.
2. Prototyp der Feldzuordnung mit DataPad-Dummydaten.
3. AI-Pipeline entwerfen (Prompts, Validierung, Feedback-Schleife).
4. Deployment-Strategie für `glxy.at` definieren (CI/CD, Domains, TLS, Backups).
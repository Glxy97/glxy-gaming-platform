# Web Adobe (FormTool Pro Web Companion)

Dieses Verzeichnis enthält den neuen Web-/HTML-Prototypen, der langfristig das desktopbasierte FormTool Pro ergänzt. Ziel ist eine AI-gestützte Webanwendung, die PDF-Formulare wie Adobe Acrobat DC bearbeitet, Felder erkennt und mit dem DataPad-Backend synchronisiert.

## Struktur
- `frontend/` – SPA-Client (React + TypeScript, Vite Setup) → siehe `frontend/README.md`
- `backend/` – API/Worker-Schicht (FastAPI, Celery, SQLModel) → siehe `backend/README.md`
- `docs/` – Vision, Architektur, DataPad-Integration
- `infra/` – Deployment- und Architekturunterlagen (Hetzner, glxy.at, Diagramme)

Weitere Details: `docs/vision.md`, `docs/architecture.md`, `docs/datapad_integration.md`.

## Quickstart (geplant)
```bash
# Frontend (Vite + React)
cd frontend
npm install
npm run dev

# Backend (FastAPI)
cd backend
python311 -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Integration glxy.at
Die Webanwendung wird unter `https://glxy.at/web-adobe` eingebunden. Deployment-Strategie: Docker-Compose auf Hetzner (Traefik/NGINX Proxy, automatisierte Builds via GitHub Actions oder self-hosted Runner). Details siehe `infra/deployment/hetzner.md`.

## DataPad-Anbindung
- DataPad-REST-Schnittstellen nutzen (Authentifizierung, Feldverwaltung, Status-Abfragen).
- Feld-Mapping-Konzept in `docs/datapad_integration.md`.
- AI-Assistent agiert als Vorschlagssystem; finale Bestätigung erfolgt durch Benutzer.

## Roadmap (Auszug)
1. UI-Prototyp mit PDF.js-Viewer und overlaybasiertem Feld-Editor.
2. Backend-Routen für Upload/OCR/AI-Vorschläge.
3. DataPad-Connector & Synchronisierung.
4. Auth/Role-Management und Deployment auf glxy.at.
# Web Adobe API Backend (FastAPI + Celery)

FastAPI-basierter Backend-Service für PDF-Formular-Verarbeitung mit DataPad-Integration.

## Features

- **PDF-Verarbeitung:** Extraktion von Formularfeldern aus PDF-Dokumenten
- **DataPad-Integration:** Vollständige REST-API für Synchronisation mit externem DataPad-Backend
- **AI-Unterstützung:** Optionale KI-basierte Feldnamen-Vorschläge
- **Async Task Queue:** Celery für Background-Jobs
- **PostgreSQL/SQLite:** Flexible Datenbank-Konfiguration
- **Mock-Modus:** Graceful Fallback für Entwicklung ohne externe Services

---

## Quick Start

### 1. Installation

```bash
cd services/web-adobe-api

# Virtual Environment erstellen
python311 -m venv .venv

# Aktivieren (Windows)
.venv\Scripts\activate

# Aktivieren (Linux/macOS)
source .venv/bin/activate

# Dependencies installieren
pip install -r requirements.txt
```

### 2. Konfiguration

```bash
# .env-Datei erstellen
cp .env.example .env

# Wichtigste Settings:
# DATABASE_URL=postgresql://user:pass@db:5432/glxy_gaming
# DATAPAD_BASE_URL=https://api.datapad.local
# DATAPAD_API_KEY=your_api_key_here  # Optional - Mock-Modus ohne Key
# AI_PROVIDER=openai                  # Optional
# AI_API_KEY=sk-...                   # Optional
```

### 3. Server starten

```bash
# Development Server mit Hot-Reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# API verfügbar unter:
# http://localhost:8000
# http://localhost:8000/docs         (Swagger UI)
# http://localhost:8000/redoc        (ReDoc)
```

### 4. Celery Worker (optional)

```bash
# In separatem Terminal
celery -A app.services.task_queue.celery_app worker --loglevel=info
```

---

## API-Übersicht

### Core Endpoints

| Endpoint                          | Methode | Beschreibung                          |
|-----------------------------------|---------|---------------------------------------|
| `/health`                         | GET     | Gesundheitscheck                      |
| `/api/forms/upload`               | POST    | PDF hochladen                         |
| `/api/forms/{id}`                 | GET     | Formulardetails abrufen               |
| `/api/forms/{id}/analyze`         | POST    | PDF analysieren (Felder extrahieren)  |

### DataPad Integration

| Endpoint                          | Methode | Beschreibung                          |
|-----------------------------------|---------|---------------------------------------|
| `/api/datapad/health`             | GET     | DataPad-Verfügbarkeit prüfen          |
| `/api/datapad/fields`             | GET     | Verfügbare DataPad-Felder             |
| `/api/datapad/fields`             | POST    | Neues Feld erstellen                  |
| `/api/datapad/fields/{id}`        | PATCH   | Feld aktualisieren                    |
| `/api/datapad/fields/{id}`        | DELETE  | Feld löschen                          |
| `/api/datapad/mappings`           | GET     | Feld-Mappings abrufen                 |
| `/api/datapad/mappings`           | POST    | Mapping erstellen                     |
| `/api/datapad/forms/{id}/sync`    | POST    | Formular synchronisieren              |
| `/api/datapad/forms/{id}/sync-status` | GET | Sync-Status abfragen                 |
| `/api/datapad/forms/{id}/sync/reset` | POST | Sync zurücksetzen                    |

### AI Services

| Endpoint                          | Methode | Beschreibung                          |
|-----------------------------------|---------|---------------------------------------|
| `/api/ai/suggest-labels`          | POST    | AI-Vorschläge für Feldnamen           |

Vollständige API-Dokumentation: **[DATAPAD_API_DOCUMENTATION.md](./DATAPAD_API_DOCUMENTATION.md)**

---

## DataPad-Integration

### Mock-Modus (Standard)

Ohne konfigurierte API-Key wird automatisch ein Mock-Client verwendet:

```bash
# .env
# DATAPAD_API_KEY=  # Leer lassen für Mock-Modus
```

**Vorteile:**
- Keine externe API-Verbindung nötig
- 7 vordefinierte Demo-Felder
- Gleiche API-Responses wie echter Client
- Perfekt für Entwicklung und Testing

### Produktions-Modus

Mit konfigurierter API-Key:

```bash
# .env
DATAPAD_BASE_URL=https://api.datapad.local
DATAPAD_API_KEY=your_real_api_key_here
```

**Features:**
- Automatisches Retry mit exponential backoff
- Rate-Limiting-Awareness
- Umfangreiches Error-Handling
- Request/Response-Logging

### Beispiel-Workflow

```bash
# 1. Health-Check
curl http://localhost:8000/api/datapad/health

# 2. Verfügbare Felder abrufen
curl http://localhost:8000/api/datapad/fields

# 3. Formular synchronisieren
curl -X POST http://localhost:8000/api/datapad/forms/1/sync \
  -H "Content-Type: application/json" \
  -d '{
    "force": false,
    "conflict_resolution": "skip"
  }'

# 4. Sync-Status prüfen
curl http://localhost:8000/api/datapad/forms/1/sync-status
```

**Python-Beispiel:**

```bash
python311 examples/datapad_example.py
```

---

## Projektstruktur

```
app/
├── api/
│   ├── routes/
│   │   ├── datapad.py      # DataPad-Endpunkte
│   │   ├── forms.py        # Formular-Verwaltung
│   │   └── ai.py           # AI-Services
│   └── dependencies.py     # FastAPI Dependencies
├── core/
│   ├── config.py           # Konfiguration (Pydantic Settings)
│   ├── database.py         # SQLModel Setup
│   └── logging.py          # Logging-Konfiguration
├── models/
│   └── form.py             # Datenbank-Modelle
├── schemas/
│   ├── datapad.py          # DataPad Pydantic-Schemas
│   └── form.py             # Form Pydantic-Schemas
├── services/
│   ├── datapad_client.py   # DataPad REST-Client
│   ├── datapad_mock.py     # Mock-Client
│   ├── sync_service.py     # Sync-Orchestrierung
│   ├── form_service.py     # Formular-Logic
│   ├── pdf_service.py      # PDF-Verarbeitung
│   └── ai_service.py       # AI-Integration
└── main.py                 # FastAPI Application

examples/
└── datapad_example.py      # API-Nutzungsbeispiele

tests/
└── ...                     # Unit & Integration Tests
```

---

## Services-Übersicht

### DataPadClient

Vollständiger REST-Client für DataPad-API:

```python
from app.services import DataPadClient
from app.core.config import get_settings

client = DataPadClient(get_settings())

# Felder abrufen
fields = await client.get_fields(group="Allgemein")

# Feld erstellen
field = await client.create_field(DataPadFieldCreate(
    label="Test",
    field_type="text",
    required=True
))

# Mapping erstellen
mapping = await client.create_mapping(
    pdf_field_id=42,
    datapad_field_id="field-abc",
    document_id=10
)
```

**Features:**
- Automatisches Retry (3 Versuche)
- Rate-Limiting-Tracking
- Umfassendes Error-Handling
- Request/Response-Logging

### SyncService

Orchestriert Synchronisation zwischen PDF-Feldern und DataPad:

```python
from app.services import SyncService

result = await sync_service.sync_document(
    document_id=10,
    field_ids=[42, 43],  # Optional: spezifische Felder
    force=False,
    conflict_resolution="skip"
)

# Status prüfen
status = await sync_service.get_sync_status(10)
```

**Sync-Status-Tracking:**
- PENDING → SYNCING → SYNCED/ERROR
- Detaillierte Fehler-Reports
- Conflict-Resolution-Strategien

### DataPadMockClient

Mock-Implementation für Testing:

```python
from app.services import DataPadMockClient

mock = DataPadMockClient()

# Gleiche API wie echter Client
fields = await mock.get_fields()
# → Liefert 7 Demo-Felder

# In-Memory Storage
field = await mock.create_field(...)
# → Wird in Mock-Dictionary gespeichert
```

---

## Testing

### Unit Tests

```bash
pytest tests/ -v
```

### Integration Tests

```bash
# Mit Mock-Client
pytest tests/integration/ -v

# Mit echter DataPad-API (API-Key erforderlich)
DATAPAD_API_KEY=real_key pytest tests/integration/ -v
```

### Coverage

```bash
pytest --cov=app --cov-report=html
```

---

## Environment Variables

### Required

```bash
DATABASE_URL=postgresql://user:pass@db:5432/glxy_gaming
```

### Optional

```bash
# DataPad Integration
DATAPAD_BASE_URL=https://api.datapad.local
DATAPAD_API_KEY=your_api_key_here

# AI Provider (OpenAI/Anthropic/Gemini)
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4

# Redis/Celery
REDIS_URL=redis://redis:6379/1
CELERY_BROKER_URL=redis://redis:6379/1

# Storage
STORAGE_DIR=var/storage
UPLOAD_DIR=var/uploads
MAX_UPLOAD_SIZE=52428800  # 50MB

# OCR
OCR_ENABLED=true
OCR_LANGUAGE=deu+eng
PDF_DPI=300

# Security
ALLOWED_ORIGINS=["http://localhost:3000","https://glxy.at"]
ALLOWED_API_KEYS=["key1","key2"]
```

---

## Error-Handling

### DataPad-Fehler

```python
from app.services.datapad_client import (
    DataPadAPIError,
    DataPadAuthenticationError,
    DataPadNotFoundError,
    DataPadRateLimitError,
    DataPadValidationError
)

try:
    await client.get_fields()
except DataPadAuthenticationError:
    # API-Key ungültig
    pass
except DataPadRateLimitError as e:
    # Rate-Limit überschritten
    retry_after = e.details.get("retry_after")
except DataPadNotFoundError:
    # Ressource nicht gefunden
    pass
```

### HTTP-Status-Codes

- **401:** Authentication fehlgeschlagen
- **404:** Ressource nicht gefunden
- **422:** Validation-Error
- **429:** Rate-Limit überschritten
- **500:** Server-Error

---

## Deployment

### Docker

```bash
# Build
docker build -t web-adobe-api .

# Run
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e DATAPAD_API_KEY=... \
  web-adobe-api
```

### Docker Compose

Siehe `docker-compose.yml` im Root-Verzeichnis.

---

## Performance

### Rate Limiting

Der Client trackt automatisch Rate-Limits:

```python
client._rate_limit_remaining  # Verbleibende Requests
client._rate_limit_reset      # Reset-Timestamp
```

### Retry-Strategie

- **Max Retries:** 3
- **Wait:** 2s → 4s → 8s (exponential backoff)
- **Retry auf:** TimeoutException, NetworkError

### Batch-Operations

```python
# Mehrere Felder gleichzeitig syncen
await sync_service.sync_document(
    document_id=10,
    field_ids=[1, 2, 3, 4, 5]
)
```

---

## Contributing

1. Branch erstellen: `git checkout -b feature/xyz`
2. Tests schreiben
3. Code formatieren: `black app/`
4. Linting: `ruff check app/`
5. Pull Request erstellen

---

## License

Proprietary - GLXY Gaming Platform

---

## Support

- **Dokumentation:** [DATAPAD_API_DOCUMENTATION.md](./DATAPAD_API_DOCUMENTATION.md)
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

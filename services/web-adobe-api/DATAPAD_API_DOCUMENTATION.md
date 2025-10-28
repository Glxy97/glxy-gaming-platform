# DataPad Integration API Documentation

## Übersicht

Die DataPad-Integration ermöglicht die Synchronisation von PDF-Formularfeldern mit einem externen DataPad-Backend. Die API bietet vollständige CRUD-Operationen für Felder, Mappings und Synchronisations-Workflows.

**Version:** 1.0
**Base URL:** `http://localhost:8000/api/datapad`
**Authentication:** Bearer Token (optional für Mock-Modus)

---

## Inhaltsverzeichnis

1. [Authentifizierung](#authentifizierung)
2. [Field Management](#field-management)
3. [Field Mappings](#field-mappings)
4. [Synchronisation](#synchronisation)
5. [Health Check](#health-check)
6. [Fehlerbehandlung](#fehlerbehandlung)
7. [DataPad API Spezifikation](#datapad-api-spezifikation)

---

## Authentifizierung

### Bearer Token

Alle Requests an die echte DataPad-API erfordern einen Bearer Token:

```http
Authorization: Bearer YOUR_DATAPAD_API_KEY
```

**Konfiguration:**

```bash
# .env
DATAPAD_BASE_URL=https://api.datapad.local
DATAPAD_API_KEY=your_api_key_here
```

**Mock-Modus:**

Ohne konfigurierte API-Key wird automatisch der Mock-Client verwendet:

- Keine externe API-Verbindung
- Demo-Daten werden in-memory gespeichert
- Gleiche API-Responses wie echter Client

---

## Field Management

### GET /datapad/fields

Alle verfügbaren DataPad-Felder abrufen.

**Query Parameters:**

| Parameter | Typ    | Required | Beschreibung                |
|-----------|--------|----------|-----------------------------|
| `group`   | string | Nein     | Filtert nach Feldgruppe     |

**Response 200:**

```json
{
  "items": [
    {
      "id": "demo-001",
      "label": "Kundennummer",
      "field_type": "text",
      "group": "Allgemein",
      "required": true,
      "default_value": null,
      "validation_rules": null,
      "metadata": null,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 7,
  "page": null,
  "page_size": null
}
```

**Curl Example:**

```bash
curl -X GET "http://localhost:8000/api/datapad/fields?group=Allgemein" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

### POST /datapad/fields

Neues DataPad-Feld erstellen.

**Request Body:**

```json
{
  "label": "Mitarbeiternummer",
  "field_type": "text",
  "group": "Personal",
  "required": true,
  "default_value": null,
  "validation_rules": {
    "pattern": "^[A-Z]{2}\\d{6}$"
  },
  "metadata": {
    "description": "Eindeutige Mitarbeiter-ID"
  }
}
```

**Response 201:**

```json
{
  "id": "field-abc123",
  "label": "Mitarbeiternummer",
  "field_type": "text",
  "group": "Personal",
  "required": true,
  "default_value": null,
  "validation_rules": {
    "pattern": "^[A-Z]{2}\\d{6}$"
  },
  "metadata": {
    "description": "Eindeutige Mitarbeiter-ID"
  },
  "created_at": "2025-01-15T11:00:00Z",
  "updated_at": "2025-01-15T11:00:00Z"
}
```

**Unterstützte Field Types:**

- `text` - Einzeiliger Text
- `textarea` - Mehrzeiliger Text
- `number` - Numerische Werte
- `email` - E-Mail-Adresse
- `phone` - Telefonnummer
- `date` - Datum
- `checkbox` - Checkbox
- `radio` - Radio Button
- `select` - Dropdown
- `signature` - Unterschrift
- `file` - Datei-Upload

---

### PATCH /datapad/fields/{field_id}

Bestehendes DataPad-Feld aktualisieren (partial update).

**Path Parameters:**

| Parameter  | Typ    | Beschreibung       |
|------------|--------|--------------------|
| `field_id` | string | ID des Feldes      |

**Request Body:**

```json
{
  "label": "Mitarbeiter-ID (aktualisiert)",
  "required": false
}
```

**Response 200:**

```json
{
  "id": "field-abc123",
  "label": "Mitarbeiter-ID (aktualisiert)",
  "field_type": "text",
  "required": false,
  ...
}
```

---

### DELETE /datapad/fields/{field_id}

DataPad-Feld löschen.

**Response 204:** No Content

---

## Field Mappings

### GET /datapad/mappings

Alle Feld-Mappings abrufen.

**Query Parameters:**

| Parameter     | Typ | Required | Beschreibung                |
|---------------|-----|----------|-----------------------------|
| `document_id` | int | Nein     | Filtert nach Dokument-ID    |

**Response 200:**

```json
[
  {
    "id": "map-xyz789",
    "pdf_field_id": 42,
    "datapad_field_id": "field-abc123",
    "document_id": 10,
    "status": "synced",
    "last_synced_at": "2025-01-15T12:00:00Z",
    "sync_error": null,
    "created_at": "2025-01-15T11:30:00Z",
    "updated_at": "2025-01-15T12:00:00Z"
  }
]
```

---

### POST /datapad/mappings

Neues Mapping erstellen.

**Request Body:**

```json
{
  "pdf_field_id": 42,
  "datapad_field_id": "field-abc123",
  "document_id": 10
}
```

**Response 201:**

```json
{
  "id": "map-xyz789",
  "pdf_field_id": 42,
  "datapad_field_id": "field-abc123",
  "document_id": 10,
  "status": "pending",
  ...
}
```

---

### DELETE /datapad/mappings/{mapping_id}

Mapping löschen.

**Response 204:** No Content

---

## Synchronisation

### POST /datapad/forms/{form_id}/sync

Formular mit DataPad synchronisieren.

**Path Parameters:**

| Parameter | Typ | Beschreibung    |
|-----------|-----|-----------------|
| `form_id` | int | ID des Forms    |

**Request Body (optional):**

```json
{
  "form_id": 10,
  "field_ids": [42, 43, 44],
  "force": false,
  "conflict_resolution": "skip"
}
```

**Request Body Fields:**

| Field                  | Typ         | Default | Beschreibung                                    |
|------------------------|-------------|---------|------------------------------------------------|
| `field_ids`            | int[]       | []      | Spezifische Felder (leer = alle)               |
| `force`                | boolean     | false   | Re-sync erzwingen                              |
| `conflict_resolution`  | string      | "skip"  | Konflikt-Strategie: skip/overwrite/merge       |

**Response 200:**

```json
{
  "form_id": 10,
  "status": "synced",
  "results": [
    {
      "field_id": 42,
      "status": "synced",
      "datapad_field_id": "field-abc123",
      "error_message": null,
      "synced_at": "2025-01-15T12:00:00Z"
    },
    {
      "field_id": 43,
      "status": "error",
      "datapad_field_id": null,
      "error_message": "DataPadValidationError: Invalid field type",
      "synced_at": null
    }
  ],
  "summary": {
    "synced": 15,
    "pending": 0,
    "failed": 1,
    "skipped": 2
  },
  "message": null,
  "started_at": "2025-01-15T11:58:00Z",
  "completed_at": "2025-01-15T12:00:30Z"
}
```

**Sync-Status-Werte:**

- `pending` - Noch nicht synchronisiert
- `syncing` - Synchronisierung läuft
- `synced` - Erfolgreich synchronisiert
- `error` - Fehler bei Synchronisation
- `conflict` - Konflikt erkannt

**Conflict Resolution Strategien:**

- `skip` - Felder mit Konflikten überspringen
- `overwrite` - Lokale Änderungen überschreiben
- `merge` - Intelligentes Merging (experimentell)

---

### GET /datapad/forms/{form_id}/sync-status

Sync-Status eines Formulars abfragen.

**Response 200:**

```json
{
  "form_id": 10,
  "status": "synced",
  "total_fields": 18,
  "synced_fields": 15,
  "pending_fields": 2,
  "failed_fields": 1,
  "last_sync_at": "2025-01-15T12:00:30Z",
  "error_count": 1,
  "errors": [
    "Field 43 (employee_signature): Sync failed"
  ]
}
```

---

### POST /datapad/forms/{form_id}/sync/reset

Sync-Status zurücksetzen.

**Query Parameters:**

| Parameter   | Typ   | Required | Beschreibung                        |
|-------------|-------|----------|-------------------------------------|
| `field_ids` | int[] | Nein     | Spezifische Felder (leer = alle)    |

**Response 200:**

```json
{
  "form_id": 10,
  "fields_reset": 18
}
```

---

## Health Check

### GET /datapad/health

DataPad API Verfügbarkeit prüfen.

**Response 200:**

```json
{
  "status": "healthy",
  "api_available": true,
  "authenticated": true,
  "rate_limit_remaining": 4950,
  "rate_limit_reset": 1704067200,
  "details": {
    "mode": "production",
    "version": "1.0.0"
  }
}
```

**Mock-Modus Response:**

```json
{
  "status": "healthy",
  "api_available": true,
  "authenticated": true,
  "rate_limit_remaining": null,
  "rate_limit_reset": null,
  "details": {
    "mode": "mock",
    "fields_count": 7,
    "mappings_count": 0
  }
}
```

---

## Fehlerbehandlung

### Standard Error Response

```json
{
  "error": "DataPadNotFoundError",
  "message": "Field with ID field-xyz not found",
  "details": {
    "field_id": "field-xyz",
    "endpoint": "/api/v1/fields/field-xyz"
  }
}
```

### HTTP Status Codes

| Code | Error Type                      | Beschreibung                          |
|------|---------------------------------|---------------------------------------|
| 400  | Bad Request                     | Ungültige Anfrage                     |
| 401  | DataPadAuthenticationError      | Authentifizierung fehlgeschlagen      |
| 403  | Forbidden                       | Zugriff verweigert                    |
| 404  | DataPadNotFoundError            | Ressource nicht gefunden              |
| 422  | DataPadValidationError          | Validierung fehlgeschlagen            |
| 429  | DataPadRateLimitError           | Rate-Limit überschritten              |
| 500  | DataPadAPIError                 | Interner Server-Fehler                |
| 503  | Service Unavailable             | DataPad API nicht erreichbar          |

### Retry-Verhalten

Der Client implementiert automatisches Retry mit exponential backoff:

- **Max Retries:** 3
- **Initial Wait:** 2 Sekunden
- **Max Wait:** 10 Sekunden
- **Retry auf:** TimeoutException, NetworkError

---

## DataPad API Spezifikation

### Erwartete DataPad-Endpunkte

Die Integration geht von folgender DataPad-API aus:

#### Authentication

```http
GET /api/v1/auth/verify
Authorization: Bearer {token}

Response 200:
{
  "user_id": "string",
  "account_name": "string",
  "tier": "string"
}
```

#### Fields

```http
# List Fields
GET /api/v1/fields?group={group}
Authorization: Bearer {token}

# Create Field
POST /api/v1/fields
Content-Type: application/json
Authorization: Bearer {token}
Body: { "label": "...", "field_type": "...", ... }

# Update Field
PATCH /api/v1/fields/{id}
Content-Type: application/json
Authorization: Bearer {token}
Body: { "label": "..." }

# Delete Field
DELETE /api/v1/fields/{id}
Authorization: Bearer {token}
```

#### Mappings

```http
# List Mappings
GET /api/v1/mappings?document_id={id}
Authorization: Bearer {token}

# Create Mapping
POST /api/v1/mappings
Content-Type: application/json
Authorization: Bearer {token}
Body: {
  "pdf_field_id": 42,
  "datapad_field_id": "field-abc",
  "document_id": 10
}

# Delete Mapping
DELETE /api/v1/mappings/{id}
Authorization: Bearer {token}
```

#### Health

```http
GET /api/v1/health

Response 200:
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### Rate Limiting Headers

Die DataPad-API sollte folgende Header liefern:

```http
X-RateLimit-Remaining: 4950
X-RateLimit-Reset: 1704067200
```

---

## Beispiel-Workflows

### 1. Formular vollständig synchronisieren

```bash
# 1. Health-Check
curl -X GET "http://localhost:8000/api/datapad/health"

# 2. Verfügbare DataPad-Felder prüfen
curl -X GET "http://localhost:8000/api/datapad/fields"

# 3. Sync starten
curl -X POST "http://localhost:8000/api/datapad/forms/10/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "form_id": 10,
    "force": false,
    "conflict_resolution": "skip"
  }'

# 4. Status prüfen
curl -X GET "http://localhost:8000/api/datapad/forms/10/sync-status"
```

### 2. Einzelne Felder synchronisieren

```bash
curl -X POST "http://localhost:8000/api/datapad/forms/10/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "form_id": 10,
    "field_ids": [42, 43, 44],
    "force": true,
    "conflict_resolution": "overwrite"
  }'
```

### 3. Fehlgeschlagene Felder neu synchronisieren

```bash
# 1. Status abrufen
STATUS=$(curl -s -X GET "http://localhost:8000/api/datapad/forms/10/sync-status")

# 2. Fehlgeschlagene Felder extrahieren (manuelle Identifikation)
# 3. Sync zurücksetzen und neu starten
curl -X POST "http://localhost:8000/api/datapad/forms/10/sync/reset"
curl -X POST "http://localhost:8000/api/datapad/forms/10/sync" \
  -d '{"force": true}'
```

---

## Environment Variables

```bash
# DataPad Configuration
DATAPAD_BASE_URL=https://api.datapad.local
DATAPAD_API_KEY=your_api_key_here

# Ohne API_KEY wird automatisch Mock-Client verwendet
```

---

## Testing mit Mock-Client

Der Mock-Client ist perfekt für:

- **Entwicklung** ohne DataPad-Zugang
- **Integration-Tests** ohne externe Dependencies
- **CI/CD-Pipelines**

**Mock-Daten:**

- 7 vordefinierte Demo-Felder
- In-Memory Storage
- Gleiche API-Responses wie echter Client
- Keine externe Netzwerkverbindung

**Aktivierung:**

Einfach `DATAPAD_API_KEY` aus `.env` entfernen oder leer lassen.

---

## OpenAPI Specification

Die vollständige OpenAPI 3.1 Spezifikation ist verfügbar unter:

```
http://localhost:8000/docs
http://localhost:8000/redoc
http://localhost:8000/openapi.json
```

---

## Support & Troubleshooting

### Häufige Probleme

**1. "DataPadAuthenticationError: Invalid API key"**

```bash
# Lösung: API-Key in .env überprüfen
DATAPAD_API_KEY=correct_key_here
```

**2. "DataPadRateLimitError: Rate limit exceeded"**

```bash
# Lösung: Warten bis Rate-Limit-Reset
curl -X GET "http://localhost:8000/api/datapad/health"
# Check rate_limit_reset timestamp
```

**3. "Sync failed: Document not found"**

```bash
# Lösung: Form-ID validieren
curl -X GET "http://localhost:8000/api/forms/10"
```

### Debug-Logging

```python
# In .env
DEBUG=true

# Logs zeigen detaillierte DataPad API-Requests
```

---

**Version:** 1.0.0
**Last Updated:** 2025-01-15
**Maintainer:** GLXY Gaming Platform Team

# DataPad Integration Blueprint

## Ziele
- Formularfelder aus PDFs mit DataPad-Felddefinitionen verknüpfen.
- Automatisierte Synchronisation (Create/Update) ins DataPad-Backend.
- Rückmeldung von DataPad (z. B. Fehler, Pflichtfelder) in der Web-Oberfläche anzeigen.

## Datenmodell (Entwurf)
| Feld | Beschreibung |
|------|--------------|
| `pdf_field_id` | Interner Identifier des PDF-Feldes (UUID) |
| `pdf_name` | Formularfeld-Name aus PDF |
| `label` | Anzeigename in der App |
| `group` | Gruppierung/Section in DataPad |
| `type` | Feldtyp (Text, Checkbox, Select, Datum…) |
| `validation` | Regeln (Regex, Pflichtfeld, Bereich) |
| `datapad_field_id` | ID des Feldes in DataPad |
| `status` | `draft`, `pending_sync`, `synced`, `error` |
| `sync_message` | Letzte Meldung/Fehler vom Backend |

## Ablauf Sync
1. Nutzer bestätigt Feldzuordnung im Web-UI.
2. Backend sammelt alle `pending_sync` Felder.
3. API-Call an DataPad (`POST /fields` oder `PUT /fields/{id}`), Auth mittels OAuth2/API-Key.
4. Antwort wird gespeichert (ID, Status, Fehlermeldung).
5. UI aktualisiert Status in Echtzeit (WebSocket/EventStream).

## Offene Punkte
- Offizielle DataPad API-Dokumentation einholen (Endpoints, Auth-Flow).
- Klären, ob DataPad Bulk-Updates unterstützt (Batch-Requests).
- Validierungsregeln: Wer ist Single Source of Truth – DataPad oder Web-App?

## Nächste Schritte
- Mock-API für DataPad (lokal im Backend) erstellen.
- Mapping-UI entwerfen (Frontend).
- E2E-Testablauf definieren (z. B. Cypress + Playwright).
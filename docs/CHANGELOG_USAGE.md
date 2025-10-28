# 📝 Changelog-Verwaltung - Benutzerhandbuch

## Überblick

Das GLXY Gaming Platform Projekt verfügt über ein automatisiertes Changelog-System, das sowohl manuelle Einträge als auch Git-basierte Generierung unterstützt.

## Verfügbare Befehle

### 1. NPM Scripts (empfohlen)

```bash
# Einzelnen Changelog-Eintrag hinzufügen
npm run changelog:add "Typ" "Beschreibung"

# Changelog aus Git-Commits generieren
npm run changelog:generate

# Verfügbare Changelog-Typen anzeigen
npm run changelog:list
```

### 2. Direkte Script-Ausführung

```bash
# Changelog-Manager direkt ausführen
node scripts/changelog-manager.js <command>
```

## Changelog-Typen

Das System unterstützt folgende Kategorien:

- **Behobene Kritische Fehler** - Bugfixes, Sicherheitslücken, kritische Reparaturen
- **Neue Features** - Neue Funktionen, Spielmodi, Tools
- **Infrastrukturverbesserungen** - Deployment, Container, Build-System
- **Sicherheitsverbesserungen** - Auth, Verschlüsselung, Schutzmaßnahmen
- **Leistungsverbesserungen** - Performance-Optimierungen, Caching
- **Verbesserte Spielelogik** - Game-spezifische Updates

## Verwendungsbeispiele

### Manueller Eintrag

```bash
# Bugfix dokumentieren
npm run changelog:add "Behobene Kritische Fehler" "Behoben: WebSocket-Verbindung bricht ab"

# Neues Feature hinzufügen
npm run changelog:add "Neue Features" "Hinzugefügt: Schach-PGN-Analyzer mit KI-Bewertung"

# Sicherheitsupdate
npm run changelog:add "Sicherheitsverbesserungen" "Implementiert: OAuth 2.1 mit PKCE"
```

### Automatische Generierung

```bash
# Changelog aus letzten Git-Commits erstellen
npm run changelog:generate
```

Das System kategorisiert Commits automatisch basierend auf Keywords:
- `fix|bug|fehler|behoben` → Behobene Kritische Fehler
- `feat|add|neu|hinzugefügt` → Neue Features
- `security|sicher|auth` → Sicherheitsverbesserungen
- `perf|optimiz|performance` → Leistungsverbesserungen
- `infra|docker|deploy` → Infrastrukturverbesserungen

### Changelog anzeigen

```bash
# Changelog im Terminal ausgeben
cat CHANGELOG.md

# Nur heute's Einträge
grep -A 20 "$(date +%Y-%m-%d)" CHANGELOG.md
```

## Dateistruktur

```
/opt/glxy-gaming/
├── CHANGELOG.md                    # Hauptchangelog-Datei
├── scripts/changelog-manager.js    # Changelog-Management-Script
└── docs/CHANGELOG_USAGE.md        # Diese Anleitung
```

## Format-Spezifikation

Das Changelog folgt diesem Format:

```markdown
# Änderungsprotokoll

## YYYY-MM-DD

### Kategorie
- Eintrag 1
- Eintrag 2

### Weitere Kategorie
- Weiterer Eintrag

## Älteres Datum
...
```

## Best Practices

1. **Regelmäßige Updates** - Nach jeder wichtigen Änderung sofort dokumentieren
2. **Klare Beschreibungen** - Nutzerfreundliche Sprache verwenden
3. **Richtige Kategorisierung** - Passenden Typ für jeden Eintrag wählen
4. **Git Integration** - Commits mit aussagekräftigen Nachrichten schreiben

## Troubleshooting

**Problem:** Script nicht ausführbar
```bash
chmod +x scripts/changelog-manager.js
```

**Problem:** Ungültiger Changelog-Typ
```bash
npm run changelog:list  # Verfügbare Typen anzeigen
```

**Problem:** Git-Commits nicht gefunden
```bash
git log --oneline --since="1 day ago"  # Manuelle Prüfung
```

## Integration mit CI/CD

Das Changelog-System kann in Deployment-Pipelines integriert werden:

```bash
# Im deploy.sh Script
npm run changelog:generate
git add CHANGELOG.md
git commit -m "docs: Update changelog for deployment $(date +%Y-%m-%d)"
```

## Erweiterte Nutzung

### Custom Git-Zeitraum

```bash
# Script anpassen für spezifischen Zeitraum
git log --oneline --since="3 days ago" --until="1 day ago"
```

### Changelog für spezifische Features

```bash
# Feature-spezifische Commits
git log --oneline --grep="chess" --since="1 week ago"
```

---

**Automatisch generiert am:** $(date)
**Letzte Aktualisierung:** 2025-09-16
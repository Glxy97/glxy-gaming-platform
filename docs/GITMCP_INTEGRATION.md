# 🎯 GitMCP Integration Guide

**GitMCP URL:** https://gitmcp.io/Glxy97/glxy-gaming-platform

---

## Was ist GitMCP?

[GitMCP.io](https://gitmcp.io/) erstellt automatisch einen **Model Context Protocol (MCP) Server** für jedes GitHub Repository. Das ermöglicht AI-Assistenten wie Claude, Cursor, und anderen, dein komplettes Repository zu verstehen und bessere, kontext-bewusste Antworten zu geben.

---

## 🚀 Deine GitMCP URL

### Original GitHub URL:
```
https://github.com/Glxy97/glxy-gaming-platform
```

### GitMCP URL:
```
https://gitmcp.io/Glxy97/glxy-gaming-platform
```

> **Tipp:** Einfach `github.com` durch `gitmcp.io` ersetzen!

---

## 🔧 Integration in Cursor

### Schritt 1: Cursor Settings öffnen
1. Drücke `Ctrl + Shift + P` (Windows/Linux) oder `Cmd + Shift + P` (Mac)
2. Tippe: `Preferences: Open Settings`
3. Suche nach: `MCP` oder `Model Context Protocol`

### Schritt 2: MCP Server Konfiguration
Klicke auf `Edit in settings.json` und füge hinzu:

```json
{
  "mcpServers": {
    "glxy-gaming": {
      "url": "https://gitmcp.io/Glxy97/glxy-gaming-platform"
    }
  }
}
```

### Schritt 3: Cursor neu starten
Nach dem Hinzufügen der Konfiguration:
1. Speichere die `settings.json`
2. Starte Cursor neu
3. Der MCP Server sollte jetzt aktiv sein

---

## 🎯 Integration in Claude Desktop

### Schritt 1: Claude Desktop Konfiguration
Öffne die Claude Desktop Konfigurationsdatei:

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### Schritt 2: MCP Server hinzufügen
```json
{
  "mcpServers": {
    "glxy-gaming-platform": {
      "command": "mcp",
      "args": ["https://gitmcp.io/Glxy97/glxy-gaming-platform"]
    }
  }
}
```

### Schritt 3: Claude Desktop neu starten

---

## 💪 Was bringt dir GitMCP?

### ✅ Vollständiges Repository-Verständnis
- AI kennt **alle 30+ Games**
- AI kennt **alle Components**
- AI kennt **alle Libraries**
- AI kennt deine **Projekt-Struktur**

### ✅ Automatisches Lesen von:
- `README.md` - Projekt-Übersicht
- `package.json` - Dependencies & Scripts
- `tsconfig.json` - TypeScript Konfiguration
- `CHANGELOG.md` - Änderungshistorie
- Alle `.md` Dateien in `docs/`
- `llms.txt` & `llms-full.txt` (falls vorhanden)

### ✅ Bessere Code-Vorschläge
- Kennt existierende Komponenten
- Schlägt passende Patterns vor
- Vermeidet Code-Duplikate
- Respektiert deine Architektur

### ✅ Kontext-bewusste Antworten
- Kann auf bestehenden Code referenzieren
- Versteht deine Naming Conventions
- Weiß welche Libraries du nutzt
- Kennt deine Deployment-Struktur

---

## 🔍 Wie funktioniert GitMCP?

GitMCP erstellt automatisch einen MCP Server, der:

1. **Dein Repository analysiert**
   - Liest alle Markdown-Dateien
   - Analysiert die Projekt-Struktur
   - Extrahiert wichtige Metadaten

2. **Kontext für AI bereitstellt**
   - Stellt Informationen strukturiert zur Verfügung
   - Ermöglicht gezielte Abfragen
   - Hält Kontext aktuell (sync mit GitHub)

3. **Mit AI-Tools kommuniziert**
   - Über Model Context Protocol (MCP)
   - Standardisierte Schnittstelle
   - Kompatibel mit vielen AI-Tools

---

## 🛠️ Kompatible Tools

GitMCP funktioniert mit:

- ✅ **Claude** (Desktop & API)
- ✅ **Cursor** (IDE)
- ✅ **Windsurf**
- ✅ **VSCode** (mit MCP Extension)
- ✅ **Cline**
- ✅ **Highlight AI**
- ✅ **Augment Code**
- ✅ **Msty AI**

---

## 📚 Erweiterte Nutzung

### llms.txt erstellen (Optional)

Erstelle eine `llms.txt` Datei im Root deines Repositories für optimale AI-Kontext:

```markdown
# GLXY Gaming Platform

## Projekt-Übersicht
Eine moderne Gaming-Plattform mit 30+ Spielen, built with Next.js 15, TypeScript, Prisma, und Socket.IO.

## Wichtige Verzeichnisse
- `/app` - Next.js App Router
- `/components` - React Components (30+ Games)
- `/lib` - Utility Libraries & Game Logic
- `/prisma` - Database Schema
- `/docs` - Documentation

## Tech Stack
- Framework: Next.js 15.5.3
- Language: TypeScript
- Database: PostgreSQL (Prisma ORM)
- Auth: NextAuth.js v5
- Real-time: Socket.IO
- Styling: Tailwind CSS
- Testing: Vitest, Playwright

## Wichtige Features
- 30+ Playable Games (FPS, Racing, Board Games)
- JWT Token Rotation
- SQL-Injection Protection
- Game Preloading System
- Performance Optimized Homepage
```

---

## 🔄 GitHub Pages Integration

Falls du GitHub Pages nutzt, funktioniert GitMCP auch damit:

**GitHub Pages URL:**
```
https://glxy97.github.io/glxy-gaming-platform
```

**GitMCP URL:**
```
https://glxy97.gitmcp.io/glxy-gaming-platform
```

> Einfach `.github.io` durch `.gitmcp.io` ersetzen!

---

## 🐛 Troubleshooting

### MCP Server wird nicht erkannt
1. Prüfe die URL-Syntax in der Konfiguration
2. Stelle sicher, dass das Repository **public** ist
3. Starte das AI-Tool neu
4. Prüfe die Cursor/Claude Logs

### Repository nicht gefunden
- GitMCP funktioniert nur mit **public** Repositories
- Prüfe ob das Repo auf GitHub erreichbar ist
- Warte 1-2 Minuten nach Repository-Erstellung

### Veralteter Kontext
- GitMCP synchronisiert sich automatisch mit GitHub
- Bei Updates: Warte ~5 Minuten für Sync
- Oder: Starte das AI-Tool neu

---

## 📖 Weitere Ressourcen

- **GitMCP Website:** https://gitmcp.io/
- **GitMCP Docs:** https://gitmcp.io/docs
- **Model Context Protocol:** https://modelcontextprotocol.io/
- **Dein Repository:** https://github.com/Glxy97/glxy-gaming-platform

---

## ✅ Quick Start Checklist

- [ ] Repository ist auf GitHub (public)
- [ ] GitMCP URL erstellt: `https://gitmcp.io/Glxy97/glxy-gaming-platform`
- [ ] MCP Server in Cursor/Claude konfiguriert
- [ ] AI-Tool neu gestartet
- [ ] GitMCP funktioniert! 🎉

---

**Erstellt:** 29. Oktober 2025  
**Repository:** https://github.com/Glxy97/glxy-gaming-platform  
**GitMCP URL:** https://gitmcp.io/Glxy97/glxy-gaming-platform


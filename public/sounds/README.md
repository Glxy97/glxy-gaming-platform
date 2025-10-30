# 🔊 GLXY FPS Audio-Assets

Willkommen im Audio-System des GLXY FPS! Dieses Verzeichnis enthält die komplette Audio-Infrastruktur für das Spiel.

## 📁 Verzeichnisstruktur

```
sounds/
├── weapons/          # Waffensounds (60+ Sounds)
│   ├── ar/          # Assault Rifles
│   ├── sniper/      # Sniper Rifles  
│   └── pistol/      # Pistolen
├── movement/        # Bewegungssounds (30+ Sounds)
│   └── footsteps/   # Fußschritte (verschiedene Oberflächen)
├── impacts/         # Einschlagssounds (20+ Sounds)
├── explosions/      # Explosionen (5+ Sounds)
├── ui/              # UI-Sounds (15+ Sounds)
├── events/          # Spielereignisse (10+ Sounds)
└── ambient/         # Umgebungssounds (10+ Sounds)
```

## 🎵 Musik

```
music/
├── menu_theme.mp3           # Hauptmenü-Musik
├── combat_intense.mp3       # Intensive Kampfmusik
└── (weitere Tracks...)
```

## 🚀 Schnellstart

### Option 1: Web Audio API (Aktuell Aktiv)
Das Spiel nutzt derzeit **synthetische Sounds** via Web Audio API als Fallback. Keine MP3-Dateien erforderlich! ✨

### Option 2: Echte Audio-Assets Hinzufügen

1. **Download Sounds:**
   - [Freesound.org](https://freesound.org) - Kostenlose Sound-Effekte
   - [OpenGameArt.org](https://opengameart.org) - Gaming-Sounds
   - [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/) - Professionelle Sounds

2. **Dateiformat:**
   - Format: MP3 (bevorzugt) oder OGG
   - Bitrate: 128-192 kbps
   - Sample Rate: 44.1 kHz oder 48 kHz

3. **Platzierung:**
   - Lege die Dateien in die entsprechenden Ordner (siehe unten)
   - Benenne sie genau wie in der Dokumentation angegeben

4. **Automatische Aktivierung:**
   - Der AudioManager lädt MP3-Dateien automatisch
   - Fehlende Dateien werden weiterhin durch synthetische Sounds ersetzt

## 📋 Benötigte Dateien

### 🔫 Waffen (Priority: HIGH)

**Assault Rifles** (`weapons/ar/`):
- `fire_01.mp3`, `fire_02.mp3`, `fire_03.mp3` - Schussgeräusche (variiert)
- `reload.mp3` - Nachladen

**Sniper Rifles** (`weapons/sniper/`):
- `fire_01.mp3`, `fire_02.mp3` - Schussgeräusche (laut, weitreichend)
- `bolt.mp3` - Repetiergeräusch (optional)
- `reload.mp3` - Nachladen

**Pistolen** (`weapons/pistol/`):
- `fire_01.mp3`, `fire_02.mp3`, `fire_03.mp3` - Schussgeräusche
- `reload.mp3` - Nachladen

### 👟 Bewegung (Priority: MEDIUM)

**Fußschritte** (`movement/footsteps/`):
- `concrete_01.mp3` bis `concrete_04.mp3` - Beton
- `metal_01.mp3` bis `metal_03.mp3` - Metall

**Aktionen** (`movement/`):
- `jump.mp3` - Sprung
- `land_01.mp3`, `land_02.mp3` - Landung

### 💥 Einschläge (Priority: MEDIUM)

**Bullet Impacts** (`impacts/`):
- `concrete_01.mp3` bis `concrete_04.mp3` - Beton
- `metal_01.mp3` bis `metal_03.mp3` - Metall
- `body_01.mp3` bis `body_03.mp3` - Körper

### 💣 Explosionen (Priority: HIGH)

**Granaten** (`explosions/`):
- `grenade_01.mp3`, `grenade_02.mp3` - Granatenexplosion

### 🎮 UI & Events (Priority: LOW)

**UI** (`ui/`):
- `click.mp3` - Button-Click
- `notification.mp3` - Benachrichtigung

**Events** (`events/`):
- `level_up.mp3` - Level-Up
- `killstreak.mp3` - Killstreak-Notification

### 🌍 Ambient (Priority: LOW)

**Loops** (`ambient/`):
- `wind_loop.mp3` - Wind (Loop)
- `rain_loop.mp3` - Regen (Loop)

## 🎼 Musik-Tracks

**Hauptmenü** (`music/`):
- `menu_theme.mp3` - Hauptmenü-Theme (180s, Loop)

**Gameplay** (`music/`):
- `combat_intense.mp3` - Intensive Kampfmusik (240s, Loop)

## 🔧 Technische Details

### Audio-Spezifikationen
- **Lautstärke:** Normalisiert auf -3dB bis -6dB
- **Format:** MP3 (128-192 kbps) oder OGG
- **Kanäle:** Mono für 3D-Sounds, Stereo für Musik/UI
- **Sample Rate:** 44.1 kHz oder 48 kHz

### 3D Audio
- **Spatial Audio:** Automatisch für Waffen, Impacts, Footsteps
- **Distance Attenuation:** Basierend auf Spielerentfernung
- **HRTF:** Head-Related Transfer Function für realistisches 3D-Audio

### Performance
- **Pooling:** Häufig verwendete Sounds werden gepoolt
- **Preloading:** Wichtige Sounds werden beim Start geladen
- **Max Instances:** Verhindert Audio-Überlastung

## 📚 Lizenz-Hinweise

Stelle sicher, dass alle verwendeten Audio-Assets lizenzkonform sind:
- ✅ CC0 / Public Domain
- ✅ CC-BY (mit Attribution)
- ✅ Kommerziell nutzbar

## 🎯 Empfohlene Quellen

### Sound-Effekte
1. **Freesound.org** - Riesige Community-Bibliothek
2. **Zapsplat.com** - Kostenlose SFX (Registrierung erforderlich)
3. **SoundBible.com** - Einfache, kostenlose Sounds
4. **BBC Sound Effects** - Professionelle Qualität

### Musik
1. **Incompetech.com** - Kevin MacLeod's Musik (CC-BY)
2. **Purple Planet** - Kostenlose Spielemusik
3. **Bensound.com** - Moderne Tracks (CC-BY)

## 🔍 Audio-Katalog Ansehen

Vollständige Liste aller erwarteten Sounds:
```bash
# Im Code:
components/games/fps/ultimate/audio/data/audio-catalog.ts
```

## 🆘 Support

**Problem:** Sound wird nicht abgespielt
- Überprüfe Dateinamen (exakt wie dokumentiert)
- Überprüfe Dateipfade (case-sensitive)
- Browser-Konsole für Fehler checken

**Problem:** Sound zu laut/leise
- Normalisiere MP3 mit Audacity auf -3dB
- In-Game Lautstärke-Einstellungen anpassen

## 🚀 Status

- ✅ **Verzeichnisstruktur:** Erstellt
- ✅ **Fallback-System:** Web Audio API Synthese aktiv
- ⏳ **MP3-Assets:** Bereit zum Hinzufügen
- ✅ **AudioManager:** Funktionsfähig

---

**Hinweis:** Das Spiel ist **sofort spielbar** auch ohne MP3-Dateien dank dem Web Audio API Fallback-System! Echte Sounds verbessern nur die Immersion. 🎮✨


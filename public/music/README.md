# 🎵 Musik-Tracks

Dieses Verzeichnis enthält alle Musik-Tracks für GLXY FPS.

## 🎯 Benötigte Tracks

### Hauptmenü
**`menu_theme.mp3`**
- **Dauer:** ~180 Sekunden (3 Minuten)
- **BPM:** 120
- **Stimmung:** Cinematic, episch, einladend
- **Loop:** Ja (Loop Points: 10s - 170s)

### Gameplay - Intense
**`combat_intense.mp3`**
- **Dauer:** ~240 Sekunden (4 Minuten)
- **BPM:** 140
- **Stimmung:** Energetisch, spannend, action-geladen
- **Loop:** Ja (Loop Points: 8s - 232s)

## 🔊 Audio-Spezifikationen

### Format
- **Dateiformat:** MP3, 192 kbps (höhere Qualität für Musik)
- **Kanäle:** Stereo
- **Sample Rate:** 44.1 kHz oder 48 kHz

### Mixing
- **Lautstärke:** Normalisiert auf -6dB
- **Master:** Leichte Kompression, kein Limiting
- **Frequenzen:** Ausgeglichener Mix (nicht bass-lastig)

## 🎨 Musik-Charakteristiken

### Menu Theme
- **Genre:** Cinematic, Electronic, Ambient
- **Instrumente:** Synths, Orchestral Elements, Pads
- **Struktur:** 
  - Intro (0-10s)
  - Main Loop (10-170s)
  - Outro (170-180s)
- **Referenzen:** Cyberpunk, Deus Ex, Battlefield Menüs

### Combat Intense
- **Genre:** Electronic, Drum & Bass, Industrial
- **Instrumente:** Heavy Drums, Bass, Synths, FX
- **Struktur:**
  - Intro (0-8s)
  - Main Loop (8-232s)
  - Outro (232-240s)
- **Referenzen:** DOOM, Hotline Miami, Tron Legacy

## 🎼 Layering System (Optional)

Das System unterstützt mehrschichtige Musik:

### Combat Intense - Layers
**Drums Layer** (`combat_intense_drums.mp3`):
- Aktiviert bei aktivem Kampf
- Nur Schlagzeug/Percussion

**Strings Layer** (`combat_intense_strings.mp3`):
- Aktiviert bei niedriger Gesundheit
- Spannungsaufbau

## 🔍 Empfohlene Quellen

### Kostenlose Musik
1. **Incompetech.com** - Kevin MacLeod
   - Genre: "Action", "Dark", "Electronic"
   - Lizenz: CC-BY

2. **Purple Planet Music**
   - Genre: "Action", "Sci-Fi"
   - Lizenz: CC-BY-NC

3. **Bensound.com**
   - Genre: "Cinematic", "Electronic"
   - Lizenz: CC-BY (kostenlos mit Attribution)

### Suchbegriffe
- "cinematic menu music"
- "action game music"
- "electronic combat music"
- "fps soundtrack"
- "cyberpunk music loop"

## 🎮 Im Spiel

**Features:**
- ✅ Seamless Looping
- ✅ Crossfading zwischen Tracks
- ✅ Fade In/Out
- ✅ Dynamische Layer (bei vorhandenen Layer-Dateien)
- ✅ Lautstärkeregelung

**Playback:**
- Menu Theme: Hauptmenü, Loadout, Einstellungen
- Combat Intense: Aktives Gameplay, Deathmatch

## 📋 Loop Points

**Wichtig:** Musik sollte nahtlos loopen!

### Tipps für perfekte Loops:
1. Nutze Audacity oder Adobe Audition
2. Finde natürliche Loop-Punkte (Beat-Ende)
3. Crossfade am Loop-Punkt (10ms)
4. Teste den Loop mehrfach

### Loop Points im Code
Die exakten Loop-Punkte werden im Audio-Katalog definiert:
```typescript
loopPoints: {
  start: 10,  // Sekunden
  end: 170    // Sekunden
}
```

## 📥 Qualitäts-Checkliste

- [ ] 192 kbps MP3 oder höher
- [ ] Stereo Mix
- [ ] Normalisiert auf -6dB
- [ ] Nahtloser Loop (ohne Klicks)
- [ ] Passende BPM für Gameplay
- [ ] Keine Copyright-Probleme

## 🎹 Selbst Erstellen

**DAW-Empfehlungen:**
- FL Studio
- Ableton Live
- Reaper (kostenlos)
- LMMS (kostenlos, Open Source)

**VST/Plugins:**
- Synth1 (kostenlos)
- TAL-U-NO-LX (kostenlos)
- Kontakt (Samples)

---

**Status:** Bereit für Assets | Aktuell: Kein Musik-System aktiv (optional) 🎵


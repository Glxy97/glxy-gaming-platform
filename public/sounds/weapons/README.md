# 🔫 Waffensounds

Dieses Verzeichnis enthält alle Waffensound-Effekte für GLXY FPS.

## 📁 Struktur

```
weapons/
├── ar/              # Assault Rifles (Sturmgewehre)
├── sniper/          # Sniper Rifles (Scharfschützengewehre)
└── pistol/          # Pistolen
```

## 🎯 Benötigte Dateien

### Assault Rifles (`ar/`)
- `fire_01.mp3` - AR Schuss Variation 1 (0.5-1s)
- `fire_02.mp3` - AR Schuss Variation 2 (0.5-1s)
- `fire_03.mp3` - AR Schuss Variation 3 (0.5-1s)
- `reload.mp3` - AR Nachladen (2-3s)

### Sniper Rifles (`sniper/`)
- `fire_01.mp3` - Sniper Schuss Variation 1 (1-2s, laut!)
- `fire_02.mp3` - Sniper Schuss Variation 2 (1-2s, laut!)

### Pistolen (`pistol/`)
- `fire_01.mp3` - Pistolen Schuss Variation 1 (0.3-0.5s)
- `fire_02.mp3` - Pistolen Schuss Variation 2 (0.3-0.5s)
- `fire_03.mp3` - Pistolen Schuss Variation 3 (0.3-0.5s)

## 🔊 Audio-Spezifikationen

### Allgemein
- **Format:** MP3, 128-192 kbps
- **Kanäle:** Mono (für 3D Audio)
- **Sample Rate:** 44.1 kHz

### Lautstärke
- **AR:** -6dB bis -3dB (mittel-laut)
- **Sniper:** -3dB bis 0dB (sehr laut, weitreichend)
- **Pistole:** -9dB bis -6dB (leiser als AR)

### Länge
- **Fire Sounds:** 0.3s - 2s (mit Nachhall)
- **Reload Sounds:** 1.5s - 3s

## 🎨 Sound-Charakteristiken

### Assault Rifles
- **Klangprofil:** Kräftig, mechanisch, mittlere Tonlage
- **Charakteristik:** Schnelles Feuer, metallisches Echo
- **Referenz:** M4A1, AK-47, SCAR

### Sniper Rifles
- **Klangprofil:** Sehr laut, tiefes Echo, langes Sustain
- **Charakteristik:** Einzelschuss, kraftvoller Bass, langer Nachhall
- **Referenz:** AWP, Barrett M82, Dragunov

### Pistolen
- **Klangprofil:** Scharf, kurz, höhere Tonlage
- **Charakteristik:** Schnappender Sound, kurzes Echo
- **Referenz:** Desert Eagle, Glock, Beretta

## 🔍 Empfohlene Suchbegriffe

Bei der Suche auf Freesound.org verwende:
- "rifle shot", "gun fire", "assault rifle"
- "sniper shot", "heavy rifle", "barrett"
- "pistol shot", "handgun fire", "9mm"
- "gun reload", "rifle reload", "magazine"

## 📥 Qualitäts-Checksliste

- [ ] Keine Clipping/Verzerrungen
- [ ] Saubere Aufnahme (kein Rauschen)
- [ ] Angemessene Lautstärke
- [ ] Passende Länge
- [ ] Mono für 3D-Sounds
- [ ] MP3-Format, 128+ kbps

## 🎮 Im Spiel

**3D Audio:** ✅ Aktiviert
- Sounds werden basierend auf Spielerposition positioniert
- Automatische Lautstärke-Anpassung bei Entfernung
- Doppler-Effekt bei Bewegung

**Variationen:** Mehrere Fire-Sounds werden zufällig abgespielt für mehr Realismus.

---

**Status:** Bereit für Assets | Fallback: Web Audio API Synthese ✅


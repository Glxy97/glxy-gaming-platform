# 👟 Bewegungssounds

Dieses Verzeichnis enthält alle Bewegungs- und Aktionssounds.

## 📁 Struktur

```
movement/
├── footsteps/       # Fußschritte (verschiedene Oberflächen)
├── jump.mp3         # Sprung
├── land_01.mp3      # Landung Variation 1
└── land_02.mp3      # Landung Variation 2
```

## 🎯 Benötigte Dateien

### Fußschritte (`footsteps/`)

**Beton:**
- `concrete_01.mp3` - Fußschritt Beton 1
- `concrete_02.mp3` - Fußschritt Beton 2
- `concrete_03.mp3` - Fußschritt Beton 3
- `concrete_04.mp3` - Fußschritt Beton 4

**Metall:**
- `metal_01.mp3` - Fußschritt Metall 1
- `metal_02.mp3` - Fußschritt Metall 2
- `metal_03.mp3` - Fußschritt Metall 3

### Aktionen (Hauptverzeichnis)
- `jump.mp3` - Sprunggeräusch
- `land_01.mp3` - Landungsgeräusch Variation 1
- `land_02.mp3` - Landungsgeräusch Variation 2

## 🔊 Audio-Spezifikationen

### Fußschritte
- **Dauer:** 0.2s - 0.4s
- **Lautstärke:** -12dB bis -9dB (leise)
- **Format:** MP3 Mono, 128 kbps

### Jump/Land
- **Dauer:** 0.3s - 0.6s
- **Lautstärke:** -9dB bis -6dB (mittel)
- **Format:** MP3 Mono, 128 kbps

## 🎨 Sound-Charakteristiken

### Beton-Fußschritte
- **Klang:** Dumpf, matt, leicht hallend
- **Stiefel/Schuhe:** Militärstiefel bevorzugt
- **Tempo:** Normal bis schnell

### Metall-Fußschritte
- **Klang:** Hell, resonant, metallisch
- **Umgebung:** Treppen, Gitter, Container
- **Echo:** Deutlicher Hall

### Sprung
- **Klang:** Kurzer Aufsprung-Sound
- **Charakteristik:** Anstrengung + Absprung

### Landung
- **Klang:** Dumpfer Aufprall
- **Gewicht:** Schwer (Soldat mit Ausrüstung)
- **Variationen:** Unterschiedliche Fallhöhen

## 🔍 Empfohlene Suchbegriffe

Bei der Suche verwende:
- "footstep concrete", "boot step", "walk concrete"
- "metal footstep", "catwalk", "grating walk"
- "jump grunt", "landing thud"
- "boot land", "heavy landing"

## 🎮 Im Spiel

**Dynamisches System:**
- ✅ Oberflächenerkennung (Beton/Metall)
- ✅ Geschwindigkeitsabhängig (Gehen/Rennen)
- ✅ 3D Positionierung
- ✅ Zufällige Variationen

**Footstep Manager:** Automatische Auswahl basierend auf:
- Spielergeschwindigkeit
- Bodentyp unter dem Spieler
- Bewegungsmodus (Normal, Sprint, Schleichen)

---

**Status:** Bereit für Assets | Fallback: Web Audio API Synthese ✅


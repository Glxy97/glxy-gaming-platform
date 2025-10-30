# 🔊 GLXY FPS - Audio System Dokumentation

## 📋 Übersicht

Das GLXY FPS Audio-System ist eine professionelle Audio-Engine mit **3D Spatial Audio**, **Sound Pooling** und einem **intelligenten Fallback-System**.

## ✨ Hauptfeatures

### 🎯 Kernfunktionen
- ✅ **Web Audio API** - Moderne Browser-Audio-Engine
- ✅ **3D Spatial Audio (HRTF)** - Realistische Positionierung
- ✅ **Sound Pooling** - Performance-Optimierung
- ✅ **Intelligentes Fallback** - Synthetische Sounds wenn MP3s fehlen
- ✅ **Multi-Channel Mixer** - Separate Lautstärke für SFX/Music/UI
- ✅ **Dynamic Music System** - Nahtlose Loops & Layers

### 🔧 Technische Features
- **Distance Attenuation** - Automatische Lautstärke nach Entfernung
- **Doppler Effect** - Tonhöhe bei Bewegung
- **Audio Occlusion** - Gedämpfter Sound durch Wände
- **Variation System** - Zufällige Tonhöhe/Lautstärke
- **Event System** - Callbacks für Audio-Events

## 🚀 Aktuelle Konfiguration

### ✅ Voll Funktionsfähig OHNE MP3-Dateien

Das System nutzt **Web Audio API** zur Generierung synthetischer Sounds:
- Waffenschüsse (Pistole, AR, Sniper)
- Explosionen
- Einschläge
- UI-Sounds
- Hit-Sounds

**Vorteil:** Null Asset-Größe, sofort spielbar!

**Nachteil:** Weniger immersiv als echte Sounds.

## 📁 Dateistruktur

```
public/
├── sounds/                 # Sound Effects (bereit für Assets)
│   ├── weapons/           # Waffensounds
│   │   ├── ar/           # Assault Rifles
│   │   ├── sniper/       # Sniper Rifles
│   │   └── pistol/       # Pistolen
│   ├── movement/         # Bewegung & Footsteps
│   ├── impacts/          # Einschläge
│   ├── explosions/       # Explosionen
│   ├── ui/               # UI-Sounds
│   ├── events/           # Game Events
│   └── ambient/          # Ambient Loops
└── music/                # Musik-Tracks (optional)
    ├── menu_theme.mp3
    └── combat_intense.mp3
```

## 🎮 Verwendung im Spiel

### AudioManager Initialisierung

```typescript
import { AudioManager } from './audio/AudioManager'

// Erstellen
const audioManager = new AudioManager({
  masterVolume: 1.0,
  sfxVolume: 0.8,
  musicVolume: 0.6
})

// Laden (optional - verwendet Fallback wenn fehlend)
await audioManager.loadAllSounds((progress) => {
  console.log(`Loading: ${progress * 100}%`)
})

// AudioContext aktivieren (Browser benötigt User-Interaktion)
await audioManager.resume()
```

### Sound Abspielen

```typescript
// Einfacher Sound
audioManager.playSound('pistol_fire')

// Mit Position (3D Audio)
audioManager.playSound('ar_fire', { x: 10, y: 0, z: 20 })

// Mit Lautstärke & Tonhöhe
audioManager.playSound('explosion_grenade', position, 1.5, 0.9)
```

### Musik Abspielen

```typescript
// Musik starten (optional)
await audioManager.playMusic('music_intense', true)

// Musik stoppen
await audioManager.stopMusic(true)
```

### 3D Audio Update

```typescript
// Update Listener (Camera/Player) Position
audioManager.updateListener(
  playerPosition,    // Position
  cameraForward,     // Blickrichtung
  cameraUp,          // Oben-Vektor
  playerVelocity     // Geschwindigkeit (für Doppler)
)

// Update Sound Position (für bewegte Sounds)
const soundId = audioManager.playSound('enemy_footstep', enemyPos)
audioManager.updateSoundPosition(soundId, newEnemyPos, enemyVelocity)
```

### Lautstärke-Kontrolle

```typescript
// Master Volume
audioManager.setMasterVolume(0.8)

// Kategorie Volume
audioManager.setCategoryVolume(AudioCategory.SFX, 0.7)
audioManager.setCategoryVolume(AudioCategory.MUSIC, 0.5)

// Mute
audioManager.setMuted(true)
```

## 🎵 Audio-Katalog

Alle verfügbaren Sounds sind im Audio-Katalog definiert:

**Pfad:** `components/games/fps/ultimate/audio/data/audio-catalog.ts`

### Verfügbare Sound-IDs

**Waffen:**
- `ar_fire` - Assault Rifle Schuss
- `ar_reload` - AR Nachladen
- `sniper_fire` - Sniper Schuss
- `pistol_fire` - Pistolen Schuss

**Bewegung:**
- `footstep_concrete` - Fußschritt Beton
- `footstep_metal` - Fußschritt Metall
- `jump` - Sprung
- `land` - Landung

**Einschläge:**
- `impact_concrete` - Beton-Einschlag
- `impact_metal` - Metall-Einschlag
- `impact_body` - Körper-Einschlag

**Explosionen:**
- `explosion_grenade` - Granaten-Explosion

**UI:**
- `ui_click` - Button Click
- `ui_notification` - Benachrichtigung

**Events:**
- `level_up` - Level-Up Sound
- `killstreak` - Killstreak Notification

**Ambient:**
- `ambient_wind` - Wind (Loop)
- `ambient_rain` - Regen (Loop)

## 🔧 Konfiguration

### Audio-Kategorien

```typescript
enum AudioCategory {
  WEAPONS = 'weapons',
  FOOTSTEPS = 'footsteps',
  IMPACTS = 'impacts',
  EXPLOSIONS = 'explosions',
  SFX = 'sfx',
  UI = 'ui',
  AMBIENT = 'ambient',
  MUSIC = 'music',
  VOICE = 'voice'
}
```

### Spatial Audio Config

```typescript
interface SpatialAudioConfig {
  panningModel: 'HRTF' | 'equalpower'
  distanceModel: 'linear' | 'inverse' | 'exponential'
  refDistance: number       // Referenz-Distanz
  maxDistance: number       // Maximale Hörweite
  rolloffFactor: number     // Abfall-Faktor
  coneInnerAngle: number    // Innerer Kegel
  coneOuterAngle: number    // Äußerer Kegel
  coneOuterGain: number     // Lautstärke außerhalb
}
```

### Beispiel-Configs

```typescript
// Waffen (weitreichend)
{
  panningModel: 'HRTF',
  distanceModel: 'inverse',
  refDistance: 5,
  maxDistance: 150,
  rolloffFactor: 1.0
}

// Fußschritte (kurze Reichweite)
{
  panningModel: 'HRTF',
  distanceModel: 'inverse',
  refDistance: 2,
  maxDistance: 30,
  rolloffFactor: 1.5
}

// Explosionen (sehr weitreichend)
{
  panningModel: 'HRTF',
  distanceModel: 'inverse',
  refDistance: 10,
  maxDistance: 250,
  rolloffFactor: 1.2
}
```

## 📊 Performance

### Sound Pooling

Häufig verwendete Sounds werden vorgeladen und gepoolt:

```typescript
const AR_FIRE: AudioClipData = {
  // ...
  maxInstances: 10,    // Max gleichzeitige Instanzen
  preload: true,       // Beim Start laden
  poolSize: 5          // Pool-Größe
}
```

**Vorteile:**
- Schnellere Wiedergabe (keine Latenz)
- Weniger GC-Druck
- Bessere Performance bei vielen Sounds

### Stats Monitoring

```typescript
const stats = audioManager.getStats()
console.log(stats)
// {
//   soundsPlayed: 1234,
//   activeSounds: 12,
//   poolHits: 890,
//   poolMisses: 100,
//   poolEfficiency: 0.899
// }
```

## 🎨 Fallback-System (SoundGenerator)

Wenn MP3-Dateien fehlen, generiert `SoundGenerator` synthetische Sounds:

**Pfad:** `components/games/fps/ultimate/audio/SoundGenerator.ts`

### Unterstützte Sound-Typen

- **Pistole:** Kurzer Knall (200Hz)
- **Assault Rifle:** Tieferer Knall (180Hz)
- **Sniper:** Sehr tiefer Knall (150Hz) + langer Hall
- **Explosion:** Multi-Frequenz Explosion mit Sub-Bass
- **Impact:** Kurzer Noise-Burst
- **UI:** Sauberer Sinus-Ton

### Manueller Aufruf

```typescript
import { SoundGenerator } from './audio/SoundGenerator'

const generator = new SoundGenerator()

// Pistolen-Sound generieren
generator.playSound('pistol_fire', 1.0)

// Eigene Frequenz
generator.generateTone(440, 0.5, 0.2) // A4 Note
```

## 🐛 Debugging

### Console Output

**Normal (mit MP3s):**
```
✅ Loaded sound: AR Fire
✅ Loaded sound: Sniper Fire
🎵 Playing music: Combat Intense
```

**Fallback (ohne MP3s):**
```
🔊 Using fallback for: ar_fire
🔊 Using Web Audio fallback for: pistol_fire
🎵 Music not available: music_intense (optional)
```

**Keine Fehler-Spam mehr!** ✨

### Event Monitoring

```typescript
audioManager.on(AudioEventType.SOUND_PLAYED, (event) => {
  console.log('Sound played:', event.data)
})

audioManager.on(AudioEventType.VOLUME_CHANGED, (event) => {
  console.log('Volume changed:', event.data)
})
```

## 📥 MP3-Assets Hinzufügen

### Schritt-für-Schritt

1. **Download Sounds:**
   - [Freesound.org](https://freesound.org)
   - [OpenGameArt.org](https://opengameart.org)
   - [Zapsplat.com](https://zapsplat.com)

2. **Konvertierung:**
   ```bash
   # Mit ffmpeg zu MP3 konvertieren
   ffmpeg -i input.wav -b:a 128k -ar 44100 output.mp3
   ```

3. **Normalisierung:**
   ```bash
   # Lautstärke normalisieren (Audacity oder ffmpeg)
   ffmpeg -i input.mp3 -af "loudnorm=I=-16:TP=-1.5:LRA=11" output.mp3
   ```

4. **Platzierung:**
   - Kopiere MP3 nach `public/sounds/[kategorie]/`
   - Benenne exakt wie in `audio-catalog.ts`

5. **Restart:**
   - Browser neu laden
   - AudioManager lädt MP3 automatisch

## 🔐 Lizenz-Compliance

**Wichtig:** Alle Audio-Assets müssen lizenzkonform sein!

### Empfohlene Lizenzen
- ✅ CC0 (Public Domain)
- ✅ CC-BY (mit Attribution)
- ✅ CC-BY-SA (Share Alike)

### Zu Vermeiden
- ❌ "All Rights Reserved"
- ❌ Urheberrechtlich geschützte Sounds
- ❌ Nicht-kommerzielle Lizenzen (wenn kommerziell genutzt)

### Attribution

Falls CC-BY verwendet:
```
Sounds:
- "Gun Shot" by UserXYZ (CC-BY 3.0)
  https://freesound.org/people/UserXYZ/sounds/12345/
```

## 🎓 Best Practices

### 1. Sound Design
- **Variation:** Nutze 2-3 Variationen pro Sound
- **Layering:** Kombiniere mehrere Samples
- **Ducking:** Reduziere Musik bei wichtigen SFX

### 2. Performance
- **Preload wichtige Sounds** beim Spielstart
- **Lazy-Load** Musik & Ambient
- **Pool häufige Sounds** (Waffen, Footsteps)

### 3. 3D Audio
- **Mono für 3D-Sounds** (Stereo verwirrt HRTF)
- **Stereo für Musik/UI** (keine Positionierung)
- **Listener-Updates** jedes Frame

### 4. Balancing
- **Waffen:** Laut aber nicht überwältigend
- **Footsteps:** Leise, im Hintergrund
- **UI:** Mittel, klar hörbar
- **Musik:** Leiser als SFX (60-70%)

## 🔮 Zukünftige Features

### Geplant
- [ ] Dynamic Reverb (Raum-basiert)
- [ ] Audio Occlusion (Wand-Dämpfung)
- [ ] Voice Chat Integration
- [ ] Audio Compression (Asset-Größe)
- [ ] Real-time Audio Mixing

### In Entwicklung
- [ ] HRTF Profile Customization
- [ ] Audio Visualization
- [ ] Surround Sound Support

## 📞 Support

**Probleme mit Audio?**
1. Check Browser-Konsole
2. Prüfe `audioManager.getStats()`
3. Teste mit `audioManager.resume()`

**Sound fehlt komplett?**
- AudioContext suspended → User-Interaktion benötigt
- Prüfe Browser-Kompatibilität (Web Audio API)

## 🎯 Status

✅ **Audio-System:** Voll funktionsfähig  
✅ **Fallback-System:** Aktiv  
✅ **3D Audio:** Implementiert  
⏳ **MP3-Assets:** Optional (Ready to add)  
✅ **Dokumentation:** Vollständig  

---

**Erstellt:** 2025-01-30  
**Version:** 1.0  
**Letzte Änderung:** Intelligente Fehlerbehandlung + Fallback-System


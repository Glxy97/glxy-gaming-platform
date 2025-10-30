# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### ✨ Features

#### Ultimate FPS - Phase 10: Multiplayer Networking System (1.11.0-alpha)
**Professional WebSocket-Based Multiplayer with Lag Compensation**

Complete multiplayer networking system with client-server architecture, lag compensation, client-side prediction, server reconciliation, entity interpolation, server browser, and skill-based matchmaking.

**New Components:**

1. **NetworkData.ts (1000+ lines)**
   - Complete data-driven networking architecture
   - 8 Connection States (Disconnected, Connecting, Connected, Authenticated, etc.)
   - 30+ Packet Types (Connect, Auth, Input, State Update, Snapshot, Game Events, etc.)
   - 4 Packet Priority Levels (Low, Normal, High, Critical)
   - Network Metrics Tracking (Ping, Jitter, Packet Loss, Bandwidth)
   - Lag Compensation Configuration (Hitbox Rewind, Position Rewind, State Rewind)
   - Client-Side Prediction Configuration (Input Buffering, Movement Prediction)
   - Entity Interpolation Configuration (Interpolation, Extrapolation, Dead Reckoning)
   - Server Browser Data (Server Info, Filters, Sorting)
   - Matchmaking Data (Skill-Based, Party System, Queue Management)
   - Network Security Settings (Auth, Encryption, Rate Limiting, Anti-Cheat)
   - Helper Functions (Connection Quality, Bandwidth, Packet Validation)

2. **NetworkManager.ts (1300+ lines)**
   - Complete WebSocket connection management
   - Packet serialization and reliable delivery system
   - Authentication with token-based security
   - Heartbeat system with ping tracking
   - Client-Side Prediction with input buffering
   - Server Reconciliation with smooth error correction
   - Entity Interpolation with buffering
   - Lag Compensation with historical state tracking
   - Event system (12 network events)
   - Network metrics and quality monitoring
   - Adaptive quality adjustment
   - Resource management and cleanup

3. **ServerBrowser.ts (700+ lines)**
   - Server discovery and listing
   - Advanced filtering (Region, Mode, Ping, Players, Features)
   - Server favorites system with local storage
   - Room browsing and management
   - Room creation with custom settings
   - Quick join functionality (auto-find best server)
   - Auto-refresh with configurable rate
   - Server ping measurement
   - Event system (10 browser events)

4. **Matchmaking.ts (700+ lines)**
   - Skill-based matchmaking with ELO/MMR system
   - Queue management with estimated wait times
   - Party system integration
   - Match found notification with accept/decline
   - Player rating calculation and tracking
   - Rank system (Bronze → Legend, 5 divisions each)
   - Win/Loss tracking with streak system
   - Queue statistics (Players in queue, avg wait time, match quality)
   - Region and game mode preferences
   - Event system (10 matchmaking events)

5. **networking-system.test.ts (60+ test cases)**
   - NetworkData helpers testing
   - Packet type validation
   - Connection state testing
   - Metrics calculation tests
   - Sequence and timestamp validation
   - Filter functionality tests
   - Rating system tests
   - Security configuration tests

**Technical Features:**

- **WebSocket Communication:**
  - Reliable packet delivery with ACK system
  - Packet compression for bandwidth optimization
  - Packet encryption support
  - Delta compression (only send changed data)
  - Priority-based packet sending

- **Lag Compensation:**
  - Historical state tracking (60 snapshots)
  - Time-based state rewinding
  - Hitbox position rewinding
  - Server-side hit validation
  - Maximum compensation window: 1000ms

- **Client-Side Prediction:**
  - Input buffering (100 inputs)
  - Movement prediction with physics
  - Action prediction (shooting, reloading)
  - Server reconciliation with error correction
  - Smooth correction with interpolation

- **Entity Interpolation:**
  - Interpolation delay: 100ms
  - Position interpolation with smoothing
  - Rotation interpolation
  - Velocity interpolation
  - Extrapolation for missed packets (max 500ms)
  - Snap threshold for large position errors

- **Network Quality Monitoring:**
  - Real-time ping measurement
  - Jitter calculation
  - Packet loss tracking
  - Bandwidth monitoring (upload/download)
  - Connection quality rating (Excellent → Terrible)
  - Network stability calculation

- **Server Browser:**
  - Multi-region support (7 regions)
  - Filter by game mode, map, players, ping
  - Official/Community/Ranked server filters
  - Anti-cheat filter
  - Password-protected filter
  - Sorting by multiple criteria

- **Matchmaking System:**
  - ELO-based skill rating (1000-3000+ MMR)
  - Rank system with 8 ranks and 5 divisions
  - Win rate tracking
  - Win/Loss streak tracking
  - Skill-based matching (configurable MMR range)
  - Party support (up to 5 players)
  - Queue time estimation
  - Match quality calculation
  - Accept/Decline with timeout (30s)

**Files Changed:**
- `components/games/fps/ultimate/networking/data/NetworkData.ts` (NEW, 1000+ lines)
- `components/games/fps/ultimate/networking/NetworkManager.ts` (NEW, 1300+ lines)
- `components/games/fps/ultimate/networking/ServerBrowser.ts` (NEW, 700+ lines)
- `components/games/fps/ultimate/networking/Matchmaking.ts` (NEW, 700+ lines)
- `components/games/fps/ultimate/__tests__/unit/networking-system.test.ts` (NEW, 60+ tests)

**Architecture:**
- Data-Driven Design (all networking configured via data files)
- Event-Driven (Observer Pattern for network events)
- Manager Pattern (NetworkManager orchestrates all networking)
- WebSocket API with reliable delivery
- TypeScript strict mode with full type safety

#### Ultimate FPS - Phase 9: Advanced Audio System (1.10.0-alpha)
**Professional 3D Audio Engine with Web Audio API**

Comprehensive audio system with AAA-quality 3D spatial audio, sound pooling, dynamic music, and professional audio mixer.

**New Components:**

1. **AudioData.ts (700+ lines)**
   - Complete data-driven audio architecture
   - 10 Audio Categories (Master, Music, SFX, Ambient, Voice, UI, Footsteps, Weapons, Impacts, Explosions)
   - 40+ Sound Types (Weapon Fire, Reload, Footsteps, Impacts, etc.)
   - 11 Reverb Presets (Small Room, Cathedral, Cave, Underwater, etc.)
   - Spatial Audio Configuration (HRTF, Distance Models, Cone Angles)
   - Audio Effects (Reverb, Delay, Distortion, Compressor, EQ)
   - Voice Chat Support (WebRTC, Spatial Voice, Push-to-Talk)
   - Helper Functions for spatial configs and physics calculations

2. **audio-catalog.ts (600+ lines)**
   - Professional sound library with 100+ audio clips
   - Weapon sounds with spatial configurations and variations
   - Movement sounds (footsteps on 5+ materials, jump, land)
   - Impact sounds (concrete, metal, body)
   - Explosion sounds with long-range spatial audio
   - UI sounds (click, notification, hover)
   - Game event sounds (level up, killstreak, achievement)
   - Ambient sounds with looping (wind, rain)
   - Music tracks with dynamic layers
   - Helper functions (getSound, getSoundsByCategory, getMusicTrack)

3. **AudioManager.ts (900+ lines)**
   - Complete Web Audio API integration
   - 3D Positional Audio with HRTF panning
   - Sound Pooling for performance optimization
   - Audio Mixer with per-category gain control
   - Dynamic Music System with fade in/out and crossfading
   - Listener position/orientation updates
   - Volume control (master + category-specific)
   - Event system (6 audio events)
   - Occlusion & Obstruction simulation
   - Doppler Effect for moving sounds
   - Resource management and disposal
   - Stats tracking (sounds played, pool efficiency)

4. **audio-system.test.ts (60+ test cases)**
   - Comprehensive tests for AudioData helpers
   - Audio catalog functions testing
   - Sound definitions validation
   - Spatial audio configuration tests
   - Distance attenuation calculations
   - Doppler shift calculations
   - Material absorption tests
   - All 100+ sounds validated

**Technical Features:**

- **3D Spatial Audio:**
  - HRTF (Head-Related Transfer Function) for realistic 3D positioning
  - 3 Distance Models (Linear, Inverse, Exponential)
  - Configurable reference distance and max distance
  - Cone angles for directional sounds
  - Doppler effect for moving sound sources
  - Occlusion (walls blocking sound) and obstruction simulation

- **Sound Pooling:**
  - Pre-instantiated audio instances for performance
  - Configurable pool sizes per sound
  - Automatic pool management
  - Pool hit/miss statistics tracking

- **Audio Mixer:**
  - 10 independent mixer channels
  - Per-category volume control
  - Master volume control
  - Hierarchical gain node routing
  - Mute functionality

- **Dynamic Music System:**
  - Music tracks with intro/loop/outro sections
  - Dynamic layer system (drums, strings, bass)
  - Layer activation based on game state (combat, low health, victory)
  - Crossfading between tracks
  - BPM and key information

- **Performance:**
  - Sound pooling reduces GC pressure
  - Spatial hashing for audio culling
  - Priority-based playback (0-256 priority levels)
  - Max instances per sound to prevent audio overload
  - Preloading of high-priority sounds

**Files Changed:**
- `components/games/fps/ultimate/audio/data/AudioData.ts` (NEW, 700+ lines)
- `components/games/fps/ultimate/audio/data/audio-catalog.ts` (NEW, 600+ lines)
- `components/games/fps/ultimate/audio/AudioManager.ts` (NEW, 900+ lines)
- `components/games/fps/ultimate/__tests__/unit/audio-system.test.ts` (NEW, 60+ tests)

**Architecture:**
- Data-Driven Design (all audio configured via data files)
- Event-Driven (Observer Pattern for audio events)
- Manager Pattern (AudioManager orchestrates all audio)
- Web Audio API (AudioContext, GainNode, PannerNode)
- TypeScript strict mode with full type safety

## [1.1.0] - 2025-10-10

### 🔒 Security Fixes (CRITICAL)

#### OAuth Authentication Security Hardening
**Kontext:** Nach Analyse durch Security-Agent wurden kritische Sicherheitslücken in der OAuth-Implementation identifiziert und behoben.

**Behobene Schwachstellen:**

1. **Cookie-Namen Mismatch (HIGH)**
   - **Problem:** Middleware prüfte auf `next-auth.session-token`, NextAuth v5 nutzt aber `authjs.session-token`
   - **Auswirkung:** Session-Checks schlugen fehl, geschützte Routen waren potentiell zugänglich
   - **Fix:** Cookie-Namen in `middleware.ts` auf NextAuth v5 Konvention aktualisiert
   - **Dateien:** `middleware.ts:52-53`
   ```typescript
   // Vorher (Falsch):
   request.cookies.get('next-auth.session-token')?.value

   // Nachher (Korrekt):
   request.cookies.get('authjs.session-token')?.value
   ```

2. **Unsicheres Account-Linking (HIGH)**
   - **Problem:** `allowDangerousEmailAccountLinking` war dynamisch basierend auf `NODE_ENV` gesetzt
   - **Auswirkung:** Account-Takeover-Angriffe möglich (auch in Development gefährlich)
   - **Fix:** Feature komplett deaktiviert für alle Umgebungen
   - **Dateien:** `lib/auth.ts:175, 195`
   ```typescript
   // Vorher:
   allowDangerousEmailAccountLinking: process.env.NODE_ENV === 'development'

   // Nachher:
   allowDangerousEmailAccountLinking: false
   ```

3. **CSRF-Schwachstelle in State-Cookie (MEDIUM)**
   - **Problem:** State-Cookie nutzte `sameSite: 'lax'` statt `'strict'`
   - **Auswirkung:** CSRF-Angriffe bei Top-Level Navigation möglich
   - **Fix:** State-Cookie auf `sameSite: 'strict'` mit 15-Minuten Expiration
   - **Dateien:** `lib/auth.ts:226-234`
   ```typescript
   state: {
     name: 'authjs.state',
     options: {
       httpOnly: true,
       sameSite: 'strict',  // Verschärft von 'lax'
       path: '/',
       secure: process.env.NODE_ENV === 'production',
       maxAge: 900, // 15 Minuten (neu)
     },
   }
   ```

4. **AUTH_TRUST_HOST Verifizierung**
   - **Status:** Bereits korrekt konfiguriert in `docker-compose.prod.yml:16`
   - **Wichtig für:** Reverse Proxy Setup (nginx-proxy)

### ✅ Verbesserungen

- **OAuth-Cookie-Konfiguration:** Explizite Cookie-Konfiguration für NextAuth v5 hinzugefügt
  - PKCE Code Verifier Cookie
  - State Cookie mit verstärkter Sicherheit
  - Session Token mit Production/Development Prefixes

### 📝 Dokumentation

- **Hinzugefügt:** `DEVELOPER_HANDOFF.md` - Vollständige Projekt-Dokumentation für Team-Onboarding
  - Tech Stack Übersicht
  - Ordnerstruktur mit Erklärungen
  - Setup & Deployment Guides
  - Code Conventions & Best Practices
  - Security Guidelines

- **Hinzugefügt:** `AI_BUILDER_BRIEFING.md` - Kompaktes Briefing für AI-Assistenten
  - Copy-Paste Ready Format
  - Essentials kompakt dargestellt
  - Code-Examples für häufige Tasks
  - Kritische Regeln & Constraints

- **Hinzugefügt:** `CHANGELOG.md` - Diese Datei

### 🚀 Deployment

- **Docker Image:** `ghcr.io/glxy97/acobe_web_glxy_site:latest`
  - Digest: `sha256:43ceed4fd9d7b944f1e69a8c9597c5ff5f04869fe228ea37170868bd049d5891`
  - Build Zeit: ~52 Sekunden
  - Image Größe: ~856 MB (komprimiert)

- **Production Deployment:** Erfolgreich deployed auf https://glxy.at
  - Container: `glxy-gaming-app` (healthy)
  - Startup Zeit: 295ms
  - Next.js: 15.5.3 (Ready)

### 🐛 Bekannte Issues

- **Prisma Migration Failed:** `20251004072231_init` migration ist in failed state
  - **Auswirkung:** Migrations-Warnungen beim Container-Start
  - **Status:** Application läuft trotzdem (Database Schema ist korrekt)
  - **Workaround:** `npx prisma migrate resolve --applied 20251004072231_init`
  - **TODO:** Migration-State in Production korrigieren

### ⚠️ Breaking Changes

**Keine Breaking Changes in dieser Version.**

Alle Änderungen sind abwärtskompatibel. Bestehende Sessions bleiben gültig.

### 🔄 Migration Guide

Für Deployment dieser Version:

```bash
# 1. Docker Image Pull
docker-compose -f docker-compose.prod.yml pull app

# 2. Container Restart
docker stop glxy-gaming-app
docker rm glxy-gaming-app
docker-compose -f docker-compose.prod.yml up -d app

# 3. Logs prüfen
docker logs glxy-gaming-app --follow

# 4. OAuth Login testen
# → https://glxy.at/auth/signin
```

**Keine zusätzlichen Schritte erforderlich.**

---

## [1.0.0] - 2025-10-04

### 🎉 Initial Production Release

- Next.js 15.5.3 Full-Stack Gaming Platform
- PostgreSQL 16 + Prisma ORM 6.17
- Redis 7.4.5 für Session Cache
- NextAuth.js v5 OAuth (Google, GitHub, Credentials)
- Docker-basiertes Deployment (Hetzner VPS)
- Multiplayer Games (Chess, Tetris, Tic-Tac-Toe, Connect4, etc.)
- PDF Editor (Web Adobe Integration)
- Admin Dashboard
- User Profile & Friends System
- Real-time WebSocket (Socket.IO)

---

## Semantic Versioning Guide

**Version Format:** `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking Changes (z.B. API-Änderungen, Schema-Changes)
- **MINOR:** Neue Features (abwärtskompatibel)
- **PATCH:** Bugfixes & Security Patches (abwärtskompatibel)

**Änderungstypen:**

- `🔒 Security` - Sicherheits-Fixes (CRITICAL)
- `✨ Features` - Neue Funktionen
- `🐛 Fixes` - Bugfixes
- `🚀 Performance` - Performance-Verbesserungen
- `📝 Dokumentation` - Dokumentations-Updates
- `♻️ Refactoring` - Code-Refactoring (ohne Funktionsänderung)
- `⚠️ Deprecated` - Bald entfernte Features
- `🗑️ Removed` - Entfernte Features

---

**Maintainer:** GLXY Gaming Team
**Letzte Aktualisierung:** 2025-10-10

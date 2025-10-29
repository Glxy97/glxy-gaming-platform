# 🎯 GAME CLEANUP PLAN - 35 → 7 GAMES

## ✅ **USER ANFORDERUNG:**
```
Es sollten diese Spiele geben:
1. ✅ Schach
2. ✅ Racing
3. ✅ Uno
4. ✅ Connect 4
5. ✅ Tetris
6. ✅ Battle Royale
7. ✅ FPS
```

---

## 📊 **BESTE KOMPONENTE PRO SPIEL:**

### **1. ♔ SCHACH**
```
BEHALTEN: components/games/chess/enhanced-chess-game.tsx
ROUTE: /games/chess
LÖSCHEN:
  - ai-chess-engine.tsx
  - ultimate-chess-engine.tsx
```

### **2. 🏎️ RACING**
```
BEHALTEN: components/games/racing/ultimate-racing-3d.tsx
ROUTE: /games/racing
LÖSCHEN:
  - enhanced-drift-racer.tsx
  - battle-royale-racing.tsx
  - racing-3d-enhanced.tsx
```

### **3. 🃏 UNO**
```
BEHALTEN: components/games/card/uno-online.tsx
ROUTE: /games/uno
```

### **4. 🔴 CONNECT 4**
```
BEHALTEN: components/games/board/connect4-2025.tsx
ROUTE: /games/connect4
LÖSCHEN:
  - connect4-engine.tsx
  - multiplayer-connect4.tsx
```

### **5. 🧱 TETRIS**
```
BEHALTEN: components/games/tetris/tetris-battle-2025.tsx
ROUTE: /games/tetris
LÖSCHEN:
  - enhanced-tetris-engine.tsx
  - multiplayer-tetris.tsx
```

### **6. 👑 BATTLE ROYALE**
```
OPTION A: Als eigenes FPS Game
  BEHALTEN: components/games/fps/battle-royale/ (GLXYBattleRoyaleCore)
  ROUTE: /games/battle-royale

OPTION B: Als MODE von FPS
  → Teil von ultimate-fps mit Mode Selector
```

### **7. 💎 FPS**
```
BEHALTEN: components/games/fps/ultimate/ (UltimateFPSEngineV2 - V11)
ROUTE: /games/fps
LÖSCHEN: 118 andere FPS-Files!
```

---

## 🗑️ **ZU LÖSCHEN:**

### **Registry:**
```
VORHER: 35 Games
NACHHER: 7 Games

LÖSCHEN:
  - tictactoe (nicht in User-Liste)
  - alle Duplikate
  - alle "enhanced", "ultimate", "multiplayer" Varianten (außer beste)
```

### **Component Files:**
```
LÖSCHEN:
  - components/games/chess/ai-chess-engine.tsx
  - components/games/chess/ultimate-chess-engine.tsx
  - components/games/racing/enhanced-drift-racer.tsx
  - components/games/racing/battle-royale-racing.tsx
  - components/games/racing/racing-3d-enhanced.tsx
  - components/games/board/connect4-engine.tsx
  - components/games/connect4/multiplayer-connect4.tsx
  - components/games/tetris/enhanced-tetris-engine.tsx
  - components/games/tetris/multiplayer-tetris.tsx
  - components/games/tictactoe/ (ganzer Ordner)
  - components/games/fps/ (118 Files, außer ultimate/)
```

### **Page Routes:**
```
LÖSCHEN:
  - app/games/tictactoe/
  - app/games/3d-demo/
  - app/games/fps-class-viewer/
  - app/games/fps-enhanced/
  - app/games/fps-map-test/
  - app/games/military-3d/
  - app/games/military-demo/
  - app/games/military-models-demo/
  - app/games/military-tactical/
  - app/games/tactical/
  - app/games/[gameId]/ (dynamic route - nicht nötig)
```

---

## 📋 **NEUE REGISTRY:**

```typescript
export const GAMES_REGISTRY: Game[] = [
  // 1. SCHACH
  {
    id: 'chess',
    name: '♔ Schach Meister',
    description: 'Strategisches Brettspiel für echte Denker',
    category: 'board',
    icon: '♔',
    href: '/games/chess',
    componentPath: 'components/games/chess/enhanced-chess-game.tsx',
    players: '1v1',
    duration: '15-45m',
    difficulty: '★★★★',
    features: ['ELO Rating', 'KI Gegner', 'Analyse', 'Turniere'],
    tags: ['strategie', 'klassiker', 'denksport']
  },

  // 2. RACING
  {
    id: 'racing',
    name: '🏎️ Racing 3D Ultimate',
    description: 'Hochgeschwindigkeits-Rennen mit Style',
    category: 'racing',
    icon: '🏎️',
    href: '/games/racing',
    componentPath: 'components/games/racing/ultimate-racing-3d.tsx',
    players: '1-12',
    duration: '10-20m',
    difficulty: '★★★★',
    features: ['Realistische Physik', 'Wetterbedingungen', 'Karriere-Modus'],
    tags: ['racing', 'action', 'simulation']
  },

  // 3. UNO
  {
    id: 'uno',
    name: '🃏 UNO Championship',
    description: 'Das klassische Kartenspiel neu erfunden',
    category: 'card',
    icon: '🃏',
    href: '/games/uno',
    componentPath: 'components/games/card/uno-online.tsx',
    players: '2-8',
    duration: '10-30m',
    difficulty: '★★',
    features: ['Power-Ups', 'Teams', 'Challenges', 'Events'],
    tags: ['party', 'karten', 'spaß']
  },

  // 4. CONNECT 4
  {
    id: 'connect4',
    name: '🔴 Connect 4 Ultimate',
    description: '4 Gewinnt mit modernem Twist',
    category: 'board',
    icon: '🔴',
    href: '/games/connect4',
    componentPath: 'components/games/board/connect4-2025.tsx',
    players: '1v1',
    duration: '5-15m',
    difficulty: '★★',
    features: ['Schnelles Spiel', 'KI', 'Online'],
    tags: ['puzzle', 'schnell', 'familie']
  },

  // 5. TETRIS
  {
    id: 'tetris',
    name: '🧱 Tetris Battle 2025',
    description: 'Kompetitives Tetris mit Power-Ups',
    category: 'puzzle',
    icon: '🧱',
    href: '/games/tetris',
    componentPath: 'components/games/tetris/tetris-battle-2025.tsx',
    players: '1-4',
    duration: '5-15m',
    difficulty: '★★★',
    features: ['Battle Mode', 'Marathon', 'Sprint', 'Multiplayer'],
    tags: ['puzzle', 'arcade', 'klassiker']
  },

  // 6. BATTLE ROYALE
  {
    id: 'battle-royale',
    name: '👑 GLXY Battle Royale',
    description: '100 Spieler, 1 Gewinner',
    category: 'fps',
    icon: '👑',
    href: '/games/battle-royale',
    componentPath: 'components/games/fps/battle-royale/GLXYBattleRoyaleGame.tsx',
    players: '1-100',
    duration: '20-45m',
    difficulty: '★★★★★',
    features: ['100 Spieler', 'Shrinking Zone', 'Loot System', 'Squad Mode'],
    tags: ['battle-royale', 'survival', 'hardcore']
  },

  // 7. FPS
  {
    id: 'fps',
    name: '💎 GLXY Ultimate FPS',
    description: 'Das süchtig machendste Browser-FPS',
    category: 'fps',
    icon: '💎',
    href: '/games/fps',
    componentPath: 'components/games/fps/ultimate/UltimateFPSGame.tsx',
    players: '1-16',
    duration: '10-30m',
    difficulty: '★★★★★',
    features: ['Three.js 3D', 'Smart AI', 'Cinematic Effects', '3 Waffen', 'Progression'],
    tags: ['fps', '3d', 'action', 'shooter', 'ultimate']
  }
]
```

---

## 📈 **STATISTIK:**

### **Vorher:**
```
Total Games: 35
├── Board: 6
├── Card: 1
├── Puzzle: 3
├── Racing: 3
└── FPS: 16
```

### **Nachher:**
```
Total Games: 7
├── Board: 2 (Schach, Connect 4)
├── Card: 1 (Uno)
├── Puzzle: 1 (Tetris)
├── Racing: 1 (Racing 3D)
└── FPS: 2 (FPS, Battle Royale)
```

**Reduction: 35 → 7 Games = -80%!** 🔥

---

## ✅ **BENEFITS:**

```
✅ Clean & Professional
✅ Genau was User will
✅ Keine Duplikate
✅ Wartbar
✅ Clear Structure
✅ 7 diverse Games
```



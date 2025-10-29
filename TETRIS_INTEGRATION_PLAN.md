# 🧱 TETRIS INTEGRATION PLAN

## ✅ **ENTSCHEIDUNG: tetris-battle-2025.tsx als Basis**

### **Warum?**
1. ✅ **7-Bag Randomizer** - Modern Tetris Standard
2. ✅ **DAS + ARR** - Professional Controls
3. ✅ **Wall Kicks** - SRS-like System
4. ✅ **Sound System** - Better UX
5. ✅ **Best Code Architecture**

---

## 🔧 **INTEGRATION FEATURES:**

### **Von enhanced-tetris-engine.tsx:**
```typescript
1. Game Mode Selector
   - classic: Traditional Tetris
   - modern: With Ghost Piece + Hold
   - battle: Multiplayer with Attacks
   - ultra: 2-minute time trial
   - zen: No time limit, relaxing

2. Power-Ups (Battle Mode)
   - line_clear: Clear random enemy lines
   - freeze_enemy: Freeze for 5s
   - speed_boost: 2x speed for 10s
   - double_score: 2x score for 15s

3. Advanced Stats
   - pps: Pieces Per Second
   - apm: Actions Per Minute
   - efficiency: % Perfect Drops
   - perfectClears: Full board clears
   - maxCombo: Highest combo achieved
```

---

## 📊 **KEEPING FROM tetris-battle-2025.tsx:**
```typescript
✅ TetrominoBag (7-Bag Randomizer)
✅ DAS + ARR Input System
✅ Wall Kick System
✅ Ghost Piece
✅ Hold System (C / Shift)
✅ 5 Next Pieces Preview
✅ Line Clear Animations
✅ Particle System
✅ Attack System (Garbage Lines)
✅ Combo System
✅ Sound Integration
✅ Countdown System
✅ Modern Scoring
✅ Glassmorphism UI
```

---

## 🎯 **NEW COMPONENT STRUCTURE:**

```typescript
components/games/tetris/tetris-battle-2025.tsx

// Add Game Mode Selection
interface TetrisBattle2025Props {
  roomId?: string
  mode?: 'solo' | 'multiplayer'
  gameMode?: 'classic' | 'modern' | 'battle' | 'ultra' | 'zen'  // NEW!
  onLeaveRoom?: () => void
}

// Add Power-Ups
type PowerUpType = 'line_clear' | 'freeze_enemy' | 'speed_boost' | 'double_score'
interface PowerUp {
  type: PowerUpType
  icon: string
  color: string
  duration?: number
  description: string
}

// Enhanced Stats
interface GameStats {
  score: number
  level: number
  lines: number
  time: number
  pps: number              // NEW!
  apm: number              // NEW!
  efficiency: number       // NEW!
  perfectClears: number    // NEW!
  maxCombo: number         // NEW!
  totalPieces: number      // NEW!
}
```

---

## 📝 **IMPLEMENTATION STEPS:**

1. ✅ Read current tetris-battle-2025.tsx
2. ✅ Add Game Mode Selector UI
3. ✅ Add Power-Ups System (for battle mode)
4. ✅ Add Advanced Stats Tracking
5. ✅ Add Perfect Clear Detection
6. ✅ Add PPS/APM Calculation
7. ✅ Update UI to show new stats
8. ✅ Test all modes

---

## 🎮 **RESULT:**

**ULTIMATE TETRIS:**
- ✅ 5 Game Modes
- ✅ Professional Controls (DAS/ARR)
- ✅ Modern Tetris Standard (7-Bag)
- ✅ Power-Ups (Battle Mode)
- ✅ Advanced Stats (PPS, APM, Efficiency)
- ✅ Perfect Clear Tracking
- ✅ Sound & Particles
- ✅ Multiplayer Attack System
- ✅ Beautiful Glassmorphism UI

**File:** `components/games/tetris/tetris-battle-2025.tsx`



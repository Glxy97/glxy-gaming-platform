# UltimateFPSEngineV4 - Refactored Manager Architecture

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│                 UltimateFPSEngineV4 (Main Class)                    │
│                        (~500 lines)                                 │
│                  ┌─ Orchestration Layer ─┐                          │
│                  │ Coordinates all       │                          │
│                  │ manager interactions  │                          │
│                  └───────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
    ┌────┴──────┬────────┬────┴──────┬────────┬───┴────────┐
    │            │        │           │        │            │
    ▼            ▼        ▼           ▼        ▼            ▼
┌─────────┐ ┌──────────┐ ┌──────┐ ┌────────┐ ┌─────┐ ┌──────────┐
│ Input   │ │ Game     │ │ Enemy│ │Collision│ │ Map │ │  Event  │
│Manager  │ │ Loop     │ │ AI   │ │Handler  │ │ Mgr │ │Orch.    │
└────┬────┘ │ Manager  │ │ Mgr  │ └────┬───┘ │     │ │         │
     │      └────┬─────┘ │      │      │     └──┬──┘ └────┬─────┘
     │           │       └──┬───┘      │        │         │
     │           │          │         │        │         │
     ▼           ▼          ▼         ▼        ▼         ▼
  Input       Game Loop   Enemy AI  Collision Map Env   Event
  Events      Updates     Updates   Damage    Setup    Wiring
  
  └─ HUD Renderer ─────────────────────────────────────┬─────┘
     │                                                  │
     └─ Weapon System Controller ─────────────────┬────┘
        │                                          │
        └─ Screen Effects Controller ──────────────┘
           │
           └─ Player Manager ────────────────────┐
                                                 │
                                    (Shared State)
```

## Detailed Manager Dependencies

### 1. **UltimateFPSEngineV4** (Main Orchestrator)
**Responsibility:** Initialization, system coordination, lifecycle
**Dependencies:** All managers
**Provides:**
- `constructor()` - Initialize all systems
- `start()` - Begin game loop
- `pause()` / `resume()` - Game state control
- `changeGameMode()` - Mode switching
- `getGameState()` - Public API

---

### 2. **InputManager** 
**Responsibility:** Handle all user input (keyboard, mouse, pointer lock)
**Size:** ~170 LOC
**Dependencies:** 
- Camera (from main class)
- MapInteractionManager
- AmmoSystem
- GrenadeSystem
- AbilitySystem
- ScopeSystem
- WeaponManager
- Recoil Manager

**Public Methods:**
```typescript
onKeyDown(key: string): void
onKeyUp(key: string): void
onMouseMove(deltaX: number, deltaY: number): void
onMouseDown(button: number): void
onMouseUp(button: number): void
getInputState(): InputState
```

**Events to Handle:**
- W/A/S/D - Movement
- Space - Jump
- Shift - Sprint
- Ctrl - Crouch
- R - Reload
- T - Cycle Ammo
- G - Throw Grenade
- H - Cycle Grenade Type
- E - Active Ability
- Q - Ultimate Ability
- F - Interact
- 1-5 - Weapon Switch
- Tab - Show Scoreboard
- Escape - Pause
- L - Loadout
- C - Character

---

### 3. **GameLoopManager**
**Responsibility:** Main render loop orchestration
**Size:** ~200 LOC
**Dependencies:**
- EnemyAIManager
- PlayerManager
- CollisionHandler
- HUDRenderer
- AudioManager
- MapEnvironmentManager
- EffectsManager
- PhysicsEngine
- Three.js Systems

**Public Methods:**
```typescript
update(deltaTime: number): void
render(): void
updatePlayerMovement(deltaTime: number): void
updateEnemies(deltaTime: number): void
updatePhysics(deltaTime: number): void
```

---

### 4. **EnemyAIManager**
**Responsibility:** Complete enemy AI system
**Size:** ~600 LOC
**Dependencies:**
- PhysicsEngine (raycast, pathfinding)
- BehaviorTreeManager
- PathfindingManager
- ModelManager
- WeaponManager (for AI weapons)
- AudioManager (for sounds)
- Scene (Three.js)
- EffectsManager (visual effects)

**Key Methods:**
```typescript
class EnemyAIManager {
  updateEnemies(deltaTime: number): void
  spawnEnemy(position: Vector3): Promise<UltimateEnemy>
  updateEnemyPathfinding(enemy, deltaTime, distance): void
  executeBehaviorAction(enemy, action, deltaTime): void
  handleEnemyDeath(enemy): void
  hasLineOfSight(from, to): boolean
  updateEnemyHealthBars(): void
  handleAIShoot(enemy, shootData): void
}
```

---

### 5. **CollisionHandler**
**Responsibility:** Hit detection, damage calculations, collision effects
**Size:** ~300 LOC
**Dependencies:**
- PhysicsEngine (raycasting)
- HitMarkerSystem
- DamageIndicatorSystem
- EffectsManager
- AudioManager
- KillRewardSystem
- ProgressionManager
- WeaponProgressionManager
- GameModeManager
- KillFeedManager
- AbilitySystem
- VisualEffectsManager
- MapInteractionManager

**Key Methods:**
```typescript
class CollisionHandler {
  handleBulletHit(intersection, damage, weapon): void
  handleEnvironmentHit(intersection): void
  handlePlayerHit(damage, direction): void
  handleAIShoot(enemy, shootData): void
  applyDamage(target, damage, source): void
  calculateHeadshot(hitPoint, targetMesh): boolean
}
```

---

### 6. **EventOrchestrator**
**Responsibility:** Connect all system events
**Size:** ~570 LOC
**Dependencies:** All other managers (listens to their events)

**Responsibilities:**
- Wire up 11+ event setup methods
- Coordinate cross-system communication
- Handle cascading events (e.g., kill → XP → level up)

```typescript
class EventOrchestrator {
  setupGameFlowEvents(): void
  setupWeaponManagerEvents(): void
  setupUIEvents(): void
  setupNetworkEvents(): void
  setupProgressionEvents(): void
  setupMapEvents(): void
  setupAudioEvents(): void
  setupGameModeEvents(): void
  setupAbilityCallbacks(): void
  setupWeaponProgressionEvents(): void
  setupGrenadeCallbacks(): void
}
```

---

### 7. **MapEnvironmentManager**
**Responsibility:** Map loading, scene setup, lighting, navigation mesh
**Size:** ~220 LOC
**Dependencies:**
- GLBMapsLoader
- MapLoader
- MapManager
- PathfindingManager
- PhysicsEngine
- Scene (Three.js)

**Key Methods:**
```typescript
class MapEnvironmentManager {
  loadMap(mapId: string): Promise<void>
  setupMapInScene(mapData): void
  clearMap(): void
  setupBasicMap(): void
  initializeNavMesh(): void
  updateEnvironmentLighting(environment): void
}
```

---

### 8. **HUDRenderer**
**Responsibility:** All HUD and UI rendering
**Size:** ~150 LOC
**Dependencies:**
- Canvas overlay
- All rendering systems (crosshair, health bars, etc.)
- GameState
- WeaponManager
- ProgressionManager
- ScoreboardManager

**Key Methods:**
```typescript
class HUDRenderer {
  updateHUD(): void
  getUIData(): GameStateData
  updateScoreboard(): void
  updateEnemyHealthBars(): void
  applySettings(settings): void
  renderOverlay(ctx, width, height): void
}
```

---

### 9. **ScreenEffectsController**
**Responsibility:** Visual feedback (screen flashes, shake, etc.)
**Size:** ~110 LOC
**Dependencies:**
- Canvas overlay
- AudioManager (for sound effects)
- Three.js Camera

**Key Methods:**
```typescript
class ScreenEffectsController {
  showRedScreenFlash(): void
  showDopamineEffects(event): void
  showScreenFlash(color, intensity): void
  applyScreenShake(intensity): void
  createVisualFeedback(type, params): void
}
```

---

### 10. **WeaponSystemController**
**Responsibility:** Shooting, reloading, weapon models
**Size:** ~150 LOC
**Dependencies:**
- WeaponManager
- RecoilManager
- PhysicsEngine
- AudioManager
- VisualEffectsManager
- ModelManager
- EffectsManager

**Key Methods:**
```typescript
class WeaponSystemController {
  shootWeapon(origin, direction): void
  reloadWeapon(): Promise<void>
  createWeaponModel(weaponId): Promise<void>
  switchWeapon(weaponId): void
  getWeaponModelPath(weaponId): string
  createFallbackWeapon(): void
}
```

---

### 11. **PlayerManager**
**Responsibility:** Player state, stats, health, respawning
**Size:** ~100 LOC
**Dependencies:**
- Player data structure
- AudioManager
- ScreenEffectsController

**Key Methods:**
```typescript
class PlayerManager {
  updatePlayerStats(stats): void
  takeDamage(damage, source): void
  heal(amount): void
  respawn(): void
  isDead(): boolean
  getPlayerData(): PlayerState
}
```

---

## Interaction Flows

### Flow 1: Player Shoots
```
InputManager (onMouseDown)
  └─> WeaponSystemController.shootWeapon()
      └─> PhysicsEngine.raycast()
          └─> CollisionHandler.handleBulletHit()
              ├─> EnemyAIManager (check for kill)
              ├─> HitMarkerSystem
              ├─> AudioManager (play impact sound)
              ├─> ScreenEffectsController (screen shake)
              ├─> KillRewardSystem (if kill)
              ├─> ProgressionManager.awardXP()
              └─> EventOrchestrator (broadcast kill event)
```

### Flow 2: Enemy Dies
```
CollisionHandler.handleBulletHit()
  └─> EnemyAIManager.handleEnemyDeath()
      ├─> Remove from scene
      ├─> KillRewardSystem.registerKill()
      ├─> ProgressionManager.awardXP()
      ├─> WeaponProgressionManager.registerKill()
      ├─> AbilitySystem.chargeUltimate()
      ├─> FPSGameModeManager.registerKill()
      ├─> KillFeedManager.addKill()
      └─> EventOrchestrator (broadcast kill event)
```

### Flow 3: Game Loop Update
```
GameLoopManager.update(deltaTime)
  ├─> GameLoopManager.updatePlayerMovement()
  ├─> EnemyAIManager.updateEnemies()
  │   └─> EnemyAIManager.executeBehaviorAction()
  ├─> CollisionHandler (continuous collision checks)
  ├─> PhysicsEngine.update()
  ├─> HUDRenderer.updateHUD()
  ├─> ScreenEffectsController.update()
  ├─> AudioManager.updateListener()
  └─> Renderer.render()
```

---

## Property Flow Chart

```
UltimateFPSEngineV4
├─ Three.js Rendering
│  ├─ scene: THREE.Scene
│  ├─ camera: THREE.PerspectiveCamera
│  ├─ renderer: THREE.WebGLRenderer
│  └─ clock: THREE.Clock
│
├─ Core Game Data
│  ├─ player: PlayerData
│  ├─ enemies: UltimateEnemy[]
│  ├─ gameState: UltimateGameState
│  └─ gameMode: GameMode
│
├─ Manager Properties
│  ├─ inputManager: InputManager
│  ├─ gameLoopManager: GameLoopManager
│  ├─ enemyAIManager: EnemyAIManager
│  ├─ collisionHandler: CollisionHandler
│  ├─ eventOrchestrator: EventOrchestrator
│  ├─ mapEnvironmentManager: MapEnvironmentManager
│  ├─ hudRenderer: HUDRenderer
│  ├─ screenEffectsController: ScreenEffectsController
│  ├─ weaponSystemController: WeaponSystemController
│  └─ playerManager: PlayerManager
│
└─ Existing Phase 7-10 Systems (keep as-is)
   ├─ progressionManager: ProgressionManager
   ├─ mapManager: MapManager
   ├─ audioManager: AudioManager
   ├─ uiManager: UIManager
   ├─ weaponManager: WeaponManager
   ├─ abilitySystem: AbilitySystem
   ├─ behaviorTreeManager: BehaviorTreeManager
   ├─ pathfindingManager: PathfindingManager
   └─ ... (many more)
```

---

## Refactoring Phases

### Phase 1: Extract Core Systems (3 weeks)
1. **Week 1:** EnemyAIManager + EventOrchestrator
   - Highest complexity
   - Most dependencies
   - Test with integration tests

2. **Week 2:** GameLoopManager + InputManager
   - Refactor main render loop
   - Consolidate input handlers

3. **Week 3:** CollisionHandler
   - Isolate hit detection
   - Test with unit tests

### Phase 2: Extract Supporting Systems (2 weeks)
1. **Week 1:** MapEnvironmentManager + HUDRenderer
   - Clear responsibilities
   - Many but localized dependencies

2. **Week 2:** ScreenEffectsController + WeaponSystemController + PlayerManager
   - Smaller scoped
   - Can be done in parallel

### Phase 3: Integration & Testing (1 week)
1. **Day 1-2:** Main class cleanup
2. **Day 3-4:** End-to-end testing
3. **Day 5:** Performance optimization

---

## Testing Strategy

### Unit Tests
- Each manager independently
- Input manager: mock keyboard/mouse events
- Collision handler: test damage calculations
- Enemy AI manager: test behavior tree execution

### Integration Tests
- InputManager → WeaponSystemController → CollisionHandler
- GameLoopManager → All subsystems
- EventOrchestrator → Event cascading

### System Tests
- Full game loop with all systems
- Multiple enemy spawning
- Player interactions (shooting, movement, abilities)

---

## Migration Checklist

- [ ] Create manager interfaces/types
- [ ] Extract EnemyAIManager
- [ ] Extract EventOrchestrator
- [ ] Extract GameLoopManager
- [ ] Extract InputManager
- [ ] Extract CollisionHandler
- [ ] Extract MapEnvironmentManager
- [ ] Extract HUDRenderer
- [ ] Extract ScreenEffectsController
- [ ] Extract WeaponSystemController
- [ ] Extract PlayerManager
- [ ] Update imports in main class
- [ ] Remove old methods from main class
- [ ] Run full test suite
- [ ] Performance check
- [ ] Code review


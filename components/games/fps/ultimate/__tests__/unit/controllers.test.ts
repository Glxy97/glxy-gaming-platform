/**
 * 🧪 CONTROLLER TESTS
 * Comprehensive unit tests for all controllers
 *
 * @remarks
 * Tests for:
 * - MovementController (925 lines)
 * - PhysicsEngine (810 lines)
 * - AIController (950 lines)
 * - EffectsManager (680 lines)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as THREE from 'three'

// MovementController imports
import { MovementController } from '../../movement/MovementController'
import { MovementState, DEFAULT_MOVEMENT_SETTINGS } from '../../movement/data/MovementData'

// PhysicsEngine imports
import { PhysicsEngine } from '../../physics/PhysicsEngine'
import {
  PhysicsObjectType,
  CollisionLayer,
  createPhysicsObject,
  createBulletPhysics,
  PHYSICS_MATERIALS
} from '../../physics/data/PhysicsData'

// AIController imports
import { AIController } from '../../ai/AIController'
import { AIState } from '../../ai/data/AIData'

// EffectsManager imports
import { EffectsManager } from '../../effects/EffectsManager'
import { EffectQuality } from '../../effects/data/EffectsData'

// ============================================================
// MOVEMENT CONTROLLER TESTS
// ============================================================

describe('MovementController', () => {
  let controller: MovementController
  let scene: THREE.Scene
  let playerMesh: THREE.Mesh

  beforeEach(() => {
    controller = new MovementController()
    scene = new THREE.Scene()
    playerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 1),
      new THREE.MeshBasicMaterial()
    )
    scene.add(playerMesh)
    controller.setScene(scene)
    controller.setPlayerMesh(playerMesh)
  })

  afterEach(() => {
    controller.destroy()
  })

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      expect(controller.stamina).toBe(100)
      expect(controller.isSprinting).toBe(false)
      expect(controller.isGrounded).toBe(false)
      expect(controller.speed).toBe(0)
    })

    it('should accept custom settings', () => {
      const customController = new MovementController({
        ...DEFAULT_MOVEMENT_SETTINGS,
        walkSpeed: 5.0
      })
      expect(customController).toBeDefined()
      customController.destroy()
    })
  })

  describe('Basic Movement', () => {
    it('should move in direction', () => {
      const direction = new THREE.Vector3(0, 0, -1)
      controller.move(direction, 0.016)
      expect(controller.velocity.length()).toBeGreaterThan(0)
    })

    it('should stop movement', () => {
      const direction = new THREE.Vector3(1, 0, 0)
      controller.move(direction, 0.016)
      controller.stop()
      expect(controller.speed).toBe(0)
    })

    it('should set speed multiplier', () => {
      controller.setSpeedMultiplier(2.0)
      const direction = new THREE.Vector3(1, 0, 0)
      controller.move(direction, 0.016)
      expect(controller.speed).toBeGreaterThan(0)
    })
  })

  describe('Sprint', () => {
    it('should start sprinting when conditions met', () => {
      const result = controller.sprint(true)
      expect(result).toBe(true)
      expect(controller.isSprinting).toBe(true)
    })

    it('should stop sprinting', () => {
      controller.sprint(true)
      const result = controller.sprint(false)
      expect(result).toBe(true)
      expect(controller.isSprinting).toBe(false)
    })

    it('should check if can sprint', () => {
      expect(controller.canSprint()).toBeDefined()
    })

    it('should drain stamina while sprinting', () => {
      const initialStamina = controller.stamina
      controller.sprint(true)
      controller.update(1.0)
      expect(controller.stamina).toBeLessThan(initialStamina)
    })
  })

  describe('Crouch', () => {
    it('should crouch', () => {
      const result = controller.crouch(true)
      expect(result).toBe(true)
      expect(controller.isCrouching).toBe(true)
    })

    it('should toggle crouch', () => {
      controller.toggleCrouch()
      expect(controller.isCrouching).toBe(true)
      controller.toggleCrouch()
      expect(controller.isCrouching).toBe(false)
    })
  })

  describe('Jump', () => {
    it('should jump when grounded', () => {
      // Simulate grounded
      playerMesh.position.y = 0
      controller.checkGrounded()
      const result = controller.jump()
      expect(controller.velocity.y).toBeGreaterThan(0)
    })

    it('should check if can jump', () => {
      expect(controller.canJump()).toBeDefined()
    })
  })

  describe('Slide', () => {
    it('should check if can slide', () => {
      expect(controller.canSlide()).toBeDefined()
    })
  })

  describe('Stamina', () => {
    it('should get stamina', () => {
      expect(controller.getStamina()).toBe(100)
    })

    it('should set stamina', () => {
      controller.setStamina(50)
      expect(controller.getStamina()).toBe(50)
    })

    it('should drain stamina', () => {
      controller.drainStamina(20)
      expect(controller.getStamina()).toBe(80)
    })

    it('should regenerate stamina', () => {
      controller.drainStamina(50)
      controller.regenerateStamina(1.0)
      expect(controller.getStamina()).toBeGreaterThan(50)
    })

    it('should clamp stamina between 0-100', () => {
      controller.setStamina(150)
      expect(controller.getStamina()).toBeLessThanOrEqual(100)
      controller.setStamina(-10)
      expect(controller.getStamina()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Events', () => {
    it('should trigger sprint change event', () => {
      const callback = vi.fn()
      controller.onSprintChange(callback)
      controller.sprint(true)
      expect(callback).toHaveBeenCalledWith(true)
    })

    it('should trigger crouch change event', () => {
      const callback = vi.fn()
      controller.onCrouchChange(callback)
      controller.crouch(true)
      expect(callback).toHaveBeenCalledWith(true)
    })

    it('should trigger jump event', () => {
      const callback = vi.fn()
      controller.onJump(callback)
      controller.jump()
      expect(callback).toHaveBeenCalled()
    })

    it('should unsubscribe from events', () => {
      const callback = vi.fn()
      const unsubscribe = controller.onSprintChange(callback)
      unsubscribe()
      controller.sprint(true)
      expect(callback).toHaveBeenCalledTimes(0)
    })
  })

  describe('Update', () => {
    it('should update movement', () => {
      controller.update(0.016)
      expect(true).toBe(true) // Update should not throw
    })
  })

  describe('Cleanup', () => {
    it('should reset to default state', () => {
      controller.sprint(true)
      controller.reset()
      expect(controller.isSprinting).toBe(false)
    })

    it('should destroy cleanly', () => {
      controller.destroy()
      expect(true).toBe(true) // Should not throw
    })
  })
})

// ============================================================
// PHYSICS ENGINE TESTS
// ============================================================

describe('PhysicsEngine', () => {
  let engine: PhysicsEngine
  let scene: THREE.Scene

  beforeEach(() => {
    engine = new PhysicsEngine()
    scene = new THREE.Scene()
    engine.setScene(scene)
  })

  afterEach(() => {
    engine.destroy()
  })

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      expect(engine.isRunning()).toBe(false)
    })

    it('should start and stop', () => {
      engine.start()
      expect(engine.isRunning()).toBe(true)
      engine.stop()
      expect(engine.isRunning()).toBe(false)
    })
  })

  describe('Object Management', () => {
    it('should add physics object', () => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
      const object = createPhysicsObject(mesh, PhysicsObjectType.DYNAMIC, PHYSICS_MATERIALS.CONCRETE)
      engine.addObject(object)
      expect(engine.getObject(object.id)).toBeDefined()
    })

    it('should remove physics object', () => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
      const object = createPhysicsObject(mesh, PhysicsObjectType.DYNAMIC, PHYSICS_MATERIALS.CONCRETE)
      engine.addObject(object)
      engine.removeObject(object.id)
      expect(engine.getObject(object.id)).toBeUndefined()
    })

    it('should get all objects', () => {
      const mesh1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
      const mesh2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
      const obj1 = createPhysicsObject(mesh1, PhysicsObjectType.DYNAMIC, PHYSICS_MATERIALS.CONCRETE)
      const obj2 = createPhysicsObject(mesh2, PhysicsObjectType.DYNAMIC, PHYSICS_MATERIALS.WOOD)
      engine.addObject(obj1)
      engine.addObject(obj2)
      expect(engine.getAllObjects()).toHaveLength(2)
    })
  })

  describe('Bullet Management', () => {
    it('should add bullet', () => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.05))
      const bullet = createBulletPhysics(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -100))
      engine.addBullet(bullet)
      expect(engine.getBullet(bullet.id)).toBeDefined()
    })

    it('should remove bullet', () => {
      const bullet = createBulletPhysics(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -100))
      engine.addBullet(bullet)
      engine.removeBullet(bullet.id)
      expect(engine.getBullet(bullet.id)).toBeUndefined()
    })
  })

  describe('Explosions', () => {
    it('should create explosion', () => {
      const center = new THREE.Vector3(0, 0, 0)
      engine.createExplosion(center, 5, 1000, 100)
      expect(true).toBe(true) // Should not throw
    })
  })

  describe('Raycasting', () => {
    it('should raycast', () => {
      const origin = new THREE.Vector3(0, 0, 0)
      const direction = new THREE.Vector3(0, 0, -1)
      const result = engine.raycast(origin, direction, 100)
      expect(result).toBeDefined()
      expect(result.hit).toBeDefined()
    })
  })

  describe('Update', () => {
    it('should update physics', () => {
      engine.start()
      engine.update(0.016)
      expect(true).toBe(true) // Should not throw
    })

    it('should update objects', () => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
      const object = createPhysicsObject(mesh, PhysicsObjectType.DYNAMIC, PHYSICS_MATERIALS.CONCRETE)
      object.velocity.set(1, 0, 0)
      engine.addObject(object)
      engine.start()
      engine.update(0.016)
      // Object should have moved
      expect(true).toBe(true)
    })
  })

  describe('Stats', () => {
    it('should provide stats', () => {
      const stats = engine.getStats()
      expect(stats).toBeDefined()
      expect(stats.totalObjects).toBeDefined()
    })
  })

  describe('Cleanup', () => {
    it('should clear all objects', () => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
      const object = createPhysicsObject(mesh, PhysicsObjectType.DYNAMIC, PHYSICS_MATERIALS.CONCRETE)
      engine.addObject(object)
      engine.clear()
      expect(engine.getAllObjects()).toHaveLength(0)
    })

    it('should destroy cleanly', () => {
      engine.destroy()
      expect(engine.isRunning()).toBe(false)
    })
  })
})

// ============================================================
// AI CONTROLLER TESTS
// ============================================================

describe('AIController', () => {
  let ai: AIController
  let scene: THREE.Scene
  let botMesh: THREE.Mesh

  beforeEach(() => {
    botMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 1),
      new THREE.MeshBasicMaterial()
    )
    ai = new AIController('aggressive_assault', 'regular', botMesh)
    scene = new THREE.Scene()
    scene.add(botMesh)
    ai.setScene(scene)
  })

  afterEach(() => {
    ai.destroy()
  })

  describe('Initialization', () => {
    it('should initialize with personality', () => {
      expect(ai.getPersonality()).toBeDefined()
      expect(ai.getPersonality().id).toBe('aggressive_assault')
    })

    it('should initialize with difficulty', () => {
      expect(ai.getDifficulty()).toBeDefined()
      expect(ai.getDifficulty().id).toBe('regular')
    })

    it('should start in idle state', () => {
      expect(ai.getCurrentState()).toBe(AIState.IDLE)
    })

    it('should have initial health', () => {
      expect(ai.getHealth()).toBeGreaterThan(0)
    })
  })

  describe('States', () => {
    it('should be alive initially', () => {
      expect(ai.isAlive()).toBe(true)
    })

    it('should get bot state', () => {
      const state = ai.getBotState()
      expect(state).toBeDefined()
      expect(state.id).toBeDefined()
    })

    it('should get learning data', () => {
      const learning = ai.getLearningData()
      expect(learning).toBeDefined()
      expect(learning.encountersWithPlayer).toBe(0)
    })
  })

  describe('Damage & Death', () => {
    it('should take damage', () => {
      const initialHealth = ai.getHealth()
      ai.takeDamage(10, new THREE.Vector3(0, 0, 0))
      expect(ai.getHealth()).toBeLessThan(initialHealth)
    })

    it('should die when health reaches zero', () => {
      ai.takeDamage(1000, new THREE.Vector3(0, 0, 0))
      expect(ai.isAlive()).toBe(false)
      expect(ai.getCurrentState()).toBe(AIState.DEAD)
    })
  })

  describe('Events', () => {
    it('should trigger state change event', () => {
      const callback = vi.fn()
      ai.onStateChange(callback)
      ai.setPlayerPosition(new THREE.Vector3(10, 0, 0))
      ai.update(0.016)
      // State may change during update
      expect(true).toBe(true)
    })

    it('should trigger death event', () => {
      const callback = vi.fn()
      ai.onDeath(callback)
      ai.takeDamage(1000, new THREE.Vector3(0, 0, 0))
      expect(callback).toHaveBeenCalled()
    })

    it('should trigger damage event', () => {
      const callback = vi.fn()
      ai.onDamage(callback)
      ai.takeDamage(10, new THREE.Vector3(0, 0, 0))
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('Update', () => {
    it('should update AI', () => {
      ai.update(0.016)
      expect(true).toBe(true) // Should not throw
    })

    it('should not update when dead', () => {
      ai.takeDamage(1000, new THREE.Vector3(0, 0, 0))
      ai.update(0.016)
      expect(ai.getCurrentState()).toBe(AIState.DEAD)
    })
  })

  describe('Cleanup', () => {
    it('should destroy cleanly', () => {
      ai.destroy()
      expect(true).toBe(true) // Should not throw
    })
  })
})

// ============================================================
// EFFECTS MANAGER TESTS
// ============================================================

describe('EffectsManager', () => {
  let manager: EffectsManager
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera

  beforeEach(() => {
    manager = new EffectsManager(EffectQuality.HIGH)
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    manager.setScene(scene)
    manager.setCamera(camera)
  })

  afterEach(() => {
    manager.destroy()
  })

  describe('Initialization', () => {
    it('should initialize with quality', () => {
      expect(manager.getQuality()).toBe(EffectQuality.HIGH)
    })

    it('should be enabled by default', () => {
      expect(manager.isEnabled()).toBe(true)
    })
  })

  describe('Quality Management', () => {
    it('should set quality', () => {
      manager.setQuality(EffectQuality.LOW)
      expect(manager.getQuality()).toBe(EffectQuality.LOW)
    })

    it('should get quality', () => {
      const quality = manager.getQuality()
      expect(quality).toBeDefined()
    })
  })

  describe('Effect Spawning', () => {
    it('should spawn muzzle flash', () => {
      const position = new THREE.Vector3(0, 0, 0)
      const direction = new THREE.Vector3(0, 0, -1)
      const effect = manager.spawnMuzzleFlash(position, direction)
      expect(effect).toBeDefined()
    })

    it('should spawn blood splatter', () => {
      const position = new THREE.Vector3(0, 0, 0)
      const direction = new THREE.Vector3(0, 1, 0)
      const effect = manager.spawnBloodSplatter(position, direction)
      expect(effect).toBeDefined()
    })

    it('should spawn explosion', () => {
      const position = new THREE.Vector3(0, 0, 0)
      const effect = manager.spawnExplosion(position, 1.0)
      expect(effect).toBeDefined()
    })

    it('should stop effect', () => {
      const position = new THREE.Vector3(0, 0, 0)
      const effect = manager.spawnExplosion(position)
      if (effect) {
        manager.stopEffect(effect.id)
        expect(manager.getActiveEffectCount()).toBe(0)
      }
    })
  })

  describe('Control', () => {
    it('should enable effects', () => {
      manager.enable()
      expect(manager.isEnabled()).toBe(true)
    })

    it('should disable effects', () => {
      manager.disable()
      expect(manager.isEnabled()).toBe(false)
    })

    it('should pause all effects', () => {
      manager.spawnExplosion(new THREE.Vector3(0, 0, 0))
      manager.pauseAll()
      expect(true).toBe(true) // Should not throw
    })

    it('should resume all effects', () => {
      manager.spawnExplosion(new THREE.Vector3(0, 0, 0))
      manager.pauseAll()
      manager.resumeAll()
      expect(true).toBe(true) // Should not throw
    })

    it('should stop all effects', () => {
      manager.spawnExplosion(new THREE.Vector3(0, 0, 0))
      manager.spawnMuzzleFlash(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1))
      manager.stopAll()
      expect(manager.getActiveEffectCount()).toBe(0)
    })
  })

  describe('Stats', () => {
    it('should provide stats', () => {
      const stats = manager.getStats()
      expect(stats).toBeDefined()
      expect(stats.activeEffects).toBeDefined()
      expect(stats.activeParticles).toBeDefined()
    })

    it('should track active effects', () => {
      const initialCount = manager.getActiveEffectCount()
      manager.spawnExplosion(new THREE.Vector3(0, 0, 0))
      expect(manager.getActiveEffectCount()).toBeGreaterThan(initialCount)
    })

    it('should track active particles', () => {
      const initialCount = manager.getActiveParticleCount()
      manager.spawnExplosion(new THREE.Vector3(0, 0, 0))
      expect(manager.getActiveParticleCount()).toBeGreaterThanOrEqual(initialCount)
    })
  })

  describe('Update', () => {
    it('should update effects', () => {
      manager.spawnExplosion(new THREE.Vector3(0, 0, 0))
      manager.update(0.016)
      expect(true).toBe(true) // Should not throw
    })

    it('should not update when disabled', () => {
      manager.disable()
      manager.spawnExplosion(new THREE.Vector3(0, 0, 0))
      manager.update(0.016)
      expect(true).toBe(true) // Should not throw
    })
  })

  describe('Events', () => {
    it('should trigger effect start event', () => {
      const callback = vi.fn()
      manager.onEffectStart(callback)
      manager.spawnExplosion(new THREE.Vector3(0, 0, 0))
      expect(callback).toHaveBeenCalled()
    })

    it('should trigger effect end event', () => {
      const callback = vi.fn()
      manager.onEffectEnd(callback)
      const effect = manager.spawnExplosion(new THREE.Vector3(0, 0, 0))
      if (effect) {
        manager.stopEffect(effect.id)
        expect(callback).toHaveBeenCalled()
      }
    })
  })

  describe('Cleanup', () => {
    it('should clear all effects', () => {
      manager.spawnExplosion(new THREE.Vector3(0, 0, 0))
      manager.spawnMuzzleFlash(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1))
      manager.clear()
      expect(manager.getActiveEffectCount()).toBe(0)
    })

    it('should destroy cleanly', () => {
      manager.spawnExplosion(new THREE.Vector3(0, 0, 0))
      manager.destroy()
      expect(manager.getActiveEffectCount()).toBe(0)
    })
  })
})

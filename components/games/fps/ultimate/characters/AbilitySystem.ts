/**
 * ⚡ ABILITY SYSTEM
 * 
 * Handles execution and management of character abilities
 * Passive, Active, and Ultimate abilities
 */

import * as THREE from 'three'
import {
  PlayableCharacter,
  CharacterState,
  CharacterAbilityEvent,
  CharacterPassive,
  CharacterActive,
  CharacterUltimate
} from '../types/CharacterTypes'
import {
  executeMobilityAbility,
  executeVisionAbility,
  executeDefensiveAbility,
  executeOffensiveAbility,
  executeUltimateAbility,
  type AbilityContext
} from './AbilityEffects'

// ============================================================================
// ABILITY SYSTEM MANAGER
// ============================================================================

export class AbilitySystem {
  private currentCharacter: PlayableCharacter | null = null
  private characterState: CharacterState | null = null
  
  // Event Callbacks
  private onAbilityUsedCallbacks: Array<(event: CharacterAbilityEvent) => void> = []
  private onUltimateReadyCallbacks: Array<() => void> = []
  
  // Scene Reference (for visual effects)
  private scene: THREE.Scene | null = null
  private camera: THREE.Camera | null = null
  
  // ✨ NEW: Game State References for Ability Effects
  private playerMesh: THREE.Object3D | null = null
  private playerHealth: { current: number; max: number; armor: number } = { current: 100, max: 100, armor: 0 }
  private enemies: Array<{ mesh: THREE.Object3D; health: number; id: string }> = []
  
  // ✨ NEW: Ability Effect Callbacks
  public onSpeedBoost?: (multiplier: number, duration: number) => void
  public onDash?: (direction: THREE.Vector3, distance: number) => void
  public onTeleport?: (targetPosition: THREE.Vector3) => void
  public onHeal?: (amount: number) => void
  public onShield?: (health: number, duration: number) => void
  public onDamage?: (targets: string[], damage: number) => void
  public onStun?: (targets: string[], duration: number) => void
  
  constructor() {
    console.log('⚡ AbilitySystem initialized')
  }

  /**
   * Set game state references (called by Engine)
   */
  setGameState(
    playerMesh: THREE.Object3D,
    playerHealth: { current: number; max: number; armor: number },
    enemies: Array<{ mesh: THREE.Object3D; health: number; id: string }>
  ): void {
    this.playerMesh = playerMesh
    this.playerHealth = playerHealth
    this.enemies = enemies
  }

  /**
   * Set current character
   */
  setCharacter(character: PlayableCharacter): void {
    this.currentCharacter = character
    this.characterState = this.initializeCharacterState(character)
    console.log(`👤 Character set: ${character.name}`)
  }

  /**
   * Set scene references
   */
  setScene(scene: THREE.Scene, camera: THREE.Camera): void {
    this.scene = scene
    this.camera = camera
  }

  /**
   * Initialize character state
   */
  private initializeCharacterState(character: PlayableCharacter): CharacterState {
    return {
      character,
      activeAbility: {
        cooldownRemaining: 0,
        chargesRemaining: character.abilities.active.charges || 1,
        isActive: false,
        activatedAt: 0
      },
      ultimateAbility: {
        charge: 0,
        isReady: false,
        isActive: false,
        activatedAt: 0
      },
      currentModifiers: { ...character.stats }
    }
  }

  // ============================================================================
  // PASSIVE ABILITIES
  // ============================================================================

  /**
   * Apply passive ability modifiers
   */
  applyPassiveAbility(): void {
    if (!this.currentCharacter || !this.characterState) return

    const passive = this.currentCharacter.abilities.passive
    
    // Apply modifiers to character state
    if (passive.modifiers) {
      Object.keys(passive.modifiers).forEach(key => {
        const value = (passive.modifiers as any)[key]
        if (value !== undefined) {
          (this.characterState!.currentModifiers as any)[key] = value
        }
      })
    }

    console.log(`✅ Passive ability applied: ${passive.name}`)
  }

  /**
   * Get current modifiers including passive
   */
  getCurrentModifiers() {
    return this.characterState?.currentModifiers || this.currentCharacter?.stats
  }

  // ============================================================================
  // ACTIVE ABILITIES
  // ============================================================================

  /**
   * Use active ability
   */
  useActiveAbility(origin: THREE.Vector3, direction?: THREE.Vector3): boolean {
    if (!this.currentCharacter || !this.characterState) {
      console.warn('⚠️ No character selected')
      return false
    }

    const ability = this.currentCharacter.abilities.active
    const state = this.characterState.activeAbility

    // Check cooldown
    if (state.cooldownRemaining > 0) {
      console.warn(`⚠️ Ability on cooldown: ${state.cooldownRemaining.toFixed(1)}s`)
      return false
    }

    // Check charges
    if (state.chargesRemaining <= 0) {
      console.warn('⚠️ No charges remaining')
      return false
    }

    // Execute ability based on type
    const success = this.executeActiveAbility(ability, origin, direction)

    if (success) {
      // Update state
      state.isActive = true
      state.activatedAt = Date.now()
      state.cooldownRemaining = ability.cooldown
      state.chargesRemaining--

      // Fire event
      this.fireAbilityEvent({
        characterId: this.currentCharacter.id,
        abilityType: 'active',
        abilityId: ability.id,
        timestamp: Date.now(),
        success: true,
        target: origin
      })

      console.log(`✅ Active ability used: ${ability.name}`)

      // Auto-deactivate after duration
      setTimeout(() => {
        if (this.characterState) {
          this.characterState.activeAbility.isActive = false
        }
      }, ability.duration * 1000)
    }

    return success
  }

  /**
   * Execute active ability effect
   */
  private executeActiveAbility(
    ability: CharacterActive,
    origin: THREE.Vector3,
    direction?: THREE.Vector3
  ): boolean {
    if (!this.scene || !this.camera || !this.playerMesh) {
      console.warn('⚠️ Missing scene/camera/player references')
      return false
    }

    const context: AbilityContext = {
      scene: this.scene,
      camera: this.camera,
      playerMesh: this.playerMesh,
      playerHealth: this.playerHealth,
      enemies: this.enemies,
      onSpeedBoost: this.onSpeedBoost,
      onDash: this.onDash,
      onTeleport: this.onTeleport,
      onHeal: this.onHeal,
      onShield: this.onShield,
      onDamage: this.onDamage,
      onStun: this.onStun
    }

    const effect = ability.effect

    switch (ability.type) {
      case 'mobility':
        return executeMobilityAbility(effect, origin, direction, context)
      
      case 'vision':
        return executeVisionAbility(effect, origin, context)
      
      case 'defensive':
        return executeDefensiveAbility(effect, origin, context)
      
      case 'offensive':
        return executeOffensiveAbility(effect, origin, direction, context)
      
      case 'utility':
        // Utility abilities are handled by specific systems
        console.log(`🔧 Utility ability: ${ability.name}`)
        return true
      
      default:
        console.warn(`Unknown ability type: ${ability.type}`)
        return false
    }
  }

  // ============================================================================
  // ULTIMATE ABILITIES
  // ============================================================================

  /**
   * Charge ultimate ability
   */
  chargeUltimate(amount: number, source: 'damage' | 'kill' | 'time'): void {
    if (!this.currentCharacter || !this.characterState) return

    const ultimate = this.currentCharacter.abilities.ultimate
    const state = this.characterState.ultimateAbility

    // Apply charge multiplier based on source
    let chargeAmount = amount
    switch (source) {
      case 'damage':
        chargeAmount *= ultimate.chargeFromDamage
        break
      case 'kill':
        chargeAmount = ultimate.chargeFromKills
        break
      case 'time':
        chargeAmount = ultimate.chargeOverTime
        break
    }

    // Add charge
    const oldCharge = state.charge
    state.charge = Math.min(state.charge + chargeAmount, ultimate.chargeRequired)

    // Check if ultimate is ready
    if (!state.isReady && state.charge >= ultimate.chargeRequired) {
      state.isReady = true
      console.log(`🌟 ULTIMATE READY: ${ultimate.name}`)
      this.fireUltimateReadyEvent()
    }

    console.log(`⚡ Ultimate charged: ${state.charge.toFixed(0)}/${ultimate.chargeRequired} (+${chargeAmount.toFixed(1)})`)
  }

  /**
   * Use ultimate ability
   */
  useUltimateAbility(origin: THREE.Vector3, target?: THREE.Vector3): boolean {
    if (!this.currentCharacter || !this.characterState) {
      console.warn('⚠️ No character selected')
      return false
    }

    const ultimate = this.currentCharacter.abilities.ultimate
    const state = this.characterState.ultimateAbility

    // Check if ready
    if (!state.isReady || state.charge < ultimate.chargeRequired) {
      console.warn(`⚠️ Ultimate not ready: ${state.charge.toFixed(0)}/${ultimate.chargeRequired}`)
      return false
    }

    // Execute ultimate
    const success = this.executeUltimateAbility(ultimate, origin, target)

    if (success) {
      // Update state
      state.isActive = true
      state.activatedAt = Date.now()
      state.charge = 0
      state.isReady = false

      // Play voice line
      if (ultimate.voiceLine) {
        console.log(`🗣️ "${ultimate.voiceLine}"`)
      }

      // Fire event
      this.fireAbilityEvent({
        characterId: this.currentCharacter.id,
        abilityType: 'ultimate',
        abilityId: ultimate.id,
        timestamp: Date.now(),
        success: true,
        target: origin
      })

      console.log(`🌟 ULTIMATE ACTIVATED: ${ultimate.name}`)

      // Auto-deactivate after duration
      setTimeout(() => {
        if (this.characterState) {
          this.characterState.ultimateAbility.isActive = false
        }
      }, ultimate.duration * 1000)
    }

    return success
  }

  /**
   * Execute ultimate ability effect
   */
  private executeUltimateAbility(
    ultimate: CharacterUltimate,
    origin: THREE.Vector3,
    target?: THREE.Vector3
  ): boolean {
    if (!this.scene || !this.camera || !this.playerMesh) {
      console.warn('⚠️ Missing scene/camera/player references')
      return false
    }

    const context: AbilityContext = {
      scene: this.scene,
      camera: this.camera,
      playerMesh: this.playerMesh,
      playerHealth: this.playerHealth,
      enemies: this.enemies,
      onSpeedBoost: this.onSpeedBoost,
      onDash: this.onDash,
      onTeleport: this.onTeleport,
      onHeal: this.onHeal,
      onShield: this.onShield,
      onDamage: this.onDamage,
      onStun: this.onStun
    }

    const effect = ultimate.effect
    const direction = target ? target.clone().sub(origin).normalize() : undefined

    return executeUltimateAbility(effect, origin, direction, context)
  }

  // ============================================================================
  // UPDATE LOOP
  // ============================================================================

  /**
   * Update ability states (call every frame)
   */
  update(deltaTime: number): void {
    if (!this.characterState) return

    // Update active ability cooldown
    if (this.characterState.activeAbility.cooldownRemaining > 0) {
      this.characterState.activeAbility.cooldownRemaining -= deltaTime
      
      // Recharge when cooldown expires
      if (this.characterState.activeAbility.cooldownRemaining <= 0) {
        this.characterState.activeAbility.cooldownRemaining = 0
        const maxCharges = this.currentCharacter?.abilities.active.charges || 1
        if (this.characterState.activeAbility.chargesRemaining < maxCharges) {
          this.characterState.activeAbility.chargesRemaining++
          console.log('⚡ Active ability recharged!')
        }
      }
    }

    // Passive charge ultimate over time
    if (this.currentCharacter?.abilities.ultimate.chargeOverTime > 0) {
      this.chargeUltimate(deltaTime, 'time')
    }
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  onAbilityUsed(callback: (event: CharacterAbilityEvent) => void): void {
    this.onAbilityUsedCallbacks.push(callback)
  }

  onUltimateReady(callback: () => void): void {
    this.onUltimateReadyCallbacks.push(callback)
  }

  private fireAbilityEvent(event: CharacterAbilityEvent): void {
    this.onAbilityUsedCallbacks.forEach(cb => cb(event))
  }

  private fireUltimateReadyEvent(): void {
    this.onUltimateReadyCallbacks.forEach(cb => cb())
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  isActiveAbilityReady(): boolean {
    return this.characterState?.activeAbility.cooldownRemaining === 0 && 
           this.characterState?.activeAbility.chargesRemaining > 0
  }

  isUltimateReady(): boolean {
    return this.characterState?.ultimateAbility.isReady || false
  }

  getActiveAbilityCooldown(): number {
    return this.characterState?.activeAbility.cooldownRemaining || 0
  }

  getUltimateCharge(): number {
    return this.characterState?.ultimateAbility.charge || 0
  }

  getUltimateChargePercent(): number {
    if (!this.currentCharacter || !this.characterState) return 0
    const required = this.currentCharacter.abilities.ultimate.chargeRequired
    const current = this.characterState.ultimateAbility.charge
    return (current / required) * 100
  }

  getCurrentCharacter(): PlayableCharacter | null {
    return this.currentCharacter
  }

  getCharacterState(): CharacterState | null {
    return this.characterState
  }

  /**
   * Get active ability state
   */
  getActiveAbilityState() {
    return this.characterState?.activeAbility
  }

  /**
   * Get ultimate ability state
   */
  getUltimateAbilityState() {
    return this.characterState?.ultimateAbility
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  destroy(): void {
    this.currentCharacter = null
    this.characterState = null
    this.onAbilityUsedCallbacks = []
    this.onUltimateReadyCallbacks = []
    console.log('🗑️ AbilitySystem destroyed')
  }
}


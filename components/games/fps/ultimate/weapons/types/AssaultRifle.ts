/**
 * 🔫 ASSAULT RIFLE
 * Derived class for assault rifles (M4A1, AK47, etc.)
 * Features: Full-auto, controllable recoil, medium damage
 */

import * as THREE from 'three'
import { BaseWeapon, type ShootResult } from '../BaseWeapon'
import type { WeaponData } from '../data/WeaponData'

export class AssaultRifle extends BaseWeapon {
  constructor(weaponData: WeaponData) {
    super(weaponData)
    this.log('Assault Rifle initialized')
  }

  /**
   * Shoot implementation for assault rifle
   */
  shoot(origin: THREE.Vector3, direction: THREE.Vector3): ShootResult {
    if (!this.canShoot()) {
      return {
        success: false,
        damage: 0,
        origin,
        direction
      }
    }

    // Apply spread based on consecutive shots
    const spread = this.calculateSpread()
    const spreadDirection = this.applySpread(direction, spread)

    // Perform raycast
    const hit = this.performRaycast(origin, spreadDirection, this.data.range)

    // Calculate damage (with falloff over distance)
    let damage = this.data.damage
    if (hit) {
      const distance = origin.distanceTo(hit.point)
      damage = this.calculateDamageFalloff(damage, distance)
      
      // Headshot bonus (if hit point is high on object)
      if (this.isHeadshot(hit)) {
        damage *= this.data.headshotMultiplier
        this.log(`HEADSHOT! Damage: ${damage}`)
      }
    }

    // Consume ammo
    this.consumeAmmo()

    // Log
    if (this.state.currentAmmo === 0) {
      this.log('Magazine empty! Reload!')
    }

    return {
      success: true,
      hit,
      damage,
      origin,
      direction: spreadDirection
    }
  }

  /**
   * Reload implementation for assault rifle
   */
  async reload(): Promise<void> {
    if (!this.canReload()) {
      return
    }

    this.state.isReloading = true
    const reloadTime = this.getReloadTime()
    const isTactical = this.state.currentAmmo > 0

    this.log(`Reloading... (${isTactical ? 'Tactical' : 'Empty'} - ${reloadTime}s)`)

    // Wait for reload time
    await new Promise(resolve => setTimeout(resolve, reloadTime * 1000))

    // Transfer ammo
    this.transferAmmo()

    this.state.isReloading = false
    this.log(`Reload complete! Ammo: ${this.getAmmoString()}`)
  }

  // ============================================================
  // ASSAULT RIFLE SPECIFIC METHODS
  // ============================================================

  /**
   * Calculate spread based on consecutive shots
   */
  private calculateSpread(): number {
    let spread = this.data.baseSpread

    // Spray penalty (more consecutive shots = more spread)
    spread *= (1 + this.state.consecutiveShots * 0.1)

    // First shot accuracy bonus
    if (this.state.consecutiveShots === 0) {
      spread *= 0.5
    }

    return spread
  }

  /**
   * Apply spread to direction
   */
  private applySpread(direction: THREE.Vector3, spreadAmount: number): THREE.Vector3 {
    const spreadDir = direction.clone()
    spreadDir.x += (Math.random() - 0.5) * spreadAmount
    spreadDir.y += (Math.random() - 0.5) * spreadAmount
    spreadDir.z += (Math.random() - 0.5) * spreadAmount
    return spreadDir.normalize()
  }

  /**
   * Calculate damage falloff over distance
   */
  private calculateDamageFalloff(baseDamage: number, distance: number): number {
    const effectiveRange = this.data.range
    
    if (distance <= effectiveRange * 0.3) {
      // Close range: full damage
      return baseDamage
    } else if (distance <= effectiveRange) {
      // Medium range: 70-100% damage
      const falloffFactor = 1 - ((distance - effectiveRange * 0.3) / (effectiveRange * 0.7)) * 0.3
      return baseDamage * falloffFactor
    } else {
      // Long range: 50-70% damage
      const falloffFactor = Math.max(0.5, 1 - (distance / (effectiveRange * 2)))
      return baseDamage * falloffFactor
    }
  }

  /**
   * Check if hit is headshot (simple Y-position check)
   */
  private isHeadshot(hit: THREE.Intersection): boolean {
    // If hit point is in upper 20% of object, consider it headshot
    const object = hit.object
    const bbox = new THREE.Box3().setFromObject(object)
    const height = bbox.max.y - bbox.min.y
    const hitHeight = hit.point.y - bbox.min.y
    
    return hitHeight > height * 0.8
  }

  /**
   * Get recoil amount for this shot
   */
  getRecoilForShot(): { vertical: number; horizontal: number } {
    const shotIndex = Math.min(
      this.state.consecutiveShots, 
      this.data.recoilPattern.vertical.length - 1
    )
    
    return {
      vertical: this.data.recoilPattern.vertical[shotIndex],
      horizontal: this.data.recoilPattern.horizontal[shotIndex]
    }
  }
}


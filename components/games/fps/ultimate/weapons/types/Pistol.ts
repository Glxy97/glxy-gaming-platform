/**
 * 🔫 PISTOL
 * Derived class for pistols (Desert Eagle, Glock, etc.)
 * Features: Semi-auto, fast switch, medium damage, accurate
 */

import * as THREE from 'three'
import { BaseWeapon, type ShootResult } from '../BaseWeapon'
import type { WeaponData } from '../data/WeaponData'

export class Pistol extends BaseWeapon {
  constructor(weaponData: WeaponData) {
    super(weaponData)
    this.log('Pistol initialized')
  }

  /**
   * Shoot implementation for pistol
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

    // Apply spread
    const spread = this.calculateSpread()
    const spreadDirection = this.applySpread(direction, spread)

    // Perform raycast
    const hit = this.performRaycast(origin, spreadDirection, this.data.range) ?? undefined

    // Calculate damage
    let damage = this.data.damage
    if (hit) {
      const distance = origin.distanceTo(hit.point)
      damage = this.calculateDamageFalloff(damage, distance)
      
      // Headshot bonus
      if (this.isHeadshot(hit)) {
        damage *= this.data.headshotMultiplier
        this.log(`HEADSHOT! Damage: ${damage}`)
      }
    }

    // Consume ammo
    this.consumeAmmo()

    // Log
    if (this.state.currentAmmo === 0) {
      this.log('Magazine empty!')
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
   * Reload implementation for pistol
   */
  async reload(): Promise<void> {
    if (!this.canReload()) {
      return
    }

    this.state.isReloading = true
    const reloadTime = this.getReloadTime()
    const isTactical = this.state.currentAmmo > 0

    this.log(`Reloading... (${isTactical ? 'Tactical' : 'Empty'} - ${reloadTime}s)`)

    // Pistol reload is relatively fast
    await new Promise(resolve => setTimeout(resolve, reloadTime * 1000))

    // Transfer ammo
    this.transferAmmo()

    this.state.isReloading = false
    this.log(`Reload complete! Ammo: ${this.getAmmoString()}`)
  }

  // ============================================================
  // PISTOL SPECIFIC METHODS
  // ============================================================

  /**
   * Calculate spread
   */
  private calculateSpread(): number {
    let spread = this.data.baseSpread

    // Pistol has moderate spray penalty
    spread *= (1 + this.state.consecutiveShots * 0.15)

    // First shot is very accurate
    if (this.state.consecutiveShots === 0) {
      spread *= 0.4
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
   * Calculate damage falloff (pistols falloff faster than rifles)
   */
  private calculateDamageFalloff(baseDamage: number, distance: number): number {
    const effectiveRange = this.data.range
    
    if (distance <= effectiveRange * 0.2) {
      // Close range: full damage
      return baseDamage
    } else if (distance <= effectiveRange) {
      // Medium range: 60-100% damage (faster falloff than rifle)
      const falloffFactor = 1 - ((distance - effectiveRange * 0.2) / (effectiveRange * 0.8)) * 0.4
      return baseDamage * falloffFactor
    } else {
      // Long range: 30-60% damage
      const falloffFactor = Math.max(0.3, 0.6 - (distance - effectiveRange) / effectiveRange * 0.3)
      return baseDamage * falloffFactor
    }
  }

  /**
   * Check if hit is headshot
   */
  private isHeadshot(hit: THREE.Intersection): boolean {
    const object = hit.object
    const bbox = new THREE.Box3().setFromObject(object)
    const height = bbox.max.y - bbox.min.y
    const hitHeight = hit.point.y - bbox.min.y
    
    // Pistol headshot detection (top 20%)
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

  /**
   * Pistols are lightweight - faster switch time
   */
  getFastSwitchBonus(): number {
    return 0.3 // 30% faster switch
  }
}


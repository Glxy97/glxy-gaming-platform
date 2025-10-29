/**
 * 🎯 SNIPER RIFLE
 * Derived class for sniper rifles (AWP, Barrett, etc.)
 * Features: High damage, long range, slow fire rate, bolt-action
 */

import * as THREE from 'three'
import { BaseWeapon, type ShootResult } from '../BaseWeapon'
import type { WeaponData } from '../data/WeaponData'

export class SniperRifle extends BaseWeapon {
  private isBoltActionAnimating: boolean = false

  constructor(weaponData: WeaponData) {
    super(weaponData)
    this.log('Sniper Rifle initialized')
  }

  /**
   * Shoot implementation for sniper rifle
   */
  shoot(origin: THREE.Vector3, direction: THREE.Vector3): ShootResult {
    if (!this.canShoot() || this.isBoltActionAnimating) {
      return {
        success: false,
        damage: 0,
        origin,
        direction
      }
    }

    // Minimal spread for sniper (high accuracy)
    const spread = this.calculateSpread()
    const spreadDirection = this.applySpread(direction, spread)

    // Perform raycast (long range!)
    const hit = this.performRaycast(origin, spreadDirection, this.data.range)

    // High base damage
    let damage = this.data.damage
    if (hit) {
      // Headshot is LETHAL
      if (this.isHeadshot(hit)) {
        damage *= this.data.headshotMultiplier
        this.log(`💀 HEADSHOT! Instant kill! Damage: ${damage}`)
      } else {
        this.log(`Hit! Damage: ${damage}`)
      }
    }

    // Consume ammo
    this.consumeAmmo()

    // Bolt-action animation delay
    this.playBoltAction()

    // Log
    if (this.state.currentAmmo === 0) {
      this.log('Out of ammo! Reload!')
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
   * Reload implementation for sniper rifle
   */
  async reload(): Promise<void> {
    if (!this.canReload()) {
      return
    }

    this.state.isReloading = true
    const reloadTime = this.getReloadTime()

    this.log(`Reloading... (${reloadTime}s)`)

    // Sniper reload is slower and more deliberate
    await new Promise(resolve => setTimeout(resolve, reloadTime * 1000))

    // Transfer ammo
    this.transferAmmo()

    this.state.isReloading = false
    this.log(`Reload complete! Ammo: ${this.getAmmoString()}`)
  }

  // ============================================================
  // SNIPER RIFLE SPECIFIC METHODS
  // ============================================================

  /**
   * Calculate spread (very low for sniper!)
   */
  private calculateSpread(): number {
    let spread = this.data.baseSpread

    // Sniper has minimal spray penalty (it's bolt-action anyway)
    spread *= (1 + this.state.consecutiveShots * 0.02)

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
   * Check if hit is headshot
   */
  private isHeadshot(hit: THREE.Intersection): boolean {
    // Sniper has stricter headshot detection (top 15% of object)
    const object = hit.object
    const bbox = new THREE.Box3().setFromObject(object)
    const height = bbox.max.y - bbox.min.y
    const hitHeight = hit.point.y - bbox.min.y
    
    return hitHeight > height * 0.85
  }

  /**
   * Play bolt-action animation (blocks shooting temporarily)
   */
  private async playBoltAction(): Promise<void> {
    this.isBoltActionAnimating = true
    
    // Bolt-action delay (200ms)
    await new Promise(resolve => setTimeout(resolve, 200))
    
    this.isBoltActionAnimating = false
  }

  /**
   * Get recoil amount for this shot (sniper has HIGH kick!)
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
   * Override canShoot to include bolt-action check
   */
  override canShoot(): boolean {
    return super.canShoot() && !this.isBoltActionAnimating
  }
}


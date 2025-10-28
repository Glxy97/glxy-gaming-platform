import * as THREE from 'three'

export interface WeaponDef {
  id: string
  name: string
  type: 'rifle' | 'pistol' | 'sniper' | 'shotgun' | 'smg'
  ammoType: string
  damage: number
  fireRate: number // shots per second
  magazineSize: number
  reloadTime: number
  recoil: {
    horizontal: number
    vertical: number
    recovery: number
  }
  spread: {
    min: number
    max: number
    increase: number
    decrease: number
  }
  range: number
  penetration: number
  firstPersonModel: {
    scale: [number, number, number]
    position: [number, number, number]
    rotation: [number, number, number]
  }
  animations: {
    fire: string
    reload: string
    idle: string
    draw: string
    holster: string
  }
  sounds: {
    fire: string
    reload: string
    empty: string
  }
}

export interface AmmoDef {
  id: string
  name: string
  caliber: string
  muzzleVelocity: number
  mass: number
  dragCoefficient: number
  damageBase: number
  falloffRanges: number[]
  falloffDamages: number[]
}

export class WeaponCore {
  private weapon: WeaponDef
  private ammo: AmmoDef
  private currentAmmo: number
  private totalAmmo: number
  private lastFireTime: number = 0
  private currentSpread: number = 0
  private isReloading: boolean = false
  private reloadStartTime: number = 0

  constructor(weapon: WeaponDef, ammo: AmmoDef) {
    this.weapon = weapon
    this.ammo = ammo
    this.currentAmmo = weapon.magazineSize
    this.totalAmmo = weapon.magazineSize * 4 // Start with 4 magazines
  }

  canFire(): boolean {
    const now = Date.now()
    const fireInterval = 1000 / this.weapon.fireRate
    return (
      !this.isReloading &&
      this.currentAmmo > 0 &&
      now - this.lastFireTime >= fireInterval
    )
  }

  fire(): boolean {
    if (!this.canFire()) return false

    this.currentAmmo--
    this.lastFireTime = Date.now()
    
    // Increase spread
    this.currentSpread = Math.min(
      this.currentSpread + this.weapon.spread.increase,
      this.weapon.spread.max
    )

    return true
  }

  update(deltaTime: number): void {
    // Decrease spread over time
    if (this.currentSpread > this.weapon.spread.min) {
      this.currentSpread = Math.max(
        this.currentSpread - this.weapon.spread.decrease * deltaTime,
        this.weapon.spread.min
      )
    }

    // Check reload completion
    if (this.isReloading) {
      const now = Date.now()
      if (now - this.reloadStartTime >= this.weapon.reloadTime * 1000) {
        this.completeReload()
      }
    }
  }

  startReload(): boolean {
    if (this.isReloading || this.currentAmmo === this.weapon.magazineSize) {
      return false
    }

    if (this.totalAmmo <= 0) {
      return false // No ammo to reload
    }

    this.isReloading = true
    this.reloadStartTime = Date.now()
    return true
  }

  completeReload(): void {
    const ammoNeeded = this.weapon.magazineSize - this.currentAmmo
    const ammoAvailable = Math.min(ammoNeeded, this.totalAmmo)
    
    this.currentAmmo += ammoAvailable
    this.totalAmmo -= ammoAvailable
    this.isReloading = false
  }

  getSpread(): number {
    return this.currentSpread
  }

  getRecoil(): { horizontal: number; vertical: number } {
    return {
      horizontal: (Math.random() - 0.5) * this.weapon.recoil.horizontal,
      vertical: Math.random() * this.weapon.recoil.vertical
    }
  }

  getAmmoStatus(): { current: number; total: number; isReloading: boolean } {
    return {
      current: this.currentAmmo,
      total: this.totalAmmo,
      isReloading: this.isReloading
    }
  }

  getState(): { heat: number; isReloading: boolean } {
    // Calculate heat based on current spread
    const maxSpread = this.weapon.spread.max - this.weapon.spread.min
    const currentSpread = this.currentSpread - this.weapon.spread.min
    const heat = maxSpread > 0 ? currentSpread / maxSpread : 0
    
    return {
      heat: Math.min(1, Math.max(0, heat)),
      isReloading: this.isReloading
    }
  }

  getWeapon(): WeaponDef {
    return this.weapon
  }

  getAmmo(): AmmoDef {
    return this.ammo
  }
}
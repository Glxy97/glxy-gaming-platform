// @ts-nocheck
import * as THREE from 'three'
import { WeaponCore, WeaponDef } from './weapon-core'

export type WeaponSlot = 'primary' | 'secondary' | 'melee' | 'equipment'

export class WeaponSelector {
  private camera: THREE.Camera
  private scene: THREE.Scene
  private weapons: Map<WeaponSlot, WeaponCore> = new Map()
  private currentSlot: WeaponSlot = 'primary'
  private weaponModels: Map<WeaponSlot, THREE.Group> = new Map()

  constructor(camera: THREE.Camera, scene: THREE.Scene) {
    this.camera = camera
    this.scene = scene
  }

  equipWeapon(slot: WeaponSlot, weaponDef: WeaponDef): void {
    // Create ammo definition (simplified for now)
    const ammoDef = {
      id: weaponDef.ammoType,
      name: weaponDef.ammoType,
      caliber: 'standard',
      muzzleVelocity: 900,
      mass: 0.01,
      dragCoefficient: 0.3,
      damageBase: weaponDef.damage,
      falloffRanges: [0, 50, 100, 200, 400],
      falloffDamages: [weaponDef.damage, weaponDef.damage * 0.9, weaponDef.damage * 0.7, weaponDef.damage * 0.5, weaponDef.damage * 0.3]
    }

    const weapon = new WeaponCore(weaponDef, ammoDef)
    this.weapons.set(slot, weapon)

    // Create weapon model (simplified representation)
    this.createWeaponModel(slot, weaponDef)
  }

  private createWeaponModel(slot: WeaponSlot, weaponDef: WeaponDef): void {
    const group = new THREE.Group()
    
    // Create a simple weapon representation
    const geometry = new THREE.BoxGeometry(0.1, 0.3, 0.8)
    const material = new THREE.MeshLambertMaterial({ color: 0x333333 })
    const mesh = new THREE.Mesh(geometry, material)
    group.add(mesh)

    // Position weapon in first-person view
    const [x, y, z] = weaponDef.firstPersonModel.position
    const [rx, ry, rz] = weaponDef.firstPersonModel.rotation
    const [sx, sy, sz] = weaponDef.firstPersonModel.scale

    group.position.set(x, y, z)
    group.rotation.set(rx, ry, rz)
    group.scale.set(sx, sy, sz)

    // Hide initially
    group.visible = false

    this.weaponModels.set(slot, group)
    this.scene.add(group)
  }

  switchToSlot(slot: WeaponSlot): void {
    if (!this.weapons.has(slot)) return

    // Hide current weapon
    const currentModel = this.weaponModels.get(this.currentSlot)
    if (currentModel) {
      currentModel.visible = false
    }

    // Show new weapon
    this.currentSlot = slot
    const newModel = this.weaponModels.get(slot)
    if (newModel) {
      newModel.visible = true
    }
  }

  fire(timestamp: number): boolean {
    const weapon = this.getCurrentWeapon()
    if (!weapon) return false

    return weapon.fire()
  }

  getCurrentWeapon(): WeaponCore | null {
    return this.weapons.get(this.currentSlot) || null
  }

  getCurrentSlot(): WeaponSlot {
    return this.currentSlot
  }

  updateWeaponPositions(): void {
    // Update weapon positions to follow camera
    this.weaponModels.forEach((model, slot) => {
      if (slot === this.currentSlot) {
        // Weapon should follow camera
        model.position.copy(this.camera.position)
        model.rotation.copy(this.camera.rotation)
        
        // Apply first-person offset
        const weapon = this.weapons.get(slot)
        if (weapon) {
          const weaponDef = weapon.getWeapon()
          const [x, y, z] = weaponDef.firstPersonModel.position
          
          // Transform offset by camera rotation
          const offset = new THREE.Vector3(x, y, z)
          offset.applyQuaternion(this.camera.quaternion)
          model.position.add(offset)
        }
      }
    })
  }

  handleKeyDown(event: KeyboardEvent): void {
    const weapon = this.getCurrentWeapon()
    if (!weapon) return

    switch (event.key.toLowerCase()) {
      case 'r':
        weapon.startReload()
        break
      case '1':
        this.switchToSlot('primary')
        break
      case '2':
        this.switchToSlot('secondary')
        break
      case '3':
        this.switchToSlot('melee')
        break
      case '4':
        this.switchToSlot('equipment')
        break
    }
  }

  update(deltaTime: number): void {
    // Update all weapons
    this.weapons.forEach(weapon => {
      weapon.update(deltaTime)
    })

    // Update weapon positions
    this.updateWeaponPositions()
  }

  getAllSlots(): any[] {
    const slots = []
    for (const [slotName, weapon] of this.weapons) {
      const weaponDef = weapon.getWeapon()
      const ammoStatus = weapon.getAmmoStatus()
      slots.push({
        slot: slotName,
        name: weaponDef.name,
        ammo: ammoStatus.current,
        isActive: slotName === this.currentSlot,
        weapon: weapon
      })
    }
    return slots
  }

  get activeSlotId(): string | null {
    return this.currentSlot
  }

  dispose(): void {
    // Clean up weapon models
    this.weaponModels.forEach(model => {
      this.scene.remove(model)
      model.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    })
    this.weaponModels.clear()
    this.weapons.clear()
  }
}
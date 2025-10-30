/**
 * Weapon Pack Loader
 * 
 * Extrahiert einzelne Waffen aus Multi-Model GLB-Dateien
 * Optimiert für low_poly_gun_pack_-_weapon_pack_assets.glb
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

export interface WeaponPackConfig {
  packPath: string
  weapons: {
    [key: string]: {
      meshName: string // Name des Mesh im GLB
      scale: number
      position: { x: number; y: number; z: number }
      rotation: { x: number; y: number; z: number }
    }
  }
}

/**
 * Weapon Pack Configuration für low_poly_gun_pack
 */
export const LOW_POLY_WEAPON_PACK: WeaponPackConfig = {
  packPath: '/models/low_poly_gun_pack_-_weapon_pack_assets.glb',
  weapons: {
    // Werden beim ersten Load automatisch erkannt
    // User kann später spezifische Mesh-Namen konfigurieren
  }
}

/**
 * Lädt und extrahiert einzelne Waffen aus einem Weapon Pack
 */
export class WeaponPackLoader {
  private loader: GLTFLoader
  private dracoLoader: DRACOLoader | null = null
  private loadedPacks: Map<string, THREE.Group> = new Map()
  private weaponCache: Map<string, THREE.Group> = new Map()

  constructor() {
    this.loader = new GLTFLoader()
    
    try {
      this.dracoLoader = new DRACOLoader()
      this.dracoLoader.setDecoderPath('/draco/')
      this.loader.setDRACOLoader(this.dracoLoader)
    } catch (error) {
      console.warn('⚠️ DRACO Loader not available')
    }
  }

  /**
   * Lädt ein Weapon Pack und listet alle verfügbaren Waffen
   */
  async loadPack(packPath: string): Promise<string[]> {
    try {
      console.log(`🔫 Loading weapon pack: ${packPath}`)
      
      const gltf = await this.loader.loadAsync(packPath)
      const packGroup = gltf.scene
      
      // Speichere das Pack
      this.loadedPacks.set(packPath, packGroup)
      
      // Analysiere alle Meshes im Pack
      const weaponNames: string[] = []
      packGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          if (mesh.name && mesh.name !== 'Scene') {
            weaponNames.push(mesh.name)
            console.log(`  ✅ Found weapon mesh: ${mesh.name}`)
          }
        }
      })
      
      console.log(`✅ Weapon pack loaded: ${weaponNames.length} weapons found`)
      return weaponNames
      
    } catch (error) {
      console.error(`❌ Failed to load weapon pack: ${packPath}`, error)
      throw error
    }
  }

  /**
   * Extrahiert eine spezifische Waffe aus dem Pack
   */
  async extractWeapon(
    packPath: string,
    weaponMeshName: string,
    config?: {
      scale?: number
      position?: { x: number; y: number; z: number }
      rotation?: { x: number; y: number; z: number }
    }
  ): Promise<THREE.Group> {
    // Cache-Check
    const cacheKey = `${packPath}:${weaponMeshName}`
    if (this.weaponCache.has(cacheKey)) {
      return this.weaponCache.get(cacheKey)!.clone()
    }

    // Pack laden falls nicht bereits geladen
    if (!this.loadedPacks.has(packPath)) {
      await this.loadPack(packPath)
    }

    const pack = this.loadedPacks.get(packPath)!
    
    // Finde das Weapon Mesh
    let weaponMesh: THREE.Mesh | null = null
    pack.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name === weaponMeshName) {
        weaponMesh = child as THREE.Mesh
      }
    })

    if (!weaponMesh) {
      throw new Error(`Weapon mesh not found: ${weaponMeshName}`)
    }

    // Erstelle isolierte Weapon Group
    const weaponGroup = new THREE.Group()
    // ✅ TypeScript: weaponMesh ist hier definitiv THREE.Mesh (nicht null)
    const clonedMesh = (weaponMesh as THREE.Mesh).clone()
    weaponGroup.add(clonedMesh)

    // Wende Konfiguration an
    if (config) {
      if (config.scale) {
        weaponGroup.scale.setScalar(config.scale)
      }
      if (config.position) {
        weaponGroup.position.set(config.position.x, config.position.y, config.position.z)
      }
      if (config.rotation) {
        weaponGroup.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z)
      }
    }

    // Setup Shadows & Materials
    weaponGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        
        // Professional Weapon Material
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          mat.metalness = 0.9
          mat.roughness = 0.3
        }
      }
    })

    // Cache weapon
    this.weaponCache.set(cacheKey, weaponGroup.clone())
    
    console.log(`✅ Extracted weapon: ${weaponMeshName}`)
    return weaponGroup
  }

  /**
   * Listet alle verfügbaren Waffen in einem Pack
   */
  getAvailableWeapons(packPath: string): string[] {
    const pack = this.loadedPacks.get(packPath)
    if (!pack) return []

    const weapons: string[] = []
    pack.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name !== 'Scene') {
        weapons.push(child.name)
      }
    })
    return weapons
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.loadedPacks.clear()
    this.weaponCache.clear()
    if (this.dracoLoader) {
      this.dracoLoader.dispose()
    }
  }
}


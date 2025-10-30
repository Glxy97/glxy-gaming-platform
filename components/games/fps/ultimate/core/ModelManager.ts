import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { WeaponPackLoader } from '../models/WeaponPackLoader'
import { ProfessionalCharacterLoader } from '../models/ProfessionalCharacterLoader'

/**
 * ModelManager - Professional 3D Model Loading & Caching System
 * 
 * Features:
 * - Model-Caching (Map<string, THREE.Group>)
 * - DRACO-Loader für komprimierte Models
 * - Animation-Mixer Support (Map<string, THREE.AnimationMixer>)
 * - Error Handling mit Fallback
 * - Graceful Degradation wenn DRACO fehlt
 */
export class ModelManager {
  private cache: Map<string, THREE.Group> = new Map()
  private mixers: Map<string, THREE.AnimationMixer> = new Map()
  private loader: GLTFLoader
  private dracoLoader: DRACOLoader | null = null
  private dracoEnabled: boolean = false
  
  // ✅ BESTE INTEGRATION: Professional Asset Loaders
  private weaponPackLoader: WeaponPackLoader
  private characterLoader: ProfessionalCharacterLoader

  constructor() {
    this.loader = new GLTFLoader()
    this.weaponPackLoader = new WeaponPackLoader()
    this.characterLoader = new ProfessionalCharacterLoader()
    
    // Try to setup DRACO Loader (graceful degradation if not available)
    try {
      this.dracoLoader = new DRACOLoader()
      this.dracoLoader.setDecoderPath('/draco/')
      this.loader.setDRACOLoader(this.dracoLoader)
      this.dracoEnabled = true
      console.log('✅ DRACO Loader initialized')
    } catch (error) {
      console.warn('⚠️ DRACO Loader not available, loading without compression:', error)
      this.dracoEnabled = false
    }
  }

  /**
   * Load a 3D model with caching support
   * @param url - Path to the model file
   * @param id - Unique identifier for animation mixer
   * @returns Promise<THREE.Group> - The loaded model (always cloned)
   */
  async loadModel(url: string, id: string): Promise<THREE.Group> {
    // Check cache first
    if (this.cache.has(url)) {
      console.log(`✅ Model loaded from cache: ${url}`)
      const cachedModel = this.cache.get(url)!
      
      // KRITISCH: IMMER clone() für Instanziierung! Verhindert shared state
      const clonedModel = cachedModel.clone()
      
      // Animation-Mixer für geklontes Model erstellen (wenn Animationen vorhanden)
      // Prüfe ob bereits ein Mixer für diese URL existiert (für Animation-Daten)
      if (!this.mixers.has(id)) {
        // Lade Model nochmal nur für Animation-Daten (falls nicht bereits geladen)
        // Oder speichere Animation-Clips separat
        try {
          const gltf = await this.loader.loadAsync(url)
          if (gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(clonedModel)
            gltf.animations.forEach((clip) => {
              mixer.clipAction(clip).play()
            })
            this.mixers.set(id, mixer)
            console.log(`✅ Animations loaded for cloned model: ${id} (${gltf.animations.length} clips)`)
          }
        } catch (error) {
          // Stille - kein Log für fehlende Animationen bei gecachten Models
        }
      }
      
      return clonedModel
    }
    
    try {
      // ✅ Model-Loading mit 10s Timeout (größere Dateien brauchen länger)
      const loadPromise = this.loader.loadAsync(url)
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Model loading timeout')), 10000)
      )
      
      const gltf = await Promise.race([loadPromise, timeoutPromise])
      const model = gltf.scene.clone() // Clone for return
      
      // Setup animations
      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model)
        gltf.animations.forEach((clip) => {
          mixer.clipAction(clip).play()
        })
        this.mixers.set(id, mixer)
        console.log(`✅ Animations loaded for: ${id} (${gltf.animations.length} clips)`)
      }
      
      // Cache original model (not cloned instance)
      const cacheModel = gltf.scene.clone()
      this.cache.set(url, cacheModel)
      
      console.log(`✅ Model loaded & cached: ${url}`)
      return model
    } catch (error) {
      // ✅ Werfe Error mit klarer Meldung, Caller entscheidet über Fallback
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to load model: ${url} (${errorMsg})`)
    }
  }

  /**
   * Update all animation mixers (only for visible models)
   * @param deltaTime - Time delta in seconds
   * @param camera - Camera for frustum culling
   */
  updateAnimationMixers(deltaTime: number, camera?: THREE.Camera): void {
    if (camera) {
      // PERFORMANCE: Nur sichtbare Models aktualisieren
      const frustum = new THREE.Frustum()
      const cameraMatrix = new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      )
      frustum.setFromProjectionMatrix(cameraMatrix)
      
      this.mixers.forEach((mixer, id) => {
        const root = mixer.getRoot() as THREE.Group
        if (root && root.visible) {
          // Prüfe ob Model im Frustum ist
          const worldPosition = new THREE.Vector3()
          root.getWorldPosition(worldPosition)
          
          // Verwende BoundingSphere für frustum check (schneller als Box)
          const boundingSphere = new THREE.Sphere(worldPosition, 2) // Radius 2 Units
          
          if (frustum.containsPoint(worldPosition) || frustum.intersectsSphere(boundingSphere)) {
            mixer.update(deltaTime)
          }
        } else {
          // Auch aktualisieren wenn kein Camera-Check möglich oder root nicht verfügbar
          mixer.update(deltaTime)
        }
      })
    } else {
      // Fallback: Alle Mixer aktualisieren wenn keine Camera verfügbar
      this.mixers.forEach((mixer) => {
        mixer.update(deltaTime)
      })
    }
  }

  /**
   * Get cached model (without cloning)
   * @param url - Path to the model file
   * @returns THREE.Group | undefined - The cached model
   */
  getCachedModel(url: string): THREE.Group | undefined {
    return this.cache.get(url)
  }

  /**
   * Remove animation mixer for a specific model ID
   * @param id - Unique identifier for animation mixer
   */
  removeAnimationMixer(id: string): void {
    const mixer = this.mixers.get(id)
    if (mixer) {
      mixer.stopAllAction()
      mixer.uncacheRoot(mixer.getRoot())
      this.mixers.delete(id)
      console.log(`✅ Animation mixer removed: ${id}`)
    }
  }

  /**
   * ✅ NEUE METHODE: Lade Waffe aus Weapon Pack
   */
  async loadWeaponFromPack(
    weaponMeshName: string,
    id: string,
    config?: {
      scale?: number
      position?: { x: number; y: number; z: number }
      rotation?: { x: number; y: number; z: number }
    }
  ): Promise<THREE.Group> {
    const cacheKey = `weapon_pack:${weaponMeshName}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!.clone()
    }

    try {
      const weapon = await this.weaponPackLoader.extractWeapon(
        '/models/low_poly_gun_pack_-_weapon_pack_assets.glb',
        weaponMeshName,
        config
      )
      
      this.cache.set(cacheKey, weapon.clone())
      return weapon
    } catch (error) {
      console.warn(`⚠️ Failed to load weapon from pack: ${weaponMeshName}`)
      throw error
    }
  }

  /**
   * ✅ BESTE METHODE: Smart Player Character Loading
   */
  async loadPlayerCharacter(characterId?: string): Promise<THREE.Group> {
    const cacheKey = `player:smart`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!.clone()
    }

    try {
      // Smart Asset Selection - BESTE Player Character aus Database
      const character = await this.characterLoader.loadCharacterSmart('player')
      this.cache.set(cacheKey, character.clone())
      return character
    } catch (error) {
      console.warn(`⚠️ Failed to load smart player character, trying fallback...`)
      
      // Fallback zu old method
      try {
        const fallback = await this.characterLoader.loadPlayerCharacter('tactical_operator_high')
        this.cache.set(cacheKey, fallback.clone())
        return fallback
      } catch (fallbackError) {
        console.error('❌ All player character loading methods failed')
        throw fallbackError
      }
    }
  }

  /**
   * ✅ BESTE METHODE: Smart Enemy Character Loading mit Auto-LOD
   */
  async loadEnemyCharacter(
    characterId?: string,
    distance: number = 20
  ): Promise<THREE.Group> {
    const distanceGroup = Math.floor(distance / 20)
    const cacheKey = `enemy:smart:${distanceGroup}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!.clone()
    }

    try {
      // Smart Asset Selection - BESTE Enemy Character aus Database mit LOD
      const character = await this.characterLoader.loadCharacterSmart('enemy', distance)
      this.cache.set(cacheKey, character.clone())
      return character
    } catch (error) {
      console.warn(`⚠️ Failed to load smart enemy character, trying fallback...`)
      
      // Fallback zu old method
      try {
        const fallback = await this.characterLoader.loadEnemyCharacter('tactical_operator_optimized', distance)
        this.cache.set(cacheKey, fallback.clone())
        return fallback
      } catch (fallbackError) {
        console.error('❌ All enemy character loading methods failed')
        throw fallbackError
      }
    }
  }

  /**
   * ✅ NEUE METHODE: Liste verfügbare Waffen im Pack
   */
  async getWeaponPackInventory(): Promise<string[]> {
    try {
      return await this.weaponPackLoader.loadPack(
        '/models/low_poly_gun_pack_-_weapon_pack_assets.glb'
      )
    } catch (error) {
      console.warn('⚠️ Failed to load weapon pack inventory')
      return []
    }
  }

  /**
   * Clear all cached models (for cleanup)
   */
  clearCache(): void {
    this.cache.clear()
    this.mixers.forEach((mixer) => {
      mixer.stopAllAction()
    })
    this.mixers.clear()
    this.weaponPackLoader.dispose()
    this.characterLoader.dispose()
    console.log('✅ Model cache cleared')
  }

  /**
   * Check if DRACO is enabled
   */
  isDracoEnabled(): boolean {
    return this.dracoEnabled
  }
}


/**
 * GLB Maps Loader
 * 
 * Lädt echte 3D GLB-Maps aus /public/data/map-templates/
 * Simpler Ansatz: GLB direkt in Scene laden
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

export interface GLBMapConfig {
  id: string
  name: string
  path: string
  scale?: number
  rotation?: { x: number; y: number; z: number }
  position?: { x: number; y: number; z: number }
}

export const AVAILABLE_GLB_MAPS: GLBMapConfig[] = [
  {
    id: 'warface_neon',
    name: 'Warface Neon Arena',
    path: '/data/map-templates/fps-map-pvp-pve-game-neon/source/Warfacemap .glb',
    scale: 1.0,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'police_office',
    name: 'Police Office',
    path: '/data/map-templates/police-office/source/Police_Office.glb',
    scale: 1.0,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'dead_city',
    name: 'Dead City',
    path: '/data/map-templates/dead-city-1/source/Dead_City.glb',
    scale: 1.0,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'graveyard',
    name: 'Graveyard',
    path: '/data/map-templates/graveyard/source/Graveyard.glb',
    scale: 1.0,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'retro_arena',
    name: 'Retro Arena',
    path: '/data/map-templates/fps-horde-arena-retro-80s/source/Retro_Arena.glb',
    scale: 1.0,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 }
  }
]

/**
 * Lädt eine GLB-Map direkt in die Scene
 */
export class GLBMapsLoader {
  private loader: GLTFLoader
  private dracoLoader: DRACOLoader | null = null

  constructor() {
    this.loader = new GLTFLoader()
    
    // Optional: DRACO Compression
    try {
      this.dracoLoader = new DRACOLoader()
      this.dracoLoader.setDecoderPath('/draco/')
      this.loader.setDRACOLoader(this.dracoLoader)
    } catch (error) {
      console.warn('⚠️ DRACO Loader not available')
    }
  }

  /**
   * Lädt eine GLB-Map
   */
  async loadGLBMap(mapId: string): Promise<THREE.Group> {
    const mapConfig = AVAILABLE_GLB_MAPS.find(m => m.id === mapId)
    if (!mapConfig) {
      throw new Error(`Map not found: ${mapId}`)
    }

    console.log(`🗺️ Loading GLB Map: ${mapConfig.name}`)

    try {
      const gltf = await this.loader.loadAsync(mapConfig.path)
      const mapGroup = gltf.scene

      // Anwenden von Scale, Rotation, Position
      if (mapConfig.scale) {
        mapGroup.scale.setScalar(mapConfig.scale)
      }
      if (mapConfig.rotation) {
        mapGroup.rotation.set(
          mapConfig.rotation.x,
          mapConfig.rotation.y,
          mapConfig.rotation.z
        )
      }
      if (mapConfig.position) {
        mapGroup.position.set(
          mapConfig.position.x,
          mapConfig.position.y,
          mapConfig.position.z
        )
      }

      // Shadows aktivieren
      mapGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          mesh.castShadow = true
          mesh.receiveShadow = true
          
          // ✅ WICHTIG: Markiere für Physics & Wallrun
          mesh.userData.isStatic = true
          mesh.userData.type = 'WORLD'
        }
      })

      console.log(`✅ GLB Map loaded: ${mapConfig.name}`)
      return mapGroup

    } catch (error) {
      console.error(`❌ Failed to load GLB map: ${mapConfig.name}`, error)
      throw error
    }
  }

  /**
   * Liste aller verfügbaren Maps
   */
  getAvailableMaps(): GLBMapConfig[] {
    return AVAILABLE_GLB_MAPS
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.dracoLoader) {
      this.dracoLoader.dispose()
    }
  }
}


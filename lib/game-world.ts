// @ts-nocheck
/**
 * GLXY Gaming Platform - 3D Game World System
 * Complete game world with terrain, characters, objects and interactive elements
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { Octree } from 'three/examples/jsm/math/Octree'
import { Capsule } from 'three/examples/jsm/math/Capsule'
import { GLXYGameRenderer } from './3d-game-renderer'
import VehicleSystem, { Vehicle, Road, TrafficLight } from './vehicle-system'

export interface GameWorldConfig {
  size: number
  terrainType: 'grassland' | 'desert' | 'snow' | 'forest' | 'city'
  timeOfDay: 'day' | 'sunset' | 'night' | 'dawn'
  weather: 'clear' | 'rain' | 'snow' | 'fog'
  enableNPCs: boolean
  enableAnimals: boolean
  enableBuildings: boolean
  enableVehicles: boolean
  enableStreets: boolean
}

export interface Character {
  id: string
  type: 'player' | 'npc' | 'enemy' | 'animal'
  mesh: THREE.Group
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  health: number
  maxHealth: number
  speed: number
  isAlive: boolean
  animations: Map<string, THREE.AnimationAction>
  currentAnimation?: string
  stats: {
    strength: number
    defense: number
    agility: number
    intelligence: number
  }
}

export interface Building {
  id: string
  type: 'house' | 'tower' | 'castle' | 'shop' | 'temple'
  mesh: THREE.Group
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  isInteractable: boolean
  entries: THREE.Vector3[]
}

export interface EnvironmentObject {
  id: string
  type: 'tree' | 'rock' | 'bush' | 'flower' | 'chest' | 'weapon'
  mesh: THREE.Mesh
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  isInteractable: boolean
  isCollectible: boolean
}

export interface QuestMarker {
  id: string
  position: THREE.Vector3
  type: 'main' | 'side' | 'collect' | 'kill' | 'explore'
  title: string
  description: string
  isActive: boolean
  isCompleted: boolean
  mesh?: THREE.Mesh
}

export class GameWorld {
  private renderer: GLXYGameRenderer
  private scene: THREE.Scene
  private config: GameWorldConfig
  private octree: Octree

  // World components
  private terrain: THREE.Group = new THREE.Group()
  private characters: Map<string, Character> = new Map()
  private buildings: Map<string, Building> = new Map()
  private environmentObjects: Map<string, EnvironmentObject> = new Map()
  private questMarkers: Map<string, QuestMarker> = new Map()

  // Vehicle system
  private vehicleSystem: VehicleSystem
  private vehicles: Map<string, Vehicle> = new Map()
  private roads: Map<string, Road> = new Map()
  private trafficLights: Map<string, TrafficLight> = new Map()

  // Lighting
  private sunLight!: THREE.DirectionalLight
  private ambientLight!: THREE.AmbientLight
  private moonLight!: THREE.DirectionalLight

  // Environment
  private weatherParticles: THREE.Points[] = []
  private skybox!: THREE.Mesh

  // Player character
  private playerCharacter: Character | null = null
  private playerVehicle: Vehicle | null = null

  constructor(renderer: GLXYGameRenderer, config: GameWorldConfig) {
    this.renderer = renderer
    this.scene = renderer.getScene()
    this.config = config
    this.octree = new Octree()

    // Initialize vehicle system
    this.vehicleSystem = new VehicleSystem(renderer)

    this.initializeLighting()
    this.createSkybox()
    this.createTerrain()
    this.createEnvironment()
    this.createCharacters()
    this.createBuildings()
    this.createQuestMarkers()
    this.createVehicles()
    this.setupWeather()
  }

  private initializeLighting(): void {
    this.scene.fog = new THREE.Fog(0x87CEEB, 10, 1000)

    // Sun/Moon based on time of day
    switch (this.config.timeOfDay) {
      case 'day':
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2)
        this.sunLight.position.set(50, 100, 50)
        this.sunLight.castShadow = true
        this.sunLight.shadow.mapSize.width = 4096
        this.sunLight.shadow.mapSize.height = 4096
        this.scene.add(this.sunLight)

        this.ambientLight = new THREE.AmbientLight(0x87CEEB, 0.4)
        this.scene.add(this.ambientLight)
        break

      case 'sunset':
        this.sunLight = new THREE.DirectionalLight(0xff6b35, 0.8)
        this.sunLight.position.set(30, 50, 30)
        this.sunLight.castShadow = true
        this.scene.add(this.sunLight)

        this.ambientLight = new THREE.AmbientLight(0xff6b35, 0.3)
        this.scene.add(this.ambientLight)
        break

      case 'night':
        this.moonLight = new THREE.DirectionalLight(0x4444ff, 0.3)
        this.moonLight.position.set(-50, 80, -50)
        this.scene.add(this.moonLight)

        this.ambientLight = new THREE.AmbientLight(0x000033, 0.1)
        this.scene.add(this.ambientLight)
        break

      case 'dawn':
        this.sunLight = new THREE.DirectionalLight(0xffa500, 0.6)
        this.sunLight.position.set(40, 60, 40)
        this.sunLight.castShadow = true
        this.scene.add(this.sunLight)

        this.ambientLight = new THREE.AmbientLight(0xffa500, 0.2)
        this.scene.add(this.ambientLight)
        break
    }
  }

  private createSkybox(): void {
    const skyGeometry = new THREE.SphereGeometry(500, 32, 16)
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: this.getSkyColor(),
      side: THREE.BackSide
    })

    this.skybox = new THREE.Mesh(skyGeometry, skyMaterial)
    this.scene.add(this.skybox)
  }

  private getSkyColor(): number {
    switch (this.config.timeOfDay) {
      case 'day': return 0x87CEEB
      case 'sunset': return 0xff6b35
      case 'night': return 0x000033
      case 'dawn': return 0xffa500
      default: return 0x87CEEB
    }
  }

  private createTerrain(): void {
    this.terrain = new THREE.Group()

    // Create large terrain mesh
    const terrainSize = this.config.size
    const segments = 128
    const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments)

    // Generate height map
    const vertices = geometry.attributes.position.array as Float32Array
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i]
      const y = vertices[i + 1]

      // Create multiple octaves of noise for realistic terrain
      let height = 0
      height += Math.sin(x * 0.05) * Math.cos(y * 0.05) * 10
      height += Math.sin(x * 0.1) * Math.cos(y * 0.1) * 5
      height += Math.sin(x * 0.2) * Math.cos(y * 0.2) * 2

      vertices[i + 2] = height
    }

    geometry.computeVertexNormals()

    // Create terrain material based on type
    const material = this.getTerrainMaterial()
    const terrainMesh = new THREE.Mesh(geometry, material)
    terrainMesh.rotation.x = -Math.PI / 2
    terrainMesh.receiveShadow = true

    this.terrain.add(terrainMesh)
    this.scene.add(this.terrain)

    // Update octree with terrain
    this.octree.fromGraphNode(this.terrain)
  }

  private getTerrainMaterial(): THREE.MeshStandardMaterial {
    const colors = {
      grassland: { color: 0x3a5f3a, roughness: 0.8, metalness: 0.1 },
      desert: { color: 0xc19a6b, roughness: 0.9, metalness: 0.0 },
      snow: { color: 0xffffff, roughness: 0.7, metalness: 0.0 },
      forest: { color: 0x2d5016, roughness: 0.9, metalness: 0.0 },
      city: { color: 0x808080, roughness: 0.6, metalness: 0.2 }
    }

    const config = colors[this.config.terrainType]
    return new THREE.MeshStandardMaterial(config)
  }

  private createEnvironment(): void {
    const objectCount = this.config.size * 2

    for (let i = 0; i < objectCount; i++) {
      const type = this.getRandomEnvironmentType()
      const position = this.getRandomPosition()
      const object = this.createEnvironmentObject(type, position)

      this.environmentObjects.set(object.id, object)
      this.scene.add(object.mesh)
    }
  }

  private getRandomEnvironmentType(): EnvironmentObject['type'] {
    const types: EnvironmentObject['type'][] = ['tree', 'rock', 'bush', 'flower', 'chest', 'weapon']
    return types[Math.floor(Math.random() * types.length)]
  }

  private getRandomPosition(): THREE.Vector3 {
    const halfSize = this.config.size / 2
    return new THREE.Vector3(
      (Math.random() - 0.5) * this.config.size,
      Math.random() * 10,
      (Math.random() - 0.5) * this.config.size
    )
  }

  private createEnvironmentObject(type: EnvironmentObject['type'], position: THREE.Vector3): EnvironmentObject {
    let mesh: THREE.Mesh
    let scale = new THREE.Vector3(1, 1, 1)
    let isInteractable = false
    let isCollectible = false

    switch (type) {
      case 'tree':
        const treeGeometry = new THREE.ConeGeometry(2, 8, 8)
        const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 })
        mesh = new THREE.Mesh(treeGeometry, treeMaterial)
        mesh.position.y = 4
        scale = new THREE.Vector3(1, 1, 1)
        break

      case 'rock':
        const rockGeometry = new THREE.DodecahedronGeometry(1.5)
        const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 })
        mesh = new THREE.Mesh(rockGeometry, rockMaterial)
        scale = new THREE.Vector3(1, 0.8, 1)
        break

      case 'bush':
        const bushGeometry = new THREE.SphereGeometry(1.5)
        const bushMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 })
        mesh = new THREE.Mesh(bushGeometry, bushMaterial)
        scale = new THREE.Vector3(1, 0.7, 1)
        break

      case 'flower':
        const flowerGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1)
        const flowerMaterial = new THREE.MeshStandardMaterial({ color: 0xff69b4 })
        mesh = new THREE.Mesh(flowerGeometry, flowerMaterial)
        mesh.position.y = 0.5
        scale = new THREE.Vector3(1, 1, 1)
        break

      case 'chest':
        const chestGeometry = new THREE.BoxGeometry(1, 0.8, 0.8)
        const chestMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
        mesh = new THREE.Mesh(chestGeometry, chestMaterial)
        mesh.position.y = 0.4
        isInteractable = true
        break

      case 'weapon':
        const weaponGeometry = new THREE.BoxGeometry(0.2, 1, 0.1)
        const weaponMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 })
        mesh = new THREE.Mesh(weaponGeometry, weaponMaterial)
        mesh.position.y = 0.5
        isCollectible = true
        break
    }

    mesh.castShadow = true
    mesh.receiveShadow = true

    const envObject: EnvironmentObject = {
      id: `env_${type}_${Date.now()}_${Math.random()}`,
      type,
      mesh,
      position,
      rotation: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
      scale,
      isInteractable,
      isCollectible
    }

    mesh.position.copy(position)
    mesh.rotation.copy(envObject.rotation)
    mesh.scale.copy(scale)

    return envObject
  }

  private createCharacters(): void {
    // Create player character
    this.playerCharacter = this.createCharacter('player', 'player', new THREE.Vector3(0, 2, 0))
    this.characters.set(this.playerCharacter.id, this.playerCharacter)
    this.scene.add(this.playerCharacter.mesh)

    // Create NPCs
    if (this.config.enableNPCs) {
      for (let i = 0; i < 10; i++) {
        const position = this.getRandomPosition()
        position.y = 2
        const npc = this.createCharacter('npc', 'npc', position)
        this.characters.set(npc.id, npc)
        this.scene.add(npc.mesh)
      }
    }

    // Create animals
    if (this.config.enableAnimals) {
      for (let i = 0; i < 15; i++) {
        const position = this.getRandomPosition()
        position.y = 1
        const animal = this.createCharacter('animal', 'animal', position)
        this.characters.set(animal.id, animal)
        this.scene.add(animal.mesh)
      }
    }
  }

  private createCharacter(type: Character['type'], subType: string, position: THREE.Vector3): Character {
    const group = new THREE.Group()

    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8)
    const bodyMaterial = this.getCharacterMaterial(type, subType)
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 1.5
    body.castShadow = true
    group.add(body)

    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16)
    const headMaterial = this.getCharacterMaterial(type, subType)
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.y = 3
    head.castShadow = true
    group.add(head)

    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.2, 1, 4, 8)
    const armMaterial = this.getCharacterMaterial(type, subType)

    const leftArm = new THREE.Mesh(armGeometry, armMaterial)
    leftArm.position.set(-0.7, 2, 0)
    leftArm.rotation.z = Math.PI / 6
    leftArm.castShadow = true
    group.add(leftArm)

    const rightArm = new THREE.Mesh(armGeometry, armMaterial)
    rightArm.position.set(0.7, 2, 0)
    rightArm.rotation.z = -Math.PI / 6
    rightArm.castShadow = true
    group.add(rightArm)

    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.3, 1.5, 4, 8)
    const legMaterial = this.getCharacterMaterial(type, subType)

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
    leftLeg.position.set(-0.3, 0.75, 0)
    leftLeg.castShadow = true
    group.add(leftLeg)

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
    rightLeg.position.set(0.3, 0.75, 0)
    rightLeg.castShadow = true
    group.add(rightLeg)

    group.position.copy(position)

    const character: Character = {
      id: `char_${type}_${Date.now()}_${Math.random()}`,
      type,
      mesh: group,
      position: position.clone(),
      rotation: new THREE.Euler(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      health: 100,
      maxHealth: 100,
      speed: type === 'animal' ? 3 : type === 'player' ? 5 : 2,
      isAlive: true,
      animations: new Map(),
      stats: {
        strength: type === 'player' ? 10 : type === 'enemy' ? 8 : 5,
        defense: type === 'player' ? 8 : type === 'enemy' ? 6 : 3,
        agility: type === 'animal' ? 10 : type === 'player' ? 7 : 4,
        intelligence: type === 'player' ? 8 : type === 'enemy' ? 4 : 2
      }
    }

    return character
  }

  private getCharacterMaterial(type: Character['type'], subType: string): THREE.MeshStandardMaterial {
    if (type === 'player') {
      return new THREE.MeshStandardMaterial({ color: 0x4169e1 })
    } else if (type === 'enemy') {
      return new THREE.MeshStandardMaterial({ color: 0xdc143c })
    } else if (type === 'animal') {
      const colors = [0x8b4513, 0x696969, 0x228b22]
      return new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random() * colors.length)] })
    } else {
      const colors = [0xffd700, 0x4169e1, 0x32cd32, 0xff69b4]
      return new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random() * colors.length)] })
    }
  }

  private createBuildings(): void {
    if (!this.config.enableBuildings) return

    for (let i = 0; i < 8; i++) {
      const position = this.getRandomPosition()
      position.y = 0
      const building = this.createBuilding(position)
      this.buildings.set(building.id, building)
      this.scene.add(building.mesh)
    }
  }

  private createBuilding(position: THREE.Vector3): Building {
    const types: Building['type'][] = ['house', 'tower', 'shop']
    const type = types[Math.floor(Math.random() * types.length)]
    const group = new THREE.Group()

    switch (type) {
      case 'house':
        // House base
        const houseGeometry = new THREE.BoxGeometry(4, 3, 4)
        const houseMaterial = new THREE.MeshStandardMaterial({ color: 0xcd853f })
        const house = new THREE.Mesh(houseGeometry, houseMaterial)
        house.position.y = 1.5
        house.castShadow = true
        group.add(house)

        // Roof
        const roofGeometry = new THREE.ConeGeometry(3, 2, 4)
        const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
        const roof = new THREE.Mesh(roofGeometry, roofMaterial)
        roof.position.y = 3.5
        roof.castShadow = true
        group.add(roof)

        // Door
        const doorGeometry = new THREE.BoxGeometry(1, 2, 0.1)
        const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 })
        const door = new THREE.Mesh(doorGeometry, doorMaterial)
        door.position.set(0, 1, 2.05)
        group.add(door)

        break

      case 'tower':
        // Tower base
        const towerGeometry = new THREE.CylinderGeometry(2, 2.5, 8, 8)
        const towerMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 })
        const tower = new THREE.Mesh(towerGeometry, towerMaterial)
        tower.position.y = 4
        tower.castShadow = true
        group.add(tower)

        // Tower top
        const topGeometry = new THREE.ConeGeometry(2.5, 3, 8)
        const topMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 })
        const top = new THREE.Mesh(topGeometry, topMaterial)
        top.position.y = 8
        top.castShadow = true
        group.add(top)

        break

      case 'shop':
        // Shop building
        const shopGeometry = new THREE.BoxGeometry(6, 2.5, 4)
        const shopMaterial = new THREE.MeshStandardMaterial({ color: 0xdaa520 })
        const shop = new THREE.Mesh(shopGeometry, shopMaterial)
        shop.position.y = 1.25
        shop.castShadow = true
        group.add(shop)

        // Sign
        const signGeometry = new THREE.BoxGeometry(2, 0.5, 0.1)
        const signMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 })
        const sign = new THREE.Mesh(signGeometry, signMaterial)
        sign.position.set(0, 3, 2.05)
        group.add(sign)

        break
    }

    group.position.copy(position)
    group.rotation.y = Math.random() * Math.PI * 2

    const building: Building = {
      id: `building_${type}_${Date.now()}_${Math.random()}`,
      type,
      mesh: group,
      position: position.clone(),
      rotation: group.rotation.clone(),
      scale: new THREE.Vector3(1, 1, 1),
      isInteractable: type === 'shop',
      entries: [position.clone()]
    }

    return building
  }

  private createQuestMarkers(): void {
    for (let i = 0; i < 5; i++) {
      const position = this.getRandomPosition()
      position.y = 3
      const marker = this.createQuestMarker(position)
      this.questMarkers.set(marker.id, marker)
      if (marker.mesh) {
        this.scene.add(marker.mesh)
      }
    }
  }

  private createQuestMarker(position: THREE.Vector3): QuestMarker {
    const types: QuestMarker['type'][] = ['main', 'side', 'collect', 'kill', 'explore']
    const type = types[Math.floor(Math.random() * types.length)]

    const geometry = new THREE.SphereGeometry(0.5, 16, 16)
    const material = new THREE.MeshStandardMaterial({
      color: type === 'main' ? 0xffd700 : type === 'side' ? 0x00ff00 : 0x0080ff,
      emissive: type === 'main' ? 0xffd700 : type === 'side' ? 0x00ff00 : 0x0080ff,
      emissiveIntensity: 0.3
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)

    // Add floating animation
    const animate = () => {
      mesh.position.y = position.y + Math.sin(Date.now() * 0.002) * 0.3
      mesh.rotation.y += 0.02
      requestAnimationFrame(animate)
    }
    animate()

    const marker: QuestMarker = {
      id: `quest_${type}_${Date.now()}_${Math.random()}`,
      position: position.clone(),
      type,
      title: `Quest ${type}`,
      description: `Complete the ${type} quest objective`,
      isActive: true,
      isCompleted: false
    }

    return { ...marker, mesh }
  }

  private createVehicles(): void {
    if (!this.config.enableVehicles) return

    // Create street layout first
    if (this.config.enableStreets) {
      this.vehicleSystem.createStreetLayout()
      this.vehicleSystem.createTrafficLights()
    }

    // Create player drift car
    this.playerVehicle = this.vehicleSystem.createVehicle({
      type: 'drift-car',
      position: new THREE.Vector3(5, 0.5, 0),
      rotation: 0,
      color: 0xff0000,
      isPlayerControlled: true
    })
    this.vehicles.set(this.playerVehicle.id, this.playerVehicle)

    // Create AI traffic vehicles
    this.vehicleSystem.spawnTraffic()

    // Store all vehicles from the vehicle system
    this.vehicleSystem.getAllVehicles().forEach(vehicle => {
      this.vehicles.set(vehicle.id, vehicle)
    })

    // Store roads and traffic lights
    this.vehicleSystem.getRoads().forEach(road => {
      this.roads.set(road.id, road)
    })

    this.vehicleSystem.getTrafficLights().forEach(light => {
      this.trafficLights.set(light.id, light)
    })
  }

  private setupWeather(): void {
    switch (this.config.weather) {
      case 'rain':
        this.createRainEffect()
        break
      case 'snow':
        this.createSnowEffect()
        break
      case 'fog':
        this.createFogEffect()
        break
    }
  }

  private createRainEffect(): void {
    const particleCount = 1000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * this.config.size
      positions[i + 1] = Math.random() * 20 + 10
      positions[i + 2] = (Math.random() - 0.5) * this.config.size
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0x87CEEB,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })

    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)
    this.weatherParticles.push(particles)
  }

  private createSnowEffect(): void {
    const particleCount = 800
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * this.config.size
      positions[i + 1] = Math.random() * 20 + 10
      positions[i + 2] = (Math.random() - 0.5) * this.config.size
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.8
    })

    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)
    this.weatherParticles.push(particles)
  }

  private createFogEffect(): void {
    const existingFog = this.scene.fog
    if (existingFog && 'near' in existingFog) {
      existingFog.near = 1
      existingFog.far = 50
    }
  }

  // Public API
  public getPlayerCharacter(): Character | null {
    return this.playerCharacter
  }

  public getCharacter(id: string): Character | undefined {
    return this.characters.get(id)
  }

  public getBuilding(id: string): Building | undefined {
    return this.buildings.get(id)
  }

  public getEnvironmentObject(id: string): EnvironmentObject | undefined {
    return this.environmentObjects.get(id)
  }

  public getQuestMarker(id: string): QuestMarker | undefined {
    return this.questMarkers.get(id)
  }

  // Vehicle-related public API
  public getPlayerVehicle(): Vehicle | null {
    return this.playerVehicle
  }

  public getVehicle(id: string): Vehicle | undefined {
    return this.vehicles.get(id)
  }

  public getAllVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values())
  }

  public getRoads(): Road[] {
    return Array.from(this.roads.values())
  }

  public getTrafficLights(): TrafficLight[] {
    return Array.from(this.trafficLights.values())
  }

  // Vehicle control methods
  public acceleratePlayerVehicle(force: number): void {
    if (this.playerVehicle) {
      this.vehicleSystem.accelerateVehicle(this.playerVehicle.id, force)
    }
  }

  public brakePlayerVehicle(force: number): void {
    if (this.playerVehicle) {
      this.vehicleSystem.brakeVehicle(this.playerVehicle.id, force)
    }
  }

  public steerPlayerVehicle(angle: number): void {
    if (this.playerVehicle) {
      this.vehicleSystem.steerVehicle(this.playerVehicle.id, angle)
    }
  }

  public handbrakePlayerVehicle(): void {
    if (this.playerVehicle) {
      this.vehicleSystem.handbrakeVehicle(this.playerVehicle.id)
    }
  }

  public update(deltaTime: number): void {
    // Update characters
    this.characters.forEach(character => {
      if (character.type === 'npc' || character.type === 'animal') {
        // Simple AI movement
        if (Math.random() < 0.01) {
          character.velocity.x = (Math.random() - 0.5) * character.speed
          character.velocity.z = (Math.random() - 0.5) * character.speed
        }

        character.position.x += character.velocity.x * deltaTime
        character.position.z += character.velocity.z * deltaTime

        // Boundary check
        const halfSize = this.config.size / 2
        if (Math.abs(character.position.x) > halfSize) {
          character.velocity.x *= -1
          character.position.x = Math.sign(character.position.x) * halfSize
        }
        if (Math.abs(character.position.z) > halfSize) {
          character.velocity.z *= -1
          character.position.z = Math.sign(character.position.z) * halfSize
        }

        character.mesh.position.copy(character.position)
        character.mesh.lookAt(character.position.x + character.velocity.x, character.position.y, character.position.z + character.velocity.z)

        // Slow down
        character.velocity.multiplyScalar(0.98)
      }
    })

    // Update vehicles
    this.vehicleSystem.updateVehicles(deltaTime)

    // Update weather particles
    this.weatherParticles.forEach(particles => {
      const positions = particles.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i)
        positions.setY(i, y - 0.1)

        if (y < 0) {
          positions.setY(i, 20)
          positions.setX(i, (Math.random() - 0.5) * this.config.size)
          positions.setZ(i, (Math.random() - 0.5) * this.config.size)
        }
      }
      positions.needsUpdate = true
    })
  }

  public dispose(): void {
    // Clean up all objects
    this.characters.forEach(character => this.scene.remove(character.mesh))
    this.buildings.forEach(building => this.scene.remove(building.mesh))
    this.environmentObjects.forEach(obj => this.scene.remove(obj.mesh))
    this.questMarkers.forEach(marker => {
      if (marker.mesh) {
        this.scene.remove(marker.mesh)
      }
    })
    this.weatherParticles.forEach(particles => this.scene.remove(particles))

    // Clean up vehicle system
    this.vehicleSystem.dispose()

    this.scene.remove(this.terrain)
    this.scene.remove(this.skybox)

    // Clear maps
    this.characters.clear()
    this.buildings.clear()
    this.environmentObjects.clear()
    this.questMarkers.clear()
    this.vehicles.clear()
    this.roads.clear()
    this.trafficLights.clear()
    this.weatherParticles.length = 0
  }
}

export default GameWorld
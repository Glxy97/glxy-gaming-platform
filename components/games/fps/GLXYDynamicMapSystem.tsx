// @ts-nocheck
'use client'

import * as THREE from 'three'

// DYNAMIC MAP SYSTEM - DAY/NIGHT, WEATHER, MULTI-LEVEL!
export interface MapLevel {
  id: string
  name: string
  level: number // Height level
  bounds: THREE.Box3
  spawnPoints: THREE.Vector3[]
  objectives: THREE.Vector3[]
  navigationMesh: any
  coverPositions: THREE.Vector3[]
  interactiveObjects: InteractiveObject[]
  ambientLight: THREE.AmbientLight
  directionalLight: THREE.DirectionalLight
  visibilityRange: number
  fogDensity: number
}

export interface InteractiveObject {
  id: string
  type: 'light_switch' | 'door' | 'window' | 'alarm' | 'computer' | 'generator' | 'radio'
  mesh: THREE.Mesh
  position: THREE.Vector3
  state: 'on' | 'off' | 'open' | 'closed' | 'active' | 'inactive'
  isInteractable: boolean
  interactionRadius: number
  effectRadius?: number
  powerRequirement?: number
  soundEffects?: string[]
  animations?: any
}

export interface WeatherSystem {
  type: 'clear' | 'rain' | 'storm' | 'fog' | 'snow' | 'wind' | 'sandstorm'
  intensity: number // 0-1
  particles: THREE.Points[]
  windDirection: THREE.Vector3
  windSpeed: number
  temperature: number
  visibility: number
  soundEffects: Map<string, HTMLAudioElement>
  lightModifiers: {
    ambientIntensity: number
    directionalIntensity: number
    colorTemperature: number
  }
}

export interface DayNightCycle {
  timeOfDay: number // 0-24 hours
  timeSpeed: number // How fast time progresses
  sun: THREE.DirectionalLight
  moon: THREE.DirectionalLight
  ambientLight: THREE.AmbientLight
  skybox: THREE.Mesh
  stars: THREE.Points
  currentPhase: 'dawn' | 'day' | 'dusk' | 'night'
  lightingConfig: {
    sunColor: THREE.Color
    moonColor: THREE.Color
    ambientColor: THREE.Color
    fogColor: THREE.Color
  }
}

export interface MapSettings {
  enableDayNightCycle: boolean
  enableWeatherSystem: boolean
  enableInteractiveObjects: boolean
  enableMultiLevel: boolean
  timeSpeed: number
  weatherIntensity: number
  dynamicLighting: boolean
  environmentalAudio: boolean
  performanceMode: 'low' | 'medium' | 'high' | 'ultra'
}

export class GLXYDynamicMapSystem {
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private levels!: Map<string, MapLevel>
  private currentLevelId!: string
  private weatherSystem!: WeatherSystem
  private dayNightCycle!: DayNightCycle
  private interactiveObjects!: Map<string, InteractiveObject>
  private settings!: MapSettings
  private timeAccumulator!: number
  private particleSystems!: Map<string, THREE.Points>
  private soundManager!: any
  private physicsEngine!: any

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, physicsEngine?: any) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.physicsEngine = physicsEngine
    this.levels = new Map()
    this.currentLevelId = 'level_0'
    this.interactiveObjects = new Map()
    this.particleSystems = new Map()
    this.timeAccumulator = 0

    // Default settings
    this.settings = {
      enableDayNightCycle: true,
      enableWeatherSystem: true,
      enableInteractiveObjects: true,
      enableMultiLevel: true,
      timeSpeed: 60, // 1 real minute = 1 game hour
      weatherIntensity: 0.5,
      dynamicLighting: true,
      environmentalAudio: true,
      performanceMode: 'high'
    }

    // Initialize systems
    this.initializeWeatherSystem()
    this.initializeDayNightCycle()
    this.initializeSoundManager()
  }

  // Initialize weather system
  private initializeWeatherSystem() {
    this.weatherSystem = {
      type: 'clear',
      intensity: 0,
      particles: [],
      windDirection: new THREE.Vector3(1, 0, 0),
      windSpeed: 0,
      temperature: 20,
      visibility: 1,
      soundEffects: new Map(),
      lightModifiers: {
        ambientIntensity: 1,
        directionalIntensity: 1,
        colorTemperature: 6500
      }
    }

    // Load weather sound effects
    this.loadWeatherSounds()
  }

  // Initialize day/night cycle
  private initializeDayNightCycle() {
    this.dayNightCycle = {
      timeOfDay: 12, // Start at noon
      timeSpeed: this.settings.timeSpeed,
      sun: new THREE.DirectionalLight(0xffffff, 1),
      moon: new THREE.DirectionalLight(0x4444ff, 0.3),
      ambientLight: new THREE.AmbientLight(0x404040, 0.5),
      skybox: this.createSkybox(),
      stars: this.createStarfield(),
      currentPhase: 'day',
      lightingConfig: {
        sunColor: new THREE.Color(0xffffff),
        moonColor: new THREE.Color(0x4444ff),
        ambientColor: new THREE.Color(0x404040),
        fogColor: new THREE.Color(0x87CEEB)
      }
    }

    // Position sun and moon
    this.updateCelestialBodies()
    this.scene.add(this.dayNightCycle.sun)
    this.scene.add(this.dayNightCycle.moon)
    this.scene.add(this.dayNightCycle.ambientLight)
    this.scene.add(this.dayNightCycle.skybox)
    this.scene.add(this.dayNightCycle.stars)
  }

  // Create skybox
  private createSkybox(): THREE.Mesh {
    const skyGeometry = new THREE.SphereGeometry(1000, 32, 32)
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        timeOfDay: { value: this.dayNightCycle.timeOfDay },
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float timeOfDay;
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          vec3 color = mix(topColor, bottomColor, max(pow(max(h, 0.0), exponent), 0.0));

          // Adjust color based on time of day
          float dayFactor = sin(timeOfDay * 0.261799); // Convert hours to radians
          color *= dayFactor * 0.5 + 0.5;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide
    })

    return new THREE.Mesh(skyGeometry, skyMaterial)
  }

  // Create starfield
  private createStarfield(): THREE.Points {
    const starsGeometry = new THREE.BufferGeometry()
    const starPositions: number[] = []
    const starColors: number[] = []

    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000
      const y = (Math.random() - 0.5) * 2000
      const z = (Math.random() - 0.5) * 2000

      starPositions.push(x, y, z)

      // Vary star colors and brightness
      const color = new THREE.Color()
      color.setHSL(Math.random() * 0.2 + 0.5, 0.5, Math.random() * 0.5 + 0.5)
      starColors.push(color.r, color.g, color.b)
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
    starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3))

    const starsMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true
    })

    return new THREE.Points(starsGeometry, starsMaterial)
  }

  // Load weather sounds
  private loadWeatherSounds() {
    const weatherTypes = ['rain', 'thunder', 'wind', 'storm']

    weatherTypes.forEach(type => {
      const audio = new Audio()
      // In a real implementation, load actual audio files
      this.weatherSystem.soundEffects.set(type, audio)
    })
  }

  // Initialize sound manager
  private initializeSoundManager() {
    // Placeholder for sound manager initialization
    // In a real implementation, this would handle 3D spatial audio
  }

  // Create multi-level building
  createMultiLevelBuilding(levels: number, width: number, depth: number, heightPerLevel: number): void {
    if (!this.settings.enableMultiLevel) return

    for (let level = 0; level < levels; level++) {
      const levelId = `level_${level}`
      const levelY = level * heightPerLevel

      // Create floor
      const floorGeometry = new THREE.BoxGeometry(width, 0.2, depth)
      const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 })
      const floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.position.set(0, levelY, 0)
      floor.receiveShadow = true
      this.scene.add(floor)

      // Create walls for this level
      this.createLevelWalls(levelId, width, depth, heightPerLevel, levelY)

      // Create stairs connecting levels
      if (level < levels - 1) {
        this.createStairs(levelY, levelY + heightPerLevel, width, depth)
      }

      // Create interactive objects for this level
      this.createLevelInteractiveObjects(levelId, width, depth, levelY, heightPerLevel)

      // Define level bounds
      const bounds = new THREE.Box3(
        new THREE.Vector3(-width/2, levelY, -depth/2),
        new THREE.Vector3(width/2, levelY + heightPerLevel, depth/2)
      )

      // Create spawn points
      const spawnPoints = [
        new THREE.Vector3(-width/3, levelY + 1, -depth/3),
        new THREE.Vector3(width/3, levelY + 1, depth/3),
        new THREE.Vector3(0, levelY + 1, 0)
      ]

      // Create objective points
      const objectives = [
        new THREE.Vector3(width/4, levelY + 1, 0),
        new THREE.Vector3(-width/4, levelY + 1, 0),
        new THREE.Vector3(0, levelY + 1, depth/4)
      ]

      // Create cover positions
      const coverPositions = this.generateCoverPositions(width, depth, levelY)

      // Create lighting for this level
      const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
      directionalLight.position.set(10, 20, 10)
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 2048
      directionalLight.shadow.mapSize.height = 2048

      const mapLevel: MapLevel = {
        id: levelId,
        name: `Level ${level + 1}`,
        level,
        bounds,
        spawnPoints,
        objectives,
        navigationMesh: null, // Would be generated from level geometry
        coverPositions,
        interactiveObjects: [],
        ambientLight,
        directionalLight,
        visibilityRange: 50,
        fogDensity: 0.01
      }

      this.levels.set(levelId, mapLevel)
      this.scene.add(ambientLight)
      this.scene.add(directionalLight)
    }
  }

  // Create walls for a level
  private createLevelWalls(levelId: string, width: number, depth: number, height: number, y: number): void {
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 })
    const wallThickness = 0.2

    // Front and back walls
    const frontWallGeometry = new THREE.BoxGeometry(width, height, wallThickness)
    const backWallGeometry = new THREE.BoxGeometry(width, height, wallThickness)

    const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial)
    frontWall.position.set(0, y + height/2, depth/2)
    frontWall.castShadow = true
    frontWall.receiveShadow = true
    this.scene.add(frontWall)

    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial)
    backWall.position.set(0, y + height/2, -depth/2)
    backWall.castShadow = true
    backWall.receiveShadow = true
    this.scene.add(backWall)

    // Left and right walls
    const leftWallGeometry = new THREE.BoxGeometry(wallThickness, height, depth)
    const rightWallGeometry = new THREE.BoxGeometry(wallThickness, height, depth)

    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial)
    leftWall.position.set(-width/2, y + height/2, 0)
    leftWall.castShadow = true
    leftWall.receiveShadow = true
    this.scene.add(leftWall)

    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial)
    rightWall.position.set(width/2, y + height/2, 0)
    rightWall.castShadow = true
    rightWall.receiveShadow = true
    this.scene.add(rightWall)
  }

  // Create stairs between levels
  private createStairs(fromY: number, toY: number, width: number, depth: number): void {
    const stairHeight = 0.2
    const stairDepth = 0.3
    const numStairs = Math.floor((toY - fromY) / stairHeight)

    const stairMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 })

    for (let i = 0; i < numStairs; i++) {
      const stairGeometry = new THREE.BoxGeometry(width, stairHeight, stairDepth)
      const stair = new THREE.Mesh(stairGeometry, stairMaterial)

      const stairY = fromY + (i * stairHeight) + stairHeight/2
      const stairZ = -depth/3 + (i * stairDepth * 0.5)

      stair.position.set(0, stairY, stairZ)
      stair.castShadow = true
      stair.receiveShadow = true
      this.scene.add(stair)
    }
  }

  // Create interactive objects for a level
  private createLevelInteractiveObjects(levelId: string, width: number, depth: number, y: number, heightPerLevel: number): void {
    if (!this.settings.enableInteractiveObjects) return

    // Create light switches
    this.createLightSwitch(levelId, new THREE.Vector3(width/2 - 1, y + 1, 0))
    this.createLightSwitch(levelId, new THREE.Vector3(-width/2 + 1, y + 1, 0))

    // Create doors
    this.createDoor(levelId, new THREE.Vector3(0, y + 1, depth/2))
    this.createDoor(levelId, new THREE.Vector3(width/2, y + 1, 0))

    // Create windows
    this.createWindow(levelId, new THREE.Vector3(width/2, y + 2, depth/4))
    this.createWindow(levelId, new THREE.Vector3(-width/2, y + 2, depth/4))

    // Create alarm system
    this.createAlarm(levelId, new THREE.Vector3(0, y + heightPerLevel - 1, 0))

    // Create computers
    this.createComputer(levelId, new THREE.Vector3(width/4, y + 1, depth/4))
    this.createComputer(levelId, new THREE.Vector3(-width/4, y + 1, depth/4))

    // Create generator
    this.createGenerator(levelId, new THREE.Vector3(-width/3, y + 1, -depth/3))

    // Create radio
    this.createRadio(levelId, new THREE.Vector3(width/3, y + 1, -depth/3))
  }

  // Create light switch
  private createLightSwitch(levelId: string, position: THREE.Vector3): void {
    const switchGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.05)
    const switchMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
    const switchMesh = new THREE.Mesh(switchGeometry, switchMaterial)
    switchMesh.position.copy(position)
    this.scene.add(switchMesh)

    const lightSwitch: InteractiveObject = {
      id: `light_switch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'light_switch',
      mesh: switchMesh,
      position: position.clone(),
      state: 'on',
      isInteractable: true,
      interactionRadius: 1.5,
      effectRadius: 20,
      soundEffects: ['switch_click', 'power_on', 'power_off']
    }

    this.interactiveObjects.set(lightSwitch.id, lightSwitch)
  }

  // Create door
  private createDoor(levelId: string, position: THREE.Vector3): void {
    const doorGeometry = new THREE.BoxGeometry(0.1, 3, 2)
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial)
    doorMesh.position.copy(position)
    doorMesh.castShadow = true
    doorMesh.receiveShadow = true
    this.scene.add(doorMesh)

    const door: InteractiveObject = {
      id: `door_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'door',
      mesh: doorMesh,
      position: position.clone(),
      state: 'closed',
      isInteractable: true,
      interactionRadius: 2,
      soundEffects: ['door_open', 'door_close', 'door_locked']
    }

    this.interactiveObjects.set(door.id, door)
  }

  // Create window
  private createWindow(levelId: string, position: THREE.Vector3): void {
    const windowGeometry = new THREE.BoxGeometry(0.05, 2, 2)
    const windowMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.3,
      transmission: 0.7,
      roughness: 0.1,
      metalness: 0.1
    })
    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial)
    windowMesh.position.copy(position)
    this.scene.add(windowMesh)

    const windowObj: InteractiveObject = {
      id: `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'window',
      mesh: windowMesh,
      position: position.clone(),
      state: 'closed',
      isInteractable: true,
      interactionRadius: 1.5,
      soundEffects: ['window_open', 'window_close', 'glass_break']
    }

    this.interactiveObjects.set(windowObj.id, windowObj)
  }

  // Create alarm system
  private createAlarm(levelId: string, position: THREE.Vector3): void {
    const alarmGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8)
    const alarmMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 })
    const alarmMesh = new THREE.Mesh(alarmGeometry, alarmMaterial)
    alarmMesh.position.copy(position)
    this.scene.add(alarmMesh)

    const alarm: InteractiveObject = {
      id: `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'alarm',
      mesh: alarmMesh,
      position: position.clone(),
      state: 'inactive',
      isInteractable: true,
      interactionRadius: 3,
      effectRadius: 50,
      soundEffects: ['alarm_activate', 'alarm_deactivate', 'alarm_siren']
    }

    this.interactiveObjects.set(alarm.id, alarm)
  }

  // Create computer
  private createComputer(levelId: string, position: THREE.Vector3): void {
    const computerGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.6)
    const screenGeometry = new THREE.BoxGeometry(0.45, 0.3, 0.05)

    const computerMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 })
    const screenMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })

    const computerMesh = new THREE.Mesh(computerGeometry, computerMaterial)
    const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial)

    computerMesh.position.copy(position)
    screenMesh.position.copy(position)
    screenMesh.position.z += 0.3
    screenMesh.position.y += 0.1

    this.scene.add(computerMesh)
    this.scene.add(screenMesh)

    const computer: InteractiveObject = {
      id: `computer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'computer',
      mesh: screenMesh, // Use screen as main interactable mesh
      position: position.clone(),
      state: 'off',
      isInteractable: true,
      interactionRadius: 1.5,
      powerRequirement: 100,
      soundEffects: ['computer_boot', 'computer_shutdown', 'keyboard_type']
    }

    this.interactiveObjects.set(computer.id, computer)
  }

  // Create generator
  private createGenerator(levelId: string, position: THREE.Vector3): void {
    const generatorGeometry = new THREE.BoxGeometry(1, 1.5, 1)
    const generatorMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 })
    const generatorMesh = new THREE.Mesh(generatorGeometry, generatorMaterial)
    generatorMesh.position.copy(position)
    generatorMesh.castShadow = true
    generatorMesh.receiveShadow = true
    this.scene.add(generatorMesh)

    const generator: InteractiveObject = {
      id: `generator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'generator',
      mesh: generatorMesh,
      position: position.clone(),
      state: 'off',
      isInteractable: true,
      interactionRadius: 2,
      effectRadius: 30,
      powerRequirement: 0, // Generates power
      soundEffects: ['generator_start', 'generator_stop', 'generator_running']
    }

    this.interactiveObjects.set(generator.id, generator)
  }

  // Create radio
  private createRadio(levelId: string, position: THREE.Vector3): void {
    const radioGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.2)
    const radioMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 })
    const radioMesh = new THREE.Mesh(radioGeometry, radioMaterial)
    radioMesh.position.copy(position)
    this.scene.add(radioMesh)

    const radio: InteractiveObject = {
      id: `radio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'radio',
      mesh: radioMesh,
      position: position.clone(),
      state: 'off',
      isInteractable: true,
      interactionRadius: 2,
      effectRadius: 15,
      powerRequirement: 20,
      soundEffects: ['radio_on', 'radio_off', 'radio_static', 'radio_music']
    }

    this.interactiveObjects.set(radio.id, radio)
  }

  // Generate cover positions
  private generateCoverPositions(width: number, depth: number, y: number): THREE.Vector3[] {
    const coverPositions: THREE.Vector3[] = []
    const coverCount = 8

    for (let i = 0; i < coverCount; i++) {
      const x = (Math.random() - 0.5) * (width - 2)
      const z = (Math.random() - 0.5) * (depth - 2)

      coverPositions.push(new THREE.Vector3(x, y + 1, z))
    }

    return coverPositions
  }

  // Change weather
  setWeather(type: WeatherSystem['type'], intensity: number = 0.5): void {
    if (!this.settings.enableWeatherSystem) return

    // Clear existing weather particles
    this.clearWeatherParticles()

    this.weatherSystem.type = type
    this.weatherSystem.intensity = intensity

    switch (type) {
      case 'rain':
        this.createRainEffect(intensity)
        break
      case 'storm':
        this.createStormEffect(intensity)
        break
      case 'fog':
        this.createFogEffect(intensity)
        break
      case 'snow':
        this.createSnowEffect(intensity)
        break
      case 'wind':
        this.createWindEffect(intensity)
        break
      case 'sandstorm':
        this.createSandstormEffect(intensity)
        break
      case 'clear':
      default:
        this.weatherSystem.visibility = 1
        break
    }

    // Update lighting based on weather
    this.updateWeatherLighting()
  }

  // Create rain effect
  private createRainEffect(intensity: number): void {
    const particleCount = Math.floor(intensity * 5000)
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200
      positions[i * 3 + 1] = Math.random() * 100 + 50
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200

      velocities[i * 3] = this.weatherSystem.windDirection.x * intensity * 2
      velocities[i * 3 + 1] = -10 - Math.random() * 5
      velocities[i * 3 + 2] = this.weatherSystem.windDirection.z * intensity * 2
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

    const material = new THREE.PointsMaterial({
      size: 0.1,
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.6,
      vertexColors: false
    })

    const rain = new THREE.Points(geometry, material)
    this.scene.add(rain)
    this.weatherSystem.particles.push(rain)

    // Play rain sound
    this.playWeatherSound('rain')

    // Update visibility
    this.weatherSystem.visibility = Math.max(0.3, 1 - intensity * 0.5)
  }

  // Create storm effect
  private createStormEffect(intensity: number): void {
    // Combine rain with additional effects
    this.createRainEffect(intensity)

    // Add lightning
    this.createLightningEffect(intensity)

    // Stronger wind
    this.weatherSystem.windSpeed = intensity * 10
    this.weatherSystem.windDirection.set(
      Math.random() - 0.5,
      0,
      Math.random() - 0.5
    ).normalize()

    // Play storm sounds
    this.playWeatherSound('storm')

    // Lower visibility
    this.weatherSystem.visibility = Math.max(0.2, 1 - intensity * 0.7)
  }

  // Create fog effect
  private createFogEffect(intensity: number): void {
    this.scene.fog = new THREE.Fog(
      this.dayNightCycle.lightingConfig.fogColor,
      1,
      Math.max(10, 50 * (1 - intensity))
    )

    // Create fog particles
    const particleCount = Math.floor(intensity * 1000)
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = Math.random() * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      size: 2,
      color: 0xcccccc,
      transparent: true,
      opacity: intensity * 0.3
    })

    const fog = new THREE.Points(geometry, material)
    this.scene.add(fog)
    this.weatherSystem.particles.push(fog)

    this.weatherSystem.visibility = Math.max(0.1, 1 - intensity * 0.9)
  }

  // Create snow effect
  private createSnowEffect(intensity: number): void {
    const particleCount = Math.floor(intensity * 3000)
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200
      positions[i * 3 + 1] = Math.random() * 100 + 50
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200

      velocities[i * 3] = this.weatherSystem.windDirection.x * intensity
      velocities[i * 3 + 1] = -2 - Math.random() * 2
      velocities[i * 3 + 2] = this.weatherSystem.windDirection.z * intensity
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

    const material = new THREE.PointsMaterial({
      size: 0.2,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    })

    const snow = new THREE.Points(geometry, material)
    this.scene.add(snow)
    this.weatherSystem.particles.push(snow)

    this.weatherSystem.visibility = Math.max(0.4, 1 - intensity * 0.4)
  }

  // Create wind effect
  private createWindEffect(intensity: number): void {
    this.weatherSystem.windSpeed = intensity * 15
    this.weatherSystem.windDirection.set(
      Math.cos(Date.now() * 0.001),
      0,
      Math.sin(Date.now() * 0.001)
    ).normalize()

    // Create wind particles (debris, leaves)
    const particleCount = Math.floor(intensity * 500)
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = Math.random() * 30
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      size: 0.1,
      color: 0x8B7355,
      transparent: true,
      opacity: 0.6
    })

    const wind = new THREE.Points(geometry, material)
    this.scene.add(wind)
    this.weatherSystem.particles.push(wind)

    this.playWeatherSound('wind')
  }

  // Create sandstorm effect
  private createSandstormEffect(intensity: number): void {
    // Combine wind with sand particles
    this.createWindEffect(intensity)

    // Add sand particles
    const particleCount = Math.floor(intensity * 2000)
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 150
      positions[i * 3 + 1] = Math.random() * 40
      positions[i * 3 + 2] = (Math.random() - 0.5) * 150
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      size: 0.3,
      color: 0xC2B280,
      transparent: true,
      opacity: 0.7
    })

    const sandstorm = new THREE.Points(geometry, material)
    this.scene.add(sandstorm)
    this.weatherSystem.particles.push(sandstorm)

    // Very low visibility
    this.weatherSystem.visibility = Math.max(0.05, 1 - intensity * 0.95)
  }

  // Create lightning effect
  private createLightningEffect(intensity: number): void {
    const lightning = () => {
      if (Math.random() < intensity * 0.1) {
        // Flash effect
        this.scene.fog = new THREE.FogExp2(0xffffff, 0.001)

        setTimeout(() => {
          if (this.weatherSystem.type === 'storm') {
            this.scene.fog = new THREE.Fog(
              this.dayNightCycle.lightingConfig.fogColor,
              1,
              20
            )
          }
        }, 100)

        // Create lightning bolt
        const lightningGeometry = new THREE.BufferGeometry()
        const lightningPoints: number[] = []

        const startX = (Math.random() - 0.5) * 200
        const startY = 100
        const startZ = (Math.random() - 0.5) * 200

        lightningPoints.push(startX, startY, startZ)

        let currentX = startX
        let currentY = startY
        let currentZ = startZ

        while (currentY > 0) {
          currentX += (Math.random() - 0.5) * 10
          currentY -= Math.random() * 20 + 5
          currentZ += (Math.random() - 0.5) * 10

          lightningPoints.push(currentX, currentY, currentZ)
        }

        lightningGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lightningPoints, 3))

        const lightningMaterial = new THREE.LineBasicMaterial({
          color: 0xffffff,
          linewidth: 2,
          transparent: true,
          opacity: 0.9
        })

        const lightningBolt = new THREE.Line(lightningGeometry, lightningMaterial)
        this.scene.add(lightningBolt)

        setTimeout(() => {
          this.scene.remove(lightningBolt)
        }, 100)

        // Play thunder sound with delay
        setTimeout(() => {
          this.playWeatherSound('thunder')
        }, Math.random() * 2000 + 500)
      }
    }

    // Schedule lightning strikes
    setInterval(lightning, 2000)
  }

  // Clear weather particles
  private clearWeatherParticles(): void {
    this.weatherSystem.particles.forEach(particle => {
      this.scene.remove(particle)
    })
    this.weatherSystem.particles = []
  }

  // Update weather lighting
  private updateWeatherLighting(): void {
    const { lightModifiers } = this.weatherSystem

    // Adjust ambient light based on weather
    this.dayNightCycle.ambientLight.intensity = 0.5 * lightModifiers.ambientIntensity

    // Adjust sun/moon intensity
    if (this.dayNightCycle.currentPhase === 'day') {
      this.dayNightCycle.sun.intensity = 1 * lightModifiers.directionalIntensity
    } else {
      this.dayNightCycle.moon.intensity = 0.3 * lightModifiers.directionalIntensity
    }

    // Adjust scene fog
    if (this.weatherSystem.type !== 'fog' && this.weatherSystem.type !== 'storm') {
      this.scene.fog = new THREE.Fog(
        this.dayNightCycle.lightingConfig.fogColor,
        1,
        Math.max(50, 100 * this.weatherSystem.visibility)
      )
    }
  }

  // Play weather sound
  private playWeatherSound(soundType: string): void {
    if (!this.settings.environmentalAudio) return

    const sound = this.weatherSystem.soundEffects.get(soundType)
    if (sound) {
      sound.loop = true
      sound.volume = this.weatherSystem.intensity
      sound.play().catch(e => console.log('Weather sound play failed:', e))
    }
  }

  // Update celestial bodies
  private updateCelestialBodies(): void {
    const time = this.dayNightCycle.timeOfDay
    const angle = (time / 24) * Math.PI * 2 - Math.PI / 2

    // Sun position
    const sunDistance = 100
    this.dayNightCycle.sun.position.x = Math.cos(angle) * sunDistance
    this.dayNightCycle.sun.position.y = Math.sin(angle) * sunDistance
    this.dayNightCycle.sun.position.z = 0

    // Moon position (opposite to sun)
    this.dayNightCycle.moon.position.x = -Math.cos(angle) * sunDistance
    this.dayNightCycle.moon.position.y = -Math.sin(angle) * sunDistance
    this.dayNightCycle.moon.position.z = 0

    // Update sun/moon visibility based on time
    const isDaytime = time >= 6 && time <= 18
    this.dayNightCycle.sun.visible = isDaytime
    this.dayNightCycle.moon.visible = !isDaytime

    // Update skybox colors
    this.updateSkyboxColors(time)
  }

  // Update skybox colors
  private updateSkyboxColors(timeOfDay: number): void {
    const skyboxMaterial = this.dayNightCycle.skybox.material as THREE.ShaderMaterial
    skyboxMaterial.uniforms.timeOfDay.value = timeOfDay

    // Determine current phase
    if (timeOfDay >= 5 && timeOfDay < 7) {
      this.dayNightCycle.currentPhase = 'dawn'
    } else if (timeOfDay >= 7 && timeOfDay < 17) {
      this.dayNightCycle.currentPhase = 'day'
    } else if (timeOfDay >= 17 && timeOfDay < 19) {
      this.dayNightCycle.currentPhase = 'dusk'
    } else {
      this.dayNightCycle.currentPhase = 'night'
    }

    // Update ambient light color
    let ambientColor = new THREE.Color()

    switch (this.dayNightCycle.currentPhase) {
      case 'dawn':
        ambientColor.setHSL(0.1, 0.7, 0.3)
        break
      case 'day':
        ambientColor.setHSL(0.6, 0.7, 0.6)
        break
      case 'dusk':
        ambientColor.setHSL(0.05, 0.8, 0.2)
        break
      case 'night':
        ambientColor.setHSL(0.6, 0.3, 0.1)
        break
    }

    this.dayNightCycle.ambientLight.color = ambientColor

    // Update star visibility
    const starOpacity = this.dayNightCycle.currentPhase === 'night' ? 1 : 0
    const starsMaterial = this.dayNightCycle.stars.material as THREE.PointsMaterial
    starsMaterial.opacity = starOpacity
  }

  // Interact with object
  interactWithObject(objectId: string, playerPosition: THREE.Vector3): boolean {
    const object = this.interactiveObjects.get(objectId)
    if (!object || !object.isInteractable) return false

    const distance = playerPosition.distanceTo(object.position)
    if (distance > object.interactionRadius) return false

    // Toggle object state based on type
    switch (object.type) {
      case 'light_switch':
        return this.toggleLightSwitch(object)
      case 'door':
        return this.toggleDoor(object)
      case 'window':
        return this.toggleWindow(object)
      case 'alarm':
        return this.toggleAlarm(object)
      case 'computer':
        return this.toggleComputer(object)
      case 'generator':
        return this.toggleGenerator(object)
      case 'radio':
        return this.toggleRadio(object)
      default:
        return false
    }
  }

  // Toggle light switch
  private toggleLightSwitch(lightSwitch: InteractiveObject): boolean {
    const newState = lightSwitch.state === 'on' ? 'off' : 'on'
    lightSwitch.state = newState

    // Update material color
    const material = lightSwitch.mesh.material as THREE.MeshLambertMaterial
    material.color.setHex(newState === 'on' ? 0xffffff : 0x444444)

    // Update lighting in effect radius
    if (lightSwitch.effectRadius) {
      const level = this.getCurrentLevel()
      if (level) {
        level.directionalLight.intensity = newState === 'on' ? 0.8 : 0.2
        level.ambientLight.intensity = newState === 'on' ? 0.4 : 0.1
      }
    }

    this.playObjectSound(lightSwitch, newState === 'on' ? 'power_on' : 'power_off')
    return true
  }

  // Toggle door
  private toggleDoor(door: InteractiveObject): boolean {
    if (door.state === 'open') {
      // Close door
      door.state = 'closed'
      door.mesh.rotation.y = 0
    } else {
      // Open door
      door.state = 'open'
      door.mesh.rotation.y = Math.PI / 2
    }

    this.playObjectSound(door, door.state === 'open' ? 'door_open' : 'door_close')
    return true
  }

  // Toggle window
  private toggleWindow(window: InteractiveObject): boolean {
    if (window.state === 'open') {
      // Close window
      window.state = 'closed'
      const material = window.mesh.material as THREE.MeshPhysicalMaterial
      material.opacity = 0.3
      material.transmission = 0.7
    } else {
      // Open window
      window.state = 'open'
      const material = window.mesh.material as THREE.MeshPhysicalMaterial
      material.opacity = 0.1
      material.transmission = 0.9
    }

    this.playObjectSound(window, window.state === 'open' ? 'window_open' : 'window_close')
    return true
  }

  // Toggle alarm
  private toggleAlarm(alarm: InteractiveObject): boolean {
    const newState = alarm.state === 'active' ? 'inactive' : 'active'
    alarm.state = newState

    // Visual effect
    const material = alarm.mesh.material as THREE.MeshLambertMaterial
    if (newState === 'active') {
      material.color.setHex(0xff0000)
      material.emissive = new THREE.Color(0xff0000)
      material.emissiveIntensity = 0.5
    } else {
      material.color.setHex(0x444444)
      material.emissive = new THREE.Color(0x000000)
      material.emissiveIntensity = 0
    }

    // Sound effect with looping
    this.playObjectSound(alarm, newState === 'active' ? 'alarm_activate' : 'alarm_deactivate')

    return true
  }

  // Toggle computer
  private toggleComputer(computer: InteractiveObject): boolean {
    const newState = computer.state === 'on' ? 'off' : 'on'
    computer.state = newState

    // Update screen material
    const material = computer.mesh.material as THREE.MeshBasicMaterial
    material.color.setHex(newState === 'on' ? 0x00ff00 : 0x000000)

    this.playObjectSound(computer, newState === 'on' ? 'computer_boot' : 'computer_shutdown')
    return true
  }

  // Toggle generator
  private toggleGenerator(generator: InteractiveObject): boolean {
    const newState = generator.state === 'active' ? 'inactive' : 'active'
    generator.state = newState

    // Visual effect
    const material = generator.mesh.material as THREE.MeshLambertMaterial
    if (newState === 'active') {
      material.color.setHex(0x888888)
      material.emissive = new THREE.Color(0x444400)
      material.emissiveIntensity = 0.3
    } else {
      material.color.setHex(0x333333)
      material.emissive = new THREE.Color(0x000000)
      material.emissiveIntensity = 0
    }

    // Provide power to nearby objects
    if (generator.effectRadius) {
      this.providePowerToNearbyObjects(generator.position, generator.effectRadius, newState === 'active')
    }

    this.playObjectSound(generator, newState === 'active' ? 'generator_start' : 'generator_stop')
    return true
  }

  // Toggle radio
  private toggleRadio(radio: InteractiveObject): boolean {
    const newState = radio.state === 'on' ? 'off' : 'on'
    radio.state = newState

    // Visual effect
    const material = radio.mesh.material as THREE.MeshLambertMaterial
    if (newState === 'on') {
      material.color.setHex(0x222222)
      material.emissive = new THREE.Color(0x222200)
      material.emissiveIntensity = 0.2
    } else {
      material.color.setHex(0x111111)
      material.emissive = new THREE.Color(0x000000)
      material.emissiveIntensity = 0
    }

    this.playObjectSound(radio, newState === 'on' ? 'radio_on' : 'radio_off')
    return true
  }

  // Provide power to nearby objects
  private providePowerToNearbyObjects(position: THREE.Vector3, radius: number, hasPower: boolean): void {
    this.interactiveObjects.forEach(object => {
      const distance = position.distanceTo(object.position)
      if (distance <= radius && object.powerRequirement !== undefined) {
        // Object is now powered/unpowered
        if (hasPower) {
          // Enable object functionality
        } else {
          // Disable object functionality
          if (object.state === 'on') {
            this.interactWithObject(object.id, position)
          }
        }
      }
    })
  }

  // Play object sound
  private playObjectSound(object: InteractiveObject, soundName: string): void {
    if (!object.soundEffects || !this.settings.environmentalAudio) return

    // In a real implementation, play actual sound files
    console.log(`Playing ${soundName} for ${object.type}`)
  }

  // Get current level
  getCurrentLevel(): MapLevel | undefined {
    return this.levels.get(this.currentLevelId)
  }

  // Get level at position
  getLevelAtPosition(position: THREE.Vector3): MapLevel | undefined {
    for (const level of this.levels.values()) {
      if (level.bounds.containsPoint(position)) {
        return level
      }
    }
    return undefined
  }

  // Update map system
  update(deltaTime: number): void {
    // Update day/night cycle
    if (this.settings.enableDayNightCycle) {
      this.updateDayNightCycle(deltaTime)
    }

    // Update weather system
    if (this.settings.enableWeatherSystem) {
      this.updateWeatherSystem(deltaTime)
    }

    // Update interactive objects
    if (this.settings.enableInteractiveObjects) {
      this.updateInteractiveObjects(deltaTime)
    }

    // Update particle systems
    this.updateParticleSystems(deltaTime)
  }

  // Update day/night cycle
  private updateDayNightCycle(deltaTime: number): void {
    this.timeAccumulator += deltaTime

    // Update time based on time speed
    const timeIncrement = (deltaTime / 3600) * this.settings.timeSpeed // Convert to hours
    this.dayNightCycle.timeOfDay += timeIncrement

    // Wrap around 24 hours
    if (this.dayNightCycle.timeOfDay >= 24) {
      this.dayNightCycle.timeOfDay -= 24
    }

    // Update celestial bodies
    this.updateCelestialBodies()
  }

  // Update weather system
  private updateWeatherSystem(deltaTime: number): void {
    // Update weather particles
    this.weatherSystem.particles.forEach(particles => {
      const positions = particles.geometry.attributes.position.array as Float32Array
      const velocities = particles.geometry.attributes.velocity?.array as Float32Array

      if (velocities) {
        for (let i = 0; i < positions.length; i += 3) {
          // Apply velocity
          positions[i] += velocities[i] * deltaTime
          positions[i + 1] += velocities[i + 1] * deltaTime
          positions[i + 2] += velocities[i + 2] * deltaTime

          // Apply wind
          positions[i] += this.weatherSystem.windDirection.x * this.weatherSystem.windSpeed * deltaTime
          positions[i + 2] += this.weatherSystem.windDirection.z * this.weatherSystem.windSpeed * deltaTime

          // Reset particles that fall too low or go too far
          if (positions[i + 1] < 0) {
            positions[i] = (Math.random() - 0.5) * 200
            positions[i + 1] = Math.random() * 50 + 100
            positions[i + 2] = (Math.random() - 0.5) * 200
          }
        }

        particles.geometry.attributes.position.needsUpdate = true
      }
    })
  }

  // Update interactive objects
  private updateInteractiveObjects(deltaTime: number): void {
    // Update animated objects
    this.interactiveObjects.forEach(object => {
      // Animate alarm blinking
      if (object.type === 'alarm' && object.state === 'active') {
        const material = object.mesh.material as THREE.MeshLambertMaterial
        const intensity = Math.sin(Date.now() * 0.01) * 0.5 + 0.5
        material.emissiveIntensity = intensity
      }
    })
  }

  // Update particle systems
  private updateParticleSystems(deltaTime: number): void {
    // Update any custom particle systems
    this.particleSystems.forEach((particles, id) => {
      // Update particle physics
    })
  }

  // Update settings
  updateSettings(newSettings: Partial<MapSettings>): void {
    this.settings = { ...this.settings, ...newSettings }

    // Apply settings changes
    if (!this.settings.enableDayNightCycle) {
      this.dayNightCycle.sun.visible = false
      this.dayNightCycle.moon.visible = false
    }

    if (!this.settings.enableWeatherSystem) {
      this.clearWeatherParticles()
    }

    // Update performance settings
    this.updatePerformanceSettings()
  }

  // Update performance settings
  private updatePerformanceSettings(): void {
    switch (this.settings.performanceMode) {
      case 'low':
        this.renderer.shadowMap.enabled = false
        this.renderer.setPixelRatio(1)
        break
      case 'medium':
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFShadowMap
        this.renderer.setPixelRatio(1)
        break
      case 'high':
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.setPixelRatio(window.devicePixelRatio)
        break
      case 'ultra':
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        break
    }
  }

  // Get current settings
  getSettings(): MapSettings {
    return { ...this.settings }
  }

  // Get current time of day
  getTimeOfDay(): number {
    return this.dayNightCycle.timeOfDay
  }

  // Get current weather
  getCurrentWeather(): WeatherSystem {
    return { ...this.weatherSystem }
  }

  // Get all interactive objects
  getInteractiveObjects(): Map<string, InteractiveObject> {
    return new Map(this.interactiveObjects)
  }

  // Get all levels
  getLevels(): Map<string, MapLevel> {
    return new Map(this.levels)
  }

  // Clean up
  cleanup(): void {
    // Clear all particles
    this.clearWeatherParticles()

    // Clear all objects
    this.interactiveObjects.clear()
    this.levels.clear()
    this.particleSystems.clear()

    // Remove from scene
    this.scene.remove(this.dayNightCycle.sun)
    this.scene.remove(this.dayNightCycle.moon)
    this.scene.remove(this.dayNightCycle.ambientLight)
    this.scene.remove(this.dayNightCycle.skybox)
    this.scene.remove(this.dayNightCycle.stars)

    // Stop sounds
    this.weatherSystem.soundEffects.forEach(sound => {
      sound.pause()
    })
  }
}

export default GLXYDynamicMapSystem
// @ts-nocheck
/**
 * GLXY Gaming Platform - Vehicle System
 * Cars, streets, and drift mechanics for the game world
 */

import * as THREE from 'three'
import { GLXYGameRenderer, GameObject } from './3d-game-renderer'

export interface VehicleConfig {
  type: 'car' | 'drift-car' | 'truck' | 'sports-car' | 'police-car'
  position: THREE.Vector3
  rotation?: number
  color?: number
  isPlayerControlled?: boolean
}

export interface RoadConfig {
  type: 'highway' | 'street' | 'parking-lot' | 'intersection'
  startPoint: THREE.Vector3
  endPoint: THREE.Vector3
  width: number
  lanes: number
}

export interface Vehicle {
  id: string
  type: VehicleConfig['type']
  mesh: THREE.Group
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  angularVelocity: number
  speed: number
  maxSpeed: number
  acceleration: number
  braking: number
  handling: number
  weight: number
  health: number
  maxHealth: number
  isPlayerControlled: boolean
  isDrifting: boolean
  driftAngle: number
  trail: THREE.Points[]
  engineForce: number
  steerAngle: number
  wheelRotation: number
  stats: {
    horsepower: number
    torque: number
    topSpeed: number
    acceleration_0_60: number
    brakingDistance: number
  }
}

export interface Road {
  id: string
  type: RoadConfig['type']
  mesh: THREE.Mesh
  position: THREE.Vector3
  startPoint: THREE.Vector3
  endPoint: THREE.Vector3
  width: number
  lanes: number
  connectedRoads: string[]
  trafficFlow: THREE.Vector3[]
}

export interface TrafficLight {
  id: string
  position: THREE.Vector3
  mesh: THREE.Group
  currentState: 'red' | 'yellow' | 'green'
  timer: number
  connectedRoads: string[]
}

export class VehicleSystem {
  private renderer: GLXYGameRenderer
  private scene: THREE.Scene
  private vehicles: Map<string, Vehicle> = new Map()
  private roads: Map<string, Road> = new Map()
  private trafficLights: Map<string, TrafficLight> = new Map()

  // Physics constants
  private readonly GRAVITY = 9.81
  private readonly FRICTION_COEFFICIENT = 0.7
  private readonly DRIFT_FRICTION = 0.3
  private readonly AIR_RESISTANCE = 0.02

  // Drift parameters
  private readonly DRIFT_SPEED_THRESHOLD = 15
  private readonly DRIFT_ANGLE_THRESHOLD = Math.PI / 6
  private readonly DRIFT_BOOST = 1.5

  constructor(renderer: GLXYGameRenderer) {
    this.renderer = renderer
    this.scene = renderer.getScene()
  }

  public createVehicle(config: VehicleConfig): Vehicle {
    const group = new THREE.Group()

    // Create vehicle body based on type
    const { body, wheels, interior } = this.createVehicleMesh(config.type, config.color || 0xff0000)

    group.add(body)
    wheels.forEach(wheel => group.add(wheel))
    if (interior) group.add(interior)

    group.position.copy(config.position)
    group.rotation.y = config.rotation || 0

    // Vehicle physics properties based on type
    const vehicleProperties = this.getVehicleProperties(config.type)

    const vehicle: Vehicle = {
      id: `vehicle_${config.type}_${Date.now()}_${Math.random()}`,
      type: config.type,
      mesh: group,
      position: config.position.clone(),
      rotation: group.rotation.clone(),
      velocity: new THREE.Vector3(0, 0, 0),
      angularVelocity: 0,
      speed: 0,
      maxSpeed: vehicleProperties.maxSpeed,
      acceleration: vehicleProperties.acceleration,
      braking: vehicleProperties.braking,
      handling: vehicleProperties.handling,
      weight: vehicleProperties.weight,
      health: 100,
      maxHealth: 100,
      isPlayerControlled: config.isPlayerControlled || false,
      isDrifting: false,
      driftAngle: 0,
      trail: [],
      engineForce: 0,
      steerAngle: 0,
      wheelRotation: 0,
      stats: vehicleProperties.stats
    }

    // Add to physics system
    this.renderer.addGameObject({
      id: vehicle.id,
      mesh: group,
      rigidBody: {
        velocity: new THREE.Vector3(0, 0, 0),
        mass: vehicle.weight,
        friction: this.FRICTION_COEFFICIENT,
        restitution: 0.3
      },
      collider: {
        type: 'box',
        size: new THREE.Vector3(4, 2, 8)
      },
      castShadow: true,
      receiveShadow: true
    })

    this.vehicles.set(vehicle.id, vehicle)
    this.scene.add(group)

    return vehicle
  }

  private createVehicleMesh(type: VehicleConfig['type'], color: number): {
    body: THREE.Mesh
    wheels: THREE.Mesh[]
    interior?: THREE.Mesh
  } {
    let bodyGeometry: THREE.BufferGeometry
    let bodyMaterial: THREE.MeshStandardMaterial
    let wheelPositions: THREE.Vector3[]

    switch (type) {
      case 'sports-car':
        bodyGeometry = new THREE.BoxGeometry(3.5, 1.2, 7)
        bodyMaterial = new THREE.MeshStandardMaterial({
          color,
          metalness: 0.8,
          roughness: 0.2
        })
        wheelPositions = [
          new THREE.Vector3(-1.2, -0.3, 2.5),
          new THREE.Vector3(1.2, -0.3, 2.5),
          new THREE.Vector3(-1.2, -0.3, -2.5),
          new THREE.Vector3(1.2, -0.3, -2.5)
        ]
        break

      case 'drift-car':
        bodyGeometry = new THREE.BoxGeometry(3.8, 1.1, 8)
        bodyMaterial = new THREE.MeshStandardMaterial({
          color: 0x000000,
          metalness: 0.9,
          roughness: 0.1
        })
        wheelPositions = [
          new THREE.Vector3(-1.3, -0.4, 3),
          new THREE.Vector3(1.3, -0.4, 3),
          new THREE.Vector3(-1.3, -0.4, -3),
          new THREE.Vector3(1.3, -0.4, -3)
        ]
        break

      case 'truck':
        bodyGeometry = new THREE.BoxGeometry(5, 2.5, 10)
        bodyMaterial = new THREE.MeshStandardMaterial({
          color: 0x4a4a4a,
          metalness: 0.3,
          roughness: 0.7
        })
        wheelPositions = [
          new THREE.Vector3(-1.5, -0.8, 3.5),
          new THREE.Vector3(1.5, -0.8, 3.5),
          new THREE.Vector3(-1.5, -0.8, -3.5),
          new THREE.Vector3(1.5, -0.8, -3.5),
          new THREE.Vector3(-1.5, -0.8, 1),
          new THREE.Vector3(1.5, -0.8, 1)
        ]
        break

      case 'police-car':
        bodyGeometry = new THREE.BoxGeometry(4, 1.5, 8)
        bodyMaterial = new THREE.MeshStandardMaterial({
          color: 0x0000ff,
          metalness: 0.6,
          roughness: 0.4
        })
        wheelPositions = [
          new THREE.Vector3(-1.3, -0.4, 2.8),
          new THREE.Vector3(1.3, -0.4, 2.8),
          new THREE.Vector3(-1.3, -0.4, -2.8),
          new THREE.Vector3(1.3, -0.4, -2.8)
        ]
        break

      default: // 'car'
        bodyGeometry = new THREE.BoxGeometry(4, 1.5, 8)
        bodyMaterial = new THREE.MeshStandardMaterial({
          color,
          metalness: 0.5,
          roughness: 0.5
        })
        wheelPositions = [
          new THREE.Vector3(-1.3, -0.4, 2.8),
          new THREE.Vector3(1.3, -0.4, 2.8),
          new THREE.Vector3(-1.3, -0.4, -2.8),
          new THREE.Vector3(1.3, -0.4, -2.8)
        ]
    }

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 1
    body.castShadow = true
    body.receiveShadow = true

    // Create wheels
    const wheels: THREE.Mesh[] = []
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16)
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8
    })

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
      wheel.rotation.z = Math.PI / 2
      wheel.position.copy(pos)
      wheel.castShadow = true
      wheels.push(wheel)
    })

    // Create interior for sports cars and drift cars
    let interior: THREE.Mesh | undefined
    if (type === 'sports-car' || type === 'drift-car') {
      const interiorGeometry = new THREE.BoxGeometry(3.2, 0.8, 4)
      const interiorMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.9
      })
      interior = new THREE.Mesh(interiorGeometry, interiorMaterial)
      interior.position.y = 1.3
      interior.position.z = -0.5
    }

    return { body, wheels, interior }
  }

  private getVehicleProperties(type: VehicleConfig['type']) {
    const properties = {
      'car': {
        maxSpeed: 35,
        acceleration: 8,
        braking: 12,
        handling: 0.8,
        weight: 1500,
        stats: { horsepower: 150, torque: 200, topSpeed: 180, acceleration_0_60: 8.5, brakingDistance: 35 }
      },
      'drift-car': {
        maxSpeed: 45,
        acceleration: 12,
        braking: 15,
        handling: 1.2,
        weight: 1200,
        stats: { horsepower: 400, torque: 450, topSpeed: 200, acceleration_0_60: 4.5, brakingDistance: 30 }
      },
      'sports-car': {
        maxSpeed: 55,
        acceleration: 15,
        braking: 18,
        handling: 1.0,
        weight: 1400,
        stats: { horsepower: 500, torque: 550, topSpeed: 280, acceleration_0_60: 3.2, brakingDistance: 28 }
      },
      'truck': {
        maxSpeed: 25,
        acceleration: 4,
        braking: 8,
        handling: 0.4,
        weight: 3000,
        stats: { horsepower: 200, torque: 400, topSpeed: 120, acceleration_0_60: 12, brakingDistance: 45 }
      },
      'police-car': {
        maxSpeed: 40,
        acceleration: 10,
        braking: 14,
        handling: 0.9,
        weight: 1800,
        stats: { horsepower: 300, torque: 350, topSpeed: 200, acceleration_0_60: 6.0, brakingDistance: 32 }
      }
    }

    return properties[type] || properties['car']
  }

  public createRoad(config: RoadConfig): Road {
    const group = new THREE.Group()

    // Calculate road direction and length
    const direction = new THREE.Vector3().subVectors(config.endPoint, config.startPoint)
    const length = direction.length()
    direction.normalize()

    // Create road geometry
    const roadGeometry = new THREE.PlaneGeometry(config.width, length)
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8
    })

    const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial)
    roadMesh.rotateX(Math.PI / 2)

    // Position road at center point
    const centerPoint = new THREE.Vector3().addVectors(config.startPoint, config.endPoint).multiplyScalar(0.5)
    roadMesh.position.copy(centerPoint)

    // Rotate road to align with direction
    const angle = Math.atan2(direction.x, direction.z)
    roadMesh.rotation.y = angle

    // Create lane markings
    const laneWidth = config.width / config.lanes
    for (let i = 1; i < config.lanes; i++) {
      const markingGeometry = new THREE.PlaneGeometry(0.1, length)
      const markingMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.5
      })

      const marking = new THREE.Mesh(markingGeometry, markingMaterial)
      marking.rotateX(Math.PI / 2)
      marking.position.copy(centerPoint)
      marking.rotation.y = angle

      const offset = (i - config.lanes / 2 + 0.5) * laneWidth
      marking.position.x += Math.cos(angle + Math.PI / 2) * offset
      marking.position.z += Math.sin(angle + Math.PI / 2) * offset

      group.add(marking)
    }

    // Create sidewalks
    const sidewalkWidth = 2
    const sidewalkGeometry = new THREE.PlaneGeometry(sidewalkWidth, length)
    const sidewalkMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.9
    })

    // Left sidewalk
    const leftSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial)
    leftSidewalk.rotateX(Math.PI / 2)
    leftSidewalk.position.copy(centerPoint)
    leftSidewalk.rotation.y = angle
    leftSidewalk.position.x += Math.cos(angle + Math.PI / 2) * (config.width / 2 + sidewalkWidth / 2)
    leftSidewalk.position.z += Math.sin(angle + Math.PI / 2) * (config.width / 2 + sidewalkWidth / 2)
    group.add(leftSidewalk)

    // Right sidewalk
    const rightSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial)
    rightSidewalk.rotateX(Math.PI / 2)
    rightSidewalk.position.copy(centerPoint)
    rightSidewalk.rotation.y = angle
    rightSidewalk.position.x += Math.cos(angle - Math.PI / 2) * (config.width / 2 + sidewalkWidth / 2)
    rightSidewalk.position.z += Math.sin(angle - Math.PI / 2) * (config.width / 2 + sidewalkWidth / 2)
    group.add(rightSidewalk)

    group.add(roadMesh)
    this.scene.add(group)

    const road: Road = {
      id: `road_${config.type}_${Date.now()}_${Math.random()}`,
      type: config.type,
      mesh: roadMesh,
      position: centerPoint.clone(),
      startPoint: config.startPoint.clone(),
      endPoint: config.endPoint.clone(),
      width: config.width,
      lanes: config.lanes,
      connectedRoads: [],
      trafficFlow: [direction.clone().multiplyScalar(1), direction.clone().multiplyScalar(-1)]
    }

    this.roads.set(road.id, road)

    return road
  }

  public createStreetLayout(): void {
    // Create a city street layout

    // Main highway (horizontal)
    this.createRoad({
      type: 'highway',
      startPoint: new THREE.Vector3(-100, 0.01, 0),
      endPoint: new THREE.Vector3(100, 0.01, 0),
      width: 20,
      lanes: 4
    })

    // Main highway (vertical)
    this.createRoad({
      type: 'highway',
      startPoint: new THREE.Vector3(0, 0.01, -100),
      endPoint: new THREE.Vector3(0, 0.01, 100),
      width: 20,
      lanes: 4
    })

    // Secondary streets (grid pattern)
    for (let x = -60; x <= 60; x += 30) {
      if (x !== 0) {
        this.createRoad({
          type: 'street',
          startPoint: new THREE.Vector3(x, 0.01, -80),
          endPoint: new THREE.Vector3(x, 0.01, 80),
          width: 12,
          lanes: 2
        })
      }
    }

    for (let z = -60; z <= 60; z += 30) {
      if (z !== 0) {
        this.createRoad({
          type: 'street',
          startPoint: new THREE.Vector3(-80, 0.01, z),
          endPoint: new THREE.Vector3(80, 0.01, z),
          width: 12,
          lanes: 2
        })
      }
    }

    // Parking lots at intersections
    for (let x = -60; x <= 60; x += 60) {
      for (let z = -60; z <= 60; z += 60) {
        this.createRoad({
          type: 'parking-lot',
          startPoint: new THREE.Vector3(x - 8, 0.01, z - 8),
          endPoint: new THREE.Vector3(x + 8, 0.01, z + 8),
          width: 16,
          lanes: 1
        })
      }
    }
  }

  public createTrafficLights(): void {
    // Add traffic lights at major intersections
    const intersections = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(30, 0, 0),
      new THREE.Vector3(-30, 0, 0),
      new THREE.Vector3(0, 0, 30),
      new THREE.Vector3(0, 0, -30)
    ]

    intersections.forEach((pos, index) => {
      const light = this.createTrafficLight(pos)
      this.trafficLights.set(light.id, light)
    })
  }

  private createTrafficLight(position: THREE.Vector3): TrafficLight {
    const group = new THREE.Group()

    // Pole
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4)
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 })
    const pole = new THREE.Mesh(poleGeometry, poleMaterial)
    pole.position.y = 2
    group.add(pole)

    // Light box
    const boxGeometry = new THREE.BoxGeometry(1, 0.3, 0.8)
    const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x202020 })
    const lightBox = new THREE.Mesh(boxGeometry, boxMaterial)
    lightBox.position.y = 3.5
    group.add(lightBox)

    // Individual lights
    const lights = [
      { color: 0xff0000, position: -0.2 }, // Red
      { color: 0xffff00, position: 0 },    // Yellow
      { color: 0x00ff00, position: 0.2 }   // Green
    ]

    lights.forEach(light => {
      const lightGeometry = new THREE.SphereGeometry(0.1, 8, 8)
      const lightMaterial = new THREE.MeshStandardMaterial({
        color: light.color,
        emissive: light.color,
        emissiveIntensity: 0.3
      })
      const lightMesh = new THREE.Mesh(lightGeometry, lightMaterial)
      lightMesh.position.y = 3.5 + light.position
      group.add(lightMesh)
    })

    group.position.copy(position)
    this.scene.add(group)

    const trafficLight: TrafficLight = {
      id: `traffic_light_${Date.now()}_${Math.random()}`,
      position: position.clone(),
      mesh: group,
      currentState: 'green',
      timer: 0,
      connectedRoads: []
    }

    return trafficLight
  }

  public spawnTraffic(): void {
    // Spawn AI-controlled vehicles
    const vehicleTypes: VehicleConfig['type'][] = ['car', 'truck', 'police-car']
    const spawnCount = 8

    for (let i = 0; i < spawnCount; i++) {
      const roadArray = Array.from(this.roads.values())
      if (roadArray.length === 0) continue

      const randomRoad = roadArray[Math.floor(Math.random() * roadArray.length)]
      const spawnPosition = randomRoad.startPoint.clone()

      // Add some randomness to spawn position
      spawnPosition.x += (Math.random() - 0.5) * randomRoad.width * 0.8
      spawnPosition.z += (Math.random() - 0.5) * 10

      const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)]
      const vehicle = this.createVehicle({
        type: vehicleType,
        position: spawnPosition,
        rotation: Math.random() * Math.PI * 2,
        isPlayerControlled: false
      })

      // Set initial velocity for AI vehicles
      const direction = randomRoad.trafficFlow[0]
      vehicle.velocity.copy(direction.multiplyScalar(10))
      vehicle.engineForce = 5
    }
  }

  public updateVehicles(deltaTime: number): void {
    this.vehicles.forEach(vehicle => {
      if (!vehicle.isPlayerControlled) {
        // AI vehicle behavior
        this.updateAIVehicle(vehicle, deltaTime)
      } else {
        // Player vehicle physics
        this.updatePlayerVehicle(vehicle, deltaTime)
      }

      // Update vehicle mesh position
      vehicle.mesh.position.copy(vehicle.position)
      vehicle.mesh.rotation.copy(vehicle.rotation)

      // Animate wheels
      this.animateWheels(vehicle, deltaTime)

      // Handle drift effects
      if (vehicle.isDrifting) {
        this.updateDriftEffects(vehicle, deltaTime)
      }
    })

    // Update traffic lights
    this.updateTrafficLights(deltaTime)
  }

  private updatePlayerVehicle(vehicle: Vehicle, deltaTime: number): void {
    // Apply engine force
    const forwardForce = new THREE.Vector3(0, 0, vehicle.engineForce)
    forwardForce.applyQuaternion(vehicle.mesh.quaternion)

    // Apply physics
    vehicle.velocity.add(forwardForce.multiplyScalar(deltaTime / vehicle.weight))

    // Apply steering
    if (Math.abs(vehicle.velocity.length()) > 0.1) {
      const steerDirection = new THREE.Vector3(vehicle.steerAngle, 0, 0)
      vehicle.rotation.y += steerDirection.y * deltaTime

      // Rotate velocity vector
      vehicle.velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicle.steerAngle * deltaTime)
    }

    // Check for drift conditions
    const speed = vehicle.velocity.length()
    const lateralVelocity = this.calculateLateralVelocity(vehicle)

    if (speed > this.DRIFT_SPEED_THRESHOLD && Math.abs(lateralVelocity) > this.DRIFT_ANGLE_THRESHOLD && vehicle.type === 'drift-car') {
      if (!vehicle.isDrifting) {
        this.startDrift(vehicle)
      }
    } else if (vehicle.isDrifting && speed < this.DRIFT_SPEED_THRESHOLD) {
      this.endDrift(vehicle)
    }

    // Apply friction
    const friction = vehicle.isDrifting ? this.DRIFT_FRICTION : this.FRICTION_COEFFICIENT
    vehicle.velocity.multiplyScalar(1 - friction * deltaTime)

    // Apply air resistance
    vehicle.velocity.multiplyScalar(1 - this.AIR_RESISTANCE * speed * deltaTime)

    // Update position
    vehicle.position.add(vehicle.velocity.clone().multiplyScalar(deltaTime))

    // Keep vehicle on ground
    vehicle.position.y = 0.5
  }

  private updateAIVehicle(vehicle: Vehicle, deltaTime: number): void {
    // Simple AI: follow roads, avoid collisions
    vehicle.velocity.multiplyScalar(0.98) // Friction

    // Random behavior changes
    if (Math.random() < 0.01) {
      vehicle.engineForce = (Math.random() - 0.5) * 10
    }

    // Apply engine force
    const forwardVector = new THREE.Vector3(0, 0, 1)
    forwardVector.applyQuaternion(vehicle.mesh.quaternion)
    vehicle.velocity.add(forwardVector.multiplyScalar(vehicle.engineForce * deltaTime))

    // Limit speed
    const speed = vehicle.velocity.length()
    if (speed > vehicle.maxSpeed) {
      vehicle.velocity.normalize().multiplyScalar(vehicle.maxSpeed)
    }

    // Update position
    vehicle.position.add(vehicle.velocity.clone().multiplyScalar(deltaTime))

    // Simple boundary checking
    if (Math.abs(vehicle.position.x) > 100) {
      vehicle.velocity.x *= -1
      vehicle.rotation.y += Math.PI
    }
    if (Math.abs(vehicle.position.z) > 100) {
      vehicle.velocity.z *= -1
      vehicle.rotation.y += Math.PI
    }

    // Keep vehicle on ground
    vehicle.position.y = 0.5

    // Update rotation to match movement direction
    if (speed > 0.1) {
      const targetRotation = Math.atan2(vehicle.velocity.x, vehicle.velocity.z)
      vehicle.mesh.rotation.y = targetRotation
      vehicle.rotation.y = targetRotation
    }
  }

  private calculateLateralVelocity(vehicle: Vehicle): number {
    const forwardVector = new THREE.Vector3(0, 0, 1)
    forwardVector.applyQuaternion(vehicle.mesh.quaternion)

    const velocityNormalized = vehicle.velocity.clone().normalize()
    const dotProduct = forwardVector.dot(velocityNormalized)

    return Math.acos(Math.max(-1, Math.min(1, dotProduct))) - Math.PI / 2
  }

  private startDrift(vehicle: Vehicle): void {
    vehicle.isDrifting = true
    vehicle.driftAngle = 0
    console.log(`🚗 DRIFT STARTED - Vehicle ${vehicle.id}`)
  }

  private endDrift(vehicle: Vehicle): void {
    vehicle.isDrifting = false
    vehicle.driftAngle = 0
    console.log(`🏁 DRIFT ENDED - Vehicle ${vehicle.id}`)
  }

  private updateDriftEffects(vehicle: Vehicle, deltaTime: number): void {
    // Create tire smoke/trail effects
    if (Math.random() < 0.3) {
      this.createDriftParticle(vehicle)
    }

    // Apply drift physics
    vehicle.driftAngle += deltaTime * 2

    const driftForce = new THREE.Vector3(
      Math.sin(vehicle.driftAngle) * this.DRIFT_BOOST,
      0,
      Math.cos(vehicle.driftAngle) * this.DRIFT_BOOST
    )

    vehicle.velocity.add(driftForce.multiplyScalar(deltaTime))
  }

  private createDriftParticle(vehicle: Vehicle): void {
    const particleGeometry = new THREE.SphereGeometry(0.2, 4, 4)
    const particleMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.6
    })

    const particle = new THREE.Mesh(particleGeometry, particleMaterial)
    particle.position.copy(vehicle.position)
    particle.position.y = 0.1

    this.scene.add(particle)

    // Animate and remove particle
    const animate = () => {
      particle.position.y += 0.1
      particle.material.opacity -= 0.02
      particle.scale.multiplyScalar(1.05)

      if (particle.material.opacity > 0) {
        requestAnimationFrame(animate)
      } else {
        this.scene.remove(particle)
      }
    }
    animate()
  }

  private animateWheels(vehicle: Vehicle, deltaTime: number): void {
    const speed = vehicle.velocity.length()
    const wheelRotation = speed * deltaTime * 2

    // Find wheel meshes and rotate them
    vehicle.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry) {
        child.rotation.x += wheelRotation
      }
    })
  }

  private updateTrafficLights(deltaTime: number): void {
    this.trafficLights.forEach(light => {
      light.timer += deltaTime

      // Simple traffic light cycle
      if (light.currentState === 'green' && light.timer > 10) {
        light.currentState = 'yellow'
        light.timer = 0
        this.updateTrafficLightMesh(light)
      } else if (light.currentState === 'yellow' && light.timer > 3) {
        light.currentState = 'red'
        light.timer = 0
        this.updateTrafficLightMesh(light)
      } else if (light.currentState === 'red' && light.timer > 8) {
        light.currentState = 'green'
        light.timer = 0
        this.updateTrafficLightMesh(light)
      }
    })
  }

  private updateTrafficLightMesh(light: TrafficLight): void {
    // Update light mesh colors based on current state
    light.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (child.material.color.getHex() === 0xff0000) {
          child.material.emissiveIntensity = light.currentState === 'red' ? 0.8 : 0.1
        } else if (child.material.color.getHex() === 0xffff00) {
          child.material.emissiveIntensity = light.currentState === 'yellow' ? 0.8 : 0.1
        } else if (child.material.color.getHex() === 0x00ff00) {
          child.material.emissiveIntensity = light.currentState === 'green' ? 0.8 : 0.1
        }
      }
    })
  }

  // Vehicle control methods for player
  public accelerateVehicle(vehicleId: string, force: number): void {
    const vehicle = this.vehicles.get(vehicleId)
    if (vehicle && vehicle.isPlayerControlled) {
      vehicle.engineForce = Math.min(force, vehicle.acceleration)
    }
  }

  public brakeVehicle(vehicleId: string, force: number): void {
    const vehicle = this.vehicles.get(vehicleId)
    if (vehicle && vehicle.isPlayerControlled) {
      vehicle.engineForce = -Math.min(force, vehicle.braking)
    }
  }

  public steerVehicle(vehicleId: string, angle: number): void {
    const vehicle = this.vehicles.get(vehicleId)
    if (vehicle && vehicle.isPlayerControlled) {
      vehicle.steerAngle = angle * vehicle.handling
    }
  }

  public handbrakeVehicle(vehicleId: string): void {
    const vehicle = this.vehicles.get(vehicleId)
    if (vehicle && vehicle.isPlayerControlled && vehicle.type === 'drift-car') {
      // Initiate drift
      vehicle.velocity.multiplyScalar(0.8)
      this.startDrift(vehicle)
    }
  }

  // Getters
  public getVehicle(id: string): Vehicle | undefined {
    return this.vehicles.get(id)
  }

  public getAllVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values())
  }

  public getPlayerVehicle(): Vehicle | undefined {
    return Array.from(this.vehicles.values()).find(v => v.isPlayerControlled)
  }

  public getRoads(): Road[] {
    return Array.from(this.roads.values())
  }

  public getTrafficLights(): TrafficLight[] {
    return Array.from(this.trafficLights.values())
  }

  public dispose(): void {
    // Clean up all vehicles
    this.vehicles.forEach(vehicle => {
      this.scene.remove(vehicle.mesh)
      this.renderer.removeGameObject(vehicle.id)
    })

    // Clean up all roads
    this.roads.forEach(road => {
      this.scene.remove(road.mesh)
    })

    // Clean up traffic lights
    this.trafficLights.forEach(light => {
      this.scene.remove(light.mesh)
    })

    // Clear maps
    this.vehicles.clear()
    this.roads.clear()
    this.trafficLights.clear()
  }
}

export default VehicleSystem
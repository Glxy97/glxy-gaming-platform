// @ts-nocheck
/**
 * GLXY Enhanced Camera Controller
 * Advanced camera system with smooth tracking, dynamic zoom, and cinematic effects
 */

import * as THREE from 'three'

export interface CameraConfig {
  // Follow settings
  followDistance: number
  followHeight: number
  lookAheadDistance: number
  followSpeed: number
  rotationSpeed: number

  // Smooth settings
  positionLerp: number
  rotationLerp: number
  zoomLerp: number

  // Zoom settings
  minZoom: number
  maxZoom: number
  zoomSpeed: number

  // Collision settings
  enableCollisionDetection: boolean
  collisionOffset: number
  collisionSmoothness: number

  // Cinematic settings
  enableCinematicMode: boolean
  shakeIntensity: number
  shakeDuration: number
  shakeFrequency: number

  // FOV settings
  enableDynamicFOV: boolean
  baseFOV: number
  speedFOVFactor: number
  minFOV: number
  maxFOV: number
}

export interface CameraState {
  targetPosition: THREE.Vector3
  currentPosition: THREE.Vector3
  targetRotation: THREE.Euler
  currentRotation: THREE.Euler
  currentZoom: number
  targetZoom: number
  isShaking: boolean
  shakeTime: number
  currentFOV: number
  targetFOV: number
}

export class EnhancedCameraController {
  private camera: THREE.PerspectiveCamera
  private config: CameraConfig
  private state: CameraState

  // Collision detection
  private raycaster: THREE.Raycaster
  private collisionNormals: THREE.Vector3[] = []

  // Shake parameters
  private shakeOffset = new THREE.Vector3()
  private originalRotation = new THREE.Euler()

  // Target reference
  private target: THREE.Object3D | null = null

  constructor(camera: THREE.PerspectiveCamera, config: Partial<CameraConfig> = {}) {
    this.camera = camera
    this.config = {
      followDistance: 10,
      followHeight: 5,
      lookAheadDistance: 2,
      followSpeed: 8,
      rotationSpeed: 5,
      positionLerp: 0.1,
      rotationLerp: 0.05,
      zoomLerp: 0.1,
      minZoom: 5,
      maxZoom: 20,
      zoomSpeed: 2,
      enableCollisionDetection: true,
      collisionOffset: 0.5,
      collisionSmoothness: 0.8,
      enableCinematicMode: false,
      shakeIntensity: 0.1,
      shakeDuration: 0.5,
      shakeFrequency: 10,
      enableDynamicFOV: true,
      baseFOV: 75,
      speedFOVFactor: 0.02,
      minFOV: 60,
      maxFOV: 90,
      ...config
    }

    this.state = {
      targetPosition: new THREE.Vector3(),
      currentPosition: camera.position.clone(),
      targetRotation: camera.rotation.clone(),
      currentRotation: camera.rotation.clone(),
      currentZoom: this.config.followDistance,
      targetZoom: this.config.followDistance,
      isShaking: false,
      shakeTime: 0,
      currentFOV: this.config.baseFOV,
      targetFOV: this.config.baseFOV
    }

    this.raycaster = new THREE.Raycaster()
    this.originalRotation.copy(camera.rotation)
  }

  /**
   * Set the target object for the camera to follow
   */
  public setTarget(target: THREE.Object3D | null): void {
    this.target = target
  }

  /**
   * Update camera position and rotation
   */
  public update(deltaTime: number, targetVelocity?: THREE.Vector3): void {
    if (!this.target) return

    // Calculate target position based on target object
    this.calculateTargetPosition()

    // Apply collision detection if enabled
    if (this.config.enableCollisionDetection) {
      this.applyCollisionDetection()
    }

    // Smooth camera movement
    this.updateCameraPosition(deltaTime)

    // Update camera rotation to look at target
    this.updateCameraRotation(deltaTime)

    // Update zoom
    this.updateCameraZoom(deltaTime)

    // Apply screen shake if active
    this.updateScreenShake(deltaTime)

    // Update dynamic FOV based on speed
    if (this.config.enableDynamicFOV && targetVelocity) {
      this.updateDynamicFOV(targetVelocity, deltaTime)
    }

    // Apply cinematic effects
    if (this.config.enableCinematicMode) {
      this.applyCinematicEffects(deltaTime)
    }
  }

  /**
   * Calculate the ideal target position for the camera
   */
  private calculateTargetPosition(): void {
    if (!this.target) return

    const targetPos = this.target.position.clone()

    // Calculate follow position behind and above the target
    const followOffset = new THREE.Vector3(0, this.config.followHeight, -this.state.currentZoom)

    // Apply look-ahead based on target velocity
    if (this.target instanceof THREE.Mesh && (this.target as any).velocity) {
      const velocity = (this.target as any).velocity
      const lookAhead = velocity.clone().normalize().multiplyScalar(this.config.lookAheadDistance)
      followOffset.add(lookAhead)
    }

    this.state.targetPosition.copy(targetPos).add(followOffset)
  }

  /**
   * Apply collision detection to prevent camera from clipping through objects
   */
  private applyCollisionDetection(): void {
    // Cast rays from camera to target to detect obstacles
    const direction = this.state.targetPosition.clone().sub(this.state.currentPosition).normalize()
    const distance = this.state.targetPosition.distanceTo(this.state.currentPosition)

    this.raycaster.set(this.state.currentPosition, direction)

    // Check for collisions with ground objects
    const colliders = this.getCollisionColliders()
    const intersections = this.raycaster.intersectObjects(colliders)

    if (intersections.length > 0) {
      const intersection = intersections[0]
      const maxAllowedDistance = intersection.distance - this.config.collisionOffset

      if (distance > maxAllowedDistance) {
        // Adjust target position to avoid collision
        const adjustedDirection = direction.normalize().multiplyScalar(maxAllowedDistance)
        this.state.targetPosition.copy(this.state.currentPosition).add(adjustedDirection)
      }
    }
  }

  /**
   * Get collision colliders (implementation depends on game world)
   */
  private getCollisionColliders(): THREE.Object3D[] {
    // This should return all objects that can block camera movement
    return (window as any).cameraColliders || []
  }

  /**
   * Smoothly update camera position
   */
  private updateCameraPosition(deltaTime: number): void {
    const lerpFactor = 1 - Math.exp(-this.config.followSpeed * deltaTime)

    this.state.currentPosition.lerp(this.state.targetPosition, lerpFactor)
    this.camera.position.copy(this.state.currentPosition)
  }

  /**
   * Update camera rotation to look at target
   */
  private updateCameraRotation(deltaTime: number): void {
    if (!this.target) return

    // Calculate look-at position
    const lookAtPosition = this.target.position.clone()

    // Apply look-ahead
    if (this.target instanceof THREE.Mesh && (this.target as any).velocity) {
      const velocity = (this.target as any).velocity
      const lookAhead = velocity.clone().multiplyScalar(this.config.lookAheadDistance)
      lookAtPosition.add(lookAhead)
    }

    // Calculate target rotation
    this.camera.lookAt(lookAtPosition)
    this.state.targetRotation.copy(this.camera.rotation)

    // Smooth rotation
    const rotationLerp = 1 - Math.exp(-this.config.rotationSpeed * deltaTime)

    // Smooth quaternion rotation for better results
    const currentQuaternion = new THREE.Quaternion().setFromEuler(this.state.currentRotation)
    const targetQuaternion = new THREE.Quaternion().setFromEuler(this.state.targetRotation)

    currentQuaternion.slerp(targetQuaternion, rotationLerp)
    this.state.currentRotation.setFromQuaternion(currentQuaternion)

    // Apply screen shake offset
    this.camera.rotation.copy(this.state.currentRotation)
    this.camera.position.add(this.shakeOffset)
  }

  /**
   * Update camera zoom
   */
  private updateCameraZoom(deltaTime: number): void {
    const zoomLerp = 1 - Math.exp(-this.config.zoomSpeed * deltaTime)
    this.state.currentZoom += (this.state.targetZoom - this.state.currentZoom) * zoomLerp
  }

  /**
   * Update screen shake effect
   */
  private updateScreenShake(deltaTime: number): void {
    if (!this.state.isShaking) return

    this.state.shakeTime -= deltaTime

    if (this.state.shakeTime <= 0) {
      this.state.isShaking = false
      this.shakeOffset.set(0, 0, 0)
    } else {
      // Calculate shake offset
      const shakeProgress = 1 - (this.state.shakeTime / this.config.shakeDuration)
      const shakeIntensity = this.config.shakeIntensity * shakeProgress

      this.shakeOffset.x = (Math.random() - 0.5) * shakeIntensity
      this.shakeOffset.y = (Math.random() - 0.5) * shakeIntensity
      this.shakeOffset.z = (Math.random() - 0.5) * shakeIntensity
    }
  }

  /**
   * Update dynamic field of view based on movement speed
   */
  private updateDynamicFOV(velocity: THREE.Vector3, deltaTime: number): void {
    const speed = velocity.length()
    const speedFactor = Math.min(speed * this.config.speedFOVFactor, 1)

    // Calculate target FOV
    const fovRange = this.config.maxFOV - this.config.minFOV
    this.state.targetFOV = this.config.baseFOV + (fovRange * speedFactor)

    // Smooth FOV transition
    const fovLerp = 1 - Math.exp(-10 * deltaTime)
    this.state.currentFOV += (this.state.targetFOV - this.state.currentFOV) * fovLerp

    this.camera.fov = THREE.MathUtils.radToDeg(this.state.currentFOV)
  }

  /**
   * Apply cinematic camera effects
   */
  private applyCinematicEffects(deltaTime: number): void {
    // Add subtle camera movement for cinematic feel
    const time = Date.now() * 0.001

    const breatheIntensity = 0.02
    const breatheSpeed = 0.5

    // Subtle breathing effect
    const breatheOffset = Math.sin(time * breatheSpeed) * breatheIntensity
    this.state.currentPosition.y += breatheOffset * deltaTime
  }

  /**
   * Trigger screen shake effect
   */
  public triggerShake(intensity?: number, duration?: number): void {
    this.state.isShaking = true
    this.state.shakeTime = duration || this.config.shakeDuration
    this.config.shakeIntensity = intensity || this.config.shakeIntensity
  }

  /**
   * Set camera zoom
   */
  public setZoom(zoom: number): void {
    this.state.targetZoom = Math.max(
      this.config.minZoom,
      Math.min(this.config.maxZoom, zoom)
    )
  }

  /**
   * Get current camera zoom
   */
  public getZoom(): number {
    return this.state.currentZoom
  }

  /**
   * Add zoom amount
   */
  public addZoom(delta: number): void {
    this.setZoom(this.state.targetZoom + delta)
  }

  /**
   * Set camera configuration
   */
  public setConfig(config: Partial<CameraConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get camera configuration
   */
  public getConfig(): CameraConfig {
    return { ...this.config }
  }

  /**
   * Get camera state
   */
  public getState(): CameraState {
    return { ...this.state }
  }

  /**
   * Reset camera to default state
   */
  public reset(): void {
    this.state.targetPosition.set(0, 0, 0)
    this.state.currentPosition.set(0, 0, 0)
    this.state.targetRotation.set(0, 0, 0)
    this.state.currentRotation.set(0, 0, 0)
    this.state.currentZoom = this.config.followDistance
    this.state.targetZoom = this.config.followDistance
    this.state.isShaking = false
    this.state.shakeTime = 0
    this.state.currentFOV = this.config.baseFOV
    this.state.targetFOV = this.config.baseFOV
    this.shakeOffset.set(0, 0, 0)
  }

  /**
   * Dispose camera controller
   */
  public dispose(): void {
    this.target = null
    this.collisionNormals = []
  }
}

export default EnhancedCameraController
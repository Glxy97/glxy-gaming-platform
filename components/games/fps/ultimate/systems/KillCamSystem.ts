/**
 * 📹 KILL CAM SYSTEM
 * 
 * Records last moments before death and replays from killer's perspective
 */

import * as THREE from 'three'

export interface KillCamFrame {
  timestamp: number
  cameraPosition: THREE.Vector3
  cameraRotation: THREE.Euler
  targetPosition?: THREE.Vector3
}

export interface KillCamData {
  killerId: string
  killerName: string
  victimId: string
  victimName: string
  weaponUsed: string
  killTime: number
  frames: KillCamFrame[]
  distance: number
  isHeadshot: boolean
}

export class KillCamSystem {
  private recording: boolean = false
  private currentFrames: KillCamFrame[] = []
  private maxFrames: number = 180 // 3 seconds at 60fps
  private frameInterval: number = 16 // ~60fps
  private lastFrameTime: number = 0
  private lastKillCam: KillCamData | null = null

  constructor() {
    console.log('📹 Kill Cam System initialized')
  }

  /**
   * Start recording frames (called continuously for potential killer)
   */
  startRecording(camera: THREE.Camera): void {
    this.recording = true
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    this.recording = false
  }

  /**
   * Record a frame
   */
  recordFrame(camera: THREE.Camera, targetPosition?: THREE.Vector3): void {
    if (!this.recording) return

    const now = performance.now()
    if (now - this.lastFrameTime < this.frameInterval) return

    this.lastFrameTime = now

    const frame: KillCamFrame = {
      timestamp: now,
      cameraPosition: camera.position.clone(),
      cameraRotation: camera.rotation.clone(),
      targetPosition: targetPosition?.clone()
    }

    this.currentFrames.push(frame)

    // Keep only last N frames (rolling buffer)
    if (this.currentFrames.length > this.maxFrames) {
      this.currentFrames.shift()
    }
  }

  /**
   * Capture kill cam when a kill happens
   */
  captureKillCam(
    killerId: string,
    killerName: string,
    victimId: string,
    victimName: string,
    weaponUsed: string,
    killerPosition: THREE.Vector3,
    victimPosition: THREE.Vector3,
    isHeadshot: boolean
  ): KillCamData {
    const distance = killerPosition.distanceTo(victimPosition)

    const killCam: KillCamData = {
      killerId,
      killerName,
      victimId,
      victimName,
      weaponUsed,
      killTime: Date.now(),
      frames: [...this.currentFrames], // Copy frames
      distance,
      isHeadshot
    }

    this.lastKillCam = killCam
    this.currentFrames = [] // Clear for next recording

    console.log(`📹 Kill Cam captured: ${killerName} killed ${victimName} with ${weaponUsed} (${distance.toFixed(1)}m)`)

    return killCam
  }

  /**
   * Get last kill cam
   */
  getLastKillCam(): KillCamData | null {
    return this.lastKillCam
  }

  /**
   * Play kill cam (returns frame-by-frame data)
   */
  *playKillCam(killCam: KillCamData): Generator<KillCamFrame> {
    for (const frame of killCam.frames) {
      yield frame
    }
  }

  /**
   * Clear frames
   */
  clear(): void {
    this.currentFrames = []
    this.lastKillCam = null
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.clear()
    this.recording = false
  }
}

export default KillCamSystem


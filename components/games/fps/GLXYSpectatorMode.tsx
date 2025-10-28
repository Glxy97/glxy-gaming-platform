// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'

export interface KillReplay {
  id: string
  timestamp: number
  killerId: string
  victimId: string
  weaponId: string
  distance: number
  isHeadshot: boolean
  wallBang: boolean
  replayData: ReplayFrame[]
  duration: number
}

export interface ReplayFrame {
  timestamp: number
  killerPosition: THREE.Vector3
  killerRotation: THREE.Euler
  victimPosition: THREE.Vector3
  victimRotation: THREE.Euler
  bulletTrajectory: THREE.Vector3[]
  cameraPosition: THREE.Vector3
  cameraTarget: THREE.Vector3
  events: ReplayEvent[]
}

export interface ReplayEvent {
  type: 'shot' | 'hit' | 'kill' | 'wallbang' | 'headshot'
  timestamp: number
  position: THREE.Vector3
  data?: any
}

export interface SpectatorCamera {
  mode: 'free' | 'follow' | 'first_person' | 'third_person' | 'killcam' | 'overview'
  target?: string
  position: THREE.Vector3
  rotation: THREE.Euler
  fov: number
}

export interface SpectatorSettings {
  showPlayerNames: boolean
  showHealthBars: boolean
  showCrosshair: boolean
  showMinimap: boolean
  autoSwitchTargets: boolean
  killReplayVolume: number
  cameraSmoothness: number
  freeCamSpeed: number
}

export const GLXY_SPECTATOR_MODE = {
  // Default spectator settings
  DEFAULT_SETTINGS: {
    showPlayerNames: true,
    showHealthBars: true,
    showCrosshair: false,
    showMinimap: true,
    autoSwitchTargets: true,
    killReplayVolume: 0.7,
    cameraSmoothness: 0.15,
    freeCamSpeed: 10
  } as SpectatorSettings,

  // Kill replay recording
  RECORDING_FRAMERATE: 30, // 30 FPS for replay recording
  MAX_REPLAY_DURATION: 15000, // 15 seconds max
  REPLAY_BUFFER_SIZE: 450, // 15 seconds * 30 frames

  // Camera settings
  FOLLOW_CAMERA_DISTANCE: 3,
  OVERVIEW_CAMERA_HEIGHT: 50,
  KILLCAM_ZOOM_SPEED: 0.02,
  FREE_CAM_ACCELERATION: 15,

  // UI settings
  PLAYER_BAR_FADE_DISTANCE: 30,
  MINIMAP_ZOOM_LEVELS: [20, 40, 60, 80],
  TARGET_SWITCH_DELAY: 3000
}

export class SpectatorModeSystem {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private settings: SpectatorSettings
  private replayFrames: Map<string, ReplayFrame[]>
  private killReplays: KillReplay[]
  private currentReplay: KillReplay | null
  private spectatorCamera: SpectatorCamera
  private activePlayers: Map<string, any>
  private isRecording: boolean
  private recordingBuffer: ReplayFrame[]
  private lastRecordingTime: number

  // UI Elements
  private playerBars!: Map<string, HTMLElement>
  private killReplayUI!: HTMLElement | null
  private spectatorControls!: HTMLElement | null

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.settings = { ...GLXY_SPECTATOR_MODE.DEFAULT_SETTINGS }
    this.replayFrames = new Map()
    this.killReplays = []
    this.currentReplay = null
    this.activePlayers = new Map()
    this.isRecording = false
    this.recordingBuffer = []
    this.lastRecordingTime = 0
    this.playerBars = new Map()

    this.spectatorCamera = {
      mode: 'free',
      position: camera.position.clone(),
      rotation: new THREE.Euler(),
      fov: 75
    }

    this.initializeSystem()
  }

  private initializeSystem() {
    this.setupReplayRecording()
    this.setupSpectatorControls()
    this.createSpectatorUI()
  }

  // REPLAY RECORDING SYSTEM
  public startRecording() {
    this.isRecording = true
    this.recordingBuffer = []
    this.lastRecordingTime = Date.now()
    console.log('📹 Started recording kill replays...')
  }

  public stopRecording() {
    this.isRecording = false
    console.log('⏹️ Stopped recording kill replays')
  }

  public recordFrame(playerStates: Map<string, any>, bulletTrajectories: any[]) {
    if (!this.isRecording) return

    const now = Date.now()
    const frame: ReplayFrame = {
      timestamp: now,
      killerPosition: new THREE.Vector3(),
      killerRotation: new THREE.Euler(),
      victimPosition: new THREE.Vector3(),
      victimRotation: new THREE.Euler(),
      bulletTrajectory: [],
      cameraPosition: this.camera.position.clone(),
      cameraTarget: new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion),
      events: []
    }

    // Record player states
    playerStates.forEach((state, playerId) => {
      // This would capture player positions for potential replays
      if (state.isKiller || state.isVictim) {
        if (state.isKiller) {
          frame.killerPosition.copy(state.position)
          frame.killerRotation.copy(state.rotation)
        }
        if (state.isVictim) {
          frame.victimPosition.copy(state.position)
          frame.victimRotation.copy(state.rotation)
        }
      }
    })

    // Record bullet trajectories
    bulletTrajectories.forEach(trajectory => {
      frame.bulletTrajectory.push(trajectory.position.clone())
    })

    this.recordingBuffer.push(frame)

    // Keep buffer size limited
    if (this.recordingBuffer.length > GLXY_SPECTATOR_MODE.REPLAY_BUFFER_SIZE) {
      this.recordingBuffer.shift()
    }
  }

  public createKillReplay(killData: any): KillReplay | null {
    if (this.recordingBuffer.length === 0) return null

    const replayFrames = this.extractRelevantFrames(killData.timestamp)
    if (replayFrames.length === 0) return null

    const replay: KillReplay = {
      id: `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: killData.timestamp,
      killerId: killData.killerId,
      victimId: killData.victimId,
      weaponId: killData.weaponId,
      distance: killData.distance,
      isHeadshot: killData.isHeadshot,
      wallBang: killData.wallBang,
      replayData: replayFrames,
      duration: (replayFrames[replayFrames.length - 1]?.timestamp - replayFrames[0]?.timestamp) || 3000
    }

    this.killReplays.push(replay)
    console.log(`🎬 Created kill replay: ${killData.killerName} killed ${killData.victimName}`)
    return replay
  }

  private extractRelevantFrames(killTimestamp: number): ReplayFrame[] {
    const killTime = killTimestamp
    const startTime = killTime - 3000 // Start 3 seconds before kill
    const endTime = killTime + 2000 // End 2 seconds after kill

    return this.recordingBuffer.filter(frame =>
      frame.timestamp >= startTime && frame.timestamp <= endTime
    )
  }

  // SPECTATOR CAMERA SYSTEM
  public setSpectatorMode(mode: SpectatorCamera['mode'], targetId?: string) {
    this.spectatorCamera.mode = mode
    this.spectatorCamera.target = targetId

    switch (mode) {
      case 'free':
        this.enableFreeCamera()
        break
      case 'follow':
        this.enableFollowCamera(targetId)
        break
      case 'first_person':
        this.enableFirstPersonCamera(targetId)
        break
      case 'third_person':
        this.enableThirdPersonCamera(targetId)
        break
      case 'killcam':
        this.enableKillcamMode()
        break
      case 'overview':
        this.enableOverviewMode()
        break
    }
  }

  private enableFreeCamera() {
    console.log('📷 Free camera mode enabled')
    // Player can fly around freely
    this.camera.fov = 75
    this.camera.updateProjectionMatrix()
  }

  private enableFollowCamera(targetId?: string) {
    if (!targetId || !this.activePlayers.has(targetId)) return

    console.log(`📷 Following player: ${targetId}`)
    // Camera follows behind player
    this.camera.fov = 75
    this.camera.updateProjectionMatrix()
  }

  private enableFirstPersonCamera(targetId?: string) {
    if (!targetId || !this.activePlayers.has(targetId)) return

    console.log(`👁️ First person camera for: ${targetId}`)
    // Camera positioned at player's eyes
    this.camera.fov = 80
    this.camera.updateProjectionMatrix()
  }

  private enableThirdPersonCamera(targetId?: string) {
    if (!targetId || !this.activePlayers.has(targetId)) return

    console.log(`🎥 Third person camera for: ${targetId}`)
    // Over-the-shoulder camera
    this.camera.fov = 75
    this.camera.updateProjectionMatrix()
  }

  private enableKillcamMode() {
    console.log('💀 Killcam mode activated')
    // Special camera mode for watching kills
    this.camera.fov = 70
    this.camera.updateProjectionMatrix()
  }

  private enableOverviewMode() {
    console.log('🗺️ Overview mode activated')
    // Top-down tactical view
    this.camera.position.set(0, GLXY_SPECTATOR_MODE.OVERVIEW_CAMERA_HEIGHT, 0)
    this.camera.lookAt(0, 0, 0)
    this.camera.fov = 60
    this.camera.updateProjectionMatrix()
  }

  public updateCamera(deltaTime: number, input: any) {
    const smoothness = this.settings.cameraSmoothness
    const lerpFactor = 1 - Math.exp(-smoothness * deltaTime * 60)

    switch (this.spectatorCamera.mode) {
      case 'free':
        this.updateFreeCamera(deltaTime, input, lerpFactor)
        break
      case 'follow':
      case 'first_person':
      case 'third_person':
        this.updatePlayerCamera(deltaTime, lerpFactor)
        break
      case 'overview':
        this.updateOverviewCamera(deltaTime, input, lerpFactor)
        break
    }
  }

  private updateFreeCamera(deltaTime: number, input: any, lerpFactor: number) {
    const speed = this.settings.freeCamSpeed * deltaTime

    // Movement
    if (input.forward) this.camera.position.add(this.getForward().multiplyScalar(speed))
    if (input.backward) this.camera.position.add(this.getForward().multiplyScalar(-speed))
    if (input.left) this.camera.position.add(this.getRight().multiplyScalar(-speed))
    if (input.right) this.camera.position.add(this.getRight().multiplyScalar(speed))
    if (input.up) this.camera.position.y += speed
    if (input.down) this.camera.position.y -= speed

    // Mouse look
    if (input.mouseDelta) {
      this.spectatorCamera.rotation.x -= input.mouseDelta.y * 0.002
      this.spectatorCamera.rotation.y -= input.mouseDelta.x * 0.002

      // Clamp vertical rotation
      this.spectatorCamera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.spectatorCamera.rotation.x))
    }

    // Apply rotation
    this.camera.quaternion.setFromEuler(this.spectatorCamera.rotation)
  }

  private updatePlayerCamera(deltaTime: number, lerpFactor: number) {
    if (!this.spectatorCamera.target || !this.activePlayers.has(this.spectatorCamera.target)) return

    const target = this.activePlayers.get(this.spectatorCamera.target)
    const targetPosition = new THREE.Vector3().copy(target.position)
    const targetRotation = new THREE.Euler().copy(target.rotation)

    switch (this.spectatorCamera.mode) {
      case 'follow':
        // Follow behind player
        const offset = new THREE.Vector3(0, 2, GLXY_SPECTATOR_MODE.FOLLOW_CAMERA_DISTANCE)
        offset.applyQuaternion(target.quaternion)
        targetPosition.add(offset)
        break
      case 'first_person':
        // At player's eye level
        targetPosition.y += 1.8
        break
      case 'third_person':
        // Over shoulder
        const shoulderOffset = new THREE.Vector3(0.5, 1.8, 2)
        shoulderOffset.applyQuaternion(target.quaternion)
        targetPosition.add(shoulderOffset)
        break
    }

    // Smooth camera movement
    this.camera.position.lerp(targetPosition, lerpFactor)

    if (this.spectatorCamera.mode === 'first_person') {
      this.camera.quaternion.slerp(target.quaternion, lerpFactor)
    } else {
      this.camera.lookAt(target.position)
    }
  }

  private updateOverviewCamera(deltaTime: number, input: any, lerpFactor: number) {
    // Pan around the map
    if (input.mouseDelta) {
      this.camera.rotation.y -= input.mouseDelta.x * 0.003
    }

    const targetX = Math.sin(this.camera.rotation.y) * GLXY_SPECTATOR_MODE.OVERVIEW_CAMERA_HEIGHT
    const targetZ = Math.cos(this.camera.rotation.y) * GLXY_SPECTATOR_MODE.OVERVIEW_CAMERA_HEIGHT

    this.camera.position.x += (targetX - this.camera.position.x) * lerpFactor
    this.camera.position.z += (targetZ - this.camera.position.z) * lerpFactor
    this.camera.lookAt(0, 0, 0)
  }

  private getForward(): THREE.Vector3 {
    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyQuaternion(this.camera.quaternion)
    return forward.normalize()
  }

  private getRight(): THREE.Vector3 {
    const right = new THREE.Vector3(1, 0, 0)
    right.applyQuaternion(this.camera.quaternion)
    return right.normalize()
  }

  // KILL REPLAY PLAYBACK
  public playKillReplay(replayId: string) {
    const replay = this.killReplays.find(r => r.id === replayId)
    if (!replay) return

    console.log(`🎬 Playing kill replay: ${replayId}`)
    this.currentReplay = replay
    this.setSpectatorMode('killcam')
    this.startReplayPlayback(replay)
  }

  private startReplayPlayback(replay: KillReplay) {
    let frameIndex = 0
    const startTime = Date.now()

    const playFrame = () => {
      if (!this.currentReplay || this.currentReplay.id !== replay.id) return

      const elapsed = Date.now() - startTime
      const currentFrame = replay.replayData[frameIndex]

      if (currentFrame && elapsed >= currentFrame.timestamp - replay.replayData[0].timestamp) {
        this.applyReplayFrame(currentFrame)

        // Process events in this frame
        currentFrame.events.forEach(event => {
          this.processReplayEvent(event)
        })

        frameIndex++
      }

      if (frameIndex < replay.replayData.length) {
        requestAnimationFrame(playFrame)
      } else {
        this.endReplayPlayback()
      }
    }

    requestAnimationFrame(playFrame)
  }

  private applyReplayFrame(frame: ReplayFrame) {
    // Apply camera positions
    this.camera.position.lerp(frame.cameraPosition, 0.3)
    this.camera.lookAt(frame.cameraTarget)

    // You could also recreate player positions, bullets, etc. here
    // for a full cinematic replay
  }

  private processReplayEvent(event: ReplayEvent) {
    switch (event.type) {
      case 'shot':
        this.showShotEffect(event.position)
        break
      case 'hit':
        this.showHitEffect(event.position, event.data)
        break
      case 'kill':
        this.showKillEffect(event.position)
        break
      case 'wallbang':
        this.showWallbangEffect(event.position)
        break
      case 'headshot':
        this.showHeadshotEffect(event.position)
        break
    }
  }

  private showShotEffect(position: THREE.Vector3) {
    // Visual effect for shot
    console.log('💥 Shot effect at position:', position)
  }

  private showHitEffect(position: THREE.Vector3, data: any) {
    // Visual effect for hit
    console.log('🎯 Hit effect at position:', position, data)
  }

  private showKillEffect(position: THREE.Vector3) {
    // Visual effect for kill
    console.log('💀 Kill effect at position:', position)
  }

  private showWallbangEffect(position: THREE.Vector3) {
    // Visual effect for wallbang
    console.log('🔫 Wallbang effect at position:', position)
  }

  private showHeadshotEffect(position: THREE.Vector3) {
    // Visual effect for headshot
    console.log('🎯 Headshot effect at position:', position)
  }

  private endReplayPlayback() {
    console.log('🎬 Kill replay playback ended')
    this.currentReplay = null

    // Switch back to normal spectating
    if (this.settings.autoSwitchTargets && this.activePlayers.size > 0) {
      const firstPlayer = Array.from(this.activePlayers.keys())[0]
      this.setSpectatorMode('follow', firstPlayer)
    }
  }

  // UI SYSTEM
  private createSpectatorUI() {
    this.createSpectatorControls()
    this.createKillReplayUI()
    this.createPlayerIndicators()
  }

  private createSpectatorControls() {
    const controls = document.createElement('div')
    controls.className = 'spectator-controls'
    controls.innerHTML = `
      <div class="spectator-mode-indicator">
        <span class="mode-text">FREE CAM</span>
      </div>
      <div class="spectator-options">
        <button class="spectator-btn" data-mode="free">Free</button>
        <button class="spectator-btn" data-mode="follow">Follow</button>
        <button class="spectator-btn" data-mode="first_person">1st Person</button>
        <button class="spectator-btn" data-mode="third_person">3rd Person</button>
        <button class="spectator-btn" data-mode="overview">Overview</button>
      </div>
      <div class="player-list">
        <!-- Players will be listed here -->
      </div>
    `

    this.spectatorControls = controls
    document.body.appendChild(controls)
  }

  private createKillReplayUI() {
    const replayUI = document.createElement('div')
    replayUI.className = 'kill-replay-ui'
    replayUI.innerHTML = `
      <div class="replay-header">
        <span class="replay-title">KILL REPLAY</span>
        <button class="skip-replay-btn">SKIP</button>
      </div>
      <div class="replay-timeline">
        <div class="timeline-progress"></div>
      </div>
      <div class="replay-info">
        <div class="killer-info"></div>
        <div class="vs-text">VS</div>
        <div class="victim-info"></div>
      </div>
    `

    this.killReplayUI = replayUI
    document.body.appendChild(replayUI)
    this.hideKillReplayUI()
  }

  private showKillReplayUI(replay: KillReplay) {
    if (!this.killReplayUI) return

    this.killReplayUI.style.display = 'block'

    // Update replay info
    const killerInfo = this.killReplayUI.querySelector('.killer-info')
    const victimInfo = this.killReplayUI.querySelector('.victim-info')

    if (killerInfo) killerInfo.textContent = `${replay.killerId} [${replay.weaponId}]`
    if (victimInfo) victimInfo.textContent = replay.victimId
  }

  private hideKillReplayUI() {
    if (this.killReplayUI) {
      this.killReplayUI.style.display = 'none'
    }
  }

  private createPlayerIndicators() {
    // Player name bars and health indicators
  }

  private setupReplayRecording() {
    // Initialize recording system
  }

  private setupSpectatorControls() {
    // Setup keyboard shortcuts for spectating
    document.addEventListener('keydown', (e) => {
      if (!this.isActive()) return

      switch (e.key) {
        case '1':
          this.setSpectatorMode('free')
          break
        case '2':
          this.setSpectatorMode('follow')
          break
        case '3':
          this.setSpectatorMode('first_person')
          break
        case '4':
          this.setSpectatorMode('third_person')
          break
        case '5':
          this.setSpectatorMode('overview')
          break
        case ' ':
          // Auto-switch to next player
          this.switchToNextPlayer()
          e.preventDefault()
          break
      }
    })
  }

  private switchToNextPlayer() {
    if (this.activePlayers.size === 0) return

    const players = Array.from(this.activePlayers.keys())
    const currentIndex = this.spectatorCamera.target ?
      players.indexOf(this.spectatorCamera.target) : -1

    const nextIndex = (currentIndex + 1) % players.length
    this.setSpectatorMode('follow', players[nextIndex])
  }

  // PUBLIC API
  public isActive(): boolean {
    return this.spectatorCamera.mode !== undefined
  }

  public addActivePlayer(playerId: string, playerData: any) {
    this.activePlayers.set(playerId, playerData)
    this.updatePlayerList()
  }

  public removeActivePlayer(playerId: string) {
    this.activePlayers.delete(playerId)

    // Switch camera if target was removed
    if (this.spectatorCamera.target === playerId) {
      this.switchToNextPlayer()
    }

    this.updatePlayerList()
  }

  private updatePlayerList() {
    if (!this.spectatorControls) return

    const playerList = this.spectatorControls.querySelector('.player-list')
    if (!playerList) return

    playerList.innerHTML = '<h4>Players:</h4>'

    this.activePlayers.forEach((player, playerId) => {
      const playerItem = document.createElement('div')
      playerItem.className = 'player-item'
      playerItem.innerHTML = `
        <span class="player-name">${player.name || playerId}</span>
        <span class="player-status">${player.alive ? '🟢' : '💀'}</span>
      `

      playerItem.addEventListener('click', () => {
        this.setSpectatorMode('follow', playerId)
      })

      playerList.appendChild(playerItem)
    })
  }

  public getSettings(): SpectatorSettings {
    return { ...this.settings }
  }

  public updateSettings(newSettings: Partial<SpectatorSettings>) {
    this.settings = { ...this.settings, ...newSettings }
  }

  public getKillReplays(): KillReplay[] {
    return [...this.killReplays]
  }

  public getRecentKillReplays(count: number = 5): KillReplay[] {
    return this.killReplays.slice(-count).reverse()
  }

  public destroy() {
    this.stopRecording()

    // Clean up UI
    if (this.spectatorControls) {
      this.spectatorControls.remove()
    }
    if (this.killReplayUI) {
      this.killReplayUI.remove()
    }

    // Clear data
    this.activePlayers.clear()
    this.killReplays = []
    this.recordingBuffer = []
    this.playerBars.clear()
  }
}

// React component for Spectator Mode
export const SpectatorModeComponent: React.FC<{
  spectatorSystem: SpectatorModeSystem
  isVisible: boolean
  onModeChange: (mode: SpectatorCamera['mode']) => void
}> = ({ spectatorSystem, isVisible, onModeChange }) => {
  const [currentMode, setCurrentMode] = useState<SpectatorCamera['mode']>('free')
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(spectatorSystem.getSettings())

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isVisible) return

      switch (e.key) {
        case '1': onModeChange('free'); break
        case '2': onModeChange('follow'); break
        case '3': onModeChange('first_person'); break
        case '4': onModeChange('third_person'); break
        case '5': onModeChange('overview'); break
        case 'Tab': setShowSettings(!showSettings); e.preventDefault(); break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isVisible, showSettings])

  if (!isVisible) return null

  return (
    <div className="spectator-mode-ui">
      {/* Mode Indicator */}
      <div className="spectator-mode-indicator">
        <div className="mode-text">
          MODE: {currentMode.toUpperCase().replace('_', ' ')}
        </div>
      </div>

      {/* Quick Controls */}
      <div className="spectator-quick-controls">
        <div className="control-hint">Press 1-5 to change camera mode</div>
        <div className="control-hint">Press SPACE to switch players</div>
        <div className="control-hint">Press TAB for settings</div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="spectator-settings-panel">
          <h3>Spectator Settings</h3>

          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.showPlayerNames}
                onChange={(e) => {
                  const newSettings = { ...settings, showPlayerNames: e.target.checked }
                  setSettings(newSettings)
                  spectatorSystem.updateSettings(newSettings)
                }}
              />
              Show Player Names
            </label>
          </div>

          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.showHealthBars}
                onChange={(e) => {
                  const newSettings = { ...settings, showHealthBars: e.target.checked }
                  setSettings(newSettings)
                  spectatorSystem.updateSettings(newSettings)
                }}
              />
              Show Health Bars
            </label>
          </div>

          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.autoSwitchTargets}
                onChange={(e) => {
                  const newSettings = { ...settings, autoSwitchTargets: e.target.checked }
                  setSettings(newSettings)
                  spectatorSystem.updateSettings(newSettings)
                }}
              />
              Auto-Switch Players
            </label>
          </div>

          <div className="setting-group">
            <label>Camera Speed: {settings.freeCamSpeed}</label>
            <input
              type="range"
              min="5"
              max="30"
              value={settings.freeCamSpeed}
              onChange={(e) => {
                const newSettings = { ...settings, freeCamSpeed: Number(e.target.value) }
                setSettings(newSettings)
                spectatorSystem.updateSettings(newSettings)
              }}
            />
          </div>

          <div className="setting-group">
            <label>Replay Volume: {Math.round(settings.killReplayVolume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.killReplayVolume}
              onChange={(e) => {
                const newSettings = { ...settings, killReplayVolume: Number(e.target.value) }
                setSettings(newSettings)
                spectatorSystem.updateSettings(newSettings)
              }}
            />
          </div>
        </div>
      )}

      {/* Kill Replay Notification */}
      <div className="kill-replay-notification">
        <div className="replay-icon">🎬</div>
        <div className="replay-text">Kill Replay Available</div>
        <div className="replay-key">Press R to watch</div>
      </div>

      <style jsx>{`
        .spectator-mode-ui {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 1000;
          pointer-events: none;
        }

        .spectator-mode-indicator {
          background: rgba(0, 0, 0, 0.8);
          color: #ff6b00;
          padding: 10px 15px;
          border-radius: 8px;
          border: 2px solid #ff6b00;
          margin-bottom: 10px;
          pointer-events: auto;
        }

        .mode-text {
          font-size: 14px;
          font-weight: bold;
          text-shadow: 0 0 10px #ff6b00;
        }

        .spectator-quick-controls {
          position: fixed;
          bottom: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.7);
          padding: 15px;
          border-radius: 8px;
          pointer-events: auto;
        }

        .control-hint {
          color: #ffffff;
          font-size: 12px;
          margin: 5px 0;
          opacity: 0.8;
        }

        .spectator-settings-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.95);
          color: white;
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #ff6b00;
          pointer-events: auto;
          min-width: 300px;
        }

        .setting-group {
          margin: 15px 0;
        }

        .setting-group label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }

        .setting-group input[type="range"] {
          flex: 1;
          margin-left: 10px;
        }

        .kill-replay-notification {
          position: fixed;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          background: linear-gradient(135deg, #ff6b00, #ff8c00);
          color: white;
          padding: 15px;
          border-radius: 8px;
          pointer-events: auto;
          animation: pulse 2s infinite;
        }

        .replay-icon {
          font-size: 24px;
          text-align: center;
          margin-bottom: 10px;
        }

        .replay-text {
          font-weight: bold;
          text-align: center;
          margin-bottom: 5px;
        }

        .replay-key {
          font-size: 12px;
          text-align: center;
          opacity: 0.8;
        }

        @keyframes pulse {
          0%, 100% { transform: translateY(-50%) scale(1); }
          50% { transform: translateY(-50%) scale(1.05); }
        }
      `}</style>
    </div>
  )
}

export default SpectatorModeSystem
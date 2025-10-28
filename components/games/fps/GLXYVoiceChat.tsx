// @ts-nocheck
'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { io, Socket } from 'socket.io-client'

// Interfaces für Voice Chat
export interface VoiceChatUser {
  id: string
  username: string
  isSpeaking: boolean
  volume: number
  muted: boolean
  team: 'red' | 'blue' | 'spectator'
  audioStream?: MediaStream
  audioContext?: AudioContext
  gainNode?: GainNode
  analyser?: AnalyserNode
}

export interface VoiceChatSettings {
  enabled: boolean
  inputVolume: number
  outputVolume: number
  pushToTalk: boolean
  pushToTalkKey: string
  noiseSuppression: boolean
  echoCancellation: boolean
  autoGainControl: boolean
  quality: 'low' | 'medium' | 'high' | 'ultra'
  sampleRate: number
  channels: number
}

export interface VoicePacket {
  userId: string
  audioData: ArrayBuffer
  timestamp: number
  sequence: number
  team: string
  isProximity: boolean
  position?: { x: number; y: number; z: number }
}

// Haupt Voice Chat Klasse
export class GLXYVoiceChat {
  private socket: Socket | null = null
  private localStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private mediaRecorder: MediaRecorder | null = null
  private users: Map<string, VoiceChatUser> = new Map()
  private settings: VoiceChatSettings
  private isRecording = false
  private pushToTalkPressed = false
  private audioWorkletNode: AudioWorkletNode | null = null
  private encoderProcessor: ScriptProcessorNode | null = null

  // 3D Audio Positionierung
  private listener: THREE.AudioListener | null = null
  private positionalAudio: Map<string, THREE.PositionalAudio> = new Map()

  // Performance
  private audioQueue: VoicePacket[] = []
  private maxQueueSize = 100
  private sequenceNumber = 0

  // Statistics
  private stats = {
    packetsSent: 0,
    packetsReceived: 0,
    bytesTransmitted: 0,
    averageLatency: 0,
    audioQuality: 1.0,
    connectionQuality: 'excellent' as 'poor' | 'fair' | 'good' | 'excellent'
  }

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    private onUserJoined?: (user: VoiceChatUser) => void,
    private onUserLeft?: (userId: string) => void,
    private onSpeakingChanged?: (userId: string, isSpeaking: boolean) => void
  ) {
    this.settings = {
      enabled: true,
      inputVolume: 0.8,
      outputVolume: 0.8,
      pushToTalk: false,
      pushToTalkKey: 'KeyV',
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
      quality: 'high',
      sampleRate: 48000,
      channels: 1
    }

    this.initializeAudioContext()
    this.setupKeyboardControls()
  }

  public async connect(serverUrl: string, userId: string, username: string): Promise<boolean> {
    try {
      this.socket = io(serverUrl, {
        transports: ['websocket'],
        query: {
          userId,
          username,
          type: 'voice'
        }
      })

      this.setupSocketListeners()

      await this.requestMicrophoneAccess()
      await this.connectToVoiceChannel()

      console.log('🎤 Voice Chat connected successfully!')
      return true
    } catch (error) {
      console.error('Failed to connect to voice chat:', error)
      return false
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    this.stopRecording()

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.users.clear()
    this.positionalAudio.clear()
  }

  public updateSettings(newSettings: Partial<VoiceChatSettings>): void {
    this.settings = { ...this.settings, ...newSettings }

    // Apply settings to local stream
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks()
      audioTracks.forEach(track => {
        const constraints = track.getConstraints()
        track.applyConstraints({
          ...constraints,
          noiseSuppression: this.settings.noiseSuppression,
          echoCancellation: this.settings.echoCancellation,
          autoGainControl: this.settings.autoGainControl,
          sampleRate: this.settings.sampleRate
        })
      })
    }

    // Update output volume for all users
    this.users.forEach(user => {
      if (user.gainNode) {
        user.gainNode.gain.value = this.settings.outputVolume
      }
    })
  }

  public setMuted(muted: boolean): void {
    const localUser = this.users.get('local')
    if (localUser) {
      localUser.muted = muted
      if (this.localStream) {
        const audioTracks = this.localStream.getAudioTracks()
        audioTracks.forEach(track => {
          track.enabled = !muted
        })
      }
    }
  }

  public addUser(user: VoiceChatUser): void {
    this.users.set(user.id, user)

    // Create 3D positional audio for user
    if (user.id !== 'local' && this.scene) {
      const positionalAudio = new THREE.PositionalAudio(this.listener!)
      positionalAudio.setRefDistance(5)
      positionalAudio.setMaxDistance(50)
      positionalAudio.setRolloffFactor(1)
      positionalAudio.setDirectionalCone(180, 230, 0.1)

      this.positionalAudio.set(user.id, positionalAudio)

      // Create invisible audio source for position tracking
      const audioSource = new THREE.Object3D()
      audioSource.add(positionalAudio)
      this.scene.add(audioSource)
    }

    if (this.onUserJoined) {
      this.onUserJoined(user)
    }
  }

  public removeUser(userId: string): void {
    const user = this.users.get(userId)
    if (user && user.audioStream) {
      user.audioStream.getTracks().forEach(track => track.stop())
    }

    this.users.delete(userId)

    // Remove 3D positional audio
    const positionalAudio = this.positionalAudio.get(userId)
    if (positionalAudio) {
      this.scene.remove(positionalAudio.parent!)
      this.positionalAudio.delete(userId)
    }

    if (this.onUserLeft) {
      this.onUserLeft(userId)
    }
  }

  public updateUserPosition(userId: string, position: THREE.Vector3): void {
    const positionalAudio = this.positionalAudio.get(userId)
    if (positionalAudio && positionalAudio.parent) {
      positionalAudio.parent.position.copy(position)
    }
  }

  public getSpeakingUsers(): VoiceChatUser[] {
    return Array.from(this.users.values()).filter(user => user.isSpeaking)
  }

  public getStats() {
    return { ...this.stats }
  }

  public getUsers(): VoiceChatUser[] {
    return Array.from(this.users.values())
  }

  private async initializeAudioContext(): Promise<void> {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Create audio listener for 3D positioning
    this.listener = new THREE.AudioListener()
    this.camera.add(this.listener)
  }

  private async requestMicrophoneAccess(): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: this.settings.sampleRate,
          channelCount: this.settings.channels,
          noiseSuppression: this.settings.noiseSuppression,
          echoCancellation: this.settings.echoCancellation,
          autoGainControl: this.settings.autoGainControl
        },
        video: false
      }

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)

      // Add local user
      this.addUser({
        id: 'local',
        username: 'You',
        isSpeaking: false,
        volume: 1.0,
        muted: false,
        team: 'spectator',
        audioStream: this.localStream,
        audioContext: this.audioContext!
      })

      console.log('🎤 Microphone access granted')
    } catch (error) {
      console.error('Failed to access microphone:', error)
      throw error
    }
  }

  private async connectToVoiceChannel(): Promise<void> {
    if (!this.localStream || !this.audioContext) return

    // Setup audio processing
    const source = this.audioContext.createMediaStreamSource(this.localStream)
    const gainNode = this.audioContext.createGain()
    const analyser = this.audioContext.createAnalyser()

    gainNode.gain.value = this.settings.inputVolume
    analyser.fftSize = 256

    source.connect(gainNode)
    gainNode.connect(analyser)

    // Voice activity detection
    this.setupVoiceActivityDetection(analyser)

    // Setup media recorder for encoding
    const mimeType = this.getOptimalMimeType()
    this.mediaRecorder = new MediaRecorder(this.localStream, {
      mimeType,
      audioBitsPerSecond: this.getAudioBitrate()
    })

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.socket && this.isRecording) {
        event.data.arrayBuffer().then(buffer => {
          const packet: VoicePacket = {
            userId: 'local',
            audioData: buffer,
            timestamp: Date.now(),
            sequence: this.sequenceNumber++,
            team: 'spectator',
            isProximity: false
          }

          this.socket?.emit('voiceData', packet)
          this.stats.packetsSent++
          this.stats.bytesTransmitted += buffer.byteLength
        })
      }
    }

    console.log('🔊 Voice channel connected')
  }

  private setupVoiceActivityDetection(analyser: AnalyserNode): void {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    let speakingThreshold = 30
    let silenceFrames = 0

    const detectVoice = () => {
      if (!this.localStream) return

      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length

      const localUser = this.users.get('local')
      if (localUser) {
        const wasSpeaking = localUser.isSpeaking
        localUser.isSpeaking = average > speakingThreshold
        localUser.volume = average / 255

        if (wasSpeaking !== localUser.isSpeaking && this.onSpeakingChanged) {
          this.onSpeakingChanged('local', localUser.isSpeaking)
        }

        // Auto-adjust threshold
        if (localUser.isSpeaking) {
          silenceFrames = 0
        } else {
          silenceFrames++
          if (silenceFrames > 100) {
            speakingThreshold = Math.max(10, speakingThreshold - 1)
          }
        }
      }

      requestAnimationFrame(detectVoice)
    }

    detectVoice()
  }

  private startRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive' && !this.users.get('local')?.muted) {
      this.isRecording = true
      this.mediaRecorder.start(50) // 50ms chunks for low latency

      // Create visual indicator
      this.createVoiceIndicator()
    }
  }

  private stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.isRecording = false
      this.mediaRecorder.stop()
    }
  }

  private setupKeyboardControls(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === this.settings.pushToTalkKey && this.settings.pushToTalk) {
        this.pushToTalkPressed = true
        this.startRecording()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === this.settings.pushToTalkKey && this.settings.pushToTalk) {
        this.pushToTalkPressed = false
        this.stopRecording()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Cleanup on disconnect
    this.cleanup = () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return

    this.socket.on('voiceData', async (packet: VoicePacket) => {
      if (packet.userId === 'local') return

      this.stats.packetsReceived++

      // Calculate latency
      const latency = Date.now() - packet.timestamp
      this.stats.averageLatency = (this.stats.averageLatency + latency) / 2

      // Add to queue for processing
      this.audioQueue.push(packet)
      if (this.audioQueue.length > this.maxQueueSize) {
        this.audioQueue.shift()
      }

      this.processAudioQueue()
    })

    this.socket.on('userJoined', (user: VoiceChatUser) => {
      this.addUser(user)
    })

    this.socket.on('userLeft', (userId: string) => {
      this.removeUser(userId)
    })

    this.socket.on('userMuted', (userId: string, muted: boolean) => {
      const user = this.users.get(userId)
      if (user) {
        user.muted = muted
      }
    })
  }

  private async processAudioQueue(): Promise<void> {
    if (this.audioQueue.length === 0) return

    const packet = this.audioQueue.shift()!

    const user = this.users.get(packet.userId)
    if (!user || user.muted) return

    try {
      // Decode audio data
      const audioBuffer = await this.decodeAudioData(packet.audioData)

      // Create audio source for playback
      const source = this.audioContext!.createBufferSource()
      source.buffer = audioBuffer

      // Apply 3D positioning if available
      const positionalAudio = this.positionalAudio.get(packet.userId)
      if (positionalAudio && packet.position) {
        try {
          positionalAudio.setNodeSource(source)
          positionalAudio.play()
        } catch (error) {
          console.warn('Failed to connect positional audio:', error)
        }
      } else {
        // Regular stereo playback
        const gainNode = this.audioContext!.createGain()
        gainNode.gain.value = this.settings.outputVolume
        source.connect(gainNode)
        gainNode.connect(this.audioContext!.destination)
        source.start()
      }

      // Update speaking status
      const wasSpeaking = user.isSpeaking
      user.isSpeaking = true

      if (!wasSpeaking && this.onSpeakingChanged) {
        this.onSpeakingChanged(packet.userId, true)
      }

      // Auto-reset speaking status after audio plays
      setTimeout(() => {
        user.isSpeaking = false
        if (this.onSpeakingChanged) {
          this.onSpeakingChanged(packet.userId, false)
        }
      }, audioBuffer.duration * 1000)

    } catch (error) {
      console.error('Failed to process audio packet:', error)
    }
  }

  private async decodeAudioData(audioData: ArrayBuffer): Promise<AudioBuffer> {
    return await this.audioContext!.decodeAudioData(audioData.slice(0))
  }

  private getOptimalMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/webm',
      'audio/ogg',
      'audio/wav'
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return 'audio/webm'
  }

  private getAudioBitrate(): number {
    switch (this.settings.quality) {
      case 'low': return 16000
      case 'medium': return 32000
      case 'high': return 64000
      case 'ultra': return 128000
      default: return 64000
    }
  }

  private createVoiceIndicator(): void {
    // Visual feedback for speaking
    const indicator = document.createElement('div')
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 255, 0, 0.8);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
      z-index: 10000;
      animation: pulse 1s infinite;
    `
    indicator.textContent = '🎤 SPEAKING'
    document.body.appendChild(indicator)

    const removeIndicator = () => {
      if (document.body.contains(indicator)) {
        document.body.removeChild(indicator)
      }
    }

    setTimeout(removeIndicator, 1000)
  }

  private cleanup: () => void = () => {}

  // Auto-start recording when not using push-to-talk
  public update(): void {
    if (!this.settings.pushToTalk && this.localStream && !this.users.get('local')?.muted) {
      const localUser = this.users.get('local')
      if (localUser?.isSpeaking && !this.isRecording) {
        this.startRecording()
      } else if (!localUser?.isSpeaking && this.isRecording) {
        this.stopRecording()
      }
    }

    // Update connection quality based on stats
    this.updateConnectionQuality()
  }

  private updateConnectionQuality(): void {
    if (this.stats.averageLatency < 50) {
      this.stats.connectionQuality = 'excellent'
    } else if (this.stats.averageLatency < 100) {
      this.stats.connectionQuality = 'good'
    } else if (this.stats.averageLatency < 200) {
      this.stats.connectionQuality = 'fair'
    } else {
      this.stats.connectionQuality = 'poor'
    }
  }
}

// React Hook für Voice Chat
export const useGLXYVoiceChat = (
  scene: THREE.Scene,
  camera: THREE.Camera,
  serverUrl?: string,
  userId?: string,
  username?: string
) => {
  const [voiceChat, setVoiceChat] = useState<GLXYVoiceChat | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [users, setUsers] = useState<VoiceChatUser[]>([])
  const [speakingUsers, setSpeakingUsers] = useState<string[]>([])
  const [settings, setSettings] = useState<VoiceChatSettings>({
    enabled: true,
    inputVolume: 0.8,
    outputVolume: 0.8,
    pushToTalk: false,
    pushToTalkKey: 'KeyV',
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    quality: 'high',
    sampleRate: 48000,
    channels: 1
  })
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (scene && camera && serverUrl && userId && username) {
      const vc = new GLXYVoiceChat(
        scene,
        camera,
        (user) => setUsers(prev => [...prev, user]),
        (userId) => setUsers(prev => prev.filter(u => u.id !== userId)),
        (userId, isSpeaking) => {
          setSpeakingUsers(prev =>
            isSpeaking
              ? [...prev.filter(id => id !== userId), userId]
              : prev.filter(id => id !== userId)
          )
        }
      )

      vc.connect(serverUrl, userId, username).then(connected => {
        if (connected) {
          setVoiceChat(vc)
          setIsConnected(true)
        }
      })

      return () => {
        vc.disconnect()
      }
    }
    return undefined
  }, [scene, camera, serverUrl, userId, username])

  useEffect(() => {
    if (voiceChat) {
      const updateInterval = setInterval(() => {
        voiceChat.update()
        setUsers(voiceChat.getUsers())
        setStats(voiceChat.getStats())
      }, 100) // 10Hz update rate

      return () => clearInterval(updateInterval)
    }
    return undefined
  }, [voiceChat])

  return {
    voiceChat,
    isConnected,
    users,
    speakingUsers,
    settings,
    stats,
    updateSettings: (newSettings: Partial<VoiceChatSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }))
      voiceChat?.updateSettings(newSettings)
    },
    setMuted: (muted: boolean) => voiceChat?.setMuted(muted),
    disconnect: () => voiceChat?.disconnect()
  }
}

// Voice Chat UI Component
export const VoiceChatUI: React.FC<{
  voiceChat: GLXYVoiceChat | null
  settings: VoiceChatSettings
  onSettingsChange: (settings: Partial<VoiceChatSettings>) => void
  stats: any
}> = ({ voiceChat, settings, onSettingsChange, stats }) => {
  const [showSettings, setShowSettings] = useState(false)

  if (!voiceChat) return null

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur-md rounded-lg p-4 border border-blue-500/30">
      {/* Voice Status */}
      <div className="flex items-center space-x-3 mb-3">
        <div className={`w-3 h-3 rounded-full ${stats?.connectionQuality === 'excellent' ? 'bg-green-400' : stats?.connectionQuality === 'good' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
        <span className="text-white text-sm font-semibold">
          🎤 Voice Chat {stats?.connectionQuality?.toUpperCase()}
        </span>
        {stats && (
          <span className="text-gray-400 text-xs">
            {stats.averageLatency?.toFixed(0)}ms
          </span>
        )}
      </div>

      {/* Speaking Users */}
      {voiceChat.getSpeakingUsers().length > 0 && (
        <div className="mb-3">
          <div className="text-green-400 text-xs mb-1">SPEAKING:</div>
          {voiceChat.getSpeakingUsers().map(user => (
            <div key={user.id} className="flex items-center space-x-2 text-white text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{user.username}</span>
              <div className="w-16 h-1 bg-gray-600 rounded">
                <div
                  className="h-full bg-green-400 rounded transition-all"
                  style={{ width: `${user.volume * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex space-x-2">
        <button
          onClick={() => voiceChat.setMuted(!voiceChat.getUsers().find(u => u.id === 'local')?.muted)}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
            voiceChat.getUsers().find(u => u.id === 'local')?.muted
              ? 'bg-red-600 text-white'
              : 'bg-green-600 text-white'
          }`}
        >
          {voiceChat.getUsers().find(u => u.id === 'local')?.muted ? '🔇 MUTED' : '🔊 UNMUTED'}
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-all"
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute bottom-full left-0 mb-2 bg-gray-900 border border-blue-500 rounded-lg p-4 w-64">
          <h3 className="text-white font-bold mb-3">Voice Settings</h3>

          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs">Input Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.inputVolume}
                onChange={(e) => onSettingsChange({ inputVolume: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs">Output Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.outputVolume}
                onChange={(e) => onSettingsChange({ outputVolume: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs">Quality</label>
              <select
                value={settings.quality}
                onChange={(e) => onSettingsChange({ quality: e.target.value as any })}
                className="w-full bg-gray-800 text-white rounded px-2 py-1 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="ultra">Ultra</option>
              </select>
            </div>

            <label className="flex items-center space-x-2 text-white text-sm">
              <input
                type="checkbox"
                checked={settings.pushToTalk}
                onChange={(e) => onSettingsChange({ pushToTalk: e.target.checked })}
                className="rounded"
              />
              <span>Push to Talk (V)</span>
            </label>

            <label className="flex items-center space-x-2 text-white text-sm">
              <input
                type="checkbox"
                checked={settings.noiseSuppression}
                onChange={(e) => onSettingsChange({ noiseSuppression: e.target.checked })}
                className="rounded"
              />
              <span>Noise Suppression</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export default GLXYVoiceChat
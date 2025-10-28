// @ts-nocheck
'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface FPSControllerProps {
  position: [number, number, number]
  onMove: (position: [number, number, number]) => void
  enabled: boolean
  objects: any[]
}

export default function FPSController({ position, onMove, enabled, objects }: FPSControllerProps) {
  const { camera, gl } = useThree()
  const cameraRef = useRef(camera)
  const moveSpeed = 0.1
  const mouseSensitivity = 0.002

  const [keys, setKeys] = useState({
    w: false, a: false, s: false, d: false,
    shift: false, space: false
  })

  const [mouseDown, setMouseDown] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [pitch, setPitch] = useState(0)
  const [yaw, setYaw] = useState(0)

  // Keyboard controls
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key.toLowerCase()) {
        case 'w': setKeys(prev => ({ ...prev, w: true })); break
        case 'a': setKeys(prev => ({ ...prev, a: true })); break
        case 's': setKeys(prev => ({ ...prev, s: true })); break
        case 'd': setKeys(prev => ({ ...prev, d: true })); break
        case 'shift': setKeys(prev => ({ ...prev, shift: true })); break
        case ' ': setKeys(prev => ({ ...prev, space: true })); e.preventDefault(); break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.key.toLowerCase()) {
        case 'w': setKeys(prev => ({ ...prev, w: false })); break
        case 'a': setKeys(prev => ({ ...prev, a: false })); break
        case 's': setKeys(prev => ({ ...prev, s: false })); break
        case 'd': setKeys(prev => ({ ...prev, d: false })); break
        case 'shift': setKeys(prev => ({ ...prev, shift: false })); break
        case ' ': setKeys(prev => ({ ...prev, space: false })); break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [enabled])

  // Mouse controls
  useEffect(() => {
    if (!enabled) return

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        setMouseDown(true)
        setMousePosition({ x: e.clientX, y: e.clientY })
        gl.domElement.requestPointerLock()
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        setMouseDown(false)
        document.exitPointerLock()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseDown || !document.pointerLockElement) return

      const movementX = e.movementX || 0
      const movementY = e.movementY || 0

      setYaw(prev => prev - movementX * mouseSensitivity)
      setPitch(prev => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev - movementY * mouseSensitivity)))
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [enabled, mouseDown, gl.domElement])

  // Movement and collision detection
  useFrame(() => {
    if (!enabled) return

    const newPosition = [...position] as [number, number, number]
    const speed = keys.shift ? moveSpeed * 1.5 : moveSpeed
    const jumpSpeed = keys.space ? 0.3 : 0

    // Calculate movement direction
    let moveX = 0
    let moveZ = 0

    if (keys.w) {
      moveX += Math.sin(yaw) * speed
      moveZ += Math.cos(yaw) * speed
    }
    if (keys.s) {
      moveX -= Math.sin(yaw) * speed
      moveZ -= Math.cos(yaw) * speed
    }
    if (keys.a) {
      moveX += Math.sin(yaw - Math.PI / 2) * speed
      moveZ += Math.cos(yaw - Math.PI / 2) * speed
    }
    if (keys.d) {
      moveX += Math.sin(yaw + Math.PI / 2) * speed
      moveZ += Math.cos(yaw + Math.PI / 2) * speed
    }

    // Apply movement with collision detection
    newPosition[0] += moveX
    newPosition[2] += moveZ

    // Simple gravity and ground collision
    if (newPosition[1] > 1.8 || jumpSpeed > 0) {
      newPosition[1] -= 0.01 // Gravity
      if (newPosition[1] < 1.8) newPosition[1] = 1.8
    }
    if (jumpSpeed > 0 && newPosition[1] <= 1.8) {
      newPosition[1] += jumpSpeed
    }

    // Keep player in bounds
    newPosition[0] = Math.max(-45, Math.min(45, newPosition[0]))
    newPosition[2] = Math.max(-45, Math.min(45, newPosition[2]))

    // Update camera position
    cameraRef.current.position.set(...newPosition)

    // Update camera rotation
    cameraRef.current.rotation.order = 'YXZ'
    cameraRef.current.rotation.y = yaw
    cameraRef.current.rotation.x = pitch

    // Update parent component
    onMove(newPosition)
  })

  // Player body (visible in third person or for debugging)
  if (!enabled) {
    return (
      <group position={position}>
        {/* Player body */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.8, 1.8, 0.8]} />
          <meshStandardMaterial color="#2563eb" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.7, 0]} castShadow>
          <sphereGeometry args={[0.2]} />
          <meshStandardMaterial color="#f4c2a1" />
        </mesh>
        {/* Weapon */}
        <mesh position={[0.3, 1.2, 0.2]} rotation={[0, 0, -Math.PI / 6]} castShadow>
          <boxGeometry args={[0.1, 0.3, 2]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    )
  }

  return null // FPS view - no visible player body
}
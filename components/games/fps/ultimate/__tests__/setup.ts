/**
 * Test Setup & Configuration
 * 
 * @module TestSetup
 * @description Global test setup, mocks, and utilities
 * @author Glxy97 + Claude Sonnet 4.5
 * @version 1.0.0
 */

import { jest } from '@jest/globals'
import '@testing-library/jest-dom'

// ============================================================================
// MOCK THREE.JS
// ============================================================================

/**
 * Mock Three.js (too complex and heavy for tests)
 */
jest.mock('three', () => ({
  Scene: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn(),
    children: []
  })),
  
  PerspectiveCamera: jest.fn().mockImplementation(() => ({
    position: { set: jest.fn(), copy: jest.fn(), x: 0, y: 0, z: 0 },
    rotation: { set: jest.fn(), copy: jest.fn(), x: 0, y: 0, z: 0 },
    lookAt: jest.fn(),
    updateProjectionMatrix: jest.fn()
  })),
  
  WebGLRenderer: jest.fn().mockImplementation(() => ({
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    domElement: document.createElement('canvas')
  })),
  
  Mesh: jest.fn().mockImplementation(() => ({
    position: { set: jest.fn(), copy: jest.fn(), x: 0, y: 0, z: 0 },
    rotation: { set: jest.fn(), copy: jest.fn(), x: 0, y: 0, z: 0 },
    scale: { set: jest.fn(), x: 1, y: 1, z: 1 },
    visible: true
  })),
  
  Group: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn(),
    position: { set: jest.fn(), copy: jest.fn(), x: 0, y: 0, z: 0 },
    rotation: { set: jest.fn(), copy: jest.fn(), x: 0, y: 0, z: 0 },
    children: []
  })),
  
  Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x, y, z,
    set: jest.fn(function(nx, ny, nz) { this.x = nx; this.y = ny; this.z = nz; return this }),
    copy: jest.fn(function(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this }),
    add: jest.fn(function(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this }),
    sub: jest.fn(function(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this }),
    multiply: jest.fn(function(v) { this.x *= v.x; this.y *= v.y; this.z *= v.z; return this }),
    multiplyScalar: jest.fn(function(s) { this.x *= s; this.y *= s; this.z *= s; return this }),
    length: jest.fn(function() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z) }),
    normalize: jest.fn(function() { 
      const len = this.length()
      if (len > 0) {
        this.x /= len
        this.y /= len
        this.z /= len
      }
      return this
    }),
    clone: jest.fn(function() { return new (this.constructor)(this.x, this.y, this.z) })
  })),
  
  Vector2: jest.fn().mockImplementation((x = 0, y = 0) => ({
    x, y,
    set: jest.fn(function(nx, ny) { this.x = nx; this.y = ny; return this }),
    copy: jest.fn(function(v) { this.x = v.x; this.y = v.y; return this })
  })),
  
  Euler: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x, y, z,
    set: jest.fn(function(nx, ny, nz) { this.x = nx; this.y = ny; this.z = nz; return this }),
    copy: jest.fn(function(e) { this.x = e.x; this.y = e.y; this.z = e.z; return this })
  })),
  
  Clock: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    getDelta: jest.fn(() => 0.016), // 60 FPS
    getElapsedTime: jest.fn(() => 0)
  })),
  
  Raycaster: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    intersectObjects: jest.fn(() => [])
  })),
  
  MeshStandardMaterial: jest.fn(),
  MeshBasicMaterial: jest.fn(),
  BoxGeometry: jest.fn(),
  SphereGeometry: jest.fn(),
  PlaneGeometry: jest.fn(),
  DirectionalLight: jest.fn(),
  AmbientLight: jest.fn(),
  PointLight: jest.fn(),
  HemisphereLight: jest.fn(),
  
  DoubleSide: 2
}))

// ============================================================================
// MOCK GLTF LOADER
// ============================================================================

jest.mock('three/examples/jsm/loaders/GLTFLoader', () => ({
  GLTFLoader: jest.fn().mockImplementation(() => ({
    load: jest.fn((url, onLoad) => {
      // Mock successful load
      setTimeout(() => {
        onLoad({
          scene: {
            traverse: jest.fn((callback) => {
              // Mock traversing mesh
              callback({
                isMesh: true,
                material: {}
              })
            }),
            scale: { set: jest.fn() },
            rotation: { set: jest.fn() },
            position: { set: jest.fn() }
          }
        })
      }, 0)
    })
  }))
}))

// ============================================================================
// MOCK WEB APIs
// ============================================================================

/**
 * Mock AudioContext
 */
global.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn(() => ({
    gain: { value: 1 },
    connect: jest.fn()
  })),
  createOscillator: jest.fn(() => ({
    frequency: { value: 440 },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  })),
  destination: {}
})) as any

/**
 * Mock requestAnimationFrame
 */
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16) // ~60 FPS
  return 0
}) as any

/**
 * Mock cancelAnimationFrame
 */
global.cancelAnimationFrame = jest.fn()

/**
 * Mock performance.now()
 */
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now())
}

// ============================================================================
// MOCK BROWSER APIS
// ============================================================================

/**
 * Mock PointerLockAPI
 */
Object.defineProperty(document, 'pointerLockElement', {
  writable: true,
  value: null
})

Object.defineProperty(HTMLElement.prototype, 'requestPointerLock', {
  writable: true,
  value: jest.fn()
})

Object.defineProperty(document, 'exitPointerLock', {
  writable: true,
  value: jest.fn()
})

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Wait for next tick
 */
export const nextTick = () => new Promise(resolve => setTimeout(resolve, 0))

/**
 * Wait for specific time
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Mock container element for Three.js
 */
export const createMockContainer = (): HTMLDivElement => {
  const div = document.createElement('div')
  Object.defineProperty(div, 'clientWidth', { value: 800, writable: true })
  Object.defineProperty(div, 'clientHeight', { value: 600, writable: true })
  return div
}

/**
 * Advance all timers
 */
export const advanceTimers = async (ms: number = 1000) => {
  jest.advanceTimersByTime(ms)
  await nextTick()
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clean up after each test
 */
afterEach(() => {
  jest.clearAllMocks()
  jest.clearAllTimers()
})


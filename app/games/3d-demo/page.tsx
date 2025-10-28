// @ts-nocheck
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

interface InteractiveObject {
  id: string
  mesh: THREE.Mesh
  originalMaterial: THREE.Material
  hoverMaterial?: THREE.Material
  isHovered: boolean
  onClick?: () => void
}

type ThemeType = 'abstract' | 'cyberpunk' | 'matrix'

export default function ThreeDDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const interactiveObjectsRef = useRef<Map<string, InteractiveObject>>(new Map())
  const mouseRef = useRef({ x: 0, y: 0 })

  const [isStarted, setIsStarted] = useState(false)
  const [stats, setStats] = useState({
    fps: 60,
    frameTime: 16.67,
    drawCalls: 0,
    triangles: 0
  })
  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>('high')
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('abstract')
  const [interactionCount, setInteractionCount] = useState(0)
  const [selectedObject, setSelectedObject] = useState<string | null>(null)
  const [rayTracing, setRayTracing] = useState(false)

  // Create interactive object with materials
  const createInteractiveObject = (
    id: string,
    mesh: THREE.Mesh,
    onClick?: () => void
  ): InteractiveObject => {
    const originalMaterial = Array.isArray(mesh.material)
      ? (mesh.material[0] as THREE.Material).clone()
      : mesh.material.clone()
    const hoverMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1
    })

    const interactiveObj: InteractiveObject = {
      id,
      mesh,
      originalMaterial,
      hoverMaterial,
      isHovered: false,
      onClick
    }

    interactiveObjectsRef.current.set(id, interactiveObj)
    return interactiveObj
  }

  // Create dark/black cubes background
  const createDarkCubesBackground = (scene: THREE.Scene, count: number = 100) => {
    const cubes: THREE.Mesh[] = []

    for (let i = 0; i < count; i++) {
      const size = Math.random() * 2 + 0.5
      const geometry = new THREE.BoxGeometry(size, size, size)
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0, 0, Math.random() * 0.1 + 0.05),
        metalness: 0.8,
        roughness: 0.2,
        emissive: new THREE.Color(0x111111),
        emissiveIntensity: 0.1
      })

      const cube = new THREE.Mesh(geometry, material)

      // Random position in a large sphere
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const radius = Math.random() * 50 + 20

      cube.position.set(
        Math.sin(phi) * Math.cos(theta) * radius,
        Math.sin(phi) * Math.sin(theta) * radius,
        Math.cos(phi) * radius
      )

      // Random rotation
      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )

      // Random rotation speed
      cube.userData = {
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        )
      }

      scene.add(cube)
      cubes.push(cube)
    }

    return cubes
  }

  // Create dice objects
  const createDice = (scene: THREE.Scene, position: THREE.Vector3, id: string) => {
    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const material = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x000000,
      emissiveIntensity: 0.2
    })

    const dice = new THREE.Mesh(geometry, material)
    dice.position.copy(position)
    dice.castShadow = true
    dice.receiveShadow = true

    // Add dots to dice faces
    const dotGeometry = new THREE.SphereGeometry(0.1)
    const dotMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5
    })

    // Add dots to all 6 faces
    const dotPositions = [
      { pos: [0, 0, 1.01], face: 'front' },
      { pos: [0, 0, -1.01], face: 'back' },
      { pos: [1.01, 0, 0], face: 'right' },
      { pos: [-1.01, 0, 0], face: 'left' },
      { pos: [0, 1.01, 0], face: 'top' },
      { pos: [0, -1.01, 0], face: 'bottom' }
    ]

    dotPositions.forEach(({ pos }, index) => {
      const dot = new THREE.Mesh(dotGeometry, dotMaterial)
      dot.position.set(pos[0] || 0, pos[1] || 0, pos[2] || 0)
      dice.add(dot)
    })

    scene.add(dice)

    createInteractiveObject(id, dice, () => {
      setInteractionCount(prev => prev + 1)
      setSelectedObject(id)
      dice.rotation.x += Math.PI / 2
      dice.rotation.y += Math.PI / 2
    })

    return dice
  }

  // Create neon edge patterns
  const createNeonPatterns = (scene: THREE.Scene) => {
    const neonLines: THREE.Line[] = []

    // Create grid of neon lines
    for (let i = 0; i < 20; i++) {
      // Horizontal lines
      const hGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-50, i * 2 - 20, -10),
        new THREE.Vector3(50, i * 2 - 20, -10)
      ])

      const hMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(i / 20, 1, 0.5),
        linewidth: 2,
        transparent: true,
        opacity: 0.8
      })

      const hLine = new THREE.Line(hGeometry, hMaterial)
      scene.add(hLine)
      neonLines.push(hLine)

      // Vertical lines
      const vGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i * 5 - 50, -20, -10),
        new THREE.Vector3(i * 5 - 50, 20, -10)
      ])

      const vMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(i / 20, 1, 0.5),
        linewidth: 2,
        transparent: true,
        opacity: 0.8
      })

      const vLine = new THREE.Line(vGeometry, vMaterial)
      scene.add(vLine)
      neonLines.push(vLine)
    }

    return neonLines
  }

  // Setup abstract theme
  const setupAbstractTheme = (scene: THREE.Scene) => {
    // Clear scene
    while(scene.children.length > 0) {
      scene.remove(scene.children[0])
    }

    // Dark background cubes
    createDarkCubesBackground(scene, 150)

    // Interactive dice
    const dicePositions = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-5, 0, 5),
      new THREE.Vector3(5, 0, 5),
      new THREE.Vector3(0, 0, -5),
      new THREE.Vector3(-5, 0, -5),
      new THREE.Vector3(5, 0, -5)
    ]

    dicePositions.forEach((pos, index) => {
      createDice(scene, pos, `dice-${index}`)
    })

    // Neon patterns
    createNeonPatterns(scene)

    // Abstract floating shapes
    for (let i = 0; i < 10; i++) {
      const geometry = Math.random() > 0.5
        ? new THREE.TetrahedronGeometry(1 + Math.random())
        : new THREE.OctahedronGeometry(1 + Math.random())

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.2),
        metalness: 0.9,
        roughness: 0.1,
        emissive: new THREE.Color().setHSL(Math.random(), 0.8, 0.1),
        emissiveIntensity: 0.3,
        wireframe: Math.random() > 0.7
      })

      const shape = new THREE.Mesh(geometry, material)
      shape.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 30
      )

      shape.userData = {
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        )
      }

      createInteractiveObject(`shape-${i}`, shape, () => {
        setInteractionCount(prev => prev + 1)
        setSelectedObject(`shape-${i}`)
        shape.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
          emissive: new THREE.Color().setHSL(Math.random(), 1, 0.3),
          emissiveIntensity: 0.8,
          wireframe: !shape.material.wireframe
        })
      })

      scene.add(shape)
    }
  }

  // Setup cyberpunk theme
  const setupCyberpunkTheme = (scene: THREE.Scene) => {
    // Clear scene
    while(scene.children.length > 0) {
      scene.remove(scene.children[0])
    }

    // Cyber grid
    const gridHelper = new THREE.GridHelper(100, 50, 0x00ffff, 0x004444)
    scene.add(gridHelper)

    // Neon buildings
    for (let i = 0; i < 15; i++) {
      const height = Math.random() * 20 + 5
      const geometry = new THREE.BoxGeometry(2 + Math.random() * 3, height, 2 + Math.random() * 3)
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x1a1a2e),
        emissive: new THREE.Color(0x0f3460),
        emissiveIntensity: 0.3,
        metalness: 0.9,
        roughness: 0.1
      })

      const building = new THREE.Mesh(geometry, material)
      building.position.set(
        (Math.random() - 0.5) * 80,
        height / 2,
        (Math.random() - 0.5) * 80
      )

      // Add neon edges
      const edges = new THREE.EdgesGeometry(geometry)
      const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 1, 0.5),
        linewidth: 2
      })
      const lineSegments = new THREE.LineSegments(edges, lineMaterial)
      building.add(lineSegments)

      createInteractiveObject(`building-${i}`, building, () => {
        setInteractionCount(prev => prev + 1)
        setSelectedObject(`building-${i}`)
        lineMaterial.color.set(new THREE.Color().setHSL(Math.random(), 1, 0.5))
      })

      scene.add(building)
    }
  }

  // Setup matrix theme
  const setupMatrixTheme = (scene: THREE.Scene) => {
    // Clear scene
    while(scene.children.length > 0) {
      scene.remove(scene.children[0])
    }

    // Matrix rain effect (simplified with green rectangles)
    for (let i = 0; i < 50; i++) {
      const geometry = new THREE.PlaneGeometry(0.5, Math.random() * 20 + 5)
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x00ff00),
        transparent: true,
        opacity: Math.random() * 0.8 + 0.2,
        side: THREE.DoubleSide
      })

      const rain = new THREE.Mesh(geometry, material)
      rain.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 50 - 25,
        (Math.random() - 0.5) * 50
      )

      rain.userData = {
        fallSpeed: Math.random() * 0.5 + 0.1,
        targetY: -30
      }

      createInteractiveObject(`rain-${i}`, rain, () => {
        setInteractionCount(prev => prev + 1)
        setSelectedObject(`rain-${i}`)
        material.color.set(new THREE.Color(0xff00ff))
        setTimeout(() => {
          material.color.set(new THREE.Color(0x00ff00))
        }, 500)
      })

      scene.add(rain)
    }

    // Dark matrix cubes
    for (let i = 0; i < 20; i++) {
      const geometry = new THREE.BoxGeometry(2, 2, 2)
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x001100),
        emissive: new THREE.Color(0x00ff00),
        emissiveIntensity: 0.1,
        wireframe: Math.random() > 0.5
      })

      const cube = new THREE.Mesh(geometry, material)
      cube.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 40
      )

      createInteractiveObject(`matrix-cube-${i}`, cube, () => {
        setInteractionCount(prev => prev + 1)
        setSelectedObject(`matrix-cube-${i}`)
        material.emissiveIntensity = 0.8
        setTimeout(() => {
          material.emissiveIntensity = 0.1
        }, 1000)
      })

      scene.add(cube)
    }
  }

  // Initialize scene
  const initializeScene = useCallback(() => {
    if (!canvasRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x000000, 10, 100)
    sceneRef.current = scene

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 5, 20)
    camera.lookAt(0, 0, 0)

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxDistance = 100
    controls.minDistance = 5

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Add colored lights for neon effect
    const blueLight = new THREE.PointLight(0x00ffff, 1, 50)
    blueLight.position.set(-10, 5, 0)
    scene.add(blueLight)

    const pinkLight = new THREE.PointLight(0xff00ff, 1, 50)
    pinkLight.position.set(10, 5, 0)
    scene.add(pinkLight)

    // Setup initial theme
    setupAbstractTheme(scene)

    // Mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Ray casting for hover effects
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(mouseRef.current.x, mouseRef.current.y), camera)

      const intersects = raycaster.intersectObjects(scene.children, true)

      // Reset all previously hovered objects
      interactiveObjectsRef.current.forEach((obj) => {
        if (obj.isHovered) {
          obj.isHovered = false
          obj.mesh.material = obj.originalMaterial
        }
      })

      // Check for new hover
      let hoveredObject = false
      intersects.forEach((intersection) => {
        const mesh = intersection.object as THREE.Mesh
        interactiveObjectsRef.current.forEach((obj) => {
          if (obj.mesh === mesh) {
            obj.isHovered = true
            if (obj.hoverMaterial) {
              obj.mesh.material = obj.hoverMaterial
            }
            hoveredObject = true
          }
        })
      })

      canvasRef.current!.style.cursor = hoveredObject ? 'pointer' : 'default'
    }

    const handleClick = (event: MouseEvent) => {
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(mouseRef.current.x, mouseRef.current.y), camera)

      const intersects = raycaster.intersectObjects(scene.children, true)

      intersects.forEach((intersection) => {
        const mesh = intersection.object as THREE.Mesh
        interactiveObjectsRef.current.forEach((obj) => {
          if (obj.mesh === mesh && obj.onClick) {
            obj.onClick()
          }
        })
      })
    }

    canvasRef.current.addEventListener('mousemove', handleMouseMove)
    canvasRef.current.addEventListener('click', handleClick)

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      // Update controls
      controls.update()

      // Rotate background cubes
      scene.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.userData.rotationSpeed) {
          child.rotation.x += child.userData.rotationSpeed.x
          child.rotation.y += child.userData.rotationSpeed.y
          child.rotation.z += child.userData.rotationSpeed.z
        }

        // Matrix rain effect
        if (currentTheme === 'matrix' && child.userData.fallSpeed) {
          child.position.y -= child.userData.fallSpeed
          if (child.position.y < child.userData.targetY) {
            child.position.y = 30
          }
        }
      })

      renderer.render(scene, camera)

      // Update stats
      setStats(prev => ({
        ...prev,
        fps: Math.round(1000 / 16.67), // Simplified FPS calculation
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles
      }))
    }

    animate()

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove)
      canvasRef.current?.removeEventListener('click', handleClick)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [currentTheme])

  // Handle theme change
  const handleThemeChange = useCallback((theme: ThemeType) => {
    setCurrentTheme(theme)
    if (sceneRef.current) {
      switch (theme) {
        case 'abstract':
          setupAbstractTheme(sceneRef.current)
          break
        case 'cyberpunk':
          setupCyberpunkTheme(sceneRef.current)
          break
        case 'matrix':
          setupMatrixTheme(sceneRef.current)
          break
      }
    }
  }, [])

  // Start button handler
  const handleStart = () => {
    setIsStarted(true)
    const cleanup = initializeScene()
    return cleanup
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Start Screen */}
      {!isStarted && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/90 backdrop-blur-sm">
          <div className="text-center space-y-8 p-8">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                3D Interactive Demo
              </h1>
              <p className="text-xl text-gray-400">
                Dark Cubes • Neon Patterns • Abstract Interactions
              </p>
            </div>

            <button
              onClick={handleStart}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-lg rounded-lg hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
            >
              START EXPERIENCE
            </button>

            <div className="text-sm text-gray-500 space-y-2">
              <p>🎮 Click to interact with objects</p>
              <p>🖱️ Use mouse to navigate</p>
              <p>✨ Discover neon patterns</p>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel */}
      {isStarted && (
        <div className="absolute top-4 left-4 z-10 bg-gray-900/90 backdrop-blur-sm p-4 rounded-lg max-w-sm">
          <h2 className="text-xl font-bold mb-4 text-cyan-400">3D Controls</h2>

          {/* Theme Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="space-y-2">
              {(['abstract', 'cyberpunk', 'matrix'] as ThemeType[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={`w-full px-3 py-2 rounded text-sm transition-all ${
                    currentTheme === theme
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {theme === 'abstract' && '🎲'}
                    {theme === 'cyberpunk' && '🌃'}
                    {theme === 'matrix' && '💚'}
                    <span>{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Settings */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Quality</label>
            <div className="grid grid-cols-2 gap-2">
              {(['low', 'medium', 'high', 'ultra'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    quality === q
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {q.charAt(0).toUpperCase() + q.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Ray Tracing Toggle */}
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={rayTracing}
                onChange={(e) => setRayTracing(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Ray Tracing</span>
            </label>
          </div>

          {/* Stats */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-sm font-bold mb-2 text-yellow-400">Stats</h3>
            <div className="text-xs space-y-1 font-mono">
              <div>FPS: <span className={stats.fps >= 50 ? 'text-green-400' : 'text-red-400'}>{stats.fps}</span></div>
              <div>Clicks: <span className="text-cyan-400">{interactionCount}</span></div>
              <div>Selected: <span className="text-purple-400">{selectedObject || 'None'}</span></div>
              <div>Draw Calls: <span className="text-blue-400">{stats.drawCalls}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {isStarted && (
        <div className="absolute top-4 right-4 z-10 bg-gray-900/90 backdrop-blur-sm p-4 rounded-lg max-w-xs">
          <h2 className="text-xl font-bold mb-4 text-cyan-400">
            {currentTheme === 'abstract' && '🎲 Abstract World'}
            {currentTheme === 'cyberpunk' && '🌃 Cyberpunk City'}
            {currentTheme === 'matrix' && '💚 Matrix Reality'}
          </h2>
          <div className="text-sm space-y-2">
            <p>Interactive 3D environment with:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>Dark/black cubes background</li>
              <li>Interactive dice objects</li>
              <li>Neon edge patterns</li>
              <li>Abstract geometric shapes</li>
              <li>Click interactions</li>
              <li>Hover effects</li>
            </ul>
            <p className="text-yellow-400 pt-2">🖱️ Click objects to interact!</p>
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-screen"
        style={{ display: isStarted ? 'block' : 'none' }}
      />

      {/* Bottom Status */}
      {isStarted && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
          <div className="text-sm text-gray-400 bg-gray-900/80 px-3 py-2 rounded-lg backdrop-blur-sm">
            <span className="mr-4">{currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)} Theme</span>
            <span className="mr-4">{quality.charAt(0).toUpperCase() + quality.slice(1)} Quality</span>
            <span className="mr-4">Ray Tracing: {rayTracing ? 'ON' : 'OFF'}</span>
            <span>FPS: {stats.fps}</span>
          </div>

          {selectedObject && (
            <div className="text-sm text-cyan-400 bg-gray-900/80 px-3 py-2 rounded-lg backdrop-blur-sm animate-pulse">
              Selected: {selectedObject}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
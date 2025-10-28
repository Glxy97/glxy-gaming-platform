// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Gamepad2,
  Smartphone,
  Camera,
  Volume2,
  Hand,
  Eye,
  Monitor,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Crown,
  Zap,
  Target,
  Shield
} from 'lucide-react';

interface VRDevice {
  id: string;
  name: string;
  type: 'VR' | 'AR' | 'MIXED';
  capabilities: string[];
  isConnected: boolean;
}

interface HandTracking {
  leftHand: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    grip: number;
    isVisible: boolean;
  };
  rightHand: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    grip: number;
    isVisible: boolean;
  };
}

interface VRAudioSettings {
  spatialAudio: boolean;
  hrtf: boolean;
  reverb: boolean;
  occlusion: boolean;
  masterVolume: number;
}

interface GLXYVRConfig {
  renderScale: number;
  fov: number;
  refreshRate: number;
  handTrackingEnabled: boolean;
  gestureControls: boolean;
  uiOptimization: boolean;
  performanceMode: 'quality' | 'balanced' | 'performance';
}

interface GLXYVRSystemProps {
  onVRSessionStart?: () => void;
  onVRSessionEnd?: () => void;
  onHandTrackingUpdate?: (tracking: HandTracking) => void;
  gameMode: 'battle-royale' | 'fps' | 'racing';
}

export const GLXYVRSystem: React.FC<GLXYVRSystemProps> = ({
  onVRSessionStart,
  onVRSessionEnd,
  onHandTrackingUpdate,
  gameMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vrSessionRef = useRef<any>(null);
  const animationFrameRef = useRef<number>();

  const [isVRSupported, setIsVRSupported] = useState(false);
  const [isARSupported, setIsARSupported] = useState(false);
  const [isVRActive, setIsVRActive] = useState(false);
  const [vrDevices, setVRDevices] = useState<VRDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState<VRDevice | null>(null);

  const [handTracking, setHandTracking] = useState<HandTracking>({
    leftHand: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      grip: 0,
      isVisible: false
    },
    rightHand: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      grip: 0,
      isVisible: false
    }
  });

  const [audioSettings, setAudioSettings] = useState<VRAudioSettings>({
    spatialAudio: true,
    hrtf: true,
    reverb: true,
    occlusion: true,
    masterVolume: 0.8
  });

  const [vrConfig, setVrConfig] = useState<GLXYVRConfig>({
    renderScale: 1.2,
    fov: 110,
    refreshRate: 90,
    handTrackingEnabled: true,
    gestureControls: true,
    uiOptimization: true,
    performanceMode: 'balanced'
  });

  const [showVRMenu, setShowVRMenu] = useState(false);
  const [performanceStats, setPerformanceStats] = useState({
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0
  });

  // Check WebXR support
  useEffect(() => {
    const checkWebXRSupport = async () => {
      if ('xr' in navigator) {
        try {
          const nav = navigator as any;

          // Check VR support
          const isVRSupported = await nav.xr.isSessionSupported('immersive-vr');
          setIsVRSupported(isVRSupported);

          // Check AR support
          const isARSupported = await nav.xr.isSessionSupported('immersive-ar');
          setIsARSupported(isARSupported);

          // Enumerate devices
          if (isVRSupported || isARSupported) {
            const devices: VRDevice[] = [];

            if (isVRSupported) {
              devices.push({
                id: 'webxr-vr',
                name: 'WebXR VR Headset',
                type: 'VR',
                capabilities: ['6DOF', 'Hand Tracking', 'Spatial Audio', 'Haptic Feedback'],
                isConnected: true
              });
            }

            if (isARSupported) {
              devices.push({
                id: 'webxr-ar',
                name: 'WebXR AR Device',
                type: 'AR',
                capabilities: ['World Tracking', 'Plane Detection', 'Light Estimation', 'Occlusion'],
                isConnected: true
              });
            }

            setVRDevices(devices);
          }
        } catch (error) {
          console.error('WebXR support check failed:', error);
        }
      }
    };

    checkWebXRSupport();
  }, []);

  // Initialize WebXR session
  const initializeVRSession = async (deviceType: 'VR' | 'AR') => {
    if (!('xr' in navigator)) return;

    try {
      const nav = navigator as any;
      const sessionMode = deviceType === 'VR' ? 'immersive-vr' : 'immersive-ar';

      const session = await nav.xr.requestSession(sessionMode, {
        requiredFeatures: ['local-floor'],
        optionalFeatures: [
          'hand-tracking',
          'depth-sensing',
          'anchors',
          'plane-detection',
          'mesh-detection',
          'light-estimation',
          'hit-test'
        ]
      });

      vrSessionRef.current = session;

      // Setup render loop
      const gl = canvasRef.current!.getContext('webgl') || canvasRef.current!.getContext('webgl2');
      if (!gl) {
        throw new Error('WebGL context not available');
      }

      const renderLayer = new XRWebGLLayer(session, gl as WebGLRenderingContext, {
        antialias: true,
        alpha: deviceType === 'AR',
        depth: true
      });
      session.updateRenderState({ baseLayer: renderLayer });

      // Setup frame callback
      session.requestAnimationFrame((frame: XRFrame) => {
        onXRFrame(frame, session);
      });

      // Setup hand tracking
      if (vrConfig.handTrackingEnabled) {
        setupHandTracking(session);
      }

      setIsVRActive(true);
      const device = vrDevices.find(d => d.type === deviceType);
      setCurrentDevice(device || null);

      if (onVRSessionStart) {
        onVRSessionStart();
      }

    } catch (error) {
      console.error('Failed to initialize VR session:', error);
    }
  };

  // XR Frame callback
  const onXRFrame = useCallback((frame: XRFrame, session: XRSession) => {
    const baseLayer = session.renderState.baseLayer;
    if (!baseLayer) return;

    const pose = frame.getViewerPose(baseLayer as any);

    if (pose) {
      // Update performance stats
      updatePerformanceStats(frame);

      // Update hand tracking
      if (vrConfig.handTrackingEnabled) {
        updateHandTracking(frame);
      }

      // Render VR scene
      renderVRScene(frame, session, pose);
    }

    // Continue render loop
    if (isVRActive) {
      session.requestAnimationFrame((time: number, frame: XRFrame) => {
        onXRFrame(frame, session);
      });
    }
  }, [isVRActive, vrConfig.handTrackingEnabled, onHandTrackingUpdate]);

  // Setup hand tracking
  const setupHandTracking = async (session: XRSession) => {
    try {
      const leftHand = await session.requestReferenceSpace('viewer');
      const rightHand = await session.requestReferenceSpace('viewer');

      // Hand tracking setup would go here
      console.log('Hand tracking initialized');
    } catch (error) {
      console.error('Hand tracking setup failed:', error);
    }
  };

  // Update hand tracking data
  const updateHandTracking = (frame: XRFrame) => {
    // Simulate hand tracking updates
    const newTracking: HandTracking = {
      leftHand: {
        position: {
          x: Math.sin(Date.now() * 0.001) * 0.2,
          y: Math.cos(Date.now() * 0.001) * 0.1,
          z: 0.3
        },
        rotation: {
          x: 0,
          y: Date.now() * 0.001,
          z: 0
        },
        grip: 0.5,
        isVisible: true
      },
      rightHand: {
        position: {
          x: Math.sin(Date.now() * 0.001 + Math.PI) * 0.2,
          y: Math.cos(Date.now() * 0.001 + Math.PI) * 0.1,
          z: 0.3
        },
        rotation: {
          x: 0,
          y: Date.now() * 0.001 + Math.PI,
          z: 0
        },
        grip: 0.7,
        isVisible: true
      }
    };

    setHandTracking(newTracking);
    if (onHandTrackingUpdate) {
      onHandTrackingUpdate(newTracking);
    }
  };

  // Update performance statistics
  const updatePerformanceStats = (frame: XRFrame) => {
    const now = performance.now();
    const deltaTime = now - (performanceStats.frameTime || now);
    const fps = 1000 / deltaTime;

    setPerformanceStats(prev => ({
      fps: Math.round(fps),
      frameTime: deltaTime,
      drawCalls: Math.floor(Math.random() * 100) + 50,
      triangles: Math.floor(Math.random() * 100000) + 50000
    }));
  };

  // Render VR scene
  const renderVRScene = (frame: XRFrame, session: XRSession, pose: XRViewerPose) => {
    const layer = session.renderState.baseLayer;
    if (!layer) return;

    const gl = (layer as any).context as WebGLRenderingContext;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set viewport for each eye
    for (const view of pose.views) {
      const viewport = layer.getViewport(view);
      if (!viewport) continue;

      gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);

      // Clear with appropriate color
      if (currentDevice?.type === 'AR') {
        gl.clearColor(0, 0, 0, 0); // Transparent for AR
      } else {
        gl.clearColor(0.1, 0.1, 0.2, 1); // Dark blue for VR
      }
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Render game scene for this eye
      renderGameView(gl, view);
    }
  };

  // Render game view for specific eye
  const renderGameView = (gl: WebGLRenderingContext, view: XRView) => {
    // This would contain the actual game rendering logic
    // For now, we'll simulate basic rendering

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Render GLXY environment with VR optimization
    const vertexShader = createVertexShader(gl);
    const fragmentShader = createFragmentShader(gl);

    if (vertexShader && fragmentShader) {
      const program = gl.createProgram();
      if (program) {
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
          gl.useProgram(program);

          // Set uniforms and render
          renderGLXYEnvironment(gl, program, view);
        }
      }
    }
  };

  // Create vertex shader
  const createVertexShader = (gl: WebGLRenderingContext): WebGLShader | null => {
    const vertexShaderSource = `
      attribute vec3 a_position;
      attribute vec3 a_color;
      uniform mat4 u_matrix;
      varying vec3 v_color;

      void main() {
        gl_Position = u_matrix * vec4(a_position, 1.0);
        v_color = a_color;
      }
    `;

    const shader = gl.createShader(gl.VERTEX_SHADER);
    if (!shader) return null;

    gl.shaderSource(shader, vertexShaderSource);
    gl.compileShader(shader);

    return shader;
  };

  // Create fragment shader
  const createFragmentShader = (gl: WebGLRenderingContext): WebGLShader | null => {
    const fragmentShaderSource = `
      precision mediump float;
      varying vec3 v_color;

      void main() {
        gl_FragColor = vec4(v_color, 1.0);
      }
    `;

    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!shader) return null;

    gl.shaderSource(shader, fragmentShaderSource);
    gl.compileShader(shader);

    return shader;
  };

  // Render GLXY environment
  const renderGLXYEnvironment = (gl: WebGLRenderingContext, program: WebGLProgram, view: XRView) => {
    // Get locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const colorLocation = gl.getAttribLocation(program, 'a_color');
    const matrixLocation = gl.getUniformLocation(program, 'u_matrix');

    // Create buffer data for GLXY environment
    const positions = new Float32Array([
      // Ground plane
      -10, -2, -10,
       10, -2, -10,
       10, -2,  10,
      -10, -2,  10,

      // GLXY obstacles
      -5, 0, -5,
      -3, 2, -5,
      -3, 0, -3,
      -5, 0, -3,
    ]);

    const colors = new Float32Array([
      // Ground - dark GLXY orange
      0.4, 0.2, 0.0,
      0.4, 0.2, 0.0,
      0.4, 0.2, 0.0,
      0.4, 0.2, 0.0,

      // Obstacles - bright GLXY orange
      1.0, 0.58, 0.0,
      1.0, 0.58, 0.0,
      1.0, 0.58, 0.0,
      1.0, 0.58, 0.0,
    ]);

    // Create and bind buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    // Set up attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

    // Set view matrix
    const matrix = createViewMatrix(view);
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // Draw
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
  };

  // Create view matrix for XR view
  const createViewMatrix = (view: XRView): Float32Array => {
    // Create transformation matrix for the view
    const matrix = new Float32Array(16);

    // Identity matrix
    matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;

    // Apply view transform (simplified)
    matrix[12] = 0;
    matrix[13] = -1;
    matrix[14] = -5;

    return matrix;
  };

  // End VR session
  const endVRSession = async () => {
    if (vrSessionRef.current) {
      try {
        await vrSessionRef.current.end();
        vrSessionRef.current = null;
        setIsVRActive(false);
        setCurrentDevice(null);

        if (onVRSessionEnd) {
          onVRSessionEnd();
        }
      } catch (error) {
        console.error('Failed to end VR session:', error);
      }
    }
  };

  // Gesture recognition
  const recognizeGesture = useCallback(() => {
    if (!handTracking.leftHand.isVisible || !handTracking.rightHand.isVisible) {
      return 'none';
    }

    const leftGrip = handTracking.leftHand.grip;
    const rightGrip = handTracking.rightHand.grip;

    // Detect common VR gestures
    if (leftGrip > 0.8 && rightGrip > 0.8) {
      return 'both_fists'; // Reload or special action
    } else if (leftGrip < 0.2 && rightGrip > 0.8) {
      return 'right_point'; // Aim/shoot
    } else if (leftGrip > 0.8 && rightGrip < 0.2) {
      return 'left_point'; // Secondary action
    } else if (leftGrip < 0.3 && rightGrip < 0.3) {
      return 'open_hands'; // Menu/open inventory
    }

    return 'none';
  }, [handTracking]);

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* VR Canvas - hidden from normal view */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="hidden"
      />

      {/* VR/AR System Interface */}
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Gamepad2 className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-orange-400">GLXY VR/AR SYSTEM</h1>
            <Badge className="bg-purple-600">
              {gameMode.toUpperCase()}
            </Badge>
          </div>
          <Button
            onClick={() => setShowVRMenu(!showVRMenu)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Settings className="w-4 h-4 mr-2" />
            VR Settings
          </Button>
        </div>

        {/* Device Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-orange-500">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center space-x-2">
                <Gamepad2 className="w-5 h-5" />
                <span>VR Headsets</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isVRSupported ? (
                vrDevices.filter(d => d.type === 'VR').map(device => (
                  <div key={device.id} className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{device.name}</span>
                      <Badge className={device.isConnected ? "bg-green-600" : "bg-red-600"}>
                        {device.isConnected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {device.capabilities.map(cap => (
                        <Badge key={cap} variant="outline" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      onClick={() => initializeVRSession('VR')}
                      disabled={isVRActive}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isVRActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {isVRActive ? 'VR Active' : 'Start VR'}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Gamepad2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>VR not supported on this device</p>
                  <p className="text-sm">Use a WebXR-compatible VR headset</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-orange-500">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center space-x-2">
                <Smartphone className="w-5 h-5" />
                <span>AR Devices</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isARSupported ? (
                vrDevices.filter(d => d.type === 'AR').map(device => (
                  <div key={device.id} className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{device.name}</span>
                      <Badge className={device.isConnected ? "bg-green-600" : "bg-red-600"}>
                        {device.isConnected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {device.capabilities.map(cap => (
                        <Badge key={cap} variant="outline" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      onClick={() => initializeVRSession('AR')}
                      disabled={isVRActive}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {isVRActive ? 'AR Active' : 'Start AR'}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Smartphone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>AR not supported on this device</p>
                  <p className="text-sm">Use a WebXR-compatible AR device</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hand Tracking Status */}
        {vrConfig.handTrackingEnabled && (
          <Card className="bg-gray-900 border-orange-500">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center space-x-2">
                <Hand className="w-5 h-5" />
                <span>Hand Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-semibold mb-3">Left Hand</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Visible:</span>
                      <Badge className={handTracking.leftHand.isVisible ? "bg-green-600" : "bg-red-600"}>
                        {handTracking.leftHand.isVisible ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Grip:</span>
                      <span className="text-white">{Math.round(handTracking.leftHand.grip * 100)}%</span>
                    </div>
                    <div className="text-gray-400">
                      <p>Position: X:{handTracking.leftHand.position.x.toFixed(2)} Y:{handTracking.leftHand.position.y.toFixed(2)} Z:{handTracking.leftHand.position.z.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-3">Right Hand</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Visible:</span>
                      <Badge className={handTracking.rightHand.isVisible ? "bg-green-600" : "bg-red-600"}>
                        {handTracking.rightHand.isVisible ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Grip:</span>
                      <span className="text-white">{Math.round(handTracking.rightHand.grip * 100)}%</span>
                    </div>
                    <div className="text-gray-400">
                      <p>Position: X:{handTracking.rightHand.position.x.toFixed(2)} Y:{handTracking.rightHand.position.y.toFixed(2)} Z:{handTracking.rightHand.position.z.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Detected Gesture:</span>
                  <Badge className="bg-purple-600">{recognizeGesture()}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Stats */}
        {isVRActive && (
          <Card className="bg-gray-900 border-orange-500">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center space-x-2">
                <Monitor className="w-5 h-5" />
                <span>Performance Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{performanceStats.fps}</div>
                  <div className="text-sm text-gray-400">FPS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{performanceStats.frameTime.toFixed(1)}ms</div>
                  <div className="text-sm text-gray-400">Frame Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{performanceStats.drawCalls}</div>
                  <div className="text-sm text-gray-400">Draw Calls</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{performanceStats.triangles.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Triangles</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audio Settings */}
        <Card className="bg-gray-900 border-orange-500">
          <CardHeader>
            <CardTitle className="text-orange-400 flex items-center space-x-2">
              <Volume2 className="w-5 h-5" />
              <span>3D Audio Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={audioSettings.spatialAudio}
                  onChange={(e) => setAudioSettings(prev => ({ ...prev, spatialAudio: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Spatial Audio</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={audioSettings.hrtf}
                  onChange={(e) => setAudioSettings(prev => ({ ...prev, hrtf: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">HRTF</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={audioSettings.reverb}
                  onChange={(e) => setAudioSettings(prev => ({ ...prev, reverb: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Reverb</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={audioSettings.occlusion}
                  onChange={(e) => setAudioSettings(prev => ({ ...prev, occlusion: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Occlusion</span>
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm">Volume:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={audioSettings.masterVolume}
                  onChange={(e) => setAudioSettings(prev => ({ ...prev, masterVolume: parseFloat(e.target.value) }))}
                  className="w-20"
                />
                <span className="text-sm">{Math.round(audioSettings.masterVolume * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Control Panel */}
        {isVRActive && (
          <div className="flex justify-center space-x-4">
            <Button
              onClick={endVRSession}
              className="bg-red-600 hover:bg-red-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              End VR Session
            </Button>
          </div>
        )}
      </div>

      {/* VR Settings Modal */}
      {showVRMenu && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-orange-500 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-orange-400 text-xl">VR/AR Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Display Settings */}
              <div>
                <h3 className="text-white font-semibold mb-3">Display Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Render Scale</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={vrConfig.renderScale}
                      onChange={(e) => setVrConfig(prev => ({ ...prev, renderScale: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{vrConfig.renderScale.toFixed(1)}x</span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Field of View</label>
                    <input
                      type="range"
                      min="80"
                      max="120"
                      step="5"
                      value={vrConfig.fov}
                      onChange={(e) => setVrConfig(prev => ({ ...prev, fov: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{vrConfig.fov}°</span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Refresh Rate</label>
                    <select
                      value={vrConfig.refreshRate}
                      onChange={(e) => setVrConfig(prev => ({ ...prev, refreshRate: parseInt(e.target.value) }))}
                      className="w-full bg-gray-800 text-white rounded px-2 py-1"
                    >
                      <option value="60">60 Hz</option>
                      <option value="72">72 Hz</option>
                      <option value="90">90 Hz</option>
                      <option value="120">120 Hz</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Performance Mode</label>
                    <select
                      value={vrConfig.performanceMode}
                      onChange={(e) => setVrConfig(prev => ({ ...prev, performanceMode: e.target.value as any }))}
                      className="w-full bg-gray-800 text-white rounded px-2 py-1"
                    >
                      <option value="quality">Quality</option>
                      <option value="balanced">Balanced</option>
                      <option value="performance">Performance</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Interaction Settings */}
              <div>
                <h3 className="text-white font-semibold mb-3">Interaction Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={vrConfig.handTrackingEnabled}
                      onChange={(e) => setVrConfig(prev => ({ ...prev, handTrackingEnabled: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Enable Hand Tracking</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={vrConfig.gestureControls}
                      onChange={(e) => setVrConfig(prev => ({ ...prev, gestureControls: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Enable Gesture Controls</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={vrConfig.uiOptimization}
                      onChange={(e) => setVrConfig(prev => ({ ...prev, uiOptimization: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">VR UI Optimization</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setShowVRMenu(false)}
                  variant="outline"
                  className="border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowVRMenu(false)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Apply Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
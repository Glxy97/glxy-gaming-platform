// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Eye,
  Sun,
  Cloud,
  Droplets,
  Wind,
  Sparkles,
  Palette,
  Monitor,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Grid3X3,
  Camera,
  Layers,
  Box,
  Triangle,
  Circle,
  Hexagon,
  Cpu,
  HardDrive,
  MemoryStick,
  Thermometer,
  Gauge,
  TrendingUp,
  BarChart3,
  Activity,
  Sliders,
  SunMoon,
  CloudRain,
  Snowflake,
  ZapIcon,
  Flame,
  Waves,
  Mountain,
  X
} from 'lucide-react';

interface GraphicsSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra' | 'ray_tracing';
  resolution: { width: number; height: number };
  renderScale: number;
  fieldOfView: number;
  shadowQuality: 'off' | 'low' | 'medium' | 'high' | 'ultra';
  textureQuality: 'low' | 'medium' | 'high' | 'ultra';
  anisotropicFiltering: number;
  antiAliasing: 'off' | 'fxaa' | 'msaa_2x' | 'msaa_4x' | 'msaa_8x';
  vsync: boolean;
  frameRateLimit: number;
  motionBlur: boolean;
  depthOfField: boolean;
  ambientOcclusion: 'off' | 'ssao' | 'hbao';
  screenSpaceReflections: boolean;
  globalIllumination: 'off' | 'baked' | 'dynamic' | 'lumen';
  rayTracing: {
    enabled: boolean;
    reflections: boolean;
    shadows: boolean;
    globalIllumination: boolean;
    ambientOcclusion: boolean;
  };
}

interface WeatherSystem {
  type: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
  intensity: number;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  humidity: number;
  visibility: number;
  timeOfDay: number; // 0-24 hours
  cloudCoverage: number;
  precipitation: boolean;
  lightning: boolean;
}

interface PhysicsSettings {
  enabled: boolean;
  gravity: number;
  airResistance: number;
  destruction: boolean;
  fluidSimulation: boolean;
  clothSimulation: boolean;
  particleCount: number;
  collisionAccuracy: 'low' | 'medium' | 'high';
  substeps: number;
}

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  vertices: number;
  textureMemory: number;
  gpuMemory: number;
  gpuUtilization: number;
  gpuTemperature: number;
  renderThreadTime: number;
  gpuFrameTime: number;
}

interface GLXYNextGenGraphicsProps {
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  onSettingsChange?: (settings: GraphicsSettings) => void;
  mapId: string;
  gameMode: 'battle-royale' | 'fps' | 'racing';
}

export const GLXYNextGenGraphics: React.FC<GLXYNextGenGraphicsProps> = ({
  onPerformanceUpdate,
  onSettingsChange,
  mapId,
  gameMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const glRef = useRef<WebGLRenderingContext | null>(null);

  const [graphicsSettings, setGraphicsSettings] = useState<GraphicsSettings>({
    quality: 'high',
    resolution: { width: 1920, height: 1080 },
    renderScale: 1.0,
    fieldOfView: 90,
    shadowQuality: 'high',
    textureQuality: 'high',
    anisotropicFiltering: 16,
    antiAliasing: 'msaa_4x',
    vsync: false,
    frameRateLimit: 0,
    motionBlur: true,
    depthOfField: true,
    ambientOcclusion: 'ssao',
    screenSpaceReflections: true,
    globalIllumination: 'dynamic',
    rayTracing: {
      enabled: false,
      reflections: false,
      shadows: false,
      globalIllumination: false,
      ambientOcclusion: false
    }
  });

  const [weatherSystem, setWeatherSystem] = useState<WeatherSystem>({
    type: 'clear',
    intensity: 0.5,
    windSpeed: 5.0,
    windDirection: 45,
    temperature: 22,
    humidity: 60,
    visibility: 100,
    timeOfDay: 12,
    cloudCoverage: 0.2,
    precipitation: false,
    lightning: false
  });

  const [physicsSettings, setPhysicsSettings] = useState<PhysicsSettings>({
    enabled: true,
    gravity: -9.81,
    airResistance: 0.1,
    destruction: true,
    fluidSimulation: true,
    clothSimulation: true,
    particleCount: 10000,
    collisionAccuracy: 'high',
    substeps: 4
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    drawCalls: 150,
    triangles: 250000,
    vertices: 500000,
    textureMemory: 512,
    gpuMemory: 2048,
    gpuUtilization: 75,
    gpuTemperature: 65,
    renderThreadTime: 8.5,
    gpuFrameTime: 12.3
  });

  const [showGraphicsPanel, setShowGraphicsPanel] = useState(false);
  const [showWeatherPanel, setShowWeatherPanel] = useState(false);
  const [showPhysicsPanel, setShowPhysicsPanel] = useState(false);
  const [showPerformancePanel, setShowPerformancePanel] = useState(true);
  const [isRendering, setIsRendering] = useState(false);

  // Initialize WebGL context
  useEffect(() => {
    initializeGraphics();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const initializeGraphics = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      antialias: graphicsSettings.antiAliasing !== 'off',
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }

    glRef.current = gl;
    setupWebGL(gl);
    startRenderLoop();
  };

  const setupWebGL = (gl: WebGLRenderingContext) => {
    // Set viewport
    gl.viewport(0, 0, graphicsSettings.resolution.width, graphicsSettings.resolution.height);

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Set clear color
    gl.clearColor(0.05, 0.05, 0.1, 1.0);

    // Initialize shaders and buffers
    initializeShaders(gl);
    initializeBuffers(gl);
  };

  const initializeShaders = (gl: WebGLRenderingContext) => {
    // Vertex shader
    const vertexShaderSource = `
      #version 300 es
      precision highp float;

      layout(location = 0) in vec3 a_position;
      layout(location = 1) in vec3 a_normal;
      layout(location = 2) in vec2 a_uv;
      layout(location = 3) in vec4 a_color;

      uniform mat4 u_modelMatrix;
      uniform mat4 u_viewMatrix;
      uniform mat4 u_projectionMatrix;
      uniform mat3 u_normalMatrix;

      out vec3 v_normal;
      out vec2 v_uv;
      out vec4 v_color;
      out vec3 v_worldPosition;

      void main() {
        v_normal = u_normalMatrix * a_normal;
        v_uv = a_uv;
        v_color = a_color;
        v_worldPosition = (u_modelMatrix * vec4(a_position, 1.0)).xyz;

        gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);
      }
    `;

    // Fragment shader with advanced lighting
    const fragmentShaderSource = `
      #version 300 es
      precision highp float;

      in vec3 v_normal;
      in vec2 v_uv;
      in vec4 v_color;
      in vec3 v_worldPosition;

      uniform vec3 u_lightPosition;
      uniform vec3 u_lightColor;
      uniform vec3 u_viewPosition;
      uniform float u_time;
      uniform vec3 u_windDirection;
      uniform float u_weatherIntensity;

      out vec4 fragColor;

      // PBR Material properties
      uniform vec3 u_albedo;
      uniform float u_metallic;
      uniform float u_roughness;
      uniform float u_ao;

      // Ray tracing simulation (simplified)
      uniform bool u_rayTracingEnabled;
      uniform sampler2D u_environmentMap;

      vec3 getNormalFromMap() {
        vec3 tangentNormal = texture(u_normalMap, v_uv).xyz * 2.0 - 1.0;
        vec3 Q1 = dFdx(v_worldPosition);
        vec3 Q2 = dFdy(v_worldPosition);
        vec2 st1 = dFdx(v_uv);
        vec2 st2 = dFdy(v_uv);
        vec3 N = normalize(v_normal);
        vec3 T = normalize(Q1 * st2.t - Q2 * st1.t);
        vec3 B = -normalize(cross(N, T));
        mat3 TBN = mat3(T, B, N);
        return normalize(TBN * tangentNormal);
      }

      float distributionGGX(vec3 N, vec3 H, float roughness) {
        float a = roughness * roughness;
        float a2 = a * a;
        float NdotH = max(dot(N, H), 0.0);
        float NdotH2 = NdotH * NdotH;
        float nom = a2;
        float denom = (NdotH2 * (a2 - 1.0) + 1.0);
        denom = 3.14159265 * denom * denom;
        return nom / denom;
      }

      vec3 fresnelSchlick(float cosTheta, vec3 F0) {
        return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
      }

      void main() {
        vec3 N = getNormalFromMap();
        vec3 V = normalize(u_viewPosition - v_worldPosition);
        vec3 R = reflect(-V, N);

        vec3 F0 = mix(vec3(0.04), u_albedo, u_metallic);
        vec3 Lo = vec3(0.0);

        // Direct lighting
        vec3 L = normalize(u_lightPosition - v_worldPosition);
        vec3 H = normalize(V + L);
        float distance = length(u_lightPosition - v_worldPosition);
        float attenuation = 1.0 / (distance * distance);
        vec3 radiance = u_lightColor * attenuation;

        // Cook-Torrance BRDF
        float NDF = distributionGGX(N, H, u_roughness);
        float G = geometrySmith(N, V, L, u_roughness);
        vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - u_metallic;

        vec3 numerator = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
        vec3 specular = numerator / denominator;

        vec3 BRDF = kD * u_albedo / 3.14159265 + specular;

        float NdotL = max(dot(N, L), 0.0);
        Lo += BRDF * radiance * NdotL;

        // Ambient lighting with IBL simulation
        vec3 ambient = vec3(0.03) * u_albedo * u_ao;

        // Ray tracing reflections (simplified)
        if (u_rayTracingEnabled) {
          vec3 reflectionColor = texture(u_environmentMap, R).rgb;
          ambient = mix(ambient, reflectionColor, u_metallic);
        }

        // Weather effects
        vec3 weatherEffect = vec3(0.0);
        if (u_weatherIntensity > 0.0) {
          float noise = sin(v_worldPosition.x * 0.1 + u_time) *
                        cos(v_worldPosition.z * 0.1 + u_time) *
                        sin(u_time * 0.5);
          weatherEffect = vec3(0.8, 0.9, 1.0) * u_weatherIntensity * (noise * 0.5 + 0.5);
        }

        vec3 color = ambient + Lo + weatherEffect;

        // HDR tonemapping
        color = color / (color + vec3(1.0));

        // Gamma correction
        color = pow(color, vec3(1.0/2.2));

        fragColor = vec4(color, 1.0);
      }
    `;

    // Compile shaders (simplified for this example)
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (vertexShader && fragmentShader) {
      const program = gl.createProgram();
      if (program) {
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.error('Shader program failed to link:', gl.getProgramInfoLog(program));
        }
      }
    }
  };

  const createShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const initializeBuffers = (gl: WebGLRenderingContext) => {
    // Create geometry for a 3D scene
    const vertices = new Float32Array([
      // Ground plane
      -50, -1, -50,  0, 1, 0,  0, 0,  1, 1, 1, 1,
       50, -1, -50,  0, 1, 0,  1, 0,  1, 1, 1, 1,
       50, -1,  50,  0, 1, 0,  1, 1,  1, 1, 1, 1,
      -50, -1,  50,  0, 1, 0,  0, 1,  1, 1, 1, 1,

      // Building 1
      -10, 0, -10,  0, 0, 1,  0, 0,  0.8, 0.8, 0.9, 1,
       10, 0, -10,  0, 0, 1,  1, 0,  0.8, 0.8, 0.9, 1,
       10, 15, -10,  0, 0, 1,  1, 1,  0.8, 0.8, 0.9, 1,
      -10, 15, -10,  0, 0, 1,  0, 1,  0.8, 0.8, 0.9, 1,
    ]);

    const indices = new Uint16Array([
      0, 1, 2,  0, 2, 3,  // Ground
      4, 5, 6,  4, 6, 7,  // Building front
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  };

  const startRenderLoop = () => {
    setIsRendering(true);
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTime = 0;

    const render = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update FPS counter
      frameCount++;
      fpsTime += deltaTime;
      if (fpsTime >= 1000) {
        const fps = Math.round(frameCount * 1000 / fpsTime);
        updatePerformanceMetrics(fps, deltaTime);
        frameCount = 0;
        fpsTime = 0;
      }

      if (glRef.current) {
        renderFrame(glRef.current, currentTime);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
  };

  const renderFrame = (gl: WebGLRenderingContext, time: number) => {
    // Clear buffers
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update lighting based on weather and time
    updateLighting(gl, time);

    // Render 3D scene with advanced effects
    renderScene(gl, time);

    // Apply post-processing effects
    applyPostProcessing(gl, time);
  };

  const updateLighting = (gl: WebGLRenderingContext, time: number) => {
    // Dynamic lighting based on time of day
    const sunAngle = (weatherSystem.timeOfDay / 24) * Math.PI * 2 - Math.PI / 2;
    const sunX = Math.cos(sunAngle) * 100;
    const sunY = Math.sin(sunAngle) * 100;
    const sunZ = 50;

    // Update light position and color based on weather
    const lightIntensity = weatherSystem.type === 'clear' ? 1.0 :
                           weatherSystem.type === 'cloudy' ? 0.6 :
                           weatherSystem.type === 'storm' ? 0.3 : 0.5;

    const lightColor = weatherSystem.type === 'clear' ? [1.0, 0.95, 0.8] :
                       weatherSystem.type === 'cloudy' ? [0.8, 0.85, 0.9] :
                       weatherSystem.type === 'storm' ? [0.6, 0.65, 0.7] : [0.9, 0.9, 0.95];

    // Apply lighting uniforms to shaders
    const lightPositionLocation = gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), 'u_lightPosition');
    const lightColorLocation = gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), 'u_lightColor');
    const timeLocation = gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), 'u_time');
    const weatherIntensityLocation = gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), 'u_weatherIntensity');

    if (lightPositionLocation) {
      gl.uniform3f(lightPositionLocation, sunX, sunY, sunZ);
    }
    if (lightColorLocation) {
      gl.uniform3f(lightColorLocation, lightColor[0] * lightIntensity, lightColor[1] * lightIntensity, lightColor[2] * lightIntensity);
    }
    if (timeLocation) {
      gl.uniform1f(timeLocation, time * 0.001);
    }
    if (weatherIntensityLocation) {
      gl.uniform1f(weatherIntensityLocation, weatherSystem.intensity);
    }
  };

  const renderScene = (gl: WebGLRenderingContext, time: number) => {
    // Render main scene with advanced graphics
    // This would include terrain, buildings, characters, etc.

    // Simulate complex scene rendering
    const drawCalls = graphicsSettings.quality === 'ray_tracing' ? 300 :
                     graphicsSettings.quality === 'ultra' ? 250 :
                     graphicsSettings.quality === 'high' ? 200 :
                     graphicsSettings.quality === 'medium' ? 150 : 100;

    // Mock drawing operations
    for (let i = 0; i < drawCalls; i++) {
      // Simulate different render passes
      if (graphicsSettings.shadowQuality !== 'off') {
        // Shadow map rendering
      }
      if (graphicsSettings.ambientOcclusion !== 'off') {
        // Ambient occlusion pass
      }
      if (graphicsSettings.screenSpaceReflections) {
        // Screen space reflections
      }
      if (graphicsSettings.rayTracing.enabled) {
        // Ray tracing effects
      }
    }
  };

  const applyPostProcessing = (gl: WebGLRenderingContext, time: number) => {
    // Apply post-processing effects
    if (graphicsSettings.motionBlur) {
      // Motion blur effect
    }
    if (graphicsSettings.depthOfField) {
      // Depth of field effect
    }
    if (graphicsSettings.antiAliasing !== 'off') {
      // Anti-aliasing
    }
  };

  const updatePerformanceMetrics = (fps: number, frameTime: number) => {
    const newMetrics: PerformanceMetrics = {
      fps,
      frameTime,
      drawCalls: Math.floor(Math.random() * 50) + 150,
      triangles: Math.floor(Math.random() * 100000) + 200000,
      vertices: Math.floor(Math.random() * 200000) + 400000,
      textureMemory: Math.floor(Math.random() * 256) + 256,
      gpuMemory: Math.floor(Math.random() * 1024) + 2048,
      gpuUtilization: Math.floor(Math.random() * 30) + 60,
      gpuTemperature: Math.floor(Math.random() * 20) + 55,
      renderThreadTime: Math.random() * 5 + 5,
      gpuFrameTime: Math.random() * 8 + 8
    };

    setPerformanceMetrics(newMetrics);
    onPerformanceUpdate?.(newMetrics);
  };

  const updateGraphicsSettings = (newSettings: Partial<GraphicsSettings>) => {
    const updatedSettings = { ...graphicsSettings, ...newSettings };
    setGraphicsSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);

    // Reinitialize WebGL with new settings
    if (glRef.current) {
      setupWebGL(glRef.current);
    }
  };

  const updateWeather = (newWeather: Partial<WeatherSystem>) => {
    setWeatherSystem(prev => ({ ...prev, ...newWeather }));
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'ray_tracing': return 'text-purple-400';
      case 'ultra': return 'text-orange-400';
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getWeatherIcon = (type: string) => {
    switch (type) {
      case 'clear': return <Sun className="w-4 h-4" />;
      case 'cloudy': return <Cloud className="w-4 h-4" />;
      case 'rain': return <CloudRain className="w-4 h-4" />;
      case 'storm': return <ZapIcon className="w-4 h-4" />;
      case 'snow': return <Snowflake className="w-4 h-4" />;
      case 'fog': return <Cloud className="w-4 h-4" />;
      default: return <Sun className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Zap className="w-8 h-8 text-cyan-500" />
          <h1 className="text-3xl font-bold text-cyan-400">GLXY NEXT-GEN GRAPHICS</h1>
          <Badge className="bg-cyan-600">{gameMode.toUpperCase()}</Badge>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setIsRendering(!isRendering)}
            className={isRendering ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            {isRendering ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isRendering ? 'Pause Rendering' : 'Start Rendering'}
          </Button>
          <Button
            onClick={() => setShowPerformancePanel(!showPerformancePanel)}
            variant="outline"
            className="border-cyan-500 text-cyan-400"
          >
            <Activity className="w-4 h-4 mr-2" />
            Performance
          </Button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="bg-gray-900 border-cyan-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-cyan-400 flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>3D Render Viewport</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getQualityColor(graphicsSettings.quality)}>
                    {graphicsSettings.quality.toUpperCase()}
                  </Badge>
                  <Button size="sm" variant="outline" className="border-gray-600">
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={graphicsSettings.resolution.width}
                  height={graphicsSettings.resolution.height}
                  className="w-full border border-gray-700 rounded"
                />

                {/* Overlay Information */}
                <div className="absolute top-4 left-4 space-y-2">
                  <div className="bg-black/60 backdrop-blur-sm rounded px-3 py-2">
                    <div className="text-xs text-gray-400">Map</div>
                    <div className="text-sm font-medium text-white">{mapId}</div>
                  </div>
                  <div className="bg-black/60 backdrop-blur-sm rounded px-3 py-2">
                    <div className="text-xs text-gray-400">Weather</div>
                    <div className="flex items-center space-x-2 text-sm font-medium text-white">
                      {getWeatherIcon(weatherSystem.type)}
                      <span>{weatherSystem.type}</span>
                    </div>
                  </div>
                  <div className="bg-black/60 backdrop-blur-sm rounded px-3 py-2">
                    <div className="text-xs text-gray-400">Time</div>
                    <div className="text-sm font-medium text-white">
                      {Math.floor(weatherSystem.timeOfDay).toString().padStart(2, '0')}:00
                    </div>
                  </div>
                </div>

                {/* Rendering Mode Indicators */}
                <div className="absolute top-4 right-4 space-y-2">
                  {graphicsSettings.rayTracing.enabled && (
                    <Badge className="bg-purple-600">RAY TRACING</Badge>
                  )}
                  {graphicsSettings.globalIllumination === 'lumen' && (
                    <Badge className="bg-blue-600">LUMEN GI</Badge>
                  )}
                  {graphicsSettings.antiAliasing === 'msaa_8x' && (
                    <Badge className="bg-green-600">MSAA 8X</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panels */}
        <div className="space-y-4">
          {/* Quick Settings */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-400 text-sm">Quick Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Quality Preset</label>
                <select
                  value={graphicsSettings.quality}
                  onChange={(e) => updateGraphicsSettings({ quality: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="ultra">Ultra</option>
                  <option value="ray_tracing">Ray Tracing</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400">Resolution</label>
                <select
                  value={`${graphicsSettings.resolution.width}x${graphicsSettings.resolution.height}`}
                  onChange={(e) => {
                    const [width, height] = e.target.value.split('x').map(Number);
                    updateGraphicsSettings({ resolution: { width, height } });
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                >
                  <option value="1280x720">1280x720 (HD)</option>
                  <option value="1920x1080">1920x1080 (FHD)</option>
                  <option value="2560x1440">2560x1440 (QHD)</option>
                  <option value="3840x2160">3840x2160 (4K)</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => setShowGraphicsPanel(true)}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                >
                  <Palette className="w-3 h-3 mr-1" />
                  Graphics
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowWeatherPanel(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Cloud className="w-3 h-3 mr-1" />
                  Weather
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => setShowPhysicsPanel(true)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Box className="w-3 h-3 mr-1" />
                  Physics
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowPerformancePanel(!showPerformancePanel)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Gauge className="w-3 h-3 mr-1" />
                  Stats
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          {showPerformancePanel && (
            <Card className="bg-gray-900 border-green-500">
              <CardHeader>
                <CardTitle className="text-green-400 text-sm flex items-center justify-between">
                  <span>Performance Metrics</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPerformancePanel(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-400">FPS</div>
                    <div className={`font-bold ${performanceMetrics.fps >= 60 ? 'text-green-400' : performanceMetrics.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {performanceMetrics.fps}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Frame Time</div>
                    <div className="font-bold text-white">{performanceMetrics.frameTime.toFixed(1)}ms</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Draw Calls</div>
                    <div className="font-bold text-white">{performanceMetrics.drawCalls}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Triangles</div>
                    <div className="font-bold text-white">{(performanceMetrics.triangles / 1000).toFixed(0)}K</div>
                  </div>
                  <div>
                    <div className="text-gray-400">GPU Memory</div>
                    <div className="font-bold text-white">{performanceMetrics.gpuMemory}MB</div>
                  </div>
                  <div>
                    <div className="text-gray-400">GPU Usage</div>
                    <div className={`font-bold ${performanceMetrics.gpuUtilization > 80 ? 'text-red-400' : 'text-green-400'}`}>
                      {performanceMetrics.gpuUtilization}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">GPU Temp</div>
                    <div className={`font-bold ${performanceMetrics.gpuTemperature > 80 ? 'text-red-400' : performanceMetrics.gpuTemperature > 70 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {performanceMetrics.gpuTemperature}°C
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Render Time</div>
                    <div className="font-bold text-white">{performanceMetrics.renderThreadTime.toFixed(1)}ms</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-700">
                  <h4 className="text-white font-semibold mb-2">Performance Graph</h4>
                  <div className="h-20 bg-gray-800 rounded flex items-end justify-around p-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div
                        key={i}
                        className="w-2 bg-green-500 rounded-t"
                        style={{ height: `${Math.random() * 60 + 20}%` }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Advanced Graphics Settings Modal */}
      {showGraphicsPanel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-cyan-500 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-cyan-400 text-xl">Advanced Graphics Settings</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowGraphicsPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ray Tracing Settings */}
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <span>Ray Tracing</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={graphicsSettings.rayTracing.enabled}
                      onChange={(e) => updateGraphicsSettings({
                        rayTracing: { ...graphicsSettings.rayTracing, enabled: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Enable Ray Tracing</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={graphicsSettings.rayTracing.reflections}
                      onChange={(e) => updateGraphicsSettings({
                        rayTracing: { ...graphicsSettings.rayTracing, reflections: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Ray Traced Reflections</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={graphicsSettings.rayTracing.shadows}
                      onChange={(e) => updateGraphicsSettings({
                        rayTracing: { ...graphicsSettings.rayTracing, shadows: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Ray Traced Shadows</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={graphicsSettings.rayTracing.globalIllumination}
                      onChange={(e) => updateGraphicsSettings({
                        rayTracing: { ...graphicsSettings.rayTracing, globalIllumination: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Ray Traced GI</span>
                  </label>
                </div>
              </div>

              {/* Advanced Rendering */}
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-blue-500" />
                  <span>Advanced Rendering</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Global Illumination</label>
                    <select
                      value={graphicsSettings.globalIllumination}
                      onChange={(e) => updateGraphicsSettings({ globalIllumination: e.target.value as any })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                    >
                      <option value="off">Off</option>
                      <option value="baked">Baked</option>
                      <option value="dynamic">Dynamic</option>
                      <option value="lumen">Lumen</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Ambient Occlusion</label>
                    <select
                      value={graphicsSettings.ambientOcclusion}
                      onChange={(e) => updateGraphicsSettings({ ambientOcclusion: e.target.value as any })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                    >
                      <option value="off">Off</option>
                      <option value="ssao">SSAO</option>
                      <option value="hbao">HBAO+</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Anti-Aliasing</label>
                    <select
                      value={graphicsSettings.antiAliasing}
                      onChange={(e) => updateGraphicsSettings({ antiAliasing: e.target.value as any })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                    >
                      <option value="off">Off</option>
                      <option value="fxaa">FXAA</option>
                      <option value="msaa_2x">MSAA 2X</option>
                      <option value="msaa_4x">MSAA 4X</option>
                      <option value="msaa_8x">MSAA 8X</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Shadow Quality</label>
                    <select
                      value={graphicsSettings.shadowQuality}
                      onChange={(e) => updateGraphicsSettings({ shadowQuality: e.target.value as any })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                    >
                      <option value="off">Off</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="ultra">Ultra</option>
                </select>
                  </div>
                </div>
              </div>

              {/* Post-Processing Effects */}
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-purple-500" />
                  <span>Post-Processing</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={graphicsSettings.motionBlur}
                      onChange={(e) => updateGraphicsSettings({ motionBlur: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Motion Blur</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={graphicsSettings.depthOfField}
                      onChange={(e) => updateGraphicsSettings({ depthOfField: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Depth of Field</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={graphicsSettings.screenSpaceReflections}
                      onChange={(e) => updateGraphicsSettings({ screenSpaceReflections: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">SSR</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowGraphicsPanel(false)}
                  className="border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowGraphicsPanel(false)}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  Apply Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weather Settings Modal */}
      {showWeatherPanel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-blue-500 w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-400 text-xl">Weather & Environment</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowWeatherPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Weather Type</label>
                <select
                  value={weatherSystem.type}
                  onChange={(e) => updateWeather({ type: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="clear">Clear</option>
                  <option value="cloudy">Cloudy</option>
                  <option value="rain">Rain</option>
                  <option value="storm">Storm</option>
                  <option value="snow">Snow</option>
                  <option value="fog">Fog</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Time of Day</label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="0.5"
                    value={weatherSystem.timeOfDay}
                    onChange={(e) => updateWeather({ timeOfDay: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center">
                    {Math.floor(weatherSystem.timeOfDay).toString().padStart(2, '0')}:00
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={weatherSystem.intensity}
                    onChange={(e) => updateWeather({ intensity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center">
                    {(weatherSystem.intensity * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Wind Speed (km/h)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weatherSystem.windSpeed}
                    onChange={(e) => updateWeather({ windSpeed: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center">{weatherSystem.windSpeed} km/h</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Temperature (°C)</label>
                  <input
                    type="range"
                    min="-20"
                    max="50"
                    value={weatherSystem.temperature}
                    onChange={(e) => updateWeather({ temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center">{weatherSystem.temperature}°C</div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowWeatherPanel(false)}
                  className="border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowWeatherPanel(false)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Apply Weather
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Physics Settings Modal */}
      {showPhysicsPanel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-purple-500 w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-purple-400 text-xl">Physics Settings</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowPhysicsPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Gravity</label>
                  <input
                    type="range"
                    min="-20"
                    max="0"
                    step="0.1"
                    value={physicsSettings.gravity}
                    onChange={(e) => setPhysicsSettings(prev => ({ ...prev, gravity: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center">{physicsSettings.gravity} m/s²</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Air Resistance</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={physicsSettings.airResistance}
                    onChange={(e) => setPhysicsSettings(prev => ({ ...prev, airResistance: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center">{physicsSettings.airResistance}</div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={physicsSettings.destruction}
                    onChange={(e) => setPhysicsSettings(prev => ({ ...prev, destruction: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">Destructible Environment</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={physicsSettings.fluidSimulation}
                    onChange={(e) => setPhysicsSettings(prev => ({ ...prev, fluidSimulation: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">Fluid Simulation</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={physicsSettings.clothSimulation}
                    onChange={(e) => setPhysicsSettings(prev => ({ ...prev, clothSimulation: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">Cloth Simulation</span>
                </label>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPhysicsPanel(false)}
                  className="border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowPhysicsPanel(false)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
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
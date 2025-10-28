// @ts-nocheck
import * as THREE from 'three';
import { RealisticMilitaryOperator, MilitaryOperatorFactory, OperatorConfig } from './realistic-military-models';

/**
 * Military Model Rendering System
 *
 * Advanced rendering system for realistic military operator models with:
 * - Physically-based lighting setup
 * - Environment mapping and reflections
 * - Post-processing effects
 * - Performance optimization
 * - Cinematic camera controls
 */

export interface MilitarySceneConfig {
  environment: 'urban' | 'forest' | 'desert' | 'indoor' | 'training';
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  weather: 'clear' | 'overcast' | 'rain' | 'fog';
  cameraMode: 'cinematic' | 'gameplay' | 'inspection' | 'screenshot';
}

export class MilitaryRenderingSystem {
  public scene: THREE.Scene = {} as THREE.Scene;
  public camera: THREE.PerspectiveCamera = {} as THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer = {} as THREE.WebGLRenderer;
  public controls: any = {}; // Will be OrbitControls or similar

  // Lighting components
  public lights = {
    ambient: {} as THREE.AmbientLight,
    directional: {} as THREE.DirectionalLight,
    point: [] as THREE.PointLight[],
    spot: [] as THREE.SpotLight[],
    hemisphere: {} as THREE.HemisphereLight,
  };

  // Environment components
  public environment = {
    skybox: {} as THREE.Mesh,
    ground: {} as THREE.Mesh,
    fog: {} as THREE.Fog | THREE.FogExp2,
  };

  // Post-processing
  public postProcessing = {
    composer: {} as any,
    bloomPass: {} as any,
    aoPass: {} as any,
    ssrPass: {} as any,
    outlinePass: {} as any,
  };

  // Performance monitoring
  public performance = {
    frameRate: 0,
    drawCalls: 0,
    triangles: 0,
    lastUpdate: 0,
  };

  // Model instances
  public operators: Map<string, RealisticMilitaryOperator> = new Map();

  constructor(container: HTMLElement, config: MilitarySceneConfig) {
    this.initializeScene();
    this.initializeRenderer(container);
    this.initializeCamera(config.cameraMode);
    this.initializeLighting(config);
    this.initializeEnvironment(config);
    this.initializePostProcessing();
    this.initializeControls(config.cameraMode);

    this.operators = new Map();
    this.performance = {
      frameRate: 0,
      drawCalls: 0,
      triangles: 0,
      lastUpdate: Date.now()
    };

    this.startRenderLoop();
  }

  private initializeScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue default

    // Set up shadow map
    this.scene.fog = new THREE.Fog(0x87ceeb, 10, 100);
  }

  private initializeRenderer(container: HTMLElement): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Advanced rendering settings
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Enable advanced features
    this.renderer.xr.enabled = false; // Can be enabled for VR
    this.renderer.sortObjects = true;
    this.renderer.autoClear = true;

    container.appendChild(this.renderer.domElement);
  }

  private initializeCamera(mode: string): void {
    const aspect = window.innerWidth / window.innerHeight;

    switch (mode) {
      case 'cinematic':
        this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 1000);
        break;
      case 'gameplay':
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 200);
        break;
      case 'inspection':
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.01, 50);
        break;
      case 'screenshot':
        this.camera = new THREE.PerspectiveCamera(85, aspect, 0.01, 100);
        break;
      default:
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 200);
    }

    // Position camera for initial view
    this.camera.position.set(5, 3, 5);
    this.camera.lookAt(0, 1, 0);
  }

  private initializeLighting(config: MilitarySceneConfig): void {
    this.lights = {
      ambient: new THREE.AmbientLight(0x404040, 0.3),
      directional: new THREE.DirectionalLight(0xffffff, 1.0),
      point: [],
      spot: [],
      hemisphere: new THREE.HemisphereLight(0x87ceeb, 0x2d4a2b, 0.5)
    };

    this.setupDayNightCycle(config.timeOfDay);
    this.setupWeatherLighting(config.weather);
    this.setupEnvironmentLighting(config.environment);

    // Add lights to scene
    this.scene.add(this.lights.ambient);
    this.scene.add(this.lights.directional);
    this.scene.add(this.lights.hemisphere);

    // Configure directional light for shadows
    this.lights.directional.castShadow = true;
    this.lights.directional.shadow.mapSize.width = 2048;
    this.lights.directional.shadow.mapSize.height = 2048;
    this.lights.directional.shadow.camera.near = 0.5;
    this.lights.directional.shadow.camera.far = 50;
    this.lights.directional.shadow.camera.left = -20;
    this.lights.directional.shadow.camera.right = 20;
    this.lights.directional.shadow.camera.top = 20;
    this.lights.directional.shadow.camera.bottom = -20;
  }

  private setupDayNightCycle(timeOfDay: string): void {
    switch (timeOfDay) {
      case 'dawn':
        this.lights.directional.color.setHex(0xffaa33);
        this.lights.directional.intensity = 0.6;
        this.lights.ambient.intensity = 0.2;
        this.lights.hemisphere.color.setHex(0xff9966);
        this.lights.hemisphere.groundColor.setHex(0x334455);
        this.lights.hemisphere.intensity = 0.4;
        this.scene.fog = new THREE.Fog(0xff9966, 5, 80);
        break;

      case 'day':
        this.lights.directional.color.setHex(0xffffff);
        this.lights.directional.intensity = 1.0;
        this.lights.ambient.intensity = 0.3;
        this.lights.hemisphere.color.setHex(0x87ceeb);
        this.lights.hemisphere.groundColor.setHex(0x2d4a2b);
        this.lights.hemisphere.intensity = 0.5;
        this.scene.fog = new THREE.Fog(0x87ceeb, 10, 100);
        break;

      case 'dusk':
        this.lights.directional.color.setHex(0xff6633);
        this.lights.directional.intensity = 0.5;
        this.lights.ambient.intensity = 0.15;
        this.lights.hemisphere.color.setHex(0xff6666);
        this.lights.hemisphere.groundColor.setHex(0x332233);
        this.lights.hemisphere.intensity = 0.3;
        this.scene.fog = new THREE.Fog(0xff6666, 3, 60);
        break;

      case 'night':
        this.lights.directional.color.setHex(0x4444ff);
        this.lights.directional.intensity = 0.1;
        this.lights.ambient.intensity = 0.05;
        this.lights.hemisphere.color.setHex(0x112244);
        this.lights.hemisphere.groundColor.setHex(0x111122);
        this.lights.hemisphere.intensity = 0.1;
        this.scene.fog = new THREE.Fog(0x112244, 2, 40);
        break;
    }

    // Update scene background
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.background = new THREE.Color(this.scene.fog.color);
    }
  }

  private setupWeatherLighting(weather: string): void {
    switch (weather) {
      case 'clear':
        // Clear weather - default lighting
        break;

      case 'overcast':
        this.lights.directional.intensity *= 0.5;
        this.lights.ambient.intensity *= 1.5;
        this.lights.hemisphere.intensity *= 0.8;
        break;

      case 'rain':
        this.lights.directional.intensity *= 0.3;
        this.lights.ambient.intensity *= 1.2;
        this.lights.hemisphere.color.setHex(0x666688);
        break;

      case 'fog':
        this.lights.directional.intensity *= 0.4;
        this.lights.ambient.intensity *= 1.8;
        if (this.scene.fog instanceof THREE.Fog) {
          this.scene.fog.near = 1;
          this.scene.fog.far = 20;
        }
        break;
    }
  }

  private setupEnvironmentLighting(environment: string): void {
    switch (environment) {
      case 'urban':
        // Add street lights and building reflections
        const streetLight = new THREE.PointLight(0xffaa44, 0.5, 10);
        streetLight.position.set(5, 4, 5);
        streetLight.castShadow = true;
        this.lights.point.push(streetLight);
        this.scene.add(streetLight);
        break;

      case 'forest':
        // Dappled lighting through trees
        this.lights.directional.intensity *= 0.7;
        this.lights.hemisphere.color.setHex(0x88cc44);
        this.lights.hemisphere.groundColor.setHex(0x1a2a1a);
        break;

      case 'desert':
        // Harsh, bright light
        this.lights.directional.intensity *= 1.3;
        this.lights.directional.color.setHex(0xffffcc);
        this.lights.ambient.intensity *= 1.2;
        break;

      case 'indoor':
        // Artificial lighting
        this.lights.directional.intensity = 0;
        this.lights.ambient.intensity = 0.4;

        // Add ceiling lights
        const ceilingLight = new THREE.PointLight(0xffffff, 0.8, 15);
        ceilingLight.position.set(0, 8, 0);
        this.lights.point.push(ceilingLight);
        this.scene.add(ceilingLight);
        break;

      case 'training':
        // Bright, even lighting
        this.lights.directional.intensity = 1.2;
        this.lights.ambient.intensity = 0.6;
        this.lights.hemisphere.intensity = 0.7;
        break;
    }
  }

  private initializeEnvironment(config: MilitarySceneConfig): void {
    this.environment = {
      skybox: this.createSkybox(config) || {} as THREE.Mesh,
      ground: this.createGround(config) || {} as THREE.Mesh,
      fog: this.scene.fog || new THREE.Fog(0x87ceeb, 10, 100)
    };

    this.scene.add(this.environment.ground);
    if (this.environment.skybox) {
      this.scene.add(this.environment.skybox);
    }
  }

  private createSkybox(config: MilitarySceneConfig): THREE.Mesh | null {
    // Create a simple sky sphere
    const skyGeometry = new THREE.SphereGeometry(200, 32, 16);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: this.getSkyColor(config.timeOfDay, config.weather),
      side: THREE.BackSide,
      fog: false
    });

    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    return sky;
  }

  private createGround(config: MilitarySceneConfig): THREE.Mesh {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: this.getGroundColor(config.environment),
      roughness: 0.8,
      metalness: 0.1,
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;

    return ground;
  }

  private getSkyColor(timeOfDay: string, weather: string): number {
    const timeColors = {
      dawn: 0xff9966,
      day: 0x87ceeb,
      dusk: 0xff6666,
      night: 0x112244
    };

    const weatherModifications = {
      clear: 1.0,
      overcast: 0.8,
      rain: 0.6,
      fog: 0.7
    };

    return timeColors[timeOfDay as keyof typeof timeColors];
  }

  private getGroundColor(environment: string): number {
    const colors = {
      urban: 0x444444,
      forest: 0x2d4a2b,
      desert: 0xc4a57b,
      indoor: 0x666666,
      training: 0x555555
    };

    return colors[environment as keyof typeof colors];
  }

  private initializePostProcessing(): void {
    // Note: This would require post-processing libraries
    // For now, we'll set up the structure
    this.postProcessing = {
      composer: null,
      bloomPass: null,
      aoPass: null,
      ssrPass: null,
      outlinePass: null
    };
  }

  private initializeControls(mode: string): void {
    // This would integrate with OrbitControls or similar
    // For now, we'll implement basic mouse controls
    this.setupBasicControls();
  }

  private setupBasicControls(): void {
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX - windowHalfX;
      mouseY = event.clientY - windowHalfY;
      targetRotationY = targetRotationY + (mouseX * 0.0002);
      targetRotationX = targetRotationX + (mouseY * 0.0002);
    };

    const handleMouseWheel = (event: WheelEvent) => {
      const scale = event.deltaY > 0 ? 1.1 : 0.9;
      this.camera.position.multiplyScalar(scale);

      // Limit camera distance
      const distance = this.camera.position.length();
      if (distance < 2) {
        this.camera.position.normalize().multiplyScalar(2);
      } else if (distance > 20) {
        this.camera.position.normalize().multiplyScalar(20);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleMouseWheel);

    // Animation for camera movement
    const animateCamera = () => {
      // Smooth camera rotation
      this.camera.position.x = Math.cos(targetRotationY) * Math.cos(targetRotationX) * 8;
      this.camera.position.y = Math.sin(targetRotationX) * 8 + 3;
      this.camera.position.z = Math.sin(targetRotationY) * Math.cos(targetRotationX) * 8;
      this.camera.lookAt(0, 1, 0);
    };

    // Store animation function for render loop
    this.animateCamera = animateCamera;
  }

  private animateCamera: (() => void) | null = null;

  private startRenderLoop(): void {
    const render = () => {
      requestAnimationFrame(render);

      // Update camera controls
      if (this.animateCamera) {
        this.animateCamera();
      }

      // Update operator animations
      this.updateOperatorAnimations();

      // Update performance metrics
      this.updatePerformanceMetrics();

      // Render the scene
      this.renderer.render(this.scene, this.camera);
    };

    render();
  }

  private updateOperatorAnimations(): void {
    this.operators.forEach(operator => {
      // Subtle breathing animation
      const breathAmount = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
      operator.setBlendShape('breath', breathAmount * 0.3);

      // Occasional blink
      if (Math.random() < 0.002) {
        operator.setBlendShape('blinkLeft', 1);
        operator.setBlendShape('blinkRight', 1);

        setTimeout(() => {
          operator.setBlendShape('blinkLeft', 0);
          operator.setBlendShape('blinkRight', 0);
        }, 150);
      }
    });
  }

  private updatePerformanceMetrics(): void {
    const now = Date.now();
    const delta = now - this.performance.lastUpdate;

    if (delta >= 1000) {
      this.performance.frameRate = Math.round(1000 / (delta / this.renderer.info.render.frame));
      this.performance.drawCalls = this.renderer.info.render.calls;
      this.performance.triangles = this.renderer.info.render.triangles;
      this.performance.lastUpdate = now;
    }
  }

  // Public API methods
  public addOperator(id: string, operator: RealisticMilitaryOperator, position?: THREE.Vector3): void {
    this.operators.set(id, operator);

    if (position) {
      operator.group.position.copy(position);
    }

    // Enable shadows for all meshes
    operator.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.scene.add(operator.group);
  }

  public removeOperator(id: string): void {
    const operator = this.operators.get(id);
    if (operator) {
      this.scene.remove(operator.group);
      operator.dispose();
      this.operators.delete(id);
    }
  }

  public createSquad(config: {
    team: 'alpha' | 'bravo';
    formation: 'line' | 'v' | 'wedge' | 'circle';
    spacing: number;
  }): string[] {
    const squad = MilitaryOperatorFactory.createFirearm(config.team);
    const operatorIds: string[] = [];

    squad.forEach((operator, index) => {
      const id = `${config.team}-operator-${index}`;
      const position = this.calculateFormationPosition(index, squad.length, config.formation, config.spacing);

      this.addOperator(id, operator, position);
      operatorIds.push(id);
    });

    return operatorIds;
  }

  private calculateFormationPosition(index: number, total: number, formation: string, spacing: number): THREE.Vector3 {
    const position = new THREE.Vector3();

    switch (formation) {
      case 'line':
        position.x = (index - Math.floor(total / 2)) * spacing;
        position.z = 0;
        break;

      case 'v':
        if (index === 0) {
          position.set(0, 0, spacing);
        } else {
          const angle = (Math.PI / 4) * (index % 2 === 0 ? 1 : -1);
          position.x = Math.sin(angle) * spacing * Math.ceil(index / 2);
          position.z = Math.cos(angle) * spacing * Math.ceil(index / 2);
        }
        break;

      case 'wedge':
        if (index === 0) {
          position.set(0, 0, spacing * 2);
        } else {
          const row = Math.floor((index - 1) / 2) + 1;
          const side = (index - 1) % 2 === 0 ? -1 : 1;
          position.x = side * row * spacing * 0.5;
          position.z = spacing * (2 - row * 0.5);
        }
        break;

      case 'circle':
        const angle = (index / total) * Math.PI * 2;
        position.x = Math.cos(angle) * spacing;
        position.z = Math.sin(angle) * spacing;
        break;
    }

    position.y = 0; // Keep on ground level
    return position;
  }

  public focusOnOperator(operatorId: string): void {
    const operator = this.operators.get(operatorId);
    if (operator) {
      const position = operator.group.position;

      // Smooth camera transition
      const targetPosition = new THREE.Vector3(
        position.x + 2,
        position.y + 1.5,
        position.z + 2
      );

      // Animate camera to new position
      const animateCameraFocus = () => {
        this.camera.position.lerp(targetPosition, 0.1);
        this.camera.lookAt(position);

        if (this.camera.position.distanceTo(targetPosition) > 0.01) {
          requestAnimationFrame(animateCameraFocus);
        }
      };

      animateCameraFocus();
    }
  }

  public setEnvironment(config: MilitarySceneConfig): void {
    // Update lighting
    this.setupDayNightCycle(config.timeOfDay);
    this.setupWeatherLighting(config.weather);
    this.setupEnvironmentLighting(config.environment);

    // Update environment objects
    if (this.environment.ground) {
      this.environment.ground.material = new THREE.MeshStandardMaterial({
        color: this.getGroundColor(config.environment),
        roughness: 0.8,
        metalness: 0.1,
      });
    }

    if (this.environment.skybox) {
      (this.environment.skybox.material as THREE.MeshBasicMaterial).color =
        new THREE.Color(this.getSkyColor(config.timeOfDay, config.weather));
    }
  }

  public takeScreenshot(filename?: string): string {
    // Render the current frame
    this.renderer.render(this.scene, this.camera);

    // Create canvas and get image data
    const canvas = this.renderer.domElement;
    const dataURL = canvas.toDataURL('image/png');

    // Optional download
    if (filename) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataURL;
      link.click();
    }

    return dataURL;
  }

  public getPerformanceMetrics(): any {
    return {
      ...this.performance,
      memory: {
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures
      },
      render: this.renderer.info.render
    };
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    // Dispose of all operators
    this.operators.forEach(operator => operator.dispose());
    this.operators.clear();

    // Dispose of scene objects
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });

    // Dispose of renderer
    this.renderer.dispose();

    // Remove event listeners
    if (this.handleMouseMove) {
      window.removeEventListener('mousemove', this.handleMouseMove);
    }
    if (this.handleMouseWheel) {
      window.removeEventListener('wheel', this.handleMouseWheel);
    }
  }

  private handleMouseMove: ((event: MouseEvent) => void) | null = null;
  private handleMouseWheel: ((event: WheelEvent) => void) | null = null;
}

// Factory function for easy scene creation
export function createMilitaryScene(
  container: HTMLElement,
  config: Partial<MilitarySceneConfig> = {}
): MilitaryRenderingSystem {
  const defaultConfig: MilitarySceneConfig = {
    environment: 'training',
    timeOfDay: 'day',
    weather: 'clear',
    cameraMode: 'inspection'
  };

  const finalConfig = { ...defaultConfig, ...config };
  return new MilitaryRenderingSystem(container, finalConfig);
}
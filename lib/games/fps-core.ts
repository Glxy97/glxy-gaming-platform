/**
 * 🎮 FPS Core Game Engine
 * ✅ TypeScript-sauber (ohne @ts-nocheck)
 */
import * as THREE from 'three';
import { FPSEnhancedAI } from './fps-enhanced-ai';

export interface PlayerState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  health: number;
  armor: number;
  isAlive: boolean;
  isAiming: boolean;
  isReloading: boolean;
  currentWeapon: string;
  ammo: number;
  score: number;
  kills: number;
  deaths: number;
  isJumping: boolean;
  jumpVelocity: number;
  isGrounded: boolean;
  isCrouching: boolean;
  isSliding: boolean;
  slideVelocity: number;
}

export interface WeaponState {
  name: string;
  damage: number;
  fireRate: number;
  magazineSize: number;
  currentAmmo: number;
  reserveAmmo: number;
  reloadTime: number;
  accuracy: number;
  recoil: number;
  range: number;
  isAutomatic: boolean;
  lastFireTime: number;
}

export interface GameState {
  players: Map<string, PlayerState>;
  gameMode: '1vs1' | '2vs2';
  roundTime: number;
  maxRoundTime: number;
  team1Score: number;
  team2Score: number;
  isGameActive: boolean;
  currentRound: number;
  maxRounds: number;
}

export class FPSCore {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera = {} as THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer = {} as THREE.WebGLRenderer;
  private clock: THREE.Clock = {} as THREE.Clock;
  private gameState: GameState = {} as GameState;
  private localPlayer: PlayerState = {} as PlayerState;
  private weapons: Map<string, WeaponState> = new Map();
  private keys: Set<string> = new Set();
  private mouse: { x: number; y: number } = { x: 0, y: 0 };
  private isPointerLocked = false;
  private container: HTMLElement = {} as HTMLElement;
  private crosshair: HTMLElement = {} as HTMLElement;
  private collidableObjects: THREE.Object3D[] = [];
  private aiSystem?: FPSEnhancedAI;
  
  // Reusable raycasters for performance
  private movementRaycaster: THREE.Raycaster;
  private slideRaycaster: THREE.Raycaster;
  private checkRaycaster: THREE.Raycaster;
  
  // Physics constants
  private readonly JUMP_FORCE = 12;
  private readonly GRAVITY = -25;
  private readonly GROUND_CHECK_DISTANCE = 0.1;
  
  // Movement constants
  private readonly CROUCH_SPEED_MULTIPLIER = 0.6; // Crouch-Geschwindigkeit: 0.78
  private readonly SLIDE_SPEED_MULTIPLIER = 1.38; // Slide-Geschwindigkeit: 1.8
  private readonly CROUCH_HEIGHT = 0.9;
  private readonly STAND_HEIGHT = 1.8;
  private readonly SLIDE_DURATION = 800; // milliseconds
  
  // Aiming constants
  private readonly DEFAULT_FOV = 75;
  private readonly AIM_FOV = 45;
  private readonly AIM_TRANSITION_SPEED = 10;
  private readonly AIM_ACCURACY_MULTIPLIER = 0.5;
  
  // Event handler methods

  constructor(container: HTMLElement) {
    console.log('FPSCore constructor called with container:', container);
    
    if (!container) {
      throw new Error('Container element is required');
    }
    
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.clock = new THREE.Clock();
    
    // Initialize reusable raycasters
    this.movementRaycaster = new THREE.Raycaster();
    this.slideRaycaster = new THREE.Raycaster();
    this.checkRaycaster = new THREE.Raycaster();
    
    // Physics constants
    this.JUMP_FORCE = 12;
    this.GRAVITY = -25;
    this.GROUND_CHECK_DISTANCE = 0.1;
    
    // Set initial camera position
    this.camera.position.set(0, 1.8, 5);
    this.camera.lookAt(0, 1.8, 0);
    
    console.log('FPSCore basic setup completed');
    
    this.initializeGame();
    console.log('Game initialized');
    
    this.setupScene();
    console.log('Scene setup completed');
    
    this.setupEventListeners();
    console.log('Event listeners setup completed');
    
    this.createCrosshair();
    console.log('Crosshair created');
    
    this.animate();
    console.log('Animation started');
    
    console.log('FPSCore constructor completed successfully');
  }

  private initializeGame(): void {
    // Initialize game state
    this.gameState = {
      players: new Map(),
      gameMode: '1vs1',
      roundTime: 0,
      maxRoundTime: 120000, // 2 minutes
      team1Score: 0,
      team2Score: 0,
      isGameActive: true,
      currentRound: 1,
      maxRounds: 5
    };

    // Initialize local player
    this.localPlayer = {
      position: new THREE.Vector3(0, 1.8, 0),
      rotation: new THREE.Euler(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      health: 100,
      armor: 0,
      isAlive: true,
      isAiming: false,
      isReloading: false,
      currentWeapon: 'rifle',
      ammo: 30,
      score: 0,
      kills: 0,
      deaths: 0,
      isJumping: false,
      jumpVelocity: 0,
      isGrounded: true,
      isCrouching: false,
      isSliding: false,
      slideVelocity: 0
    };

    // Initialize weapons
    this.weapons = new Map([
      ['rifle', {
        name: 'Assault Rifle',
        damage: 25,
        fireRate: 120, // RPM
        magazineSize: 30,
        currentAmmo: 30,
        reserveAmmo: 90,
        reloadTime: 2000,
        accuracy: 0.85,
        recoil: 0.1,
        range: 100,
        isAutomatic: true,
        lastFireTime: 0
      }],
      ['pistol', {
        name: 'Pistol',
        damage: 35,
        fireRate: 300,
        magazineSize: 12,
        currentAmmo: 12,
        reserveAmmo: 36,
        reloadTime: 1500,
        accuracy: 0.95,
        recoil: 0.05,
        range: 50,
        isAutomatic: false,
        lastFireTime: 0
      }]
    ]);

    this.gameState.players.set('local', this.localPlayer);
    
    // Set camera to player position
    this.camera.position.copy(this.localPlayer.position);
    this.camera.rotation.copy(this.localPlayer.rotation);
  }

  private setupScene(): void {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x87CEEB); // Sky blue background
    this.container.appendChild(this.renderer.domElement);

    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    this.scene.add(directionalLight);

    // Add hemisphere light for better ambient lighting
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x543E32, 0.6);
    this.scene.add(hemiLight);

    // Create simple map
    this.createMap();
  }

  private createMap(): void {
    // Ground with better texture
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c4a });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData.isCollidable = true;
    this.scene.add(ground);
    this.collidableObjects.push(ground);

    // Add grid helper for better spatial awareness
    const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x444444);
    this.scene.add(gridHelper);

    // Create village with houses
    this.createVillage();
    
    // Create walls around the map
    this.createWalls();
    
    // Create spawn points
    this.createSpawnPoints();
    
    // Add some decorative elements
    this.createDecorations();
    
    // Create additional cover objects
    this.createAdditionalCoverGraphics();
    
    // Create cover objects
    this.createCoverObjects();
    
    // Auto-detect and add any remaining mesh objects as collidable
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && !child.userData.isCollidable && child !== ground) {
        // Exclude small objects and decorations from collision
        const bbox = new THREE.Box3().setFromObject(child);
        const size = bbox.getSize(new THREE.Vector3());

        // Only add objects that are large enough to be obstacles
        if (size.x > 0.3 || size.y > 0.3 || size.z > 0.3) {
          child.userData.isCollidable = true;
          this.collidableObjects.push(child);
        }
      }
    });

    console.log(`Total collidable objects: ${this.collidableObjects.length}`);

    // Initialize AI system
    this.initializeAI();
  }

  private createWalls(): void {
    const wallHeight = 10;
    const wallThickness = 1;
    const mapSize = 50;
    
    // Wall material
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    
    // Create four walls
    const walls = [
      { pos: [0, wallHeight/2, mapSize], size: [mapSize * 2, wallHeight, wallThickness] }, // North
      { pos: [0, wallHeight/2, -mapSize], size: [mapSize * 2, wallHeight, wallThickness] }, // South
      { pos: [mapSize, wallHeight/2, 0], size: [wallThickness, wallHeight, mapSize * 2] }, // East
      { pos: [-mapSize, wallHeight/2, 0], size: [wallThickness, wallHeight, mapSize * 2] }  // West
    ];
    
    walls.forEach(wall => {
      const geometry = new THREE.BoxGeometry(wall.size[0]!, wall.size[1]!, wall.size[2]!);
      const mesh = new THREE.Mesh(geometry, wallMaterial);
      // Type-safe: Array-Elemente sind garantiert vorhanden
      mesh.position.set(wall.pos[0]!, wall.pos[1]!, wall.pos[2]!);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.isCollidable = true;
      this.scene.add(mesh);
      this.collidableObjects.push(mesh);
    });
  }

  private createVillage(): void {
    // Create multiple houses in a village layout
    this.createHouse(-20, 0, 8, 6, 0x8B4513, 0xD2691E); // Large house
    this.createHouse(20, 0, 6, 6, 0xA0522D, 0xCD853F);  // Medium house
    this.createHouse(0, -20, 10, 8, 0x8B4513, 0xDEB887); // Large house
    this.createHouse(-15, 20, 6, 5, 0xA0522D, 0xF4A460);  // Small house
    this.createHouse(15, 20, 7, 6, 0x8B4513, 0xD2691E);  // Medium house
    
    // Create a central building (town hall)
    this.createTownHall(0, 0, 12, 10);
    
    // Create some smaller shacks
    this.createShack(-30, -10, 4, 4);
    this.createShack(30, 10, 4, 4);
    this.createShack(-10, 30, 3, 3);
    this.createShack(10, -30, 3, 3);
    
    // Create walls and fences between houses
    this.createFences();
    
    // Create some rubble and debris for additional cover
    this.createRubble();
  }

  private createHouse(x: number, z: number, width: number, depth: number, wallColor: number, roofColor: number): void {
    const houseGroup = new THREE.Group();
    
    // House foundation
    const foundationGeometry = new THREE.BoxGeometry(width, 0.5, depth);
    const foundationMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
    foundation.position.set(0, 0.25, 0);
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    foundation.userData.isCollidable = true;
    houseGroup.add(foundation);
    
    // House walls
    const wallHeight = 4;
    const wallThickness = 0.3;
    
    // Front wall (with door)
    const frontWallGeometry = new THREE.BoxGeometry(width, wallHeight, wallThickness);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: wallColor });
    const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    frontWall.position.set(0, wallHeight/2 + 0.5, depth/2 - wallThickness/2);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    frontWall.userData.isCollidable = true;
    houseGroup.add(frontWall);
    
    // Back wall
    const backWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    backWall.position.set(0, wallHeight/2 + 0.5, -depth/2 + wallThickness/2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    backWall.userData.isCollidable = true;
    houseGroup.add(backWall);
    
    // Left wall
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, depth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-width/2 + wallThickness/2, wallHeight/2 + 0.5, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    leftWall.userData.isCollidable = true;
    houseGroup.add(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(width/2 - wallThickness/2, wallHeight/2 + 0.5, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    rightWall.userData.isCollidable = true;
    houseGroup.add(rightWall);
    
    // Create door opening in front wall
    const doorWidth = 1.5;
    const doorHeight = 2;
    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, wallThickness * 2);
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, doorHeight/2 + 0.5, depth/2);
    houseGroup.add(door);
    
    // Create windows
    this.createWindows(houseGroup, width, wallHeight, depth, wallThickness);
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(Math.max(width, depth) * 0.8, 2, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: roofColor });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, wallHeight + 1.5, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.receiveShadow = true;
    roof.userData.isCollidable = true;
    houseGroup.add(roof);
    
    // Interior furniture for cover
    this.createInteriorFurniture(houseGroup, width, depth);
    
    // Position the house
    houseGroup.position.set(x, 0, z);
    this.scene.add(houseGroup);
    
    // Add all collidable objects from the house group
    houseGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.isCollidable) {
        this.collidableObjects.push(child);
      }
    });
  }

  private createWindows(houseGroup: THREE.Group, width: number, wallHeight: number, depth: number, wallThickness: number): void {
    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.7 });
    
    // Front windows
    const frontWindowGeometry = new THREE.BoxGeometry(1, 1.2, wallThickness * 2);
    const leftFrontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    leftFrontWindow.position.set(-width/4, wallHeight/2 + 0.5, depth/2);
    houseGroup.add(leftFrontWindow);
    
    const rightFrontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    rightFrontWindow.position.set(width/4, wallHeight/2 + 0.5, depth/2);
    houseGroup.add(rightFrontWindow);
    
    // Back windows
    const leftBackWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    leftBackWindow.position.set(-width/4, wallHeight/2 + 0.5, -depth/2);
    houseGroup.add(leftBackWindow);
    
    const rightBackWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    rightBackWindow.position.set(width/4, wallHeight/2 + 0.5, -depth/2);
    houseGroup.add(rightBackWindow);
    
    // Side windows
    const sideWindowGeometry = new THREE.BoxGeometry(wallThickness * 2, 1.2, 1);
    const leftSideWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftSideWindow.position.set(-width/2, wallHeight/2 + 0.5, -depth/4);
    houseGroup.add(leftSideWindow);
    
    const rightSideWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightSideWindow.position.set(width/2, wallHeight/2 + 0.5, depth/4);
    houseGroup.add(rightSideWindow);
  }

  private createInteriorFurniture(houseGroup: THREE.Group, width: number, depth: number): void {
    // Table for cover
    const tableGeometry = new THREE.BoxGeometry(2, 1, 1);
    const tableMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(0, 1, 0);
    table.castShadow = true;
    table.receiveShadow = true;
    table.userData.isCollidable = true;
    houseGroup.add(table);
    
    // Chairs for additional cover
    const chairGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
    const chairMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    
    const chair1 = new THREE.Mesh(chairGeometry, chairMaterial);
    chair1.position.set(-1, 0.5, 0.5);
    chair1.castShadow = true;
    chair1.receiveShadow = true;
    chair1.userData.isCollidable = true;
    houseGroup.add(chair1);
    
    const chair2 = new THREE.Mesh(chairGeometry, chairMaterial);
    chair2.position.set(1, 0.5, 0.5);
    chair2.castShadow = true;
    chair2.receiveShadow = true;
    chair2.userData.isCollidable = true;
    houseGroup.add(chair2);
    
    // Cabinet/wardrobe for cover
    const cabinetGeometry = new THREE.BoxGeometry(1, 2, 0.5);
    const cabinetMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
    cabinet.position.set(width/3, 1.5, -depth/3);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    cabinet.userData.isCollidable = true;
    houseGroup.add(cabinet);
    
    // Bed for larger houses
    if (width > 6) {
      const bedGeometry = new THREE.BoxGeometry(2, 0.5, 1.5);
      const bedMaterial = new THREE.MeshLambertMaterial({ color: 0x4682B4 });
      const bed = new THREE.Mesh(bedGeometry, bedMaterial);
      bed.position.set(-width/3, 0.75, depth/3);
      bed.castShadow = true;
      bed.receiveShadow = true;
      bed.userData.isCollidable = true;
      houseGroup.add(bed);
    }
  }

  private createTownHall(x: number, z: number, width: number, depth: number): void {
    const hallGroup = new THREE.Group();
    
    // Larger foundation
    const foundationGeometry = new THREE.BoxGeometry(width, 0.8, depth);
    const foundationMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
    foundation.position.set(0, 0.4, 0);
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    foundation.userData.isCollidable = true;
    hallGroup.add(foundation);
    
    // Tall walls
    const wallHeight = 6;
    const wallThickness = 0.4;
    
    // Main walls
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    // Front wall with large entrance
    const frontWallGeometry = new THREE.BoxGeometry(width, wallHeight, wallThickness);
    const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    frontWall.position.set(0, wallHeight/2 + 0.8, depth/2 - wallThickness/2);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    frontWall.userData.isCollidable = true;
    hallGroup.add(frontWall);
    
    // Back wall
    const backWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    backWall.position.set(0, wallHeight/2 + 0.8, -depth/2 + wallThickness/2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    backWall.userData.isCollidable = true;
    hallGroup.add(backWall);
    
    // Side walls
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, depth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-width/2 + wallThickness/2, wallHeight/2 + 0.8, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    leftWall.userData.isCollidable = true;
    hallGroup.add(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(width/2 - wallThickness/2, wallHeight/2 + 0.8, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    rightWall.userData.isCollidable = true;
    hallGroup.add(rightWall);
    
    // Large entrance
    const entranceWidth = 3;
    const entranceHeight = 4;
    const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, wallThickness * 2);
    const entranceMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(0, entranceHeight/2 + 0.8, depth/2);
    hallGroup.add(entrance);
    
    // Large windows
    this.createTownHallWindows(hallGroup, width, wallHeight, depth, wallThickness);
    
    // Tower/roof structure
    const towerGeometry = new THREE.CylinderGeometry(width * 0.3, width * 0.4, 3, 8);
    const towerMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(0, wallHeight + 2.3, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    tower.userData.isCollidable = true;
    hallGroup.add(tower);
    
    // Interior columns for cover
    this.createTownHallInterior(hallGroup, width, depth);
    
    hallGroup.position.set(x, 0, z);
    this.scene.add(hallGroup);
    
    // Add all collidable objects from the town hall group
    hallGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.isCollidable) {
        this.collidableObjects.push(child);
      }
    });
  }

  private createTownHallWindows(houseGroup: THREE.Group, width: number, wallHeight: number, depth: number, wallThickness: number): void {
    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.7 });
    
    // Large front windows
    const frontWindowGeometry = new THREE.BoxGeometry(2, 2.5, wallThickness * 2);
    const leftFrontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    leftFrontWindow.position.set(-width/3, wallHeight/2 + 0.8, depth/2);
    houseGroup.add(leftFrontWindow);
    
    const rightFrontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    rightFrontWindow.position.set(width/3, wallHeight/2 + 0.8, depth/2);
    houseGroup.add(rightFrontWindow);
  }

  private createTownHallInterior(hallGroup: THREE.Group, width: number, depth: number): void {
    // Large central table
    const tableGeometry = new THREE.BoxGeometry(4, 1, 2);
    const tableMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(0, 1, 0);
    table.castShadow = true;
    table.receiveShadow = true;
    hallGroup.add(table);
    
    // Support columns
    const columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
    const columnMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    const positions = [
      [-width/3, 2, -depth/3],
      [width/3, 2, -depth/3],
      [-width/3, 2, depth/3],
      [width/3, 2, depth/3]
    ];
    
    positions.forEach(pos => {
      const column = new THREE.Mesh(columnGeometry, columnMaterial);
      // Type-safe: Array-Elemente sind garantiert vorhanden
      column.position.set(pos[0]!, pos[1]!, pos[2]!);
      column.castShadow = true;
      column.receiveShadow = true;
      column.userData.isCollidable = true;
      hallGroup.add(column);
    });
    
    // Benches around the table
    const benchGeometry = new THREE.BoxGeometry(3, 0.5, 0.5);
    const benchMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    
    const bench1 = new THREE.Mesh(benchGeometry, benchMaterial);
    bench1.position.set(0, 0.5, -1.5);
    bench1.castShadow = true;
    bench1.receiveShadow = true;
    bench1.userData.isCollidable = true;
    hallGroup.add(bench1);
    
    const bench2 = new THREE.Mesh(benchGeometry, benchMaterial);
    bench2.position.set(0, 0.5, 1.5);
    bench2.castShadow = true;
    bench2.receiveShadow = true;
    bench2.userData.isCollidable = true;
    hallGroup.add(bench2);
  }

  private createShack(x: number, z: number, width: number, depth: number): void {
    const shackGroup = new THREE.Group();
    
    // Simple foundation
    const foundationGeometry = new THREE.BoxGeometry(width, 0.3, depth);
    const foundationMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
    foundation.position.set(0, 0.15, 0);
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    foundation.userData.isCollidable = true;
    shackGroup.add(foundation);
    
    // Low walls
    const wallHeight = 2.5;
    const wallThickness = 0.2;
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
    
    // Simple walls with openings
    const wallGeometry = new THREE.BoxGeometry(width, wallHeight, wallThickness);
    const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
    frontWall.position.set(0, wallHeight/2 + 0.3, depth/2 - wallThickness/2);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    frontWall.userData.isCollidable = true;
    shackGroup.add(frontWall);
    
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, wallHeight/2 + 0.3, -depth/2 + wallThickness/2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    backWall.userData.isCollidable = true;
    shackGroup.add(backWall);
    
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, depth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-width/2 + wallThickness/2, wallHeight/2 + 0.3, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    leftWall.userData.isCollidable = true;
    shackGroup.add(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(width/2 - wallThickness/2, wallHeight/2 + 0.3, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    rightWall.userData.isCollidable = true;
    shackGroup.add(rightWall);
    
    // Simple roof
    const roofGeometry = new THREE.ConeGeometry(Math.max(width, depth) * 0.7, 1.5, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, wallHeight + 1, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.receiveShadow = true;
    roof.userData.isCollidable = true;
    shackGroup.add(roof);
    
    // Simple interior crate for cover
    const crateGeometry = new THREE.BoxGeometry(1, 1, 1);
    const crateMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const crate = new THREE.Mesh(crateGeometry, crateMaterial);
    crate.position.set(0, 0.8, 0);
    crate.castShadow = true;
    crate.receiveShadow = true;
    crate.userData.isCollidable = true;
    shackGroup.add(crate);
    
    shackGroup.position.set(x, 0, z);
    this.scene.add(shackGroup);
    
    // Add all collidable objects from the shack group
    shackGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.isCollidable) {
        this.collidableObjects.push(child);
      }
    });
  }

  private createFences(): void {
    const fenceMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    // Create fences between some houses
    const fenceSegments = [
      { start: [-25, 0], end: [-15, 0] },
      { start: [15, 0], end: [25, 0] },
      { start: [0, -25], end: [0, -15] },
      { start: [0, 15], end: [0, 25] },
      { start: [-20, 15], end: [-10, 25] },
      { start: [20, 15], end: [10, 25] }
    ];
    
    fenceSegments.forEach(segment => {
      this.createFenceSegment(((segment.start[0] ?? 0) ?? 0), ((segment.start[1] ?? 0) ?? 0), ((segment.end[0] ?? 0) ?? 0), ((segment.end[1] ?? 0) ?? 0), fenceMaterial);
    });
  }

  private createFenceSegment(x1: number, z1: number, x2: number, z2: number, material: THREE.MeshLambertMaterial): void {
    const distance = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
    const angle = Math.atan2(z2 - z1, x2 - x1);
    
    const fenceHeight = 1.5;
    const fenceThickness = 0.1;
    
    const fenceGeometry = new THREE.BoxGeometry(distance, fenceHeight, fenceThickness);
    const fence = new THREE.Mesh(fenceGeometry, material);
    fence.position.set((x1 + x2) / 2, fenceHeight / 2, (z1 + z2) / 2);
    fence.rotation.y = angle;
    fence.castShadow = true;
    fence.receiveShadow = true;
    fence.userData.isCollidable = true;
    this.scene.add(fence);
    this.collidableObjects.push(fence);
    
    // Add fence posts
    const postGeometry = new THREE.BoxGeometry(0.2, fenceHeight + 0.5, 0.2);
    const post1 = new THREE.Mesh(postGeometry, material);
    post1.position.set(x1, (fenceHeight + 0.5) / 2, z1);
    post1.castShadow = true;
    post1.receiveShadow = true;
    post1.userData.isCollidable = true;
    this.scene.add(post1);
    this.collidableObjects.push(post1);
    
    const post2 = new THREE.Mesh(postGeometry, material);
    post2.position.set(x2, (fenceHeight + 0.5) / 2, z2);
    post2.castShadow = true;
    post2.receiveShadow = true;
    post2.userData.isCollidable = true;
    this.scene.add(post2);
    this.collidableObjects.push(post2);
  }

  private createRubble(): void {
    const rubblePositions = [
      { x: -25, z: 10 },
      { x: 25, z: -10 },
      { x: -10, z: 25 },
      { x: 10, z: -25 },
      { x: -35, z: 0 },
      { x: 35, z: 0 },
      { x: 0, z: -35 },
      { x: 0, z: 35 }
    ];
    
    rubblePositions.forEach(pos => {
      // Create random rubble piles
      const rubbleSize = Math.random() * 0.8 + 0.5;
      const rubbleGeometry = new THREE.BoxGeometry(rubbleSize, rubbleSize * 0.5, rubbleSize);
      const rubbleMaterial = new THREE.MeshLambertMaterial({ 
        color: Math.random() > 0.5 ? 0x696969 : 0x8B4513 
      });
      const rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
      rubble.position.set(pos.x, rubbleSize * 0.25, pos.z);
      rubble.rotation.y = Math.random() * Math.PI;
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      rubble.userData.isCollidable = true;
      this.scene.add(rubble);
      this.collidableObjects.push(rubble);
    });
  }

  private createCoverObjects(): void {
    const coverPositions = [
      { x: 10, z: 10, width: 3, height: 4, depth: 2, color: 0x8B4513 },
      { x: -10, z: 10, width: 3, height: 4, depth: 2, color: 0x8B4513 },
      { x: 10, z: -10, width: 3, height: 4, depth: 2, color: 0x8B4513 },
      { x: -10, z: -10, width: 3, height: 4, depth: 2, color: 0x8B4513 },
      { x: 0, z: 0, width: 2, height: 3, depth: 2, color: 0x696969 },
      { x: 20, z: 0, width: 2, height: 3, depth: 1, color: 0x696969 },
      { x: -20, z: 0, width: 2, height: 3, depth: 1, color: 0x696969 },
      { x: 0, z: 20, width: 1, height: 2.5, depth: 2, color: 0x696969 },
      { x: 0, z: -20, width: 1, height: 2.5, depth: 2, color: 0x696969 }
    ];

    coverPositions.forEach(pos => {
      const geometry = new THREE.BoxGeometry(pos.width, pos.height, pos.depth);
      const material = new THREE.MeshLambertMaterial({ color: pos.color });
      const cover = new THREE.Mesh(geometry, material);
      cover.position.set(pos.x, pos.height / 2, pos.z);
      cover.castShadow = true;
      cover.receiveShadow = true;
      cover.userData.isCollidable = true;
      this.scene.add(cover);
      this.collidableObjects.push(cover);
    });
  }

  private createAdditionalCoverGraphics(): void {
    // Create large concrete barriers
    this.createConcreteBarriers();
    
    // Create metal containers
    this.createMetalContainers();
    
    // Create wooden crates and pallets
    this.createWoodenCrates();
    
    // Create low walls for crouch cover
    this.createLowWalls();
    
    // Create destroyed vehicles as cover
    this.createDestroyedVehicles();
    
    // Create sandbag positions
    this.createSandbagPositions();
  }

  private createConcreteBarriers(): void {
    const barrierPositions = [
      { x: 15, z: 5, rotation: 0 },
      { x: -15, z: 5, rotation: 0 },
      { x: 15, z: -5, rotation: 0 },
      { x: -15, z: -5, rotation: 0 },
      { x: 5, z: 15, rotation: Math.PI / 2 },
      { x: -5, z: 15, rotation: Math.PI / 2 },
      { x: 5, z: -15, rotation: Math.PI / 2 },
      { x: -5, z: -15, rotation: Math.PI / 2 }
    ];

    barrierPositions.forEach(pos => {
      // Jersey barrier shape
      const shape = new THREE.Shape();
      shape.moveTo(-1, 0);
      shape.lineTo(-0.8, 0);
      shape.lineTo(-0.6, 0.4);
      shape.lineTo(0.6, 0.4);
      shape.lineTo(0.8, 0);
      shape.lineTo(1, 0);
      shape.lineTo(1, 0.8);
      shape.lineTo(-1, 0.8);
      shape.lineTo(-1, 0);

      const extrudeSettings = {
        depth: 3,
        bevelEnabled: false
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const material = new THREE.MeshLambertMaterial({ color: 0x808080 });
      const barrier = new THREE.Mesh(geometry, material);
      
      barrier.position.set(pos.x, 0.4, pos.z);
      barrier.rotation.y = pos.rotation;
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      barrier.userData.isCollidable = true;
      this.scene.add(barrier);
      this.collidableObjects.push(barrier);
    });
  }

  private createMetalContainers(): void {
    const containerPositions = [
      { x: 20, z: 10, color: 0x8B4513 },
      { x: -20, z: 10, color: 0x8B4513 },
      { x: 20, z: -10, color: 0x8B4513 },
      { x: -20, z: -10, color: 0x8B4513 },
      { x: 25, z: 0, color: 0x654321 },
      { x: -25, z: 0, color: 0x654321 }
    ];

    containerPositions.forEach(pos => {
      // Main container body
      const geometry = new THREE.BoxGeometry(3, 2.5, 2);
      const material = new THREE.MeshLambertMaterial({ color: pos.color });
      const container = new THREE.Mesh(geometry, material);
      container.position.set(pos.x, 1.25, pos.z);
      container.castShadow = true;
      container.receiveShadow = true;
      this.scene.add(container);

      // Container doors
      const doorGeometry = new THREE.BoxGeometry(0.1, 2.3, 1.8);
      const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
      
      const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
      leftDoor.position.set(pos.x - 1.45, 1.25, pos.z);
      leftDoor.castShadow = true;
      this.scene.add(leftDoor);

      const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
      rightDoor.position.set(pos.x + 1.45, 1.25, pos.z);
      rightDoor.castShadow = true;
      this.scene.add(rightDoor);

      // Container corner reinforcements
      const cornerGeometry = new THREE.BoxGeometry(0.2, 2.5, 0.2);
      const cornerMaterial = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
      
      const corners = [
        { x: pos.x - 1.4, z: pos.z - 0.9 },
        { x: pos.x + 1.4, z: pos.z - 0.9 },
        { x: pos.x - 1.4, z: pos.z + 0.9 },
        { x: pos.x + 1.4, z: pos.z + 0.9 }
      ];

      corners.forEach(corner => {
        const cornerPiece = new THREE.Mesh(cornerGeometry, cornerMaterial);
        cornerPiece.position.set(corner.x, 1.25, corner.z);
        cornerPiece.castShadow = true;
        this.scene.add(cornerPiece);
      });
    });
  }

  private createWoodenCrates(): void {
    const cratePositions = [
      { x: 8, z: 8, size: 1.5 },
      { x: -8, z: 8, size: 1.5 },
      { x: 8, z: -8, size: 1.5 },
      { x: -8, z: -8, size: 1.5 },
      { x: 12, z: 0, size: 1 },
      { x: -12, z: 0, size: 1 },
      { x: 0, z: 12, size: 1 },
      { x: 0, z: -12, size: 1 },
      // Stacked crates
      { x: 18, z: 18, size: 1, height: 1 },
      { x: 18, z: 18, size: 1, height: 2.2 },
      { x: -18, z: 18, size: 1, height: 1 },
      { x: -18, z: 18, size: 1, height: 2.2 },
      { x: 18, z: -18, size: 1, height: 1 },
      { x: 18, z: -18, size: 1, height: 2.2 },
      { x: -18, z: -18, size: 1, height: 1 },
      { x: -18, z: -18, size: 1, height: 2.2 }
    ];

    cratePositions.forEach(pos => {
      const geometry = new THREE.BoxGeometry(pos.size, pos.size, pos.size);
      const material = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
      const crate = new THREE.Mesh(geometry, material);
      crate.position.set(pos.x, pos.height || pos.size / 2, pos.z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.scene.add(crate);

      // Add wood grain effect with darker lines
      const lineGeometry = new THREE.BoxGeometry(pos.size * 1.01, 0.05, pos.size * 1.01);
      const lineMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
      
      // Horizontal lines
      for (let i = 0; i < 3; i++) {
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.position.set(pos.x, (pos.height || pos.size / 2) + (i - 1) * pos.size / 3, pos.z);
        this.scene.add(line);
      }
    });

    // Create pallets
    const palletPositions = [
      { x: 10, z: 20 },
      { x: -10, z: 20 },
      { x: 10, z: -20 },
      { x: -10, z: -20 }
    ];

    palletPositions.forEach(pos => {
      // Pallet base
      const baseGeometry = new THREE.BoxGeometry(2, 0.2, 1.5);
      const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(pos.x, 0.1, pos.z);
      base.castShadow = true;
      base.receiveShadow = true;
      this.scene.add(base);

      // Pallet slats
      const slatGeometry = new THREE.BoxGeometry(0.1, 0.15, 1.5);
      const slatMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
      
      for (let i = 0; i < 5; i++) {
        const slat = new THREE.Mesh(slatGeometry, slatMaterial);
        slat.position.set(pos.x + (i - 2) * 0.4, 0.275, pos.z);
        slat.castShadow = true;
        this.scene.add(slat);
      }
    });
  }

  private createLowWalls(): void {
    const wallPositions = [
      { x: 0, z: 25, width: 8, height: 1.2 },
      { x: 0, z: -25, width: 8, height: 1.2 },
      { x: 25, z: 0, width: 8, height: 1.2, rotation: Math.PI / 2 },
      { x: -25, z: 0, width: 8, height: 1.2, rotation: Math.PI / 2 },
      { x: 15, z: 15, width: 4, height: 1 },
      { x: -15, z: 15, width: 4, height: 1 },
      { x: 15, z: -15, width: 4, height: 1 },
      { x: -15, z: -15, width: 4, height: 1 }
    ];

    wallPositions.forEach(wall => {
      const geometry = new THREE.BoxGeometry(wall.width, wall.height, 0.8);
      const material = new THREE.MeshLambertMaterial({ color: 0x696969 });
      const wallMesh = new THREE.Mesh(geometry, material);
      wallMesh.position.set(wall.x, wall.height / 2, wall.z);
      if (wall.rotation) {
        wallMesh.rotation.y = wall.rotation;
      }
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      this.scene.add(wallMesh);

      // Add crenellations for visual interest
      const crenelGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.9);
      const crenelMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
      
      const crenelCount = Math.floor(wall.width / 1.2);
      for (let i = 0; i < crenelCount; i++) {
        const crenel = new THREE.Mesh(crenelGeometry, crenelMaterial);
        const offset = (i - crenelCount / 2) * 1.2 + 0.6;
        crenel.position.set(
          wall.x + (wall.rotation ? offset * Math.cos(wall.rotation) : offset),
          wall.height + 0.15,
          wall.z + (wall.rotation ? offset * Math.sin(wall.rotation) : 0)
        );
        if (wall.rotation) {
          crenel.rotation.y = wall.rotation;
        }
        crenel.castShadow = true;
        this.scene.add(crenel);
      }
    });
  }

  private createDestroyedVehicles(): void {
    // Destroyed car
    const carGeometry = new THREE.BoxGeometry(4, 1.5, 2);
    const carMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    const car = new THREE.Mesh(carGeometry, carMaterial);
    car.position.set(30, 0.75, 30);
    car.rotation.y = Math.PI / 4;
    car.castShadow = true;
    car.receiveShadow = true;
    this.scene.add(car);

    // Car wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
    
    const wheelPositions = [
      { x: 1.5, z: 0.8 },
      { x: 1.5, z: -0.8 },
      { x: -1.5, z: 0.8 },
      { x: -1.5, z: -0.8 }
    ];

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(30 + pos.x, 0.4, 30 + pos.z);
      wheel.castShadow = true;
      this.scene.add(wheel);
    });

    // Destroyed truck
    const truckGeometry = new THREE.BoxGeometry(6, 2.5, 2.5);
    const truckMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
    const truck = new THREE.Mesh(truckGeometry, truckMaterial);
    truck.position.set(-30, 1.25, -30);
    truck.rotation.y = -Math.PI / 3;
    truck.castShadow = true;
    truck.receiveShadow = true;
    this.scene.add(truck);

    // Truck cargo area
    const cargoGeometry = new THREE.BoxGeometry(3, 2, 2.3);
    const cargoMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    const cargo = new THREE.Mesh(cargoGeometry, cargoMaterial);
    cargo.position.set(-32, 2, -30);
    cargo.rotation.y = -Math.PI / 3;
    cargo.castShadow = true;
    this.scene.add(cargo);
  }

  private createSandbagPositions(): void {
    const sandbagPositions = [
      { x: 22, z: 22, pattern: 'semicircle' },
      { x: -22, z: 22, pattern: 'semicircle' },
      { x: 22, z: -22, pattern: 'semicircle' },
      { x: -22, z: -22, pattern: 'semicircle' },
      { x: 0, z: 30, pattern: 'line' },
      { x: 0, z: -30, pattern: 'line' },
      { x: 30, z: 0, pattern: 'line' },
      { x: -30, z: 0, pattern: 'line' }
    ];

    sandbagPositions.forEach(pos => {
      this.createSandbagBunker(pos.x, pos.z, pos.pattern);
    });
  }

  private initializeAI(): void {
    this.aiSystem = new FPSEnhancedAI(this.scene, this.collidableObjects);
    console.log('🤖 AI System initialized with enhanced enemy behavior');
  }

  private createSandbagBunker(x: number, z: number, pattern: string): void {
    const bagGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.4);
    const bagMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });

    if (pattern === 'semicircle') {
      // Create semicircular sandbag barrier
      for (let layer = 0; layer < 3; layer++) {
        const radius = 2 + layer * 0.2;
        const bagCount = 8;
        
        for (let i = 0; i < bagCount; i++) {
          const angle = (i / bagCount) * Math.PI;
          const bagX = x + Math.cos(angle) * radius;
          const bagZ = z + Math.sin(angle) * radius;
          
          const bag = new THREE.Mesh(bagGeometry, bagMaterial);
          bag.position.set(bagX, 0.2 + layer * 0.4, bagZ);
          bag.rotation.y = angle + Math.PI / 2;
          bag.castShadow = true;
          bag.receiveShadow = true;
          this.scene.add(bag);
        }
      }
    } else if (pattern === 'line') {
      // Create linear sandbag barrier
      for (let layer = 0; layer < 3; layer++) {
        const bagCount = 6;
        
        for (let i = 0; i < bagCount; i++) {
          const bagX = x + (i - bagCount / 2) * 0.7;
          
          const bag = new THREE.Mesh(bagGeometry, bagMaterial);
          bag.position.set(bagX, 0.2 + layer * 0.4, z);
          bag.castShadow = true;
          bag.receiveShadow = true;
          this.scene.add(bag);
        }
      }
    }
  }

  private createDecorations(): void {
    // Add some trees/boxes for visual interest
    const decorations = [
      { x: 15, z: 15, type: 'box', color: 0xCD853F },
      { x: -15, z: 15, type: 'box', color: 0xCD853F },
      { x: 15, z: -15, type: 'box', color: 0xCD853F },
      { x: -15, z: -15, type: 'box', color: 0xCD853F },
      { x: 25, z: 25, type: 'box', color: 0xA0522D },
      { x: -25, z: 25, type: 'box', color: 0xA0522D },
      { x: 25, z: -25, type: 'box', color: 0xA0522D },
      { x: -25, z: -25, type: 'box', color: 0xA0522D }
    ];

    decorations.forEach(dec => {
      if (dec.type === 'box') {
        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const material = new THREE.MeshLambertMaterial({ color: dec.color });
        const box = new THREE.Mesh(geometry, material);
        box.position.set(dec.x, 0.75, dec.z);
        box.castShadow = true;
        box.receiveShadow = true;
        this.scene.add(box);
      }
    });

    // Add some colored spheres for visual variety
    const spherePositions = [
      { x: 5, z: 25, color: 0xFF6B6B },
      { x: -5, z: 25, color: 0x4ECDC4 },
      { x: 5, z: -25, color: 0x45B7D1 },
      { x: -5, z: -25, color: 0xF7DC6F }
    ];

    spherePositions.forEach(pos => {
      const geometry = new THREE.SphereGeometry(0.8, 16, 16);
      const material = new THREE.MeshLambertMaterial({ color: pos.color });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(pos.x, 0.8, pos.z);
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      this.scene.add(sphere);
    });
  }

  private createSpawnPoints(): void {
    // Team 1 spawn points (Blue team)
    const team1Spawns = [
      new THREE.Vector3(-30, 0, -30),
      new THREE.Vector3(-30, 0, 30)
    ];

    // Team 2 spawn points (Red team)
    const team2Spawns = [
      new THREE.Vector3(30, 0, -30),
      new THREE.Vector3(30, 0, 30)
    ];

    // Visual indicators for spawn points - Team 1 (Blue)
    team1Spawns.forEach((spawn, index) => {
      // Create a glowing blue cylinder
      const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x0066ff,
        transparent: true,
        opacity: 0.7
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.copy(spawn);
      marker.position.y = 0.1;
      this.scene.add(marker);

      // Add a glowing light above
      const light = new THREE.PointLight(0x0066ff, 0.5, 10);
      light.position.copy(spawn);
      light.position.y = 2;
      this.scene.add(light);
    });

    // Visual indicators for spawn points - Team 2 (Red)
    team2Spawns.forEach((spawn, index) => {
      // Create a glowing red cylinder
      const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.7
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.copy(spawn);
      marker.position.y = 0.1;
      this.scene.add(marker);

      // Add a glowing light above
      const light = new THREE.PointLight(0xff0000, 0.5, 10);
      light.position.copy(spawn);
      light.position.y = 2;
      this.scene.add(light);
    });
  }

  private createCrosshair(): void {
    this.crosshair = document.createElement('div');
    this.crosshair.style.position = 'fixed';
    this.crosshair.style.top = '50%';
    this.crosshair.style.left = '50%';
    this.crosshair.style.transform = 'translate(-50%, -50%)';
    this.crosshair.style.width = '20px';
    this.crosshair.style.height = '20px';
    this.crosshair.style.pointerEvents = 'none';
    this.crosshair.style.zIndex = '1000';
    this.crosshair.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20">
        <line x1="10" y1="0" x2="10" y2="8" stroke="white" stroke-width="2"/>
        <line x1="10" y1="12" x2="10" y2="20" stroke="white" stroke-width="2"/>
        <line x1="0" y1="10" x2="8" y2="10" stroke="white" stroke-width="2"/>
        <line x1="12" y1="10" x2="20" y2="10" stroke="white" stroke-width="2"/>
        <circle cx="10" cy="10" r="3" fill="none" stroke="white" stroke-width="1"/>
      </svg>
    `;
    document.body.appendChild(this.crosshair);
  }

  private setupEventListeners(): void {
    // Keyboard events
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this);
    this.preventContextMenu = this.preventContextMenu.bind(this);
    
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    // Mouse events
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('click', this.handleClick);
    document.addEventListener('contextmenu', this.preventContextMenu);
    
    // Global mouseup for right-click release
    window.addEventListener('mouseup', this.handleGlobalMouseUp.bind(this));
    
    // Pointer lock
    this.renderer.domElement.addEventListener('click', () => {
      this.renderer.domElement.requestPointerLock();
    });
    
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    
    // Window resize
    window.addEventListener('resize', this.handleResize);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.keys.add(event.code.toLowerCase());
    
    // Weapon switching
    if (event.code === 'Digit1') {
      this.switchWeapon('rifle');
    } else if (event.code === 'Digit2') {
      this.switchWeapon('pistol');
    }
    
    // Reload
    if (event.code === 'KeyR') {
      this.reloadWeapon();
    }
    
    // Jump
    if (event.code === 'Space') {
      this.jump();
    }
    
    // Crouch
    if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
      this.startCrouch();
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.code.toLowerCase());
    
    // Stop crouching
    if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
      this.stopCrouch();
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isPointerLocked) return;
    
    const sensitivity = 0.002;
    this.localPlayer.rotation.y -= event.movementX * sensitivity;
    this.localPlayer.rotation.x -= event.movementY * sensitivity;
    
    // Limit vertical rotation to realistic values (about 85 degrees up and down)
    const maxVerticalAngle = Math.PI * 0.47; // ~85 degrees
    this.localPlayer.rotation.x = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, this.localPlayer.rotation.x));
  }

  private handlePointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
  }

  private preventContextMenu(event: Event): void {
    // Allow right-click for aiming, prevent default context menu
    event.preventDefault();
    
    // Trigger aiming on right-click
    const mouseEvent = event as MouseEvent;
    if (mouseEvent.button === 2) { // Right mouse button
      this.startAiming();
    }
  }

  private jump(): void {
    if (!this.localPlayer.isAlive || !this.localPlayer.isGrounded || this.localPlayer.isCrouching) return;
    
    this.localPlayer.isJumping = true;
    this.localPlayer.jumpVelocity = this.JUMP_FORCE;
    this.localPlayer.isGrounded = false;
  }

  private checkGrounded(): boolean {
    // Check if player is grounded by casting a ray downward
    this.checkRaycaster.set(this.localPlayer.position, new THREE.Vector3(0, -1, 0));
    const intersects = this.checkRaycaster.intersectObjects(this.collidableObjects);
    
    return intersects.length > 0 && intersects[0]!.distance <= this.GROUND_CHECK_DISTANCE;
  }

  private updatePhysics(deltaTime: number): void {
    if (!this.localPlayer.isAlive) return;
    
    // Apply gravity
    if (!this.localPlayer.isGrounded) {
      this.localPlayer.jumpVelocity += this.GRAVITY * deltaTime;
    }
    
    // Update vertical position
    if (this.localPlayer.jumpVelocity !== 0) {
      const verticalMovement = new THREE.Vector3(0, this.localPlayer.jumpVelocity * deltaTime, 0);
      const newPosition = this.localPlayer.position.clone().add(verticalMovement);
      
      // Check for collision below
      if (this.localPlayer.jumpVelocity < 0) {
        this.checkRaycaster.set(this.localPlayer.position, new THREE.Vector3(0, -1, 0));
        const intersects = this.checkRaycaster.intersectObjects(this.collidableObjects);
        
        if (intersects.length > 0 && intersects[0]!.distance <= Math.abs(verticalMovement.y) + 0.1) {
          // Land on ground
          this.localPlayer.position.y = intersects[0]!.point.y + 0.1;
          this.localPlayer.jumpVelocity = 0;
          this.localPlayer.isJumping = false;
          this.localPlayer.isGrounded = true;
        } else {
          this.localPlayer.position.copy(newPosition);
        }
      } else {
        // Moving upward, check for ceiling collision
        this.checkRaycaster.set(this.localPlayer.position, new THREE.Vector3(0, 1, 0));
        const intersects = this.checkRaycaster.intersectObjects(this.collidableObjects);
        
        if (intersects.length > 0 && intersects[0]!.distance <= verticalMovement.y) {
          // Hit ceiling
          this.localPlayer.jumpVelocity = 0;
        } else {
          this.localPlayer.position.copy(newPosition);
        }
      }
    }
    
    // Update grounded state
    this.localPlayer.isGrounded = this.checkGrounded();
  }

  private handleClick(): void {
    if (!this.isPointerLocked || !this.localPlayer.isAlive) return;
    
    this.fireWeapon();
  }

  private handleMouseDown(event: MouseEvent): void {
    if (!this.isPointerLocked || !this.localPlayer.isAlive) return;
    
    // Check if right mouse button (button 2)
    if (event.button === 2) {
      this.startAiming();
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.isPointerLocked || !this.localPlayer.isAlive) return;
    
    // Check if right mouse button (button 2)
    if (event.button === 2) {
      this.stopAiming();
    }
  }

  private handleGlobalMouseUp(event: MouseEvent): void {
    // Handle right-click release globally (even outside game window)
    if (event.button === 2) {
      this.stopAiming();
    }
  }

  private startAiming(): void {
    if (this.localPlayer.isReloading) return;
    
    this.localPlayer.isAiming = true;
    this.updateCrosshair();
  }

  private stopAiming(): void {
    this.localPlayer.isAiming = false;
    this.updateCrosshair();
  }

  private updateCrosshair(): void {
    if (!this.crosshair) return;
    
    // Update crosshair appearance based on aiming state
    this.crosshair.style.opacity = this.localPlayer.isAiming ? '0.3' : '1';
    this.crosshair.style.transform = `translate(-50%, -50%) scale(${this.localPlayer.isAiming ? 0.7 : 1})`;
  }

  private updateCameraFOV(deltaTime: number): void {
    const targetFOV = this.localPlayer.isAiming ? this.AIM_FOV : this.DEFAULT_FOV;
    const currentFOV = this.camera.fov;
    
    // Smooth transition between FOV values
    if (Math.abs(currentFOV - targetFOV) > 0.1) {
      const fovDiff = targetFOV - currentFOV;
      this.camera.fov += fovDiff * this.AIM_TRANSITION_SPEED * deltaTime;
      this.camera.updateProjectionMatrix();
    }
  }

  private switchWeapon(weaponName: string): void {
    if (!this.localPlayer.isAlive || this.localPlayer.isReloading) return;
    
    if (this.weapons.has(weaponName)) {
      this.localPlayer.currentWeapon = weaponName;
      const weapon = this.weapons.get(weaponName)!;
      this.localPlayer.ammo = weapon.currentAmmo;
    }
  }

  private reloadWeapon(): void {
    if (!this.localPlayer.isAlive || this.localPlayer.isReloading) return;
    
    const weapon = this.weapons.get(this.localPlayer.currentWeapon);
    if (!weapon || weapon.currentAmmo === weapon.magazineSize || weapon.reserveAmmo === 0) return;
    
    this.localPlayer.isReloading = true;
    
    setTimeout(() => {
      if (weapon) {
        const neededAmmo = weapon.magazineSize - weapon.currentAmmo;
        const ammoToReload = Math.min(neededAmmo, weapon.reserveAmmo);
        weapon.currentAmmo += ammoToReload;
        weapon.reserveAmmo -= ammoToReload;
        this.localPlayer.ammo = weapon.currentAmmo;
      }
      this.localPlayer.isReloading = false;
    }, weapon.reloadTime);
  }

  private fireWeapon(): void {
    if (!this.localPlayer.isAlive || this.localPlayer.isReloading) return;
    
    const weapon = this.weapons.get(this.localPlayer.currentWeapon);
    if (!weapon || weapon.currentAmmo <= 0) {
      this.reloadWeapon();
      return;
    }
    
    const now = Date.now();
    const fireInterval = 60000 / weapon.fireRate; // Convert RPM to ms
    
    if (now - weapon.lastFireTime < fireInterval) return;
    
    weapon.lastFireTime = now;
    weapon.currentAmmo--;
    this.localPlayer.ammo = weapon.currentAmmo;
    
    // Apply recoil
    this.applyRecoil(weapon.recoil);
    
    // Perform raycast for hit detection
    this.performRaycast(weapon);
    
    // Auto-reload if empty
    if (weapon.currentAmmo === 0) {
      setTimeout(() => this.reloadWeapon(), 100);
    }
  }

  private applyRecoil(recoilAmount: number): void {
    this.localPlayer.rotation.x -= recoilAmount;
    this.localPlayer.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.localPlayer.rotation.x));
  }

  private performRaycast(weapon: WeaponState): void {
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    
    // Apply accuracy spread
    const accuracyMultiplier = this.localPlayer.isAiming ? this.AIM_ACCURACY_MULTIPLIER : 1;
    const spread = (1 - weapon.accuracy) * 0.1 * accuracyMultiplier;
    
    // Add random spread to direction
    if (spread > 0) {
      const spreadX = (Math.random() - 0.5) * spread;
      const spreadY = (Math.random() - 0.5) * spread;
      direction.x += spreadX;
      direction.y += spreadY;
      direction.normalize();
    }
    
    raycaster.set(this.camera.position, direction);
    
    const intersects = raycaster.intersectObjects(this.collidableObjects);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      const distance = hit!.distance;
      
      if (distance <= weapon.range) {
        // Calculate damage based on distance
        const damageMultiplier = Math.max(0.3, 1 - (distance / weapon.range));
        const finalDamage = weapon.damage * damageMultiplier;
        
        // Create impact effect
        if (hit!.point && hit!.normal) {
          this.createImpactEffect(hit!.point, hit!.normal);
        }
        
        console.log(`Hit at distance ${distance.toFixed(2)}m, damage: ${finalDamage.toFixed(1)}`);
      }
    }
  }

  private createImpactEffect(position: THREE.Vector3, normal: THREE.Vector3): void {
    // Create a simple impact effect
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const impact = new THREE.Mesh(geometry, material);
    impact.position.copy(position);
    this.scene.add(impact);
    
    // Remove impact effect after a short time
    setTimeout(() => {
      this.scene.remove(impact);
    }, 200);
  }

  private updateMovement(deltaTime: number): void {
    if (!this.localPlayer.isAlive) return;
    
    let moveSpeed = 1.3; // units per second - Normalgeschwindigkeit
    let sprintMultiplier = 1;
    
    // Check for sprint (only when not crouching or sliding)
    if (!this.localPlayer.isCrouching && !this.localPlayer.isSliding) {
      sprintMultiplier = (this.keys.has('shift') || this.keys.has('shiftleft') || this.keys.has('shiftright')) ? 1.38 : 1; // Sprintgeschwindigkeit: 1.8
    }
    
    // Apply crouch speed multiplier
    if (this.localPlayer.isCrouching && !this.localPlayer.isSliding) {
      moveSpeed *= this.CROUCH_SPEED_MULTIPLIER; // Crouch-Geschwindigkeit: 0.78
    }
    
    // Apply slide speed multiplier
    if (this.localPlayer.isSliding) {
      moveSpeed *= this.SLIDE_SPEED_MULTIPLIER; // Slide-Geschwindigkeit: 1.8
    }
    
    const currentSpeed = moveSpeed * sprintMultiplier * deltaTime;
    
    const direction = new THREE.Vector3();
    
    if (this.keys.has('keyw')) direction.z -= 1;
    if (this.keys.has('keys')) direction.z += 1;
    if (this.keys.has('keya')) direction.x -= 1;
    if (this.keys.has('keyd')) direction.x += 1;
    
    // Also check alternative key codes
    if (this.keys.has('w')) direction.z -= 1;
    if (this.keys.has('s')) direction.z += 1;
    if (this.keys.has('a')) direction.x -= 1;
    if (this.keys.has('d')) direction.x += 1;
    
    direction.normalize();
    
    // Keep movement horizontal first, then apply rotation
    direction.y = 0;
    direction.applyQuaternion(this.camera.quaternion);
    direction.multiplyScalar(currentSpeed);
    
    // Calculate desired position
    const desiredPosition = this.localPlayer.position.clone().add(direction);
    
    // Check for collisions and get safe position (pass currentSpeed for sliding)
    const safePosition = this.getSafePosition(this.localPlayer.position, desiredPosition, currentSpeed);
    
    // Update player position
    this.localPlayer.position.copy(safePosition);
    this.camera.position.copy(this.localPlayer.position);
    
    // Update slide physics
    this.updateSlide(deltaTime);
  }

  private startCrouch(): void {
    if (this.localPlayer.isSliding) return; // Can't crouch while sliding
    
    this.localPlayer.isCrouching = true;
    this.updatePlayerHeight();
    
    // Start sliding if sprinting and moving
    const isSprinting = this.keys.has('shift') || this.keys.has('shiftleft') || this.keys.has('shiftright');
    const isMoving = this.keys.has('keyw') || this.keys.has('keys') || this.keys.has('keya') || this.keys.has('keyd') ||
                     this.keys.has('w') || this.keys.has('s') || this.keys.has('a') || this.keys.has('d');
    
    if (isSprinting && isMoving && this.localPlayer.isGrounded) {
      this.startSlide();
    }
  }

  private stopCrouch(): void {
    this.localPlayer.isCrouching = false;
    this.updatePlayerHeight();
  }

  private startSlide(): void {
    if (this.localPlayer.isSliding || !this.localPlayer.isGrounded) return;
    
    this.localPlayer.isSliding = true;
    this.localPlayer.slideVelocity = 1.8; // Initial slide velocity
    
    // Auto-stop slide after duration
    setTimeout(() => {
      this.localPlayer.isSliding = false;
      this.localPlayer.slideVelocity = 0;
    }, this.SLIDE_DURATION);
  }

  private updateSlide(deltaTime: number): void {
    if (this.localPlayer.isSliding) {
      // Apply slide momentum
      const slideDirection = new THREE.Vector3();
      
      if (this.keys.has('keyw')) slideDirection.z -= 1;
      if (this.keys.has('keys')) slideDirection.z += 1;
      if (this.keys.has('keya')) slideDirection.x -= 1;
      if (this.keys.has('keyd')) slideDirection.x += 1;
      
      // Also check alternative key codes
      if (this.keys.has('w')) slideDirection.z -= 1;
      if (this.keys.has('s')) slideDirection.z += 1;
      if (this.keys.has('a')) slideDirection.x -= 1;
      if (this.keys.has('d')) slideDirection.x += 1;
      
      if (slideDirection.length() > 0) {
        slideDirection.normalize();
        slideDirection.y = 0;
        slideDirection.applyQuaternion(this.camera.quaternion);
        
        const slideMovement = slideDirection.clone().multiplyScalar(this.localPlayer.slideVelocity * deltaTime);
        const slidePosition = this.localPlayer.position.clone().add(slideMovement);
        const safeSlidePosition = this.getSafePosition(this.localPlayer.position, slidePosition, this.localPlayer.slideVelocity * deltaTime);
        
        this.localPlayer.position.copy(safeSlidePosition);
        this.camera.position.copy(this.localPlayer.position);
      }
      
      // Gradually reduce slide velocity
      this.localPlayer.slideVelocity *= 0.98;
      if (this.localPlayer.slideVelocity < 0.1) {
        this.localPlayer.isSliding = false;
        this.localPlayer.slideVelocity = 0;
      }
    }
  }

  private updatePlayerHeight(): void {
    const targetHeight = this.localPlayer.isCrouching ? this.CROUCH_HEIGHT : this.STAND_HEIGHT;
    const currentHeight = this.localPlayer.position.y;
    const heightDiff = targetHeight - currentHeight;
    
    // Smooth height transition
    if (Math.abs(heightDiff) > 0.01) {
      this.localPlayer.position.y += heightDiff * 0.2;
      this.camera.position.copy(this.localPlayer.position);
    }
  }

  private updateCamera(): void {
    this.camera.rotation.copy(this.localPlayer.rotation);
  }

  private updateGameLogic(deltaTime: number): void {
    if (!this.gameState.isGameActive) return;
    
    this.gameState.roundTime += deltaTime * 1000;
    
    // Check round time limit
    if (this.gameState.roundTime >= this.gameState.maxRoundTime) {
      this.endRound();
    }
  }

  private endRound(): void {
    this.gameState.isGameActive = false;
    console.log('Round ended!');
    // Reset for next round
    setTimeout(() => {
      this.resetRound();
    }, 3000);
  }

  private resetRound(): void {
    this.gameState.roundTime = 0;
    this.gameState.currentRound++;
    this.gameState.isGameActive = true;
    
    // Reset player positions and health
    this.localPlayer.position.set(0, 1.8, 0);
    this.localPlayer.health = 100;
    this.localPlayer.isAlive = true;
    
    // Reset ammo
    this.weapons.forEach(weapon => {
      weapon.currentAmmo = weapon.magazineSize;
      weapon.reserveAmmo = weapon.magazineSize * 3;
    });
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private checkCollision(position: THREE.Vector3, direction: THREE.Vector3, distance: number): boolean {
    this.movementRaycaster.set(position, direction);
    const intersects = this.movementRaycaster.intersectObjects(this.collidableObjects);
    
    return intersects.length > 0 && intersects[0]!.distance < distance;
  }

  // Enhanced collision check with player radius
  private checkCollisionWithRadius(position: THREE.Vector3, direction: THREE.Vector3, distance: number, radius: number = 0.3): boolean {
    this.movementRaycaster.set(position, direction);
    const intersects = this.movementRaycaster.intersectObjects(this.collidableObjects);
    
    return intersects.length > 0 && intersects[0]!.distance < distance + radius;
  }

  private getSafePosition(currentPosition: THREE.Vector3, desiredPosition: THREE.Vector3, currentSpeed: number): THREE.Vector3 {
    const direction = new THREE.Vector3().subVectors(desiredPosition, currentPosition);
    const distance = direction.length();
    direction.normalize();
    
    // Player collision radius
    const playerRadius = 0.3;
    
    // Check collision along the movement path
    this.movementRaycaster.set(currentPosition, direction);
    const intersects = this.movementRaycaster.intersectObjects(this.collidableObjects);
    
    if (intersects.length > 0 && intersects[0]!.distance < distance + playerRadius) {
      // Collision detected, try to slide along the surface
      const collisionPoint = intersects[0]!.point;
      
      // Calculate slide direction (simplified)
      const collisionNormal = intersects[0]!.face?.normal || new THREE.Vector3(0, 1, 0);
      
      // Calculate slide direction
      const slideDirection = direction.clone().sub(collisionNormal.clone().multiplyScalar(direction.dot(collisionNormal)));
      slideDirection.normalize();
      
      // Try sliding with reduced distance
      const slideDistance = Math.min(distance - intersects[0]!.distance + playerRadius, currentSpeed * 0.5);
      const slidePosition = currentPosition.clone().add(slideDirection.multiplyScalar(slideDistance));
      
      // Check if slide position is valid
      this.slideRaycaster.set(currentPosition, slideDirection);
      const slideIntersects = this.slideRaycaster.intersectObjects(this.collidableObjects);
      
      if (slideIntersects.length === 0 || slideIntersects[0].distance > slideDistance) {
        return slidePosition;
      }
      
      // If sliding doesn't work, return current position
      return currentPosition.clone();
    }
    
    // Check for collisions at the desired position (multiple directions)
    const checkDirections = [
      new THREE.Vector3(0, -1, 0),  // Down
      new THREE.Vector3(0, 1, 0),   // Up
      new THREE.Vector3(1, 0, 0),   // Right
      new THREE.Vector3(-1, 0, 0),  // Left
      new THREE.Vector3(0, 0, 1),   // Forward
      new THREE.Vector3(0, 0, -1)   // Backward
    ];
    
    for (const checkDir of checkDirections) {
      this.checkRaycaster.set(desiredPosition, checkDir);
      const checkIntersects = this.checkRaycaster.intersectObjects(this.collidableObjects);
      
      if (checkIntersects.length > 0 && checkIntersects[0].distance < playerRadius) {
        // Too close to an object in this direction
        return currentPosition.clone();
      }
    }
    
    return desiredPosition;
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = Math.min(this.clock.getDelta(), 0.1); // Cap delta time to prevent large jumps
    
    this.updatePhysics(deltaTime);
    this.updateMovement(deltaTime);
    this.updateCamera();
    this.updateCameraFOV(deltaTime);
    this.updateGameLogic(deltaTime);

    // Update AI system
    if (this.aiSystem) {
      this.aiSystem.updatePlayerPosition(this.localPlayer.position);
      this.aiSystem.update(deltaTime);
    }

    // Ensure renderer is properly sized
    if (this.renderer.domElement.width !== window.innerWidth || this.renderer.domElement.height !== window.innerHeight) {
      this.handleResize();
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public getLocalPlayerState(): PlayerState {
    return { ...this.localPlayer };
  }

  public destroy(): void {
    // Remove crosshair
    if (this.crosshair && document.body.contains(this.crosshair)) {
      document.body.removeChild(this.crosshair);
    }
    
    // Remove renderer from container
    if (this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    // Dispose of Three.js resources
    this.renderer.dispose();
    
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('contextmenu', this.preventContextMenu);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mouseup', this.handleGlobalMouseUp.bind(this));
    
    // Clear arrays
    this.collidableObjects.length = 0;
    this.keys.clear();

    // Cleanup AI system
    if (this.aiSystem) {
      this.aiSystem.cleanup();
      this.aiSystem = undefined;
    }
  }
}
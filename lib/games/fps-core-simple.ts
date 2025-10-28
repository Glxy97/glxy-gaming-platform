import * as THREE from 'three';
import { SoundManager } from './sound-manager';
import { BloodEffect } from './blood-effect';
import { DamageIndicator } from './damage-indicator';
import { HitAnimation } from './hit-animation';

export class SimpleFPSCore {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private animationId: number | null = null;
  private ground: THREE.Mesh | null = null;
  private gameActive: boolean = true; // Add game active state
  
  // Movement and controls
  private keys: Set<string> = new Set();
  private isPointerLocked = false;
  private moveSpeed = 4.0; // Increased from 0.5
  private mouseSensitivity = 0.002;
  
  // Player state - COMPLETELY REWRITTEN MOUSE LOOK SYSTEM
  private position: THREE.Vector3 = new THREE.Vector3(0, 1.8, 5);
  private yaw: number = 0; // Horizontal rotation (around Y axis)
  private pitch: number = 0; // Vertical rotation (around X axis)
  
  // Movement states - Battlefield 2042 style
  private isCrouching: boolean = false;
  private isSliding: boolean = false;
  private isSprinting: boolean = false;
  private isJumping: boolean = false;
  private crouchHeight: number = 1.0;
  private standHeight: number = 1.8;
  private slideSpeed: number = 12.0; // Battlefield 2042 style slide speed (much faster)
  private sprintSpeed: number = 7.0; // Battlefield 2042 style sprint speed
  private normalSpeed: number = 5.0; // Battlefield 2042 style normal speed
  private slideDirection: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private slideDeceleration: number = 8.0; // Battlefield 2042 style slide deceleration (more gradual)
  private slideMomentum: number = 1.5; // Battlefield 2042 style slide momentum (longer slides)
  private slideBoost: number = 1.2; // Initial slide boost for that Battlefield feel
  
  // Jumping mechanics - Battlefield 2042 style
  private jumpVelocity: number = 0;
  private jumpForce: number = 4.5; // Battlefield 2042 style jump height
  private gravity: number = 12.0; // Battlefield 2042 style gravity for faster descent
  private groundY: number = 1.8; // Ground level when standing
  private airControl: number = 0.6; // Battlefield 2042 style air control (more responsive)
  private jumpCooldown: number = 0; // Cooldown between jumps
  private jumpCooldownTime: number = 200; // Very short cooldown for responsive jumping
  private lastJumpTime: number = 0;
  
  // Cooldown systems
  private crouchCooldown: number = 0;
  private crouchCooldownTime: number = 600; // 0.6 seconds cooldown (extended by 0.3)
  private slideCooldown: number = 0;
  private slideCooldownTime: number = 800; // Battlefield 2042 style slide cooldown (faster reuse)
  private lastCrouchTime: number = 0;
  private lastSlideTime: number = 0;
  
  // Weapon system
  private currentWeapon: string = 'rifle';
  private weapons: Map<string, any> = new Map();
  private canShoot: boolean = true;
  private shootCooldown: number = 0;
  private weaponModels: Map<string, THREE.Group> = new Map();
  private currentWeaponModel: THREE.Group | null = null;
  private handModel: THREE.Group | null = null;
  
  // Firing system
  private isMouseDown: boolean = false;
  private isAiming: boolean = false;
  private autoFireInterval: number | null = null;
  
  // Hit feedback systems
  private soundManager: SoundManager = {} as SoundManager;
  private bloodEffect: BloodEffect = {} as BloodEffect;
  private damageIndicator: DamageIndicator = {} as DamageIndicator;
  private hitAnimation: HitAnimation = {} as HitAnimation;
  
  // Event handlers

  constructor(container: HTMLElement) {
    console.log('SimpleFPSCore constructor called');
    
    if (!container) {
      throw new Error('Container element is required');
    }
    
    this.container = container;
    
    try {
      // Initialize Three.js
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      
      console.log('Three.js initialized successfully');
      
      // Setup renderer
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setClearColor(0x87CEEB); // Sky blue background
      this.container.appendChild(this.renderer.domElement);
      
      console.log('Renderer setup completed');
      
      // Setup camera - COMPLETELY REWRITTEN FOR PROPER MOUSE LOOK
      this.camera.position.copy(this.position);
      // Initialize with proper yaw/pitch angles
      this.yaw = 0;
      this.pitch = 0;
      this.updateCameraRotation();
      
      console.log('Camera setup completed');
      
      // Add basic lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
      this.scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight.position.set(10, 20, 5);
      this.scene.add(directionalLight);
      
      console.log('Lighting setup completed');
      
      // Add a simple ground
      const groundGeometry = new THREE.PlaneGeometry(100, 100);
      const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c4a });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      this.scene.add(ground);
      this.ground = ground; // Store reference for collision detection
      
      console.log('Ground added');
      
      // Add a simple cube
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.set(0, 0.5, 0);
      this.scene.add(cube);
      
      console.log('Cube added');
      
      // Add some obstacles for movement testing
      this.addObstacles();
      
      // Initialize weapons
      this.initializeWeapons();
      
      // Initialize hit feedback systems
      this.initializeHitFeedbackSystems();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('Event listeners setup completed');
      
      // Start animation
      this.animate();
      
      console.log('SimpleFPSCore constructor completed successfully');
      
    } catch (error) {
      console.error('Error in SimpleFPSCore constructor:', error);
      throw error;
    }
  }

  private addObstacles(): void {
    // Add some boxes to test movement and collision
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    // Box 1
    const box1 = new THREE.Mesh(boxGeometry, boxMaterial);
    box1.position.set(5, 1, 0);
    this.scene.add(box1);
    
    // Box 2
    const box2 = new THREE.Mesh(boxGeometry, boxMaterial);
    box2.position.set(-5, 1, 0);
    this.scene.add(box2);
    
    // Box 3
    const box3 = new THREE.Mesh(boxGeometry, boxMaterial);
    box3.position.set(0, 1, -5);
    this.scene.add(box3);
    
    console.log('Obstacles added');
  }

  private initializeWeapons(): void {
    // Initialize weapon system with fire modes
    this.weapons.set('rifle', {
      name: 'Assault Rifle',
      damage: 25,
      fireRate: 750, // RPM for full auto
      magazineSize: 30,
      currentAmmo: 30,
      reloadTime: 2000,
      lastFireTime: 0,
      isReloading: false,
      reloadStartTime: 0,
      fireMode: 'auto' // Full auto for AR
    });
    
    this.weapons.set('pistol', {
      name: 'Pistol',
      damage: 35,
      fireRate: 180, // RPM for semi-auto
      magazineSize: 12,
      currentAmmo: 12,
      reloadTime: 1500,
      lastFireTime: 0,
      isReloading: false,
      reloadStartTime: 0,
      fireMode: 'semi' // Semi-auto for pistol
    });
    
    this.weapons.set('melee', {
      name: 'Schwert',
      damage: 50,
      fireRate: 60, // RPM for melee attacks
      magazineSize: -1, // Unlimited uses
      currentAmmo: -1,
      reloadTime: 0,
      lastFireTime: 0,
      isReloading: false,
      reloadStartTime: 0,
      fireMode: 'melee' // Melee mode
    });
    
    // Create 3D weapon models
    this.createWeaponModels();
    
    console.log('Weapons initialized with fire modes');
  }
  
  private initializeHitFeedbackSystems(): void {
    // Initialize sound manager
    this.soundManager = new SoundManager();
    this.soundManager.generateHitSounds();
    
    // Initialize blood effect system
    this.bloodEffect = new BloodEffect(this.scene);
    
    // Initialize damage indicator system
    this.damageIndicator = new DamageIndicator(this.scene, this.camera);
    
    // Initialize hit animation system
    this.hitAnimation = new HitAnimation(this.scene, this.camera);
    
    console.log('Hit feedback systems initialized');
  }

  private createWeaponModels(): void {
    // Create rifle model (AR-15 style) - COMPLETELY REDESIGNED for realistic appearance
    const rifleGroup = new THREE.Group();
    
    // Main receiver body - more realistic shape
    const receiverGeometry = new THREE.BoxGeometry(0.25, 0.15, 0.08);
    const receiverMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial);
    receiver.position.set(0, 0, 0);
    rifleGroup.add(receiver);
    
    // Barrel - longer and more prominent
    const barrelGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.8, 12);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.4, 0.02, 0);
    rifleGroup.add(barrel);
    
    // Hand guard - more realistic
    const handguardGeometry = new THREE.BoxGeometry(0.3, 0.08, 0.08);
    const handguardMaterial = new THREE.MeshLambertMaterial({ color: 0x252525 });
    const handguard = new THREE.Mesh(handguardGeometry, handguardMaterial);
    handguard.position.set(0.15, 0.02, 0);
    rifleGroup.add(handguard);
    
    // Stock - adjustable looking
    const stockGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.25);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(-0.2, 0, 0);
    rifleGroup.add(stock);
    
    // Pistol grip - ergonomic shape
    const gripGeometry = new THREE.BoxGeometry(0.06, 0.15, 0.06);
    const gripMaterial = new THREE.MeshLambertMaterial({ color: 0x151515 });
    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.set(-0.08, -0.08, 0);
    rifleGroup.add(grip);
    
    // Magazine - more realistic
    const magGeometry = new THREE.BoxGeometry(0.05, 0.18, 0.08);
    const magMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const magazine = new THREE.Mesh(magGeometry, magMaterial);
    magazine.position.set(0, -0.12, 0.04);
    rifleGroup.add(magazine);
    
    // Front sight post
    const frontSightGeometry = new THREE.BoxGeometry(0.02, 0.06, 0.02);
    const sightMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const frontSight = new THREE.Mesh(frontSightGeometry, sightMaterial);
    frontSight.position.set(0.42, 0.08, 0);
    rifleGroup.add(frontSight);
    
    // Rear sight
    const rearSightGeometry = new THREE.BoxGeometry(0.03, 0.05, 0.02);
    const rearSight = new THREE.Mesh(rearSightGeometry, sightMaterial);
    rearSight.position.set(-0.05, 0.08, 0);
    rifleGroup.add(rearSight);
    
    // Picatinny rail system on top
    const railGeometry = new THREE.BoxGeometry(0.35, 0.025, 0.04);
    const railMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.set(0.1, 0.085, 0);
    rifleGroup.add(rail);
    
    // Charging handle
    const handleGeometry = new THREE.BoxGeometry(0.04, 0.03, 0.02);
    const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const chargingHandle = new THREE.Mesh(handleGeometry, handleMaterial);
    chargingHandle.position.set(0.05, 0.06, 0.05);
    rifleGroup.add(chargingHandle);
    
    // Ejection port cover
    const ejectionGeometry = new THREE.BoxGeometry(0.08, 0.04, 0.01);
    const ejectionMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const ejectionPort = new THREE.Mesh(ejectionGeometry, ejectionMaterial);
    ejectionPort.position.set(0.05, 0.02, -0.04);
    rifleGroup.add(ejectionPort);
    
    // Forward assist
    const assistGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.03, 8);
    const assistMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const forwardAssist = new THREE.Mesh(assistGeometry, assistMaterial);
    forwardAssist.rotation.z = Math.PI / 2;
    forwardAssist.position.set(0.12, 0.06, -0.04);
    rifleGroup.add(forwardAssist);
    
    rifleGroup.visible = false;
    // Set default position and rotation for rifle
    rifleGroup.position.set(0.3, -0.2, -0.5);
    rifleGroup.rotation.set(-0.1, 0.5, 0);
    this.weaponModels.set('rifle', rifleGroup);
    this.scene.add(rifleGroup);
    
    // Create pistol model (1911 style) - COMPLETELY REDESIGNED for realistic appearance
    const pistolGroup = new THREE.Group();
    
    // Slide - more realistic proportions
    const slideGeometry = new THREE.BoxGeometry(0.18, 0.06, 0.05);
    const slideMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const slide = new THREE.Mesh(slideGeometry, slideMaterial);
    slide.position.set(0, 0, 0);
    pistolGroup.add(slide);
    
    // Barrel
    const pistolBarrelGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8);
    const pistolBarrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const pistolBarrel = new THREE.Mesh(pistolBarrelGeometry, pistolBarrelMaterial);
    pistolBarrel.rotation.z = Math.PI / 2;
    pistolBarrel.position.set(0.12, 0, 0);
    pistolGroup.add(pistolBarrel);
    
    // Frame
    const frameGeometry = new THREE.BoxGeometry(0.14, 0.08, 0.04);
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(-0.04, -0.02, 0);
    pistolGroup.add(frame);
    
    // Grip safety area
    const gripAreaGeometry = new THREE.BoxGeometry(0.08, 0.06, 0.03);
    const gripAreaMaterial = new THREE.MeshLambertMaterial({ color: 0x151515 });
    const gripArea = new THREE.Mesh(gripAreaGeometry, gripAreaMaterial);
    gripArea.position.set(-0.06, -0.06, 0);
    pistolGroup.add(gripArea);
    
    // Main grip
    const pistolGripGeometry = new THREE.BoxGeometry(0.05, 0.08, 0.05);
    const pistolGripMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    const pistolGrip = new THREE.Mesh(pistolGripGeometry, pistolGripMaterial);
    pistolGrip.position.set(-0.12, -0.12, 0);
    pistolGroup.add(pistolGrip);
    
    // Trigger guard
    const guardGeometry = new THREE.TorusGeometry(0.025, 0.008, 6, 8, Math.PI);
    const guardMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const guard = new THREE.Mesh(guardGeometry, guardMaterial);
    guard.rotation.z = Math.PI / 2;
    guard.position.set(-0.04, -0.04, 0);
    pistolGroup.add(guard);
    
    // Trigger
    const triggerGeometry = new THREE.BoxGeometry(0.008, 0.02, 0.015);
    const triggerMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
    trigger.position.set(-0.04, -0.04, 0);
    pistolGroup.add(trigger);
    
    // Hammer
    const hammerGeometry = new THREE.BoxGeometry(0.01, 0.02, 0.01);
    const hammerMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const hammer = new THREE.Mesh(hammerGeometry, hammerMaterial);
    hammer.position.set(-0.02, 0.04, 0);
    hammer.rotation.z = 0.3;
    pistolGroup.add(hammer);
    
    // Front sight
    const frontSightPistol = new THREE.BoxGeometry(0.008, 0.025, 0.008);
    const sightMaterialPistol = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const frontSightP = new THREE.Mesh(frontSightPistol, sightMaterialPistol);
    frontSightP.position.set(0.13, 0.035, 0);
    pistolGroup.add(frontSightP);
    
    // Rear sight
    const rearSightPistol = new THREE.BoxGeometry(0.015, 0.025, 0.008);
    const rearSightP = new THREE.Mesh(rearSightPistol, sightMaterialPistol);
    rearSightP.position.set(-0.06, 0.035, 0);
    pistolGroup.add(rearSightP);
    
    // Slide serrations
    for (let i = 0; i < 5; i++) {
      const serrationGeometry = new THREE.BoxGeometry(0.002, 0.015, 0.001);
      const serrationMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      const serration = new THREE.Mesh(serrationGeometry, serrationMaterial);
      serration.position.set(-0.02 + i * 0.01, 0.06, 0.025);
      pistolGroup.add(serration);
    }
    
    // Magazine base plate
    const magPlateGeometry = new THREE.BoxGeometry(0.04, 0.01, 0.05);
    const magPlateMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const magPlate = new THREE.Mesh(magPlateGeometry, magPlateMaterial);
    magPlate.position.set(-0.04, -0.16, 0);
    pistolGroup.add(magPlate);
    
    pistolGroup.visible = false;
    // Set default position and rotation for pistol
    pistolGroup.position.set(0.25, -0.15, -0.4);
    pistolGroup.rotation.set(-0.05, 0.3, 0);
    this.weaponModels.set('pistol', pistolGroup);
    this.scene.add(pistolGroup);
    
    // Create melee weapon model (Sword)
    const meleeGroup = new THREE.Group();
    
    // Blade
    const bladeGeometry = new THREE.BoxGeometry(0.03, 0.4, 0.008);
    const bladeMaterial = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 }); // Silver color
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.set(0, 0.2, 0);
    meleeGroup.add(blade);
    
    // Crossguard
    const crossguardGeometry = new THREE.BoxGeometry(0.08, 0.01, 0.02);
    const crossguardMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Bronze color
    const crossguard = new THREE.Mesh(crossguardGeometry, crossguardMaterial);
    crossguard.position.set(0, 0.05, 0);
    meleeGroup.add(crossguard);
    
    // Handle/Grip
    const swordHandleGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.1, 8);
    const swordHandleMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 }); // Dark brown
    const handle = new THREE.Mesh(swordHandleGeometry, swordHandleMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 0, 0);
    meleeGroup.add(handle);
    
    // Pommel
    const pommelGeometry = new THREE.SphereGeometry(0.012, 8, 8);
    const pommelMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Bronze color
    const pommel = new THREE.Mesh(pommelGeometry, pommelMaterial);
    pommel.position.set(0, -0.05, 0);
    meleeGroup.add(pommel);
    
    // Sharp tip
    const tipGeometry = new THREE.ConeGeometry(0.003, 0.02, 8);
    const tipMaterial = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 }); // Silver color
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    tip.position.set(0, 0.41, 0);
    meleeGroup.add(tip);
    
    meleeGroup.visible = false;
    // Set default position and rotation for melee weapon
    meleeGroup.position.set(0.2, -0.1, -0.3);
    meleeGroup.rotation.set(0.2, 0.8, 0.1);
    this.weaponModels.set('melee', meleeGroup);
    this.scene.add(meleeGroup);
    
    // Set initial weapon
    this.switchWeapon('rifle');
    
    // Create hand model
    this.createHandModel();
    
    // Ensure initial visibility
    if (this.currentWeaponModel) {
      this.currentWeaponModel.visible = true;
      console.log('Initial weapon model visibility set to true');
    }
    if (this.handModel) {
      this.handModel.visible = true;
      console.log('Initial hand model visibility set to true');
    }
    
    console.log('Enhanced realistic weapon models created');
  }

  private createHandModel(): void {
    const handGroup = new THREE.Group();
    
    // Palm (much smaller and proportional)
    const palmGeometry = new THREE.BoxGeometry(0.05, 0.06, 0.015);
    const palmMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 }); // Skin color
    const palm = new THREE.Mesh(palmGeometry, palmMaterial);
    palm.position.set(0, 0, 0);
    handGroup.add(palm);
    
    // Thumb (much smaller)
    const thumbGeometry = new THREE.BoxGeometry(0.015, 0.03, 0.012);
    const thumbMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 });
    const thumb = new THREE.Mesh(thumbGeometry, thumbMaterial);
    thumb.position.set(0.025, 0.015, 0.008);
    thumb.rotation.z = -0.3;
    handGroup.add(thumb);
    
    // Index finger (extended for trigger - much smaller)
    const indexGeometry = new THREE.BoxGeometry(0.012, 0.04, 0.01);
    const indexMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 });
    const index = new THREE.Mesh(indexGeometry, indexMaterial);
    index.position.set(0.012, -0.04, 0.008);
    handGroup.add(index);
    
    // Middle finger (much smaller)
    const middleGeometry = new THREE.BoxGeometry(0.012, 0.044, 0.01);
    const middleMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 });
    const middle = new THREE.Mesh(middleGeometry, middleMaterial);
    middle.position.set(0, -0.044, 0.008);
    handGroup.add(middle);
    
    // Ring finger (much smaller)
    const ringGeometry = new THREE.BoxGeometry(0.012, 0.04, 0.01);
    const ringMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(-0.012, -0.04, 0.008);
    handGroup.add(ring);
    
    // Pinky finger (much smaller)
    const pinkyGeometry = new THREE.BoxGeometry(0.01, 0.032, 0.01);
    const pinkyMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 });
    const pinky = new THREE.Mesh(pinkyGeometry, pinkyMaterial);
    pinky.position.set(-0.024, -0.032, 0.008);
    handGroup.add(pinky);
    
    // Add some detail to the hand (much smaller)
    const knuckleGeometry = new THREE.BoxGeometry(0.032, 0.008, 0.012);
    const knuckleMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 });
    const knuckles = new THREE.Mesh(knuckleGeometry, knuckleMaterial);
    knuckles.position.set(0, -0.024, 0.01);
    handGroup.add(knuckles);
    
    this.handModel = handGroup;
    this.scene.add(handGroup);
    
    console.log('Realistic hand model created');
  }

  private setupEventListeners(): void {
    // Bind event handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this);
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    // Mouse events
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('click', this.handleClick);
    
    // Pointer lock
    this.renderer.domElement.addEventListener('click', () => {
      this.renderer.domElement.requestPointerLock();
    });
    
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    
    // Window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    console.log('Event listeners setup');
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.keys.add(event.key.toLowerCase());
    console.log('Key pressed:', event.key.toLowerCase());
    
    // Weapon switching
    if (event.code === 'Digit1') {
      this.switchWeapon('rifle');
    } else if (event.code === 'Digit2') {
      this.switchWeapon('pistol');
    } else if (event.code === 'Digit3') {
      this.switchWeapon('melee');
    }
    
    // Reload
    if (event.code === 'KeyR') {
      this.reloadWeapon();
    }
    
    // Movement controls
    if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
      this.startCrouch();
    }
    
    if (event.code === 'KeyC') {
      this.startSlide();
    }
    
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      this.startSprint();
    }
    
    // Jumping - only if game is active
    if (event.code === 'Space' && this.gameActive) {
      this.jump();
    }
    
    // Melee attack with V key
    if (event.code === 'KeyV') {
      this.meleeAttack();
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.key.toLowerCase());
    
    // Movement controls
    if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
      this.stopCrouch();
    }
    
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      this.stopSprint();
    }
  }

  // COMPLETELY REWRITTEN MOUSE LOOK SYSTEM
  private updateCameraRotation(): void {
    // Convert yaw/pitch to camera rotation
    // Yaw rotates around Y axis, pitch rotates around X axis
    this.camera.rotation.order = 'YXZ'; // Important for FPS controls
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
  
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isPointerLocked) return;
    
    // COMPLETELY NEW MOUSE LOOK IMPLEMENTATION
    // This is a standard FPS mouse look system
    
    // Apply mouse movement to yaw and pitch
    this.yaw -= event.movementX * this.mouseSensitivity;
    this.pitch -= event.movementY * this.mouseSensitivity;
    
    // Clamp pitch to prevent over-rotation (looking straight up/down)
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
    
    // Normalize yaw to prevent accumulation issues
    if (this.yaw > Math.PI) this.yaw -= Math.PI * 2;
    if (this.yaw < -Math.PI) this.yaw += Math.PI * 2;
    
    // Update camera rotation
    this.updateCameraRotation();
    
    // Debug logging for significant movements
    if (Math.abs(event.movementX) > 1 || Math.abs(event.movementY) > 1) {
      console.log('Mouse look:', {
        movementX: event.movementX,
        movementY: event.movementY,
        yaw: this.yaw.toFixed(3),
        pitch: this.pitch.toFixed(3),
        camRotX: this.camera.rotation.x.toFixed(3),
        camRotY: this.camera.rotation.y.toFixed(3)
      });
    }
  }

  private handleClick(): void {
    console.log('Click - attempting to lock pointer');
    if (!this.isPointerLocked) {
      this.renderer.domElement.requestPointerLock();
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    if (this.isPointerLocked) {
      if (event.button === 0) { // Left mouse button
        // Check if melee weapon is equipped
        if (this.currentWeapon === 'melee') {
          this.meleeAttack();
        } else {
          this.isMouseDown = true;
          this.startFiring();
        }
      } else if (event.button === 2) { // Right mouse button - Aim Down Sights
        this.startAiming();
        event.preventDefault(); // Prevent context menu
      }
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (event.button === 0) { // Left mouse button
      this.isMouseDown = false;
      this.stopFiring();
    } else if (event.button === 2) { // Right mouse button - Stop aiming
      this.stopAiming();
      event.preventDefault(); // Prevent context menu
    }
  }

  private startAiming(): void {
    console.log('Starting aiming');
    this.isAiming = true;
    
    // Adjust weapon position for ADS - align sights with center of screen (Kimme und Korn)
    if (this.currentWeaponModel) {
      switch (this.currentWeapon) {
        case 'rifle':
          // Position rifle so sights align with center - proper Kimme und Korn alignment
          // Move weapon to center of screen for proper sight alignment
          this.currentWeaponModel.position.set(0, -0.05, -0.2);
          this.currentWeaponModel.rotation.set(0, 0, 0); // Center the weapon
          break;
        case 'pistol':
          // Position pistol so sights align with center - proper Kimme und Korn alignment
          // Move weapon to center of screen for proper sight alignment
          this.currentWeaponModel.position.set(0, -0.04, -0.15);
          this.currentWeaponModel.rotation.set(0, 0, 0); // Center the weapon
          break;
        case 'melee':
          // Melee weapons don't have sights, but bring to center
          this.currentWeaponModel.position.set(0, -0.05, -0.2);
          this.currentWeaponModel.rotation.set(0, 0, 0); // Center the weapon
          break;
      }
    }
    
    // Adjust camera FOV for zoom effect (proper ADS zoom)
    this.camera.fov = 50; // Proper zoom for aiming
    this.camera.updateProjectionMatrix();
    
    // Notify UI about aiming state change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aimStateChanged', { 
        detail: { isAiming: true } 
      }));
    }
  }

  private stopAiming(): void {
    console.log('Stopping aiming');
    this.isAiming = false;
    
    // Reset weapon position
    if (this.currentWeaponModel) {
      switch (this.currentWeapon) {
        case 'rifle':
          this.currentWeaponModel.position.set(0.3, -0.2, -0.5);
          this.currentWeaponModel.rotation.set(-0.1, 0.5, 0);
          break;
        case 'pistol':
          this.currentWeaponModel.position.set(0.25, -0.15, -0.4);
          this.currentWeaponModel.rotation.set(-0.05, 0.3, 0);
          break;
        case 'melee':
          this.currentWeaponModel.position.set(0.2, -0.1, -0.3);
          this.currentWeaponModel.rotation.set(0.2, 0.8, 0.1);
          break;
      }
    }
    
    // Reset camera FOV
    this.camera.fov = 75; // Normal FOV
    this.camera.updateProjectionMatrix();
    
    // Notify UI about aiming state change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aimStateChanged', { 
        detail: { isAiming: false } 
      }));
    }
  }

  private startFiring(): void {
    const weapon = this.weapons.get(this.currentWeapon);
    if (!weapon || weapon.isReloading) return;

    if (weapon.fireMode === 'auto') {
      // Full auto - start continuous firing
      this.fireShot(); // Fire first shot immediately
      const fireRate = 60000 / weapon.fireRate; // Convert RPM to delay in ms
      this.autoFireInterval = window.setInterval(() => {
        this.fireShot();
      }, fireRate);
    } else {
      // Semi auto - fire single shot
      this.fireShot();
    }
  }

  private stopFiring(): void {
    if (this.autoFireInterval) {
      clearInterval(this.autoFireInterval);
      this.autoFireInterval = null;
    }
  }

  private fireShot(): void {
    const weapon = this.weapons.get(this.currentWeapon);
    if (!weapon || weapon.currentAmmo <= 0 || weapon.isReloading) {
      this.stopFiring(); // Stop auto fire if can't shoot
      return;
    }

    const currentTime = Date.now();
    const fireRateDelay = 60000 / weapon.fireRate; // Convert RPM to delay in ms

    if (currentTime - weapon.lastFireTime < fireRateDelay) {
      return; // Still on cooldown
    }

    // Perform shooting
    weapon.currentAmmo--;
    weapon.lastFireTime = currentTime;
    
    console.log('Shot fired! Ammo remaining:', weapon.currentAmmo);
    
    // Calculate hit detection and damage
    this.calculateHitAndDamage(weapon);
    
    // Create visual effect
    this.createShootEffect();
    
    // Dispatch custom event for UI update
    window.dispatchEvent(new CustomEvent('weaponFired', {
      detail: { weapon: this.currentWeapon, ammo: weapon.currentAmmo }
    }));

    // Stop auto fire if out of ammo
    if (weapon.currentAmmo <= 0) {
      this.stopFiring();
    }
  }

  private calculateHitAndDamage(weapon: any): void {
    // Simple raycast for hit detection
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera); // Center of screen
    
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitPoint = hit.point;
      
      // Calculate damage based on weapon and distance
      const distance = this.position.distanceTo(hitPoint);
      const baseDamage = weapon.damage;
      
      // Damage falloff with distance
      let damage = baseDamage;
      if (distance > 20) {
        damage *= Math.max(0.3, 1 - (distance - 20) / 80); // Reduce damage beyond 20 units
      }
      
      // Random damage variation (±15%)
      const variation = 0.85 + Math.random() * 0.3;
      damage = Math.round(damage * variation);
      
      // Check for headshot (simple check based on hit point height)
      const isHeadshot = hitPoint.y > (this.position.y - 0.5);
      
      // Check for critical hit (10% chance)
      const isCritical = Math.random() < 0.1;
      
      if (isHeadshot) {
        damage = Math.round(damage * 1.5); // Headshot multiplier
      }
      
      if (isCritical) {
        damage = Math.round(damage * 1.2); // Critical hit multiplier
      }
      
      console.log(`Hit detected! Distance: ${distance.toFixed(1)}, Damage: ${damage}, Headshot: ${isHeadshot}, Critical: ${isCritical}`);
      
      // Check if hit is an enemy (not environment objects)
      const hitObject = hit.object;
      let isEnemy = false;
      
      // Check if the hit object has enemy properties or is part of enemy group
      if (hitObject.userData && hitObject.userData.type === 'enemy') {
        isEnemy = true;
      } else if (hitObject.parent && hitObject.parent.userData && hitObject.parent.userData.type === 'enemy') {
        isEnemy = true;
      }
      
      // Create hit effect
      this.createHitEffect(hitPoint, isHeadshot);
      
      // Play hit sound
      if (isHeadshot) {
        this.soundManager.playSound('headshot', 0.8);
      } else if (isCritical) {
        this.soundManager.playSound('critical', 0.7);
      } else {
        this.soundManager.playSound('hit', 0.6);
      }
      
      // Create blood effect if hitting enemy
      if (isEnemy) {
        this.bloodEffect.createBloodSplatter(hitPoint, isHeadshot ? 1.5 : 1.0);
        this.bloodEffect.createBloodPool(hitPoint, isHeadshot ? 1.2 : 0.8);
      }
      
      // Show damage indicator near crosshair
      this.damageIndicator.showCrosshairDamage(damage, isHeadshot, isCritical);
      
      // Trigger hit animation
      let hitType: 'normal' | 'headshot' | 'critical' = 'normal';
      if (isHeadshot) {
        hitType = 'headshot';
      } else if (isCritical) {
        hitType = 'critical';
      }
      this.hitAnimation.triggerHitEffect(hitType);
      
      // Only dispatch damage event if hitting an enemy
      if (isEnemy) {
        // Dispatch hit event for game logic and UI feedback
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('enemyHit', {
            detail: {
              position: hitPoint,
              damage: damage,
              isHeadshot: isHeadshot,
              isCritical: isCritical,
              distance: distance
            }
          }));
        }
      }
    } else {
      console.log('Shot missed - no hit detected');
    }
  }

  private createHitEffect(hitPoint: THREE.Vector3, isHeadshot: boolean): void {
    // Create impact effect at hit location
    const impactGroup = new THREE.Group();
    
    // Impact spark
    const sparkGeometry = new THREE.SphereGeometry(0.05, 4, 4);
    const sparkMaterial = new THREE.MeshBasicMaterial({ 
      color: isHeadshot ? 0xff4444 : 0xffaa00,
      transparent: true,
      opacity: 1.0
    });
    const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
    spark.position.copy(hitPoint);
    impactGroup.add(spark);
    
    // Impact particles
    for (let i = 0; i < 5; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.02, 3, 3);
      const particleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff6600,
        transparent: true,
        opacity: 0.8
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      // Random position around hit point
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      );
      particle.position.copy(hitPoint).add(offset);
      impactGroup.add(particle);
    }
    
    this.scene.add(impactGroup);
    
    // Remove impact effect after short duration
    setTimeout(() => {
      this.scene.remove(impactGroup);
    }, 200);
  }

  private handlePointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    console.log('Pointer lock changed:', this.isPointerLocked);
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private switchWeapon(weaponName: string): void {
    if (this.weapons.has(weaponName)) {
      // Hide current weapon model
      if (this.currentWeaponModel) {
        this.currentWeaponModel.visible = false;
      }
      
      this.currentWeapon = weaponName;
      console.log('Switched to weapon:', weaponName);
      
      // Show new weapon model with correct position based on aiming state
      this.currentWeaponModel = this.weaponModels.get(weaponName) || null;
      if (this.currentWeaponModel) {
        this.currentWeaponModel.visible = true;
        
        // Adjust position based on aiming state
        if (this.isAiming) {
          // Set ADS position - align sights with center
          switch (weaponName) {
            case 'rifle':
              this.currentWeaponModel.position.set(0, -0.05, -0.2);
              this.currentWeaponModel.rotation.set(0, 0, 0);
              break;
            case 'pistol':
              this.currentWeaponModel.position.set(0, -0.04, -0.15);
              this.currentWeaponModel.rotation.set(0, 0, 0);
              break;
            case 'melee':
              this.currentWeaponModel.position.set(0, -0.05, -0.2);
              this.currentWeaponModel.rotation.set(0, 0, 0);
              break;
          }
        } else {
          // Set default position
          switch (weaponName) {
            case 'rifle':
              this.currentWeaponModel.position.set(0.3, -0.2, -0.5);
              this.currentWeaponModel.rotation.set(-0.1, 0.5, 0);
              break;
            case 'pistol':
              this.currentWeaponModel.position.set(0.25, -0.15, -0.4);
              this.currentWeaponModel.rotation.set(-0.05, 0.3, 0);
              break;
            case 'melee':
              this.currentWeaponModel.position.set(0.2, -0.1, -0.3);
              this.currentWeaponModel.rotation.set(0.2, 0.8, 0.1);
              break;
          }
        }
        
        console.log(`Weapon model set to visible: ${this.currentWeaponModel.visible}`);
      }
      
      // Dispatch custom event for UI update
      window.dispatchEvent(new CustomEvent('weaponChanged', {
        detail: { weapon: weaponName, ammo: this.weapons.get(weaponName).currentAmmo }
      }));
    }
  }

  private reloadWeapon(): void {
    const weapon = this.weapons.get(this.currentWeapon);
    if (weapon && weapon.currentAmmo < weapon.magazineSize && !weapon.isReloading) {
      console.log('Reloading weapon...');
      weapon.isReloading = true;
      weapon.reloadStartTime = Date.now();
      
      // Dispatch custom event for UI update
      window.dispatchEvent(new CustomEvent('weaponReloadStart', {
        detail: { weapon: this.currentWeapon, reloadTime: weapon.reloadTime }
      }));
    }
  }

  // Movement control methods
  private startCrouch(): void {
    const currentTime = Date.now();
    if (!this.isCrouching && !this.isSliding && (currentTime - this.lastCrouchTime > this.crouchCooldownTime)) {
      this.isCrouching = true;
      this.lastCrouchTime = currentTime;
      this.updatePlayerHeight();
      console.log('Started crouching');
    } else if (currentTime - this.lastCrouchTime <= this.crouchCooldownTime) {
      console.log(`Crouch on cooldown: ${Math.ceil((this.crouchCooldownTime - (currentTime - this.lastCrouchTime)) / 1000)}s remaining`);
    }
  }

  private stopCrouch(): void {
    if (this.isCrouching) {
      this.isCrouching = false;
      this.updatePlayerHeight();
      console.log('Stopped crouching');
    }
  }

  private startSlide(): void {
    const currentTime = Date.now();
    if (!this.isSliding && !this.isCrouching && this.isSprinting && (currentTime - this.lastSlideTime > this.slideCooldownTime)) {
      this.isSliding = true;
      this.isCrouching = true;
      this.lastSlideTime = currentTime;
      this.updatePlayerHeight();
      
      // Set slide direction based on current movement
      const moveDirection = this.getCurrentMoveDirection();
      if (moveDirection.length() > 0) {
        this.slideDirection.copy(moveDirection.normalize());
      }
      
      console.log('Started sliding');
    } else if (currentTime - this.lastSlideTime <= this.slideCooldownTime) {
      console.log(`Slide on cooldown: ${Math.ceil((this.slideCooldownTime - (currentTime - this.lastSlideTime)) / 1000)}s remaining`);
    } else if (!this.isSprinting) {
      console.log('Can only slide while sprinting');
    }
  }

  private startSprint(): void {
    if (!this.isSprinting && !this.isCrouching) {
      this.isSprinting = true;
      console.log('Started sprinting');
    }
  }

  private stopSprint(): void {
    if (this.isSprinting) {
      this.isSprinting = false;
      console.log('Stopped sprinting');
    }
  }

  private jump(): void {
    const currentTime = Date.now();
    
    // Battlefield 2042 style jumping - more responsive
    if (!this.isJumping && !this.isSliding && (currentTime - this.lastJumpTime > this.jumpCooldown)) {
      // Can jump while crouching (Battlefield style)
      if (this.isCrouching) {
        // Stand up quickly and jump
        this.isCrouching = false;
        this.updatePlayerHeight();
      }
      
      this.isJumping = true;
      this.jumpVelocity = this.jumpForce;
      this.lastJumpTime = currentTime;
      console.log('Battlefield 2042 style jump!');
    }
  }

  private meleeAttack(): void {
    // Only allow melee attacks if currently holding melee weapon
    if (this.currentWeapon === 'melee') {
      const weapon = this.weapons.get('melee');
      if (weapon && !weapon.isReloading) {
        const currentTime = Date.now();
        const timeSinceLastFire = currentTime - weapon.lastFireTime;
        const minTimeBetweenShots = 60000 / weapon.fireRate; // Convert RPM to milliseconds
        
        if (timeSinceLastFire >= minTimeBetweenShots) {
          weapon.lastFireTime = currentTime;
          
          // Create melee attack effect
          this.createMeleeEffect();
          
          // Create sword swing animation
          this.createSwordSwingEffect();
          
          // Dispatch melee attack event
          window.dispatchEvent(new CustomEvent('weaponFired', {
            detail: {
              weapon: 'melee',
              ammo: weapon.currentAmmo,
              isMelee: true
            }
          }));
          
          console.log('Melee attack!');
        }
      }
    } else {
      // Switch to melee weapon if not already equipped
      this.switchWeapon('melee');
    }
  }

  private createMeleeEffect(): void {
    // Simple melee swipe effect
    if (this.currentWeaponModel) {
      // Create a quick swipe animation
      const originalRotation = this.currentWeaponModel.rotation.z;
      const swipeDuration = 200; // milliseconds
      const startTime = Date.now();
      
      const animateSwipe = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / swipeDuration, 1);
        
        if (this.currentWeaponModel) {
          if (progress < 0.5) {
            // Swipe forward
            this.currentWeaponModel.rotation.z = originalRotation + (Math.PI / 4) * (progress * 2);
          } else {
            // Return to original position
            this.currentWeaponModel.rotation.z = originalRotation + (Math.PI / 4) * (2 - progress * 2);
          }
        }
        
        if (progress < 1) {
          requestAnimationFrame(animateSwipe);
        } else {
          if (this.currentWeaponModel) {
            this.currentWeaponModel.rotation.z = originalRotation;
          }
        }
      };
      
      animateSwipe();
    }
  }

  private createSwordSwingEffect(): void {
    // Create cyan energy sword swing effect with trail
    if (!this.currentWeaponModel) return;
    
    const swordGroup = new THREE.Group();
    
    // Create energy blade effect
    const bladeGeometry = new THREE.BoxGeometry(0.05, 0.5, 0.01);
    const bladeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00ffff, // Cyan color
      transparent: true,
      opacity: 0.8,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5
    });
    const energyBlade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    energyBlade.position.set(0.3, 0, 0);
    swordGroup.add(energyBlade);
    
    // Create trail effect
    const trailGeometry = new THREE.PlaneGeometry(0.8, 0.1);
    const trailMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.position.set(0.2, 0, 0);
    swordGroup.add(trail);
    
    // Position sword group relative to camera
    swordGroup.position.copy(this.camera.position);
    swordGroup.rotation.copy(this.camera.rotation);
    
    // Offset sword to right side of camera
    const swordOffset = new THREE.Vector3(0.3, -0.1, -0.5);
    swordOffset.applyQuaternion(this.camera.quaternion);
    swordGroup.position.add(swordOffset);
    
    this.scene.add(swordGroup);
    
    // Animate sword swing
    const animationDuration = 300; // 300ms
    const startTime = Date.now();
    const startRotation = -Math.PI / 6;
    const endRotation = Math.PI / 3;
    
    const animateSwordSwing = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Swing rotation
      const currentRotation = startRotation + (endRotation - startRotation) * progress;
      swordGroup.rotation.z = currentRotation;
      
      // Scale effect for impact
      const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
      energyBlade.scale.set(scale, scale, scale);
      
      // Fade out trail
      trail.material.opacity = 0.6 * (1 - progress);
      
      // Emissive intensity pulse
      bladeMaterial.emissiveIntensity = 0.5 + Math.sin(progress * Math.PI * 2) * 0.3;
      
      if (progress < 1) {
        requestAnimationFrame(animateSwordSwing);
      } else {
        // Remove sword effect after animation
        this.scene.remove(swordGroup);
        bladeMaterial.dispose();
        trailMaterial.dispose();
      }
    };
    
    animateSwordSwing();
  }

  private updatePlayerHeight(): void {
    // Only update height if not jumping (let jumping physics handle height when in air)
    if (!this.isJumping) {
      const targetHeight = this.isCrouching ? this.crouchHeight : this.standHeight;
      this.position.y = targetHeight;
    }
    this.camera.position.copy(this.position);
  }

  private getCurrentMoveDirection(): THREE.Vector3 {
    const moveDirection = new THREE.Vector3(0, 0, 0);
    
    // Get camera forward and right vectors for movement (only horizontal rotation)
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    
    // Apply only horizontal camera rotation (yaw) to these vectors
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    
    // Calculate movement direction based on input
    if (this.keys.has('w')) {
      moveDirection.add(forward);
    }
    if (this.keys.has('s')) {
      moveDirection.sub(forward);
    }
    if (this.keys.has('a')) {
      moveDirection.sub(right);
    }
    if (this.keys.has('d')) {
      moveDirection.add(right);
    }
    
    return moveDirection;
  }

  
  private createShootEffect(): void {
    // Create a more realistic muzzle flash with multiple components
    const flashGroup = new THREE.Group();
    
    // Main bright flash - smaller size
    const flashGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffaa,
      transparent: true,
      opacity: 0.9
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flashGroup.add(flash);
    
    // Outer glow - smaller size
    const glowGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff6600,
      transparent: true,
      opacity: 0.6
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    flashGroup.add(glow);
    
    // Directional flame cone - smaller size
    const flameGeometry = new THREE.ConeGeometry(0.06, 0.15, 6);
    const flameMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff4400,
      transparent: true,
      opacity: 0.8
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.rotation.z = Math.PI / 2;
    flame.position.set(0.08, 0, 0);
    flashGroup.add(flame);
    
    // Position flash at weapon barrel with correct offset for each weapon
    if (this.currentWeaponModel) {
      let barrelPosition;
      if (this.currentWeapon === 'rifle') {
        // Rifle barrel end position - adjusted for new larger model and rotation
        barrelPosition = new THREE.Vector3(0.5, 0.02, 0);
      } else {
        // Pistol barrel end position - adjusted for new larger model and rotation
        barrelPosition = new THREE.Vector3(0.15, 0, 0);
      }
      
      // Apply weapon rotation to barrel position
      barrelPosition.applyQuaternion(this.currentWeaponModel.quaternion);
      flashGroup.position.copy(this.currentWeaponModel.position).add(barrelPosition);
      flashGroup.rotation.copy(this.currentWeaponModel.rotation);
      
      console.log('Muzzle flash positioned at weapon barrel:', flashGroup.position);
    } else {
      // Fallback to camera position - closer distance
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(this.camera.quaternion);
      flashGroup.position.copy(this.camera.position).add(direction.multiplyScalar(0.25));
      flashGroup.rotation.copy(this.camera.rotation);
      
      console.log('Muzzle flash positioned at camera (fallback):', flashGroup.position);
    }
    
    this.scene.add(flashGroup);
    
    // Animate flash fade-out
    let opacity = 1.0;
    let scale = 1.0;
    const fadeInterval = setInterval(() => {
      opacity -= 0.2;
      scale += 0.1;
      
      if (opacity <= 0) {
        clearInterval(fadeInterval);
        this.scene.remove(flashGroup);
        console.log('Muzzle flash removed');
      } else {
        // Update flash materials
        flashMaterial.opacity = opacity * 0.9;
        glowMaterial.opacity = opacity * 0.6;
        flameMaterial.opacity = opacity * 0.8;
        
        // Scale up the flash for expansion effect
        flash.scale.set(scale, scale, scale);
        glow.scale.set(scale * 1.2, scale * 1.2, scale * 1.2);
        flame.scale.set(scale, scale, scale);
      }
    }, 15);
  }

  private updateMovement(): void {
    // Handle reload animation
    this.updateReload();
    
    // Handle cooldowns
    this.updateCooldowns();
    
    // Handle jumping physics
    if (this.isJumping) {
      // Apply gravity
      this.jumpVelocity -= this.gravity * 0.016; // Assuming 60 FPS
      
      // Update position
      this.position.y += this.jumpVelocity * 0.016;
      
      // Check if landed
      const targetGroundY = this.isCrouching ? this.crouchHeight : this.standHeight;
      if (this.position.y <= targetGroundY) {
        this.position.y = targetGroundY;
        this.isJumping = false;
        this.jumpVelocity = 0;
        console.log('Landed with improved jump mechanics');
      }
    }
    
    // Handle sliding physics
    if (this.isSliding) {
      this.updateSlide();
    }
    
    // Get current movement direction
    const moveDirection = this.getCurrentMoveDirection();
    
    // Determine current speed based on state
    let currentSpeed = this.normalSpeed;
    if (this.isSliding) {
      currentSpeed = this.slideSpeed;
    } else if (this.isSprinting && !this.isCrouching) {
      currentSpeed = this.sprintSpeed;
    } else if (this.isCrouching) {
      currentSpeed = this.normalSpeed * 0.5; // Slower when crouching
    } else if (this.isJumping) {
      currentSpeed = this.normalSpeed * this.airControl; // Improved air control
    }
    
    // Apply movement if there's any input
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      
      const moveDistance = currentSpeed * 0.016; // Assuming 60 FPS
      const newPosition = this.position.clone().add(moveDirection.multiplyScalar(moveDistance));
      
      // Enhanced collision detection with obstacles
      let canMove = true;
      const playerHeight = this.isCrouching ? this.crouchHeight : this.standHeight;
      const playerRadius = 0.3; // Player collision radius
      
      // Check collision with all obstacles
      const obstacles: THREE.Mesh[] = [];
      this.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry && child !== this.ground) {
          obstacles.push(child);
        }
      });
      
      // Check if new position collides with any obstacle
      for (const obstacle of obstacles) {
        const box = new THREE.Box3().setFromObject(obstacle);
        const playerBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(newPosition.x, newPosition.y - playerHeight/2, newPosition.z),
          new THREE.Vector3(playerRadius * 2, playerHeight, playerRadius * 2)
        );
        
        if (box.intersectsBox(playerBox)) {
          canMove = false;
          
          // Try to slide along the wall if moving horizontally
          if (this.isJumping || this.jumpVelocity > 0) {
            // Allow some sliding when jumping against walls
            const slideDirection = moveDirection.clone();
            slideDirection.y = 0; // Only horizontal sliding
            slideDirection.normalize();
            
            const slideDistance = moveDistance * 0.3; // Reduced slide distance
            const slidePosition = this.position.clone().add(slideDirection.multiplyScalar(slideDistance));
            
            // Check if slide position is valid
            const slideBox = new THREE.Box3().setFromCenterAndSize(
              new THREE.Vector3(slidePosition.x, slidePosition.y - playerHeight/2, slidePosition.z),
              new THREE.Vector3(playerRadius * 2, playerHeight, playerRadius * 2)
            );
            
            if (!box.intersectsBox(slideBox)) {
              this.position.copy(slidePosition);
              this.camera.position.copy(this.position);
              canMove = true; // Mark as successful slide
            }
          }
          break; // Exit loop if collision found and no slide possible
        }
      }
      
      if (canMove) {
        this.position.copy(newPosition);
        this.camera.position.copy(this.position);
        // Update hit animation camera position
        if (this.hitAnimation) {
          this.hitAnimation.updateCameraPosition(this.position);
        }
      }
    }
  }

  private updateCooldowns(): void {
    const currentTime = Date.now();
    
    // Update crouch cooldown
    if (currentTime - this.lastCrouchTime < this.crouchCooldownTime) {
      this.crouchCooldown = this.crouchCooldownTime - (currentTime - this.lastCrouchTime);
    } else {
      this.crouchCooldown = 0;
    }
    
    // Update slide cooldown
    if (currentTime - this.lastSlideTime < this.slideCooldownTime) {
      this.slideCooldown = this.slideCooldownTime - (currentTime - this.lastSlideTime);
    } else {
      this.slideCooldown = 0;
    }
    
    // Update jump cooldown
    if (currentTime - this.lastJumpTime < this.jumpCooldownTime) {
      this.jumpCooldown = this.jumpCooldownTime - (currentTime - this.lastJumpTime);
    } else {
      this.jumpCooldown = 0;
    }
  }

  private updateSlide(): void {
    // Battlefield 2042 style slide physics
    if (this.slideDirection.length() > 0) {
      const slideDistance = this.slideSpeed * 0.016 * this.slideMomentum * this.slideBoost;
      const slideMovement = this.slideDirection.clone().multiplyScalar(slideDistance);
      const newPosition = this.position.clone().add(slideMovement);
      
      // Check collision
      let canMove = true;
      this.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry && child !== this.scene.children[0]) {
          const distance = newPosition.distanceTo(child.position);
          if (distance < 2) {
            canMove = false;
          }
        }
      });
      
      if (canMove) {
        this.position.copy(newPosition);
        this.camera.position.copy(this.position);
        // Update hit animation camera position
        if (this.hitAnimation) {
          this.hitAnimation.updateCameraPosition(this.position);
        }
      } else {
        // Stop sliding if hit obstacle
        this.slideDirection.set(0, 0, 0);
        this.isSliding = false;
      }
      
      // Battlefield 2042 style gradual deceleration
      this.slideSpeed -= this.slideDeceleration * 0.016;
      this.slideMomentum *= 0.992; // Gradual momentum reduction for longer slides
      this.slideBoost *= 0.98; // Reduce initial boost
      
      if (this.slideSpeed <= this.normalSpeed || this.slideMomentum < 0.3) {
        // Stop sliding when speed drops to normal or momentum is lost
        this.isSliding = false;
        this.slideSpeed = 12; // Reset slide speed
        this.slideDirection.set(0, 0, 0);
        this.slideMomentum = 1.5; // Reset momentum
        this.slideBoost = 1.2; // Reset boost
        
        // Check if we should remain crouched or stand up
        if (this.keys.has('controllleft') || this.keys.has('controlright')) {
          this.isCrouching = true; // Stay crouched if control is still held
        } else {
          this.isCrouching = false;
          this.updatePlayerHeight();
        }
        
        console.log('Battlefield 2042 style slide ended');
      }
    }
  }

  private updateReload(): void {
    const weapon = this.weapons.get(this.currentWeapon);
    if (weapon && weapon.isReloading) {
      const reloadProgress = Date.now() - weapon.reloadStartTime;
      
      if (reloadProgress >= weapon.reloadTime) {
        // Reload complete
        weapon.currentAmmo = weapon.magazineSize;
        weapon.isReloading = false;
        
        console.log('Reload complete!');
        
        // Dispatch custom event for UI update
        window.dispatchEvent(new CustomEvent('weaponReloaded', {
          detail: { weapon: this.currentWeapon, ammo: weapon.currentAmmo }
        }));
      }
    }
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Update movement
    this.updateMovement();
    
    // Update weapon position and rotation
    this.updateWeaponPosition();
    
    // Rotate the cube for visual feedback
    const cube = this.scene.children.find(child => child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry);
    if (cube && cube.position.y === 0.5) { // Only rotate the original cube
      cube.rotation.y += 0.01;
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  private updateWeaponPosition(): void {
    if (this.currentWeaponModel) {
      // Check if aiming to determine position
      if (this.isAiming) {
        // ADS position - center the weapon for proper Kimme und Korn alignment
        let weaponOffset;
        if (this.currentWeapon === 'rifle') {
          weaponOffset = new THREE.Vector3(0, -0.05, -0.2);
        } else {
          weaponOffset = new THREE.Vector3(0, -0.04, -0.15);
        }
        
        weaponOffset.applyQuaternion(this.camera.quaternion);
        this.currentWeaponModel.position.copy(this.camera.position).add(weaponOffset);
        
        // Center weapon rotation for ADS
        this.currentWeaponModel.rotation.copy(this.camera.rotation);
        this.currentWeaponModel.rotation.set(0, 0, 0); // Center perfectly
      } else {
        // Default hip-fire position
        let weaponOffset;
        if (this.currentWeapon === 'rifle') {
          // Rifle position - adjusted for larger model
          weaponOffset = new THREE.Vector3(0.15, -0.08, -0.25);
        } else {
          // Pistol position - adjusted for larger model
          weaponOffset = new THREE.Vector3(0.12, -0.06, -0.2);
        }
        
        weaponOffset.applyQuaternion(this.camera.quaternion);
        this.currentWeaponModel.position.copy(this.camera.position).add(weaponOffset);
        
        // Match weapon rotation to camera rotation
        this.currentWeaponModel.rotation.copy(this.camera.rotation);
        
        // Add slight downward tilt for more natural aiming
        this.currentWeaponModel.rotation.x += 0.02;
        
        // FIX: Rotate weapon to point forward (12 o'clock) instead of right (3 o'clock)
        this.currentWeaponModel.rotation.y += Math.PI / 2; // Add 90 degrees rotation
      }
      
      // Ensure weapon is visible with appropriate scale
      this.currentWeaponModel.visible = true;
      this.currentWeaponModel.scale.set(0.8, 0.8, 0.8); // Slightly smaller for better fit
    }
    
    // Update hand position to grip the weapon
    if (this.handModel && this.currentWeaponModel) {
      let handOffset;
      if (this.currentWeapon === 'rifle') {
        // Hand position for rifle grip - adjusted for larger model
        handOffset = new THREE.Vector3(0.08, -0.08, -0.22);
      } else {
        // Hand position for pistol grip - adjusted for larger model
        handOffset = new THREE.Vector3(0.1, -0.06, -0.18);
      }
      
      handOffset.applyQuaternion(this.camera.quaternion);
      this.handModel.position.copy(this.camera.position).add(handOffset);
      this.handModel.rotation.copy(this.camera.rotation);
      this.handModel.rotation.x += 0.02;
      
      // FIX: Also rotate hand to match weapon rotation
      this.handModel.rotation.y += Math.PI / 2; // Add 90 degrees rotation
      
      // Adjust hand rotation to grip weapon properly
      if (this.currentWeapon === 'rifle') {
        this.handModel.rotation.z += 0.12; // More rotation for rifle grip
      } else {
        this.handModel.rotation.z += 0.06; // Less rotation for pistol grip
      }
      
      // Ensure hand is visible and properly scaled
      this.handModel.visible = true;
      this.handModel.scale.set(0.8, 0.8, 0.8); // Match weapon scale
    }
  }

  // Public methods for bot system integration
  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCollidableObjects(): THREE.Object3D[] {
    // Return all scene objects that could be collided with
    const objects: THREE.Object3D[] = [];
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child !== this.ground) {
        objects.push(child);
      }
    });
    return objects;
  }

  public getPlayerPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public destroy(): void {
    console.log('Destroying SimpleFPSCore');
    
    // Stop auto fire
    this.stopFiring();
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    if (this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    this.renderer.dispose();
    
    // Clean up hit feedback systems
    if (this.soundManager) {
      // Sound manager doesn't need explicit cleanup
    }
    if (this.bloodEffect) {
      this.bloodEffect.cleanup();
    }
    if (this.damageIndicator) {
      this.damageIndicator.cleanup();
    }
    if (this.hitAnimation) {
      this.hitAnimation.cleanup();
    }
    
    console.log('SimpleFPSCore destroyed');
  }

  // Public methods for UI interaction
  public getCurrentWeapon(): string {
    return this.currentWeapon;
  }

  public getCurrentWeaponInfo(): any {
    return this.weapons.get(this.currentWeapon);
  }

  public switchWeaponPublic(weaponName: string): void {
    this.switchWeapon(weaponName);
  }

  public setMouseSensitivity(sensitivity: number): void {
    // Convert sensitivity percentage to actual value (0.001 to 0.005)
    this.mouseSensitivity = 0.001 + (sensitivity / 100) * 0.004;
    console.log('Mouse sensitivity set to:', this.mouseSensitivity);
  }

  public reloadWeaponPublic(): void {
    this.reloadWeapon();
  }

  public setGameActive(active: boolean): void {
    this.gameActive = active;
    console.log('Game active state set to:', active);
  }

  public getGameActive(): boolean {
    return this.gameActive;
  }
}
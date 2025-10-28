import * as THREE from 'three';

export interface WeaponConfig {
  id: string;
  name: string;
  type: 'assault_rifle' | 'smg' | 'shotgun' | 'sniper' | 'pistol';
  damage: number;
  fireRate: number; // Rounds per minute
  magazineSize: number;
  maxAmmo: number;
  reloadTime: number;
  range: number;
  accuracy: number; // 0-1
  recoil: {
    horizontal: number;
    vertical: number;
    recovery: number; // 0-1, how quickly it recovers
  };
  spread: {
    min: number;
    max: number;
    increasePerShot: number;
    decreasePerSecond: number;
    movementMultiplier: number;
    adsMultiplier: number;
  };
  handling: {
    adsTime: number; // Time to aim down sights
    equipTime: number;
    unequipTime: number;
  };
  projectile?: {
    speed: number;
    gravity?: number;
    dropoff?: {
      startDistance: number;
      endDistance: number;
      startDamage: number;
      endDamage: number;
    };
  };
}

export interface WeaponState {
  config: WeaponConfig;
  currentAmmo: number;
  reserveAmmo: number;
  isReloading: boolean;
  lastFireTime: number;
  currentSpread: number;
  isAiming: boolean;
  heatLevel: number; // For weapon overheating
  jamChance: number; // Chance to jam based on condition
}

export class FPSWeaponSystem {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private weapons: Map<string, WeaponConfig>;
  private currentWeapon: WeaponState | null;
  private weaponModels: Map<string, THREE.Group>;
  private isPointerLocked: boolean;
  private movementState: {
    isMoving: boolean;
    isSprinting: boolean;
    isInAir: boolean;
  };

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    this.weapons = new Map();
    this.weaponModels = new Map();
    this.currentWeapon = null;
    this.isPointerLocked = false;
    this.movementState = {
      isMoving: false,
      isSprinting: false,
      isInAir: false
    };

    this.initializeWeapons();
    this.setupEventListeners();
  }

  private initializeWeapons(): void {
    // Define weapon configurations
    const weaponConfigs: WeaponConfig[] = [
      {
        id: 'm4a1',
        name: 'M4A1',
        type: 'assault_rifle',
        damage: 35,
        fireRate: 750,
        magazineSize: 30,
        maxAmmo: 90,
        reloadTime: 2.2,
        range: 100,
        accuracy: 0.85,
        recoil: {
          horizontal: 0.15,
          vertical: 0.25,
          recovery: 0.8
        },
        spread: {
          min: 0.5,
          max: 8.0,
          increasePerShot: 0.8,
          decreasePerSecond: 4.0,
          movementMultiplier: 2.5,
          adsMultiplier: 0.4
        },
        handling: {
          adsTime: 0.25,
          equipTime: 0.5,
          unequipTime: 0.5
        },
        projectile: {
          speed: 900,
          dropoff: {
            startDistance: 20,
            endDistance: 80,
            startDamage: 35,
            endDamage: 20
          }
        }
      },
      {
        id: 'ak47',
        name: 'AK-47',
        type: 'assault_rifle',
        damage: 45,
        fireRate: 600,
        magazineSize: 30,
        maxAmmo: 90,
        reloadTime: 2.5,
        range: 80,
        accuracy: 0.75,
        recoil: {
          horizontal: 0.25,
          vertical: 0.4,
          recovery: 0.6
        },
        spread: {
          min: 1.0,
          max: 12.0,
          increasePerShot: 1.2,
          decreasePerSecond: 3.0,
          movementMultiplier: 3.0,
          adsMultiplier: 0.5
        },
        handling: {
          adsTime: 0.3,
          equipTime: 0.6,
          unequipTime: 0.6
        },
        projectile: {
          speed: 715,
          dropoff: {
            startDistance: 15,
            endDistance: 60,
            startDamage: 45,
            endDamage: 25
          }
        }
      },
      {
        id: 'desert_eagle',
        name: 'Desert Eagle',
        type: 'pistol',
        damage: 65,
        fireRate: 180,
        magazineSize: 7,
        maxAmmo: 35,
        reloadTime: 1.8,
        range: 50,
        accuracy: 0.9,
        recoil: {
          horizontal: 0.4,
          vertical: 0.8,
          recovery: 0.5
        },
        spread: {
          min: 0.2,
          max: 3.0,
          increasePerShot: 0.5,
          decreasePerSecond: 6.0,
          movementMultiplier: 1.5,
          adsMultiplier: 0.3
        },
        handling: {
          adsTime: 0.2,
          equipTime: 0.3,
          unequipTime: 0.3
        },
        projectile: {
          speed: 470,
          dropoff: {
            startDistance: 10,
            endDistance: 40,
            startDamage: 65,
            endDamage: 45
          }
        }
      },
      {
        id: 'awp',
        name: 'AWP',
        type: 'sniper',
        damage: 120,
        fireRate: 30,
        magazineSize: 5,
        maxAmmo: 20,
        reloadTime: 3.5,
        range: 200,
        accuracy: 0.98,
        recoil: {
          horizontal: 0.1,
          vertical: 1.2,
          recovery: 0.3
        },
        spread: {
          min: 0.01,
          max: 0.5,
          increasePerShot: 0.1,
          decreasePerSecond: 2.0,
          movementMultiplier: 5.0,
          adsMultiplier: 0.1
        },
        handling: {
          adsTime: 0.4,
          equipTime: 0.8,
          unequipTime: 0.8
        },
        projectile: {
          speed: 1200,
          dropoff: {
            startDistance: 50,
            endDistance: 150,
            startDamage: 120,
            endDamage: 90
          }
        }
      }
    ];

    weaponConfigs.forEach(config => {
      this.weapons.set(config.id, config);
    });

    // Create weapon models
    this.createWeaponModels();
  }

  private createWeaponModels(): void {
    this.weapons.forEach((config, id) => {
      const weaponGroup = new THREE.Group();
      
      // Create simple weapon representation
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
      const material = new THREE.MeshLambertMaterial({ color: 0x333333 });
      const weaponMesh = new THREE.Mesh(geometry, material);
      weaponGroup.add(weaponMesh);

      // Add barrel
      const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3);
      const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.z = 0.25;
      weaponGroup.add(barrel);

      // Add scope for sniper
      if (config.type === 'sniper') {
        const scopeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.2);
        const scopeMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
        scope.rotation.x = Math.PI / 2;
        scope.position.y = 0.05;
        scope.position.z = 0.1;
        weaponGroup.add(scope);
      }

      weaponGroup.visible = false;
      this.weaponModels.set(id, weaponGroup);
      this.scene.add(weaponGroup);
    });
  }

  private setupEventListeners(): void {
    // These will be called from the main game loop
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
  }

  public equipWeapon(weaponId: string): boolean {
    const config = this.weapons.get(weaponId);
    if (!config) return false;

    // Hide current weapon
    if (this.currentWeapon) {
      const currentModel = this.weaponModels.get(this.currentWeapon.config.id);
      if (currentModel) currentModel.visible = false;
    }

    // Create new weapon state
    this.currentWeapon = {
      config,
      currentAmmo: config.magazineSize,
      reserveAmmo: config.maxAmmo,
      isReloading: false,
      lastFireTime: 0,
      currentSpread: config.spread.min,
      isAiming: false,
      heatLevel: 0,
      jamChance: 0.01
    };

    // Show new weapon model
    const newModel = this.weaponModels.get(weaponId);
    if (newModel) {
      newModel.visible = true;
      this.updateWeaponPosition(newModel);
    }

    return true;
  }

  public update(deltaTime: number): void {
    if (!this.currentWeapon) return;

    // Update spread recovery
    if (this.currentWeapon.currentSpread > this.currentWeapon.config.spread.min) {
      this.currentWeapon.currentSpread = Math.max(
        this.currentWeapon.config.spread.min,
        this.currentWeapon.currentSpread - this.currentWeapon.config.spread.decreasePerSecond * deltaTime
      );
    }

    // Update heat level
    if (this.currentWeapon.heatLevel > 0) {
      this.currentWeapon.heatLevel = Math.max(0, this.currentWeapon.heatLevel - deltaTime * 0.5);
    }

    // Update weapon position and rotation
    const currentModel = this.weaponModels.get(this.currentWeapon.config.id);
    if (currentModel) {
      this.updateWeaponPosition(currentModel);
      this.updateWeaponRecoil(currentModel, deltaTime);
    }
  }

  private updateWeaponPosition(model: THREE.Group): void {
    if (!this.currentWeapon) return;

    const basePosition = new THREE.Vector3(0.3, -0.4, -0.8);
    const baseRotation = new THREE.Euler(0, 0, 0);

    // Adjust for aiming
    if (this.currentWeapon.isAiming) {
      basePosition.x = 0.1;
      basePosition.y = -0.3;
      basePosition.z = -0.5;
    }

    // Adjust for movement
    if (this.movementState.isMoving) {
      basePosition.y += Math.sin(Date.now() * 0.01) * 0.02;
      baseRotation.z = Math.sin(Date.now() * 0.01) * 0.05;
    }

    // Apply camera transform
    model.position.copy(basePosition);
    model.rotation.copy(baseRotation);
    model.applyQuaternion(this.camera.quaternion);
    model.position.add(this.camera.position);
  }

  private updateWeaponRecoil(model: THREE.Group, deltaTime: number): void {
    if (!this.currentWeapon) return;

    // Simple recoil recovery
    const recoilRecovery = this.currentWeapon.config.recoil.recovery * deltaTime * 5;
    model.rotation.x *= (1 - recoilRecovery);
    model.rotation.y *= (1 - recoilRecovery);
  }

  public fire(): boolean {
    if (!this.currentWeapon || this.currentWeapon.isReloading) return false;

    const now = Date.now();
    const fireInterval = 60000 / this.currentWeapon.config.fireRate;

    if (now - this.currentWeapon.lastFireTime < fireInterval) return false;
    if (this.currentWeapon.currentAmmo <= 0) {
      this.reload();
      return false;
    }

    // Check for jam
    if (Math.random() < this.currentWeapon.jamChance) {
      console.log('Weapon jammed!');
      this.currentWeapon.jamChance = Math.min(0.5, this.currentWeapon.jamChance + 0.1);
      return false;
    }

    this.currentWeapon.lastFireTime = now;
    this.currentWeapon.currentAmmo--;
    this.currentWeapon.heatLevel = Math.min(1, this.currentWeapon.heatLevel + 0.1);

    // Increase spread
    this.currentWeapon.currentSpread = Math.min(
      this.currentWeapon.config.spread.max,
      this.currentWeapon.currentSpread + this.currentWeapon.config.spread.increasePerShot
    );

    // Apply recoil to weapon model
    const model = this.weaponModels.get(this.currentWeapon.config.id);
    if (model) {
      const recoilX = this.currentWeapon.config.recoil.vertical * (0.5 + Math.random() * 0.5);
      const recoilY = (Math.random() - 0.5) * this.currentWeapon.config.recoil.horizontal;
      model.rotation.x -= recoilX;
      model.rotation.y += recoilY;
    }

    // Auto-reload if empty
    if (this.currentWeapon.currentAmmo === 0) {
      setTimeout(() => this.reload(), 100);
    }

    return true;
  }

  public reload(): boolean {
    if (!this.currentWeapon || this.currentWeapon.isReloading) return false;
    if (this.currentWeapon.currentAmmo === this.currentWeapon.config.magazineSize) return false;
    if (this.currentWeapon.reserveAmmo === 0) return false;

    this.currentWeapon.isReloading = true;

    setTimeout(() => {
      if (!this.currentWeapon) return;

      const ammoNeeded = this.currentWeapon.config.magazineSize - this.currentWeapon.currentAmmo;
      const ammoToReload = Math.min(ammoNeeded, this.currentWeapon.reserveAmmo);
      
      this.currentWeapon.currentAmmo += ammoToReload;
      this.currentWeapon.reserveAmmo -= ammoToReload;
      this.currentWeapon.isReloading = false;
      
      // Reduce jam chance on successful reload
      this.currentWeapon.jamChance = Math.max(0.01, this.currentWeapon.jamChance - 0.05);
    }, this.currentWeapon.config.reloadTime * 1000);

    return true;
  }

  public setAiming(aiming: boolean): void {
    if (!this.currentWeapon) return;

    this.currentWeapon.isAiming = aiming;
  }

  public getFireDirection(): THREE.Vector3 {
    if (!this.currentWeapon) return new THREE.Vector3(0, 0, -1);

    const direction = new THREE.Vector3(0, 0, -1);
    
    // Apply spread
    const spread = this.currentWeapon.currentSpread * 0.01;
    const spreadX = (Math.random() - 0.5) * spread;
    const spreadY = (Math.random() - 0.5) * spread;
    
    direction.x += spreadX;
    direction.y += spreadY;
    
    direction.applyQuaternion(this.camera.quaternion);
    direction.normalize();
    
    return direction;
  }

  public calculateDamage(distance: number): number {
    if (!this.currentWeapon) return 0;

    let damage = this.currentWeapon.config.damage;
    const projectile = this.currentWeapon.config.projectile;

    if (projectile?.dropoff) {
      if (distance > projectile.dropoff.startDistance) {
        const dropoffProgress = Math.min(
          1,
          (distance - projectile.dropoff.startDistance) / 
          (projectile.dropoff.endDistance - projectile.dropoff.startDistance)
        );
        
        damage = projectile.dropoff.startDamage - 
                 (projectile.dropoff.startDamage - projectile.dropoff.endDamage) * dropoffProgress;
      }
    }

    return Math.max(1, damage);
  }

  public getCurrentWeapon(): WeaponState | null {
    return this.currentWeapon;
  }

  public getWeaponConfig(weaponId: string): WeaponConfig | undefined {
    return this.weapons.get(weaponId);
  }

  public getAvailableWeapons(): WeaponConfig[] {
    return Array.from(this.weapons.values());
  }

  public setMovementState(state: Partial<{
    isMoving: boolean;
    isSprinting: boolean;
    isInAir: boolean;
  }>): void {
    this.movementState = { ...this.movementState, ...state };
  }

  public setPointerLocked(locked: boolean): void {
    this.isPointerLocked = locked;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isPointerLocked) return;

    switch (event.code.toLowerCase()) {
      case 'keyr':
        this.reload();
        break;
      case 'digit1':
        this.equipWeapon('m4a1');
        break;
      case 'digit2':
        this.equipWeapon('ak47');
        break;
      case 'digit3':
        this.equipWeapon('desert_eagle');
        break;
      case 'digit4':
        this.equipWeapon('awp');
        break;
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    // Handle key up events if needed
  }

  private handleMouseDown(event: MouseEvent): void {
    if (!this.isPointerLocked) return;

    if (event.button === 2) { // Right click
      this.setAiming(true);
    } else if (event.button === 0) { // Left click
      this.fire();
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.isPointerLocked) return;

    if (event.button === 2) { // Right click
      this.setAiming(false);
    }
  }

  public dispose(): void {
    this.weaponModels.forEach(model => {
      this.scene.remove(model);
    });
    this.weaponModels.clear();
    this.weapons.clear();
    this.currentWeapon = null;
  }
}
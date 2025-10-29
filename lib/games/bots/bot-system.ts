// @ts-nocheck
import * as THREE from 'three';

export interface BotState {
  id: string;
  name: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  health: number;
  armor: number;
  isAlive: boolean;
  team: 'team1' | 'team2';
  weapon: string;
  ammo: number;
  kills: number;
  deaths: number;
  score: number;
  isAiming: boolean;
  isReloading: boolean;
  lastFireTime: number;
  targetPosition: THREE.Vector3;
  state: 'idle' | 'patrol' | 'attack' | 'retreat' | 'seek_cover';
  stateTimer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  reactionTime: number;
  accuracy: number;
  aggression: number;
  // New movement capabilities
  isJumping: boolean;
  isCrouching: boolean;
  jumpVelocity: number;
  crouchHeight: number;
  standHeight: number;
  lastJumpTime: number;
  lastCrouchTime: number;
}

export interface KillLogEntry {
  id: string;
  timestamp: number;
  killer: {
    id: string;
    name: string;
    team: 'team1' | 'team2';
    weapon: string;
  };
  victim: {
    id: string;
    name: string;
    team: 'team1' | 'team2';
  };
  isHeadshot: boolean;
  damage: number;
  distance: number;
}

export interface BotConfig {
  team1Bots: number;
  team2Bots: number;
  botDifficulty: 'easy' | 'medium' | 'hard';
  botNames: string[];
}

export class BotSystem {
  private bots: Map<string, BotState> = new Map();
  private scene: THREE.Scene;
  private config: BotConfig;
  private playerPosition: THREE.Vector3;
  private collidableObjects: THREE.Object3D[];
  private botMeshes: Map<string, THREE.Mesh> = new Map();
  private botWeapons: Map<string, THREE.Group> = new Map(); // Store weapon models
  private killLog: KillLogEntry[] = [];
  private maxKillLogEntries = 10;
  private onKillLogUpdate?: (killLog: KillLogEntry[]) => void;
  
  // Difficulty settings
  private difficultySettings = {
    easy: { reactionTime: 800, accuracy: 0.4, aggression: 0.3, health: 80 },
    medium: { reactionTime: 400, accuracy: 0.6, aggression: 0.5, health: 100 },
    hard: { reactionTime: 200, accuracy: 0.8, aggression: 0.7, health: 120 }
  };

  constructor(scene: THREE.Scene, config: BotConfig, collidableObjects: THREE.Object3D[]) {
    this.scene = scene;
    this.config = config;
    this.playerPosition = new THREE.Vector3(0, 1.8, 0);
    this.collidableObjects = collidableObjects;
    
    this.initializeBots();
  }

  public setKillLogCallback(callback: (killLog: KillLogEntry[]) => void): void {
    this.onKillLogUpdate = callback;
  }

  private addKillLogEntry(
    killerId: string,
    victimId: string,
    weapon: string,
    isHeadshot: boolean,
    damage: number,
    distance: number
  ): void {
    const killer = this.bots.get(killerId);
    const victim = this.bots.get(victimId);
    
    if (!killer || !victim) return;
    
    const killEntry: KillLogEntry = {
      id: `kill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      killer: {
        id: killer.id,
        name: killer.name,
        team: killer.team,
        weapon: weapon
      },
      victim: {
        id: victim.id,
        name: victim.name,
        team: victim.team
      },
      isHeadshot,
      damage,
      distance
    };
    
    this.killLog.unshift(killEntry);
    
    // Keep only the most recent entries
    if (this.killLog.length > this.maxKillLogEntries) {
      this.killLog = this.killLog.slice(0, this.maxKillLogEntries);
    }
    
    // Notify callback if set
    if (this.onKillLogUpdate) {
      this.onKillLogUpdate(this.killLog);
    }
  }

  public getKillLog(): KillLogEntry[] {
    return [...this.killLog];
  }

  public clearKillLog(): void {
    this.killLog = [];
    if (this.onKillLogUpdate) {
      this.onKillLogUpdate(this.killLog);
    }
  }

  private initializeBots(): void {
    // Create team 1 bots
    for (let i = 0; i < this.config.team1Bots; i++) {
      this.createBot('team1', i);
    }
    
    // Create team 2 bots
    for (let i = 0; i < this.config.team2Bots; i++) {
      this.createBot('team2', i);
    }
  }

  private createBot(team: 'team1' | 'team2', index: number): void {
    const botId = `${team}_bot_${index}`;
    const difficulty = this.config.botDifficulty;
    const settings = this.difficultySettings[difficulty];
    
    // Random spawn position
    const spawnPosition = this.getRandomSpawnPosition(team);
    
    // Random weapon assignment
    const weapons = ['rifle', 'smg', 'shotgun'];
    const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];
    
    const bot: BotState = {
      id: botId,
      name: this.config.botNames[Math.floor(Math.random() * this.config.botNames.length)],
      position: spawnPosition.clone(),
      rotation: new THREE.Euler(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      health: settings.health,
      armor: 0,
      isAlive: true,
      team,
      weapon: randomWeapon,
      ammo: randomWeapon === 'shotgun' ? 8 : (randomWeapon === 'smg' ? 40 : 30),
      kills: 0,
      deaths: 0,
      score: 0,
      isAiming: false,
      isReloading: false,
      lastFireTime: 0,
      targetPosition: spawnPosition.clone(),
      state: 'patrol',
      stateTimer: 0,
      difficulty,
      reactionTime: settings.reactionTime,
      accuracy: settings.accuracy,
      aggression: settings.aggression,
      // New movement capabilities
      isJumping: false,
      isCrouching: false,
      jumpVelocity: 0,
      crouchHeight: 0.9,
      standHeight: 1.8,
      lastJumpTime: 0,
      lastCrouchTime: 0
    };
    
    this.bots.set(botId, bot);
    
    // Create visual representation
    this.createBotMesh(bot);
  }

  private createBotMesh(bot: BotState): void {
    const botGroup = new THREE.Group();
    
    // Create detailed bot model with multiple parts
    const height = bot.isCrouching ? bot.crouchHeight : bot.standHeight;
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ 
      color: bot.team === 'team1' ? 0x0066ff : 0xff3333 
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = height + 0.1;
    head.castShadow = true;
    botGroup.add(head);
    
    // Helmet
    const helmetGeometry = new THREE.SphereGeometry(0.22, 8, 8);
    const helmetMaterial = new THREE.MeshLambertMaterial({ 
      color: bot.team === 'team1' ? 0x004499 : 0xcc0000 
    });
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.y = height + 0.12;
    helmet.scale.set(1, 0.7, 1);
    helmet.castShadow = true;
    botGroup.add(helmet);
    
    // Body (torso)
    const bodyGeometry = new THREE.BoxGeometry(0.4, height * 0.6, 0.25);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: bot.team === 'team1' ? 0x0055cc : 0xdd2222 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = height * 0.3;
    body.castShadow = true;
    botGroup.add(body);
    
    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.08, height * 0.35, 4, 8);
    const armMaterial = new THREE.MeshLambertMaterial({ 
      color: bot.team === 'team1' ? 0x0066ff : 0xff3333 
    });
    
    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.25, height * 0.25, 0);
    leftArm.rotation.z = Math.PI / 8;
    leftArm.castShadow = true;
    botGroup.add(leftArm);
    
    // Right arm (will hold weapon)
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.25, height * 0.25, 0);
    rightArm.rotation.z = -Math.PI / 8;
    rightArm.castShadow = true;
    botGroup.add(rightArm);
    
    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.1, height * 0.4, 4, 8);
    const legMaterial = new THREE.MeshLambertMaterial({ 
      color: bot.team === 'team1' ? 0x004488 : 0xbb1111 
    });
    
    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.12, -height * 0.2, 0);
    leftLeg.castShadow = true;
    botGroup.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.12, -height * 0.2, 0);
    rightLeg.castShadow = true;
    botGroup.add(rightLeg);
    
    // Backpack
    const backpackGeometry = new THREE.BoxGeometry(0.15, 0.25, 0.1);
    const backpackMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x2a2a2a 
    });
    const backpack = new THREE.Mesh(backpackGeometry, backpackMaterial);
    backpack.position.set(0, height * 0.4, -0.15);
    backpack.castShadow = true;
    botGroup.add(backpack);
    
    botGroup.position.copy(bot.position);
    botGroup.userData.isBot = true;
    botGroup.userData.botId = bot.id;
    
    this.scene.add(botGroup);
    this.botMeshes.set(bot.id, botGroup as any);
    
    // Create weapon for the bot
    this.createBotWeapon(bot);
  }
  
  private createBotWeapon(bot: BotState): void {
    const weaponGroup = new THREE.Group();
    
    // Create different weapon models based on bot.weapon
    let weaponMesh: THREE.Mesh;
    
    switch (bot.weapon) {
      case 'rifle':
        weaponMesh = this.createRifleModel();
        break;
      case 'smg':
        weaponMesh = this.createSMGModel();
        break;
      case 'shotgun':
        weaponMesh = this.createShotgunModel();
        break;
      default:
        weaponMesh = this.createRifleModel();
    }
    
    // Position weapon on bot's right side
    weaponMesh.position.set(0.4, -0.2, 0.3);
    weaponMesh.rotation.set(0, Math.PI / 2, 0);
    
    weaponGroup.add(weaponMesh);
    weaponGroup.position.copy(bot.position);
    weaponGroup.rotation.copy(bot.rotation);
    
    this.scene.add(weaponGroup);
    this.botWeapons.set(bot.id, weaponGroup);
  }
  
  private createRifleModel(): THREE.Mesh {
    const rifleGroup = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    rifleGroup.add(body);
    
    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.z = 0.6;
    rifleGroup.add(barrel);
    
    // Stock
    const stockGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.3);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.z = -0.55;
    rifleGroup.add(stock);
    
    // Grip
    const gripGeometry = new THREE.BoxGeometry(0.06, 0.1, 0.15);
    const gripMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.set(0, -0.1, 0.1);
    rifleGroup.add(grip);
    
    return rifleGroup as any;
  }
  
  private createSMGModel(): THREE.Mesh {
    const smgGroup = new THREE.Group();
    
    // Main body (smaller than rifle)
    const bodyGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.5);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    smgGroup.add(body);
    
    // Shorter barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.25);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.z = 0.375;
    smgGroup.add(barrel);
    
    // Extended magazine
    const magGeometry = new THREE.BoxGeometry(0.04, 0.15, 0.08);
    const magMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const mag = new THREE.Mesh(magGeometry, magMaterial);
    mag.position.set(0, -0.12, 0);
    smgGroup.add(mag);
    
    return smgGroup as any;
  }
  
  private createShotgunModel(): THREE.Mesh {
    const shotgunGroup = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(0.12, 0.18, 0.6);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    shotgunGroup.add(body);
    
    // Double barrels
    const barrelGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.5);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    
    const barrel1 = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel1.rotation.z = Math.PI / 2;
    barrel1.position.set(-0.03, 0, 0.55);
    shotgunGroup.add(barrel1);
    
    const barrel2 = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel2.rotation.z = Math.PI / 2;
    barrel2.position.set(0.03, 0, 0.55);
    shotgunGroup.add(barrel2);
    
    // Pump
    const pumpGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.2);
    const pumpMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
    pump.rotation.z = Math.PI / 2;
    pump.position.set(0, 0, 0.2);
    shotgunGroup.add(pump);
    
    return shotgunGroup as any;
  }

  private getRandomSpawnPosition(team: 'team1' | 'team2'): THREE.Vector3 {
    // Different spawn areas for different teams
    const baseX = team === 'team1' ? -20 : 20;
    const baseZ = team === 'team1' ? -20 : 20;
    
    return new THREE.Vector3(
      baseX + (Math.random() - 0.5) * 10,
      1.8,
      baseZ + (Math.random() - 0.5) * 10
    );
  }

  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    this.playerPosition.copy(playerPosition);
    
    this.bots.forEach((bot, botId) => {
      if (!bot.isAlive) return;
      
      // Update bot state
      this.updateBotState(bot, deltaTime);
      
      // Update bot movement
      this.updateBotMovement(bot, deltaTime);
      
      // Update bot combat
      this.updateBotCombat(bot, deltaTime);
      
      // Update visual representation
      this.updateBotMesh(bot);
    });
    
    // Process combat between bots
    this.processBotCombat();
  }

  private updateBotState(bot: BotState, deltaTime: number): void {
    bot.stateTimer -= deltaTime;
    
    // Calculate distance to player
    const distanceToPlayer = bot.position.distanceTo(this.playerPosition);
    
    // State machine
    switch (bot.state) {
      case 'idle':
        if (bot.stateTimer <= 0) {
          bot.state = 'patrol';
          bot.stateTimer = 3000 + Math.random() * 2000; // Patrol for 3-5 seconds
          this.setRandomTargetPosition(bot);
        }
        break;
        
      case 'patrol':
        if (distanceToPlayer < 15) {
          bot.state = 'attack';
          bot.stateTimer = 2000 + Math.random() * 1000;
        } else if (bot.stateTimer <= 0) {
          bot.state = 'idle';
          bot.stateTimer = 1000 + Math.random() * 1000;
        }
        break;
        
      case 'attack':
        if (distanceToPlayer > 20) {
          bot.state = 'patrol';
          bot.stateTimer = 3000 + Math.random() * 2000;
        } else if (bot.health < 30 && Math.random() < bot.aggression) {
          bot.state = 'retreat';
          bot.stateTimer = 2000 + Math.random() * 1000;
        } else if (bot.stateTimer <= 0) {
          bot.state = Math.random() < 0.7 ? 'attack' : 'seek_cover';
          bot.stateTimer = 1000 + Math.random() * 1000;
        }
        break;
        
      case 'retreat':
        if (bot.health > 50 || bot.stateTimer <= 0) {
          bot.state = 'patrol';
          bot.stateTimer = 3000 + Math.random() * 2000;
        }
        break;
        
      case 'seek_cover':
        if (bot.stateTimer <= 0) {
          bot.state = 'attack';
          bot.stateTimer = 2000 + Math.random() * 1000;
        }
        break;
    }
  }

  private updateBotMovement(bot: BotState, deltaTime: number): void {
    const speed = bot.isCrouching ? 0.25 : (bot.state === 'retreat' ? 8.0 : (bot.state === 'attack' ? 6.0 : (bot.state === 'seek_cover' ? 5.0 : 4.0)));
    const jumpForce = 1.5;
    const gravity = 5.0;
    const groundLevel = 0.0;
    
    // Handle jumping physics
    if (bot.isJumping) {
      bot.jumpVelocity += gravity * deltaTime;
      bot.position.y += bot.jumpVelocity * deltaTime;
      
      // Check if landed
      if (bot.position.y <= groundLevel + (bot.isCrouching ? bot.crouchHeight : bot.standHeight)) {
        bot.position.y = groundLevel + (bot.isCrouching ? bot.crouchHeight : bot.standHeight);
        bot.isJumping = false;
        bot.jumpVelocity = 0;
      }
    }
    
    // Handle crouching/standing transitions
    const targetHeight = bot.isCrouching ? bot.crouchHeight : bot.standHeight;
    const currentHeight = bot.position.y - groundLevel;
    if (Math.abs(currentHeight - targetHeight) > 0.01) {
      const heightDiff = targetHeight - currentHeight;
      bot.position.y += heightDiff * deltaTime * 2; // Smooth transition
    }
    
    // Decision making for jumping and crouching
    const now = Date.now();
    const distanceToPlayer = bot.position.distanceTo(this.playerPosition);
    
    // Jump over obstacles or when in combat
    if (!bot.isJumping && !bot.isCrouching && now - bot.lastJumpTime > 3000) {
      // Jump when in combat and random chance
      if (bot.state === 'attack' && Math.random() < 0.1) {
        bot.isJumping = true;
        bot.jumpVelocity = jumpForce;
        bot.lastJumpTime = now;
      }
      // Jump when approaching obstacles (simplified)
      else if (Math.random() < 0.05) {
        bot.isJumping = true;
        bot.jumpVelocity = jumpForce;
        bot.lastJumpTime = now;
      }
    }
    
    // Crouch decision making
    if (!bot.isJumping && now - bot.lastCrouchTime > 2000) {
      // Crouch when taking fire or low health
      if (bot.health < 50 && bot.state === 'attack' && Math.random() < 0.3) {
        bot.isCrouching = !bot.isCrouching;
        bot.lastCrouchTime = now;
      }
      // Crouch for cover
      else if (bot.state === 'seek_cover' && !bot.isCrouching && Math.random() < 0.7) {
        bot.isCrouching = true;
        bot.lastCrouchTime = now;
      }
      // Stand up when safe
      else if (bot.state === 'patrol' && bot.isCrouching && Math.random() < 0.3) {
        bot.isCrouching = false;
        bot.lastCrouchTime = now;
      }
    }
    
    switch (bot.state) {
      case 'patrol':
        this.moveTowardsTarget(bot, bot.targetPosition, speed, deltaTime);
        if (bot.position.distanceTo(bot.targetPosition) < 1) {
          this.setRandomTargetPosition(bot);
        }
        break;
        
      case 'attack':
        // Move towards player but maintain some distance
        const desiredDistance = 8 + Math.random() * 4;
        if (bot.position.distanceTo(this.playerPosition) > desiredDistance) {
          this.moveTowardsTarget(bot, this.playerPosition, speed, deltaTime);
        } else if (bot.position.distanceTo(this.playerPosition) < desiredDistance - 2) {
          // Move away if too close
          const awayDirection = bot.position.clone().sub(this.playerPosition).normalize();
          bot.position.add(awayDirection.multiplyScalar(speed * deltaTime));
        }
        break;
        
      case 'retreat':
        // Move away from player
        const retreatDirection = bot.position.clone().sub(this.playerPosition).normalize();
        bot.position.add(retreatDirection.multiplyScalar(speed * deltaTime));
        break;
        
      case 'seek_cover':
        // Move towards cover (simplified - just move perpendicular to player)
        const perpendicular = new THREE.Vector3(
          -(this.playerPosition.z - bot.position.z),
          0,
          this.playerPosition.x - bot.position.x
        ).normalize();
        bot.position.add(perpendicular.multiplyScalar(speed * deltaTime));
        break;
    }
    
    // Simple collision detection with boundaries
    bot.position.x = Math.max(-45, Math.min(45, bot.position.x));
    bot.position.z = Math.max(-45, Math.min(45, bot.position.z));
  }

  private moveTowardsTarget(bot: BotState, target: THREE.Vector3, speed: number, deltaTime: number): void {
    const direction = target.clone().sub(bot.position).normalize();
    bot.position.add(direction.multiplyScalar(speed * deltaTime));
    
    // Update rotation to face movement direction
    const angle = Math.atan2(direction.x, direction.z);
    bot.rotation.y = angle;
  }

  private setRandomTargetPosition(bot: BotState): void {
    bot.targetPosition.set(
      (Math.random() - 0.5) * 80,
      1.8,
      (Math.random() - 0.5) * 80
    );
  }

  private updateBotCombat(bot: BotState, deltaTime: number): void {
    const distanceToPlayer = bot.position.distanceTo(this.playerPosition);
    
    // Only shoot if in attack state and player is visible and in range
    if (bot.state === 'attack' && distanceToPlayer < 25 && this.hasLineOfSight(bot.position, this.playerPosition)) {
      // Aim at player
      const direction = this.playerPosition.clone().sub(bot.position).normalize();
      const angle = Math.atan2(direction.x, direction.z);
      bot.rotation.y = angle;
      
      // Check if bot should fire
      const now = Date.now();
      const fireRate = 300; // Shots per minute converted to ms
      const shouldFire = now - bot.lastFireTime > fireRate && Math.random() < bot.accuracy;
      
      if (shouldFire && bot.ammo > 0) {
        this.fireWeapon(bot);
        bot.lastFireTime = now;
        bot.ammo--;
        
        // Reload if out of ammo
        if (bot.ammo <= 0) {
          bot.isReloading = true;
          setTimeout(() => {
            bot.isReloading = false;
            bot.ammo = 30;
          }, 2000);
        }
      }
    }
  }

  private hasLineOfSight(start: THREE.Vector3, end: THREE.Vector3): boolean {
    // Simple line of sight check (can be enhanced with actual raycasting)
    const distance = start.distanceTo(end);
    return distance < 25; // Simplified - bots can "see" within 25 units
  }

  private fireWeapon(bot: BotState): void {
    // Simulate bot firing weapon
    const hitChance = bot.accuracy * 0.3; // 30% of accuracy becomes hit chance
    
    if (Math.random() < hitChance) {
      // Bot hit player (this would need to be connected to player health system)
      console.log(`${bot.name} hit the player!`);
    }
  }

  private updateBotMesh(bot: BotState): void {
    const mesh = this.botMeshes.get(bot.id);
    const weapon = this.botWeapons.get(bot.id);
    
    if (mesh) {
      mesh.position.copy(bot.position);
      mesh.rotation.copy(bot.rotation);
      
      // Update mesh appearance based on bot state
      if (!bot.isAlive) {
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material.opacity = 0.3;
            child.material.transparent = true;
          }
        });
      } else {
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material.opacity = 1;
            child.material.transparent = false;
          }
        });
      }
      
      // Update model when crouching/standing
      const height = bot.isCrouching ? bot.crouchHeight : bot.standHeight;
      
      // Update head position
      const head = mesh.children.find(child => child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry);
      if (head) {
        head.position.y = height + 0.1;
      }
      
      // Update helmet position
      const helmet = mesh.children.find(child => child instanceof THREE.Mesh && 
        child.geometry instanceof THREE.SphereGeometry && child.scale.y < 1);
      if (helmet) {
        helmet.position.y = height + 0.12;
      }
      
      // Update body position and size
      const body = mesh.children.find(child => child instanceof THREE.Mesh && 
        child.geometry instanceof THREE.BoxGeometry && Math.abs(child.geometry.parameters.width - 0.4) < 0.01);
      if (body) {
        body.position.y = height * 0.3;
        body.scale.y = height / 1.8; // Scale based on height
      }
      
      // Update arms
      const arms = mesh.children.filter(child => child instanceof THREE.Mesh && 
        child.geometry instanceof THREE.CapsuleGeometry && Math.abs(child.geometry.parameters.radius - 0.08) < 0.01);
      arms.forEach(arm => {
        arm.position.y = height * 0.25;
        arm.scale.y = height / 1.8;
      });
      
      // Update legs
      const legs = mesh.children.filter(child => child instanceof THREE.Mesh && 
        child.geometry instanceof THREE.CapsuleGeometry && Math.abs(child.geometry.parameters.radius - 0.1) < 0.01);
      legs.forEach(leg => {
        leg.position.y = -height * 0.2;
        leg.scale.y = height / 1.8;
      });
      
      // Update backpack
      const backpack = mesh.children.find(child => child instanceof THREE.Mesh && 
        child.geometry instanceof THREE.BoxGeometry && Math.abs(child.geometry.parameters.width - 0.15) < 0.01);
      if (backpack) {
        backpack.position.y = height * 0.4;
      }
    }
    
    // Update weapon position and rotation
    if (weapon) {
      weapon.position.copy(bot.position);
      weapon.rotation.copy(bot.rotation);
      
      // Adjust weapon position when crouching
      const weaponMesh = weapon.children[0] as any;
      if (weaponMesh && bot.isCrouching) {
        weaponMesh.position.y = -0.1; // Raise weapon when crouching
      } else if (weaponMesh) {
        weaponMesh.position.y = -0.2; // Normal position when standing
      }
      
      // Hide weapon when bot is dead
      weapon.visible = bot.isAlive;
    }
  }

  public getBotData(): BotState[] {
    return Array.from(this.bots.values());
  }

  public processBotCombat(): void {
    // Process combat between bots
    const aliveBots = Array.from(this.bots.values()).filter(bot => bot.isAlive);
    
    for (let i = 0; i < aliveBots.length; i++) {
      for (let j = i + 1; j < aliveBots.length; j++) {
        const bot1 = aliveBots[i];
        const bot2 = aliveBots[j];
        
        // Only engage if bots are on different teams
        if (bot1.team !== bot2.team) {
          const distance = bot1.position.distanceTo(bot2.position);
          
          // Check if bots can see each other and are in range
          if (distance < 25 && this.hasLineOfSight(bot1.position, bot2.position)) {
            // Bot1 attacks Bot2
            if (bot1.state === 'attack' && Math.random() < bot1.accuracy * 0.1) {
              const isHeadshot = Math.random() < 0.2; // 20% chance for headshot
              const damage = isHeadshot ? 100 : 25; // Headshot is instant kill
              this.damageBot(bot2.id, damage, bot1.id, bot1.weapon, isHeadshot);
            }
            
            // Bot2 attacks Bot1
            if (bot2.state === 'attack' && Math.random() < bot2.accuracy * 0.1) {
              const isHeadshot = Math.random() < 0.2; // 20% chance for headshot
              const damage = isHeadshot ? 100 : 25; // Headshot is instant kill
              this.damageBot(bot1.id, damage, bot2.id, bot2.weapon, isHeadshot);
            }
          }
        }
      }
    }
  }

  public getTeamBots(team: 'team1' | 'team2'): BotState[] {
    return Array.from(this.bots.values()).filter(bot => bot.team === team && bot.isAlive);
  }

  public damageBot(botId: string, damage: number, attackerId?: string, weapon?: string, isHeadshot: boolean = false): boolean {
    const bot = this.bots.get(botId);
    if (!bot || !bot.isAlive) return false;
    
    bot.health -= damage;
    
    // Show damage indicator
    if (typeof window !== 'undefined' && (window as any).showDamageIndicator) {
      const isCritical = damage > 50; // Critical hit if damage > 50
      (window as any).showDamageIndicator(bot.position.clone(), damage, isHeadshot, isCritical);
    }
    
    if (bot.health <= 0) {
      bot.isAlive = false;
      bot.deaths++;
      
      // Add kill log entry if there's an attacker
      if (attackerId && weapon) {
        const attacker = this.bots.get(attackerId);
        if (attacker) {
          attacker.kills++;
          const distance = bot.position.distanceTo(attacker.position);
          this.addKillLogEntry(attackerId, botId, weapon, isHeadshot, damage, distance);
        }
      }
      
      this.updateBotMesh(bot);
      return true; // Bot was killed
    }
    
    return false; // Bot was damaged but not killed
  }

  public respawnBot(botId: string): void {
    const bot = this.bots.get(botId);
    if (!bot) return;
    
    bot.health = this.difficultySettings[bot.difficulty].health;
    bot.isAlive = true;
    bot.position = this.getRandomSpawnPosition(bot.team);
    bot.ammo = bot.weapon === 'shotgun' ? 8 : (bot.weapon === 'smg' ? 40 : 30);
    bot.isReloading = false;
    bot.isJumping = false;
    bot.isCrouching = false;
    bot.jumpVelocity = 0;
    bot.lastJumpTime = 0;
    bot.lastCrouchTime = 0;
    bot.state = 'patrol';
    bot.stateTimer = 3000 + Math.random() * 2000;
    
    this.updateBotMesh(bot);
  }

  public updateConfig(newConfig: BotConfig): void {
    this.config = newConfig;
    this.clearBots();
    this.initializeBots();
  }

  public clearBots(): void {
    // Remove all bot meshes from scene
    this.botMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    
    // Remove all weapon models from scene
    this.botWeapons.forEach(weapon => {
      this.scene.remove(weapon);
      weapon.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    
    // Clear bot data
    this.bots.clear();
    this.botMeshes.clear();
    this.botWeapons.clear();
  }

  public dispose(): void {
    this.clearBots();
  }
}
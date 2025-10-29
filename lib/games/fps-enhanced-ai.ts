// @ts-nocheck
/**
 * Enhanced AI System for FPS Enhanced
 * Smart enemies with realistic behavior patterns
 */

import * as THREE from 'three';

export interface AIState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  health: number;
  maxHealth: 100;
  isAlive: boolean;
  currentState: 'idle' | 'patrol' | 'search' | 'combat' | 'flank' | 'retreat';
  targetPosition?: THREE.Vector3;
  lastKnownPlayerPosition?: THREE.Vector3;
  patrolPath: THREE.Vector3[];
  currentPatrolIndex: number;
  reactionTime: number;
  accuracy: number;
  aggression: number;
  weaponType: 'rifle' | 'shotgun' | 'sniper';
  lastFireTime: number;
  fireRate: number;
  damage: number;
  coverPoints: THREE.Vector3[];
  currentCoverPoint?: THREE.Vector3;
  isTakingCover: boolean;
  morale: number;
  suppressionLevel: number;
}

export class FPSEnhancedAI {
  private aiAgents: Map<string, AIState> = new Map();
  private playerPosition: THREE.Vector3;
  private scene: THREE.Scene;
  private collidableObjects: THREE.Object3D[];
  private aiMeshes: Map<string, THREE.Group> = new Map();
  private lastUpdateTime = 0;

  constructor(scene: THREE.Scene, collidableObjects: THREE.Object3D[]) {
    this.scene = scene;
    this.collidableObjects = collidableObjects;
    this.playerPosition = new THREE.Vector3(0, 1.8, 0);
    this.initializeAIAgents();
  }

  private initializeAIAgents(): void {
    // Create multiple AI agents with different roles
    const aiConfigs = [
      {
        id: 'assault_1',
        position: new THREE.Vector3(20, 1.8, 20),
        weaponType: 'rifle' as const,
        aggression: 0.8,
        accuracy: 0.7,
        patrolPath: this.generatePatrolPath(new THREE.Vector3(20, 0, 20), 8)
      },
      {
        id: 'sniper_1',
        position: new THREE.Vector3(-30, 1.8, -30),
        weaponType: 'sniper' as const,
        aggression: 0.3,
        accuracy: 0.9,
        patrolPath: this.generatePatrolPath(new THREE.Vector3(-30, 0, -30), 4)
      },
      {
        id: 'shotgun_1',
        position: new THREE.Vector3(30, 1.8, -30),
        weaponType: 'shotgun' as const,
        aggression: 0.9,
        accuracy: 0.5,
        patrolPath: this.generatePatrolPath(new THREE.Vector3(30, 0, -30), 6)
      }
    ];

    aiConfigs.forEach(config => {
      const aiState: AIState = {
        position: config.position.clone(),
        rotation: new THREE.Euler(0, 0, 0),
        health: 100,
        maxHealth: 100,
        isAlive: true,
        currentState: 'patrol',
        patrolPath: config.patrolPath,
        currentPatrolIndex: 0,
        reactionTime: 200 + Math.random() * 300, // 200-500ms reaction time
        accuracy: config.accuracy,
        aggression: config.aggression,
        weaponType: config.weaponType,
        lastFireTime: 0,
        fireRate: this.getWeaponFireRate(config.weaponType),
        damage: this.getWeaponDamage(config.weaponType),
        coverPoints: this.findCoverPoints(config.position),
        isTakingCover: false,
        morale: 1.0,
        suppressionLevel: 0
      };

      this.aiAgents.set(config.id, aiState);
      this.createAIMesh(config.id, aiState);
    });
  }

  private getWeaponFireRate(weaponType: string): number {
    switch (weaponType) {
      case 'rifle': return 180; // 180 RPM
      case 'shotgun': return 60; // 60 RPM
      case 'sniper': return 30; // 30 RPM
      default: return 120;
    }
  }

  private getWeaponDamage(weaponType: string): number {
    switch (weaponType) {
      case 'rifle': return 25;
      case 'shotgun': return 15; // Per pellet
      case 'sniper': return 80;
      default: return 20;
    }
  }

  private generatePatrolPath(center: THREE.Vector3, radius: number): THREE.Vector3[] {
    const path: THREE.Vector3[] = [];
    const points = 6 + Math.floor(Math.random() * 4); // 6-9 points

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const distance = radius + Math.random() * 10 - 5;
      const x = center.x + Math.cos(angle) * distance;
      const z = center.z + Math.sin(angle) * distance;
      path.push(new THREE.Vector3(x, 1.8, z));
    }

    return path;
  }

  private findCoverPoints(position: THREE.Vector3): THREE.Vector3[] {
    const coverPoints: THREE.Vector3[] = [];
    const searchRadius = 20;

    this.collidableObjects.forEach(obj => {
      if (obj instanceof THREE.Mesh) {
        const bbox = new THREE.Box3().setFromObject(obj);
        const center = bbox.getCenter(new THREE.Vector3());
        const distance = position.distanceTo(center);

        if (distance < searchRadius && bbox.getSize(new THREE.Vector3()).y > 1.5) {
          coverPoints.push(center.clone());
        }
      }
    });

    return coverPoints;
  }

  private createAIMesh(id: string, aiState: AIState): void {
    const aiGroup = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.6, 8, 16);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: 0x8B0000, // Dark red for enemy
      transparent: true,
      opacity: 0.8
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    aiGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B6B });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.6;
    head.castShadow = true;
    aiGroup.add(head);

    // Weapon indicator
    const weaponGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.1);
    const weaponMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.set(0.6, 1.2, 0);
    weapon.rotation.z = Math.PI / 4;
    aiGroup.add(weapon);

    // Health bar
    const healthBarBackground = new THREE.BoxGeometry(1, 0.1, 0.1);
    const healthBarBgMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const healthBarBg = new THREE.Mesh(healthBarBackground, healthBarBgMaterial);
    healthBarBg.position.y = 2.2;
    aiGroup.add(healthBarBg);

    const healthBarGeometry = new THREE.BoxGeometry(0.98, 0.08, 0.11);
    const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
    healthBar.position.y = 2.2;
    healthBar.position.x = -0.01;
    aiGroup.add(healthBar);

    aiGroup.position.copy(aiState.position);
    this.scene.add(aiGroup);
    this.aiMeshes.set(id, aiGroup);
  }

  public updatePlayerPosition(position: THREE.Vector3): void {
    this.playerPosition = position.clone();
  }

  public update(deltaTime: number): void {
    const now = Date.now();
    const timeDelta = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    this.aiAgents.forEach((ai, id) => {
      if (!ai.isAlive) return;

      // Update AI state based on player proximity
      this.updateAIState(ai, timeDelta);

      // Execute current behavior
      this.executeAIBehavior(ai, timeDelta);

      // Update visual representation
      this.updateAIMesh(id, ai);

      // Check for line of sight to player
      if (this.hasLineOfSight(ai.position, this.playerPosition)) {
        ai.lastKnownPlayerPosition = this.playerPosition.clone();
        if (ai.currentState !== 'combat') {
          ai.currentState = 'combat';
          ai.reactionTime = 200 + Math.random() * 300; // Reset reaction time
        }
      }

      // Try to shoot at player
      if (ai.currentState === 'combat' && now - ai.lastFireTime > (60000 / ai.fireRate)) {
        this.attemptShot(ai);
      }
    });
  }

  private updateAIState(ai: AIState, deltaTime: number): void {
    const distanceToPlayer = ai.position.distanceTo(this.playerPosition);
    const timeSinceLastPlayerSeen = ai.lastKnownPlayerPosition ?
      Date.now() - (ai.lastKnownPlayerPosition as any)._timestamp || 0 : 999999;

    // State transitions based on distance and aggression
    if (distanceToPlayer < 5) {
      ai.currentState = 'retreat';
      ai.morale = Math.max(0.3, ai.morale - 0.01);
    } else if (distanceToPlayer < 15 && ai.aggression > 0.5) {
      ai.currentState = 'combat';
    } else if (distanceToPlayer < 25) {
      ai.currentState = Math.random() > 0.5 ? 'flank' : 'combat';
    } else if (ai.lastKnownPlayerPosition && timeSinceLastPlayerSeen < 5000) {
      ai.currentState = 'search';
    } else if (timeSinceLastPlayerSeen > 10000) {
      ai.currentState = 'patrol';
    }

    // Update suppression level (decreases over time)
    ai.suppressionLevel = Math.max(0, ai.suppressionLevel - deltaTime * 0.2);

    // Check if need to take cover
    if (ai.health < 50 && ai.coverPoints.length > 0 && !ai.isTakingCover) {
      this.findBestCover(ai);
    }
  }

  private executeAIBehavior(ai: AIState, deltaTime: number): void {
    switch (ai.currentState) {
      case 'patrol':
        this.executePatrol(ai, deltaTime);
        break;
      case 'search':
        this.executeSearch(ai, deltaTime);
        break;
      case 'combat':
        this.executeCombat(ai, deltaTime);
        break;
      case 'flank':
        this.executeFlank(ai, deltaTime);
        break;
      case 'retreat':
        this.executeRetreat(ai, deltaTime);
        break;
    }

    // Always look towards player when in combat
    if (ai.currentState === 'combat' || ai.currentState === 'flank') {
      this.lookAtPosition(ai, this.playerPosition);
    }
  }

  private executePatrol(ai: AIState, deltaTime: number): void {
    if (ai.patrolPath.length === 0) return;

    const targetPosition = ai.patrolPath[ai.currentPatrolIndex];
    const distance = ai.position.distanceTo(targetPosition);

    if (distance < 1) {
      ai.currentPatrolIndex = (ai.currentPatrolIndex + 1) % ai.patrolPath.length;
    } else {
      const direction = targetPosition!.clone().sub(ai.position).normalize();
      const moveSpeed = 1.5 * deltaTime; // Walking speed
      const newPosition = ai.position.clone().add(direction.multiplyScalar(moveSpeed));

      if (this.isValidPosition(newPosition)) {
        ai.position.copy(newPosition);
      }
    }
  }

  private executeSearch(ai: AIState, deltaTime: number): void {
    if (!ai.lastKnownPlayerPosition) {
      ai.currentState = 'patrol';
      return;
    }

    const distanceToLastKnown = ai.position.distanceTo(ai.lastKnownPlayerPosition);

    if (distanceToLastKnown < 1) {
      // Reached last known position, search area
      const searchRadius = 5;
      const searchAngle = (Date.now() / 1000) % (Math.PI * 2);
      const searchX = ai.lastKnownPlayerPosition.x + Math.cos(searchAngle) * searchRadius;
      const searchZ = ai.lastKnownPlayerPosition.z + Math.sin(searchAngle) * searchRadius;

      const targetPosition = new THREE.Vector3(searchX, 1.8, searchZ);
      this.moveTowards(ai, targetPosition, 1.0, deltaTime);
    } else {
      this.moveTowards(ai, ai.lastKnownPlayerPosition, 2.0, deltaTime);
    }
  }

  private executeCombat(ai: AIState, deltaTime: number): void {
    // Maintain optimal combat distance based on weapon type
    let optimalDistance = 15;
    let aggressiveness = ai.aggression;

    switch (ai.weaponType) {
      case 'shotgun':
        optimalDistance = 8;
        aggressiveness *= 1.5; // Shotguns are more aggressive
        break;
      case 'sniper':
        optimalDistance = 30;
        aggressiveness *= 0.5; // Snipers are more cautious
        break;
    }

    const distanceToPlayer = ai.position.distanceTo(this.playerPosition);

    if (distanceToPlayer > optimalDistance + 5) {
      // Move closer
      this.moveTowards(ai, this.playerPosition, 2.5, deltaTime);
    } else if (distanceToPlayer < optimalDistance - 5 && aggressiveness < 0.8) {
      // Move away
      const direction = ai.position.clone().sub(this.playerPosition).normalize();
      const newPosition = ai.position.clone().add(direction.multiplyScalar(2.0 * deltaTime));

      if (this.isValidPosition(newPosition)) {
        ai.position.copy(newPosition);
      }
    }

    // Strafe movement when in optimal range
    if (Math.abs(distanceToPlayer - optimalDistance) < 5) {
      const strafeDirection = new THREE.Vector3();
      strafeDirection.crossVectors(
        this.playerPosition.clone().sub(ai.position).normalize(),
        new THREE.Vector3(0, 1, 0)
      ).normalize();

      if (Math.random() > 0.5) {
        strafeDirection.negate();
      }

      const strafePosition = ai.position.clone().add(strafeDirection.multiplyScalar(1.5 * deltaTime));

      if (this.isValidPosition(strafePosition)) {
        ai.position.copy(strafePosition);
      }
    }

    // Look at player with some prediction
    const predictedPlayerPos = this.playerPosition.clone();
    this.lookAtPosition(ai, predictedPlayerPos);
  }

  private executeFlank(ai: AIState, deltaTime: number): void {
    // Calculate flanking position
    const toPlayer = this.playerPosition.clone().sub(ai.position).normalize();
    const flankDirection = new THREE.Vector3();

    // Cross product to get perpendicular direction
    flankDirection.crossVectors(toPlayer, new THREE.Vector3(0, 1, 0)).normalize();

    // Choose left or right flank randomly
    if (Math.random() > 0.5) {
      flankDirection.negate();
    }

    const flankDistance = 15;
    const flankPosition = this.playerPosition.clone().add(flankDirection.multiplyScalar(flankDistance));

    this.moveTowards(ai, flankPosition, 3.0, deltaTime);
  }

  private executeRetreat(ai: AIState, deltaTime: number): void {
    // Find safe position to retreat to
    const retreatDirection = ai.position.clone().sub(this.playerPosition).normalize();
    const retreatDistance = 20;
    const retreatPosition = ai.position.clone().add(retreatDirection.multiplyScalar(retreatDistance));

    this.moveTowards(ai, retreatPosition, 4.0, deltaTime);

    // Look at player while retreating
    this.lookAtPosition(ai, this.playerPosition);
  }

  private findBestCover(ai: AIState): void {
    if (ai.coverPoints.length === 0) return;

    let bestCover = ai.coverPoints[0];
    let bestScore = -Infinity;

    ai.coverPoints.forEach(coverPoint => {
      const distanceToCover = ai.position.distanceTo(coverPoint);
      const coverAngle = this.getCoverAngle(coverPoint, this.playerPosition);
      const distanceToPlayer = coverPoint.distanceTo(this.playerPosition);

      // Score based on proximity, cover quality, and distance from player
      const score = (20 - distanceToCover) + coverAngle + (distanceToPlayer / 2);

      if (score > bestScore) {
        bestScore = score;
        bestCover = coverPoint;
      }
    });

    ai.currentCoverPoint = bestCover;
    ai.isTakingCover = true;
  }

  private getCoverAngle(coverPoint: THREE.Vector3, fromPoint: THREE.Vector3): number {
    // Calculate how well the cover point blocks line of sight from player
    const toCover = coverPoint.clone().sub(fromPoint).normalize();
    const toAI = new THREE.Vector3(coverPoint.x, coverPoint.y + 1.8, coverPoint.z).sub(fromPoint).normalize();

    const dot = toCover.dot(toAI);
    return Math.max(0, dot);
  }

  private moveTowards(ai: AIState, target: THREE.Vector3, speed: number, deltaTime: number): void {
    const direction = target.clone().sub(ai.position).normalize();
    const newPosition = ai.position.clone().add(direction.multiplyScalar(speed * deltaTime));

    if (this.isValidPosition(newPosition)) {
      ai.position.copy(newPosition);
    }
  }

  private lookAtPosition(ai: AIState, target: THREE.Vector3): void {
    const direction = target.clone().sub(ai.position).normalize();
    const yaw = Math.atan2(direction.x, direction.z);
    const pitch = Math.asin(-direction.y);

    ai.rotation.y = yaw;
    ai.rotation.x = pitch;
  }

  private hasLineOfSight(from: THREE.Vector3, to: THREE.Vector3): boolean {
    const raycaster = new THREE.Raycaster();
    const direction = to.clone().sub(from).normalize();

    raycaster.set(from, direction);
    const intersects = raycaster.intersectObjects(this.collidableObjects);

    const distance = from.distanceTo(to);

    // Check if any intersection blocks the line of sight
    for (const intersect of intersects) {
      if (intersect.distance < distance) {
        return false;
      }
    }

    return true;
  }

  private isValidPosition(position: THREE.Vector3): boolean {
    // Check if position is not inside any collidable object
    for (const obj of this.collidableObjects) {
      if (obj instanceof THREE.Mesh) {
        const bbox = new THREE.Box3().setFromObject(obj);
        if (bbox.containsPoint(position)) {
          return false;
        }
      }
    }
    return true;
  }

  private attemptShot(ai: AIState): void {
    const now = Date.now();

    // Check reaction time
    if (now - (ai as any)._lastCombatStart < ai.reactionTime) {
      return;
    }

    // Check if player is in range and has line of sight
    const distance = ai.position.distanceTo(this.playerPosition);
    const maxRange = ai.weaponType === 'sniper' ? 50 : 30;

    if (distance > maxRange || !this.hasLineOfSight(ai.position, this.playerPosition)) {
      return;
    }

    // Calculate hit probability based on distance, accuracy, and player movement
    let hitProbability = ai.accuracy;

    // Distance penalty
    hitProbability *= Math.max(0.3, 1 - (distance / maxRange));

    // Movement penalty for player
    hitProbability *= 0.8;

    // Suppression penalty
    hitProbability *= (1 - ai.suppressionLevel * 0.5);

    // Morale penalty
    hitProbability *= ai.morale;

    // Aim offset based on accuracy
    const spread = (1 - hitProbability) * 0.2;
    const aimOffset = new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    );

    const aimTarget = this.playerPosition.clone().add(aimOffset);

    // Perform shot
    if (Math.random() < hitProbability) {
      console.log(`AI ${ai.weaponType} hit player for ${ai.damage} damage`);
      // This would need to be connected to the actual player damage system
    } else {
      console.log(`AI ${ai.weaponType} missed`);
      this.createMissEffect(aimTarget);
    }

    ai.lastFireTime = now;

    // Add muzzle flash effect
    this.createMuzzleFlash(ai.position, ai.rotation);
  }

  private createMissEffect(position: THREE.Vector3): void {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xff6666 });
    const effect = new THREE.Mesh(geometry, material);
    effect.position.copy(position);
    this.scene.add(effect);

    setTimeout(() => {
      this.scene.remove(effect);
    }, 200);
  }

  private createMuzzleFlash(position: THREE.Vector3, rotation: THREE.Euler): void {
    const geometry = new THREE.SphereGeometry(0.2, 6, 6);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    });
    const flash = new THREE.Mesh(geometry, material);

    // Position muzzle flash in front of AI
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyEuler(rotation);
    flash.position.copy(position.clone().add(forward.multiplyScalar(0.8)));
    flash.position.y += 1.2;

    this.scene.add(flash);

    setTimeout(() => {
      this.scene.remove(flash);
    }, 50);
  }

  private updateAIMesh(id: string, ai: AIState): void {
    const mesh = this.aiMeshes.get(id);
    if (!mesh) return;

    mesh.position.copy(ai.position);
    mesh.rotation.copy(ai.rotation);

    // Update health bar
    const healthBar = mesh.children.find(child =>
      child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial &&
      child.material.color.getHex() === 0x00ff00
    ) as THREE.Mesh;

    if (healthBar) {
      const healthPercentage = ai.health / ai.maxHealth;
      const material = healthBar.material as THREE.MeshBasicMaterial;

      // Change color based on health
      if (healthPercentage > 0.6) {
        material.color.setHex(0x00ff00); // Green
      } else if (healthPercentage > 0.3) {
        material.color.setHex(0xffff00); // Yellow
      } else {
        material.color.setHex(0xff0000); // Red
      }

      // Scale health bar
      healthBar.scale.x = healthPercentage;
      healthBar.position.x = -0.01 * (1 - healthPercentage);
    }

    // Update visibility based on alive state
    mesh.visible = ai.isAlive;
  }

  public applyDamage(aiId: string, damage: number): boolean {
    const ai = this.aiAgents.get(aiId);
    if (!ai || !ai.isAlive) return false;

    ai.health = Math.max(0, ai.health - damage);
    ai.morale = Math.max(0.3, ai.morale - 0.1);
    ai.suppressionLevel = Math.min(1, ai.suppressionLevel + 0.3);

    if (ai.health <= 0) {
      ai.isAlive = false;
      console.log(`AI ${aiId} eliminated`);
      return true;
    }

    return false;
  }

  public getAIAgents(): Map<string, AIState> {
    return new Map(this.aiAgents);
  }

  public cleanup(): void {
    this.aiMeshes.forEach(mesh => {
      this.scene.remove(mesh);
    });
    this.aiMeshes.clear();
    this.aiAgents.clear();
  }
}
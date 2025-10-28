// @ts-nocheck
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js.js';

/**
 * Realistic Military Operator Models
 *
 * This system creates anatomically correct human soldier models with:
 * - Proper human anatomy and proportions
 * - Muscular definition for athletic builds
 * - Detailed military equipment and gear
 * - PBR materials for realistic rendering
 * - Animation-ready skeletal systems
 */

export interface OperatorConfig {
  class: 'assault' | 'recon' | 'marksman' | 'engineer' | 'medic';
  team: 'alpha' | 'bravo';
  rank: 'operator' | 'specialist' | 'team-lead';
  equipment: string[];
  camoPattern: 'multicam' | 'woodland' | 'desert' | 'urban' | 'arctic';
}

export class RealisticMilitaryOperator {
  public group: THREE.Group;
  public skeleton: THREE.Skeleton;
  public materials: { [key: string]: THREE.Material };
  public config: OperatorConfig;
  public bodyParts: { [key: string]: THREE.Mesh | THREE.Group };
  public equipment: { [key: string]: THREE.Mesh | THREE.Group };

  // Animation morph targets and blend shapes
  public morphTargets: { [key: string]: THREE.Mesh };
  public blendShapes: { [key: string]: number };

  // Body proportions based on real human anatomy
  private proportions = {
    headHeight: 0.125,    // Head is ~12.5% of total height
    neckHeight: 0.05,     // Neck is ~5% of total height
    torsoHeight: 0.3,     // Torso is ~30% of total height
    legHeight: 0.475,     // Legs are ~47.5% of total height
    armLength: 0.35,      // Arms are ~35% of total height
    shoulderWidth: 0.2,   // Shoulders are ~20% of total height
  };

  constructor(config: OperatorConfig, height: number = 1.8) {
    this.config = config;
    this.group = new THREE.Group();
    this.bodyParts = {};
    this.equipment = {};
    this.morphTargets = {};
    this.blendShapes = {
      jawOpen: 0,
      blinkLeft: 0,
      blinkRight: 0,
      frown: 0,
      smile: 0,
      breath: 0
    };

    this.materials = this.createRealisticMaterials();
    this.skeleton = new THREE.Skeleton([]);

    this.buildAnatomicallyCorrectSoldier(height);
    this.addMilitaryEquipment();
    this.finalizeModel();
  }

  private createRealisticMaterials(): { [key: string]: THREE.Material } {
    const materials: { [key: string]: THREE.Material } = {};

    // Skin materials with subsurface scattering effect
    materials.skinHead = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xd4a373), // Natural skin tone
      roughness: 0.7,
      metalness: 0.0,
      clearcoat: 0.2,
      clearcoatRoughness: 0.8,
      normalScale: new THREE.Vector2(0.5, 0.5),
      envMapIntensity: 0.5
    });

    materials.skinBody = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xe6c9a8), // Slightly different tone for body
      roughness: 0.8,
      metalness: 0.0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.9,
      normalScale: new THREE.Vector2(0.3, 0.3)
    });

    // Uniform materials
    materials.uniformBase = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x2d4a2b), // Base uniform color
      roughness: 0.9,
      metalness: 0.0,
      normalScale: new THREE.Vector2(0.8, 0.8),
      envMapIntensity: 0.3
    });

    // Tactical gear materials
    materials.tacticalVest = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x1a1a1a),
      roughness: 0.6,
      metalness: 0.1,
      clearcoat: 0.3,
      clearcoatRoughness: 0.7,
      normalScale: new THREE.Vector2(1.0, 1.0)
    });

    materials.helmet = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x2a2a2a),
      roughness: 0.3,
      metalness: 0.8,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.0
    });

    // Weapon materials
    materials.weaponMetal = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x1a1a1a),
      roughness: 0.2,
      metalness: 1.0,
      clearcoat: 0.4,
      clearcoatRoughness: 0.6,
      envMapIntensity: 1.2
    });

    materials.weaponPlastic = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x1a1a1a),
      roughness: 0.8,
      metalness: 0.0
    });

    // Equipment materials
    materials.pouches = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x1a1a1a),
      roughness: 0.7,
      metalness: 0.0
    });

    materials.straps = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x1a1a1a),
      roughness: 0.9,
      metalness: 0.0
    });

    // Eye materials
    materials.eyes = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x4169e1), // Blue eyes
      roughness: 0.1,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      envMapIntensity: 1.5,
      transmission: 0.1,
      ior: 1.4
    });

    return materials;
  }

  private buildAnatomicallyCorrectSoldier(height: number): void {
    // Create skeletal structure first
    this.createSkeleton(height);

    // Build body parts with anatomically correct proportions
    this.buildHead(height * this.proportions.headHeight);
    this.buildTorso(height * this.proportions.torsoHeight);
    this.buildArms(height * this.proportions.armLength);
    this.buildLegs(height * this.proportions.legHeight);

    // Position body parts correctly
    this.positionBodyParts(height);
  }

  private createSkeleton(height: number): void {
    const bones: THREE.Bone[] = [];

    // Root bone
    const rootBone = new THREE.Bone();
    rootBone.name = 'root';
    bones.push(rootBone);

    // Spine bones
    const hipBone = new THREE.Bone();
    hipBone.name = 'hip';
    hipBone.position.y = height * this.proportions.legHeight;
    rootBone.add(hipBone);
    bones.push(hipBone);

    const spineBone = new THREE.Bone();
    spineBone.name = 'spine';
    spineBone.position.y = height * this.proportions.legHeight + height * this.proportions.torsoHeight * 0.4;
    rootBone.add(spineBone);
    bones.push(spineBone);

    const chestBone = new THREE.Bone();
    chestBone.name = 'chest';
    chestBone.position.y = height * this.proportions.legHeight + height * this.proportions.torsoHeight * 0.8;
    rootBone.add(chestBone);
    bones.push(chestBone);

    const neckBone = new THREE.Bone();
    neckBone.name = 'neck';
    neckBone.position.y = height * this.proportions.legHeight + height * this.proportions.torsoHeight + height * this.proportions.neckHeight * 0.5;
    rootBone.add(neckBone);
    bones.push(neckBone);

    const headBone = new THREE.Bone();
    headBone.name = 'head';
    headBone.position.y = height * this.proportions.legHeight + height * this.proportions.torsoHeight + height * this.proportions.neckHeight;
    rootBone.add(headBone);
    bones.push(headBone);

    // Arm bones
    const leftShoulderBone = new THREE.Bone();
    leftShoulderBone.name = 'leftShoulder';
    leftShoulderBone.position.set(
      -height * this.proportions.shoulderWidth / 2,
      height * this.proportions.legHeight + height * this.proportions.torsoHeight * 0.85,
      0
    );
    rootBone.add(leftShoulderBone);
    bones.push(leftShoulderBone);

    const leftArmBone = new THREE.Bone();
    leftArmBone.name = 'leftArm';
    leftShoulderBone.add(leftArmBone);
    bones.push(leftArmBone);

    const leftForearmBone = new THREE.Bone();
    leftForearmBone.name = 'leftForearm';
    leftForearmBone.position.y = -height * this.proportions.armLength * 0.45;
    leftArmBone.add(leftForearmBone);
    bones.push(leftForearmBone);

    // Right arm bones
    const rightShoulderBone = new THREE.Bone();
    rightShoulderBone.name = 'rightShoulder';
    rightShoulderBone.position.set(
      height * this.proportions.shoulderWidth / 2,
      height * this.proportions.legHeight + height * this.proportions.torsoHeight * 0.85,
      0
    );
    rootBone.add(rightShoulderBone);
    bones.push(rightShoulderBone);

    const rightArmBone = new THREE.Bone();
    rightArmBone.name = 'rightArm';
    rightShoulderBone.add(rightArmBone);
    bones.push(rightArmBone);

    const rightForearmBone = new THREE.Bone();
    rightForearmBone.name = 'rightForearm';
    rightForearmBone.position.y = -height * this.proportions.armLength * 0.45;
    rightArmBone.add(rightForearmBone);
    bones.push(rightForearmBone);

    // Leg bones
    const leftHipBone = new THREE.Bone();
    leftHipBone.name = 'leftHip';
    leftHipBone.position.set(-0.08, height * this.proportions.legHeight * 0.5, 0);
    rootBone.add(leftHipBone);
    bones.push(leftHipBone);

    const leftThighBone = new THREE.Bone();
    leftThighBone.name = 'leftThigh';
    leftThighBone.position.y = -height * this.proportions.legHeight * 0.5;
    leftHipBone.add(leftThighBone);
    bones.push(leftThighBone);

    const leftShinBone = new THREE.Bone();
    leftShinBone.name = 'leftShin';
    leftShinBone.position.y = -height * this.proportions.legHeight * 0.45;
    leftThighBone.add(leftShinBone);
    bones.push(leftShinBone);

    // Right leg bones
    const rightHipBone = new THREE.Bone();
    rightHipBone.name = 'rightHip';
    rightHipBone.position.set(0.08, height * this.proportions.legHeight * 0.5, 0);
    rootBone.add(rightHipBone);
    bones.push(rightHipBone);

    const rightThighBone = new THREE.Bone();
    rightThighBone.name = 'rightThigh';
    rightThighBone.position.y = -height * this.proportions.legHeight * 0.5;
    rightHipBone.add(rightThighBone);
    bones.push(rightThighBone);

    const rightShinBone = new THREE.Bone();
    rightShinBone.name = 'rightShin';
    rightShinBone.position.y = -height * this.proportions.legHeight * 0.45;
    rightThighBone.add(rightShinBone);
    bones.push(rightShinBone);

    this.skeleton = new THREE.Skeleton(bones);
  }

  private buildHead(headHeight: number): void {
    const headGroup = new THREE.Group();

    // Create anatomically correct head shape using multiple spheres
    const headMain = new THREE.Mesh(
      new THREE.SphereGeometry(headHeight * 0.7, 32, 32),
      this.materials.skinHead
    );

    // Jaw
    const jawGeometry = new THREE.SphereGeometry(headHeight * 0.35, 16, 8);
    jawGeometry.scale(1.2, 0.8, 1.5);
    jawGeometry.translate(0, -headHeight * 0.5, headHeight * 0.2);
    const jaw = new THREE.Mesh(jawGeometry, this.materials.skinHead);

    // Chin
    const chinGeometry = new THREE.SphereGeometry(headHeight * 0.2, 12, 8);
    chinGeometry.scale(1.2, 1.5, 1.8);
    chinGeometry.translate(0, -headHeight * 0.65, headHeight * 0.3);
    const chin = new THREE.Mesh(chinGeometry, this.materials.skinHead);

    // Forehead
    const foreheadGeometry = new THREE.SphereGeometry(headHeight * 0.45, 16, 12);
    foreheadGeometry.scale(1.1, 0.8, 0.9);
    foreheadGeometry.translate(0, headHeight * 0.4, -headHeight * 0.1);
    const forehead = new THREE.Mesh(foreheadGeometry, this.materials.skinHead);

    // Nose
    const noseGeometry = new THREE.ConeGeometry(headHeight * 0.08, headHeight * 0.25, 8);
    noseGeometry.rotateZ(Math.PI / 2);
    noseGeometry.translate(0, 0, headHeight * 0.65);
    const nose = new THREE.Mesh(noseGeometry, this.materials.skinHead);

    // Eyes
    const leftEye = new THREE.Mesh(
      new THREE.SphereGeometry(headHeight * 0.12, 16, 16),
      this.materials.eyes
    );
    leftEye.position.set(-headHeight * 0.2, headHeight * 0.1, headHeight * 0.55);

    const rightEye = new THREE.Mesh(
      new THREE.SphereGeometry(headHeight * 0.12, 16, 16),
      this.materials.eyes
    );
    rightEye.position.set(headHeight * 0.2, headHeight * 0.1, headHeight * 0.55);

    // Combine head parts
    headGroup.add(headMain);
    headGroup.add(jaw);
    headGroup.add(chin);
    headGroup.add(forehead);
    headGroup.add(nose);
    headGroup.add(leftEye);
    headGroup.add(rightEye);

    // Create morph targets for facial animations
    this.morphTargets.jawOpen = jaw as THREE.Mesh;
    this.morphTargets.leftEye = leftEye as THREE.Mesh;
    this.morphTargets.rightEye = rightEye as THREE.Mesh;

    this.bodyParts.head = headGroup;
    this.group.add(headGroup);
  }

  private buildTorso(torsoHeight: number): void {
    const torsoGroup = new THREE.Group();

    // Chest - athletic build
    const chestGeometry = new THREE.CylinderGeometry(
      torsoHeight * 0.22, // Top radius
      torsoHeight * 0.28, // Bottom radius
      torsoHeight * 0.6,  // Height
      16,                // Radial segments
      3                  // Height segments
    );
    chestGeometry.translate(0, torsoHeight * 0.3, 0);

    // Add muscular definition to chest
    const chest = new THREE.Mesh(chestGeometry, this.materials.skinBody);

    // Pectoral muscles
    const leftPec = new THREE.Mesh(
      new THREE.SphereGeometry(torsoHeight * 0.15, 16, 8),
      this.materials.skinBody
    );
    leftPec.position.set(-torsoHeight * 0.15, torsoHeight * 0.35, torsoHeight * 0.15);
    leftPec.scale.set(1.2, 0.6, 0.8);

    const rightPec = new THREE.Mesh(
      new THREE.SphereGeometry(torsoHeight * 0.15, 16, 8),
      this.materials.skinBody
    );
    rightPec.position.set(torsoHeight * 0.15, torsoHeight * 0.35, torsoHeight * 0.15);
    rightPec.scale.set(1.2, 0.6, 0.8);

    // Abdominal muscles
    const absGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const ab = new THREE.Mesh(
        new THREE.BoxGeometry(torsoHeight * 0.08, torsoHeight * 0.06, torsoHeight * 0.03),
        this.materials.skinBody
      );
      ab.position.set(0, torsoHeight * 0.05 - (i * torsoHeight * 0.04), torsoHeight * 0.25);
      absGroup.add(ab);
    }

    // Back muscles
    const backLeft = new THREE.Mesh(
      new THREE.SphereGeometry(torsoHeight * 0.18, 16, 8),
      this.materials.skinBody
    );
    backLeft.position.set(-torsoHeight * 0.25, torsoHeight * 0.25, -torsoHeight * 0.2);
    backLeft.scale.set(1.5, 1.2, 0.8);

    const backRight = new THREE.Mesh(
      new THREE.SphereGeometry(torsoHeight * 0.18, 16, 8),
      this.materials.skinBody
    );
    backRight.position.set(torsoHeight * 0.25, torsoHeight * 0.25, -torsoHeight * 0.2);
    backRight.scale.set(1.5, 1.2, 0.8);

    // Shoulder muscles (deltoids)
    const leftShoulder = new THREE.Mesh(
      new THREE.SphereGeometry(torsoHeight * 0.2, 16, 8),
      this.materials.skinBody
    );
    leftShoulder.position.set(-torsoHeight * 0.3, torsoHeight * 0.55, 0);

    const rightShoulder = new THREE.Mesh(
      new THREE.SphereGeometry(torsoHeight * 0.2, 16, 8),
      this.materials.skinBody
    );
    rightShoulder.position.set(torsoHeight * 0.3, torsoHeight * 0.55, 0);

    torsoGroup.add(chest);
    torsoGroup.add(leftPec);
    torsoGroup.add(rightPec);
    torsoGroup.add(absGroup);
    torsoGroup.add(backLeft);
    torsoGroup.add(backRight);
    torsoGroup.add(leftShoulder);
    torsoGroup.add(rightShoulder);

    this.bodyParts.torso = torsoGroup;
    this.group.add(torsoGroup);
  }

  private buildArms(armLength: number): void {
    // Left arm
    const leftArmGroup = new THREE.Group();

    // Upper arm with bicep definition
    const leftUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(armLength * 0.08, armLength * 0.06, armLength * 0.45, 12),
      this.materials.skinBody
    );

    // Bicep muscle
    const leftBicep = new THREE.Mesh(
      new THREE.SphereGeometry(armLength * 0.12, 12, 8),
      this.materials.skinBody
    );
    leftBicep.position.set(0, -armLength * 0.2, 0);
    leftBicep.scale.set(1.3, 0.8, 1.2);

    // Tricep muscle
    const leftTricep = new THREE.Mesh(
      new THREE.SphereGeometry(armLength * 0.08, 12, 8),
      this.materials.skinBody
    );
    leftTricep.position.set(0, -armLength * 0.2, -armLength * 0.06);
    leftTricep.scale.set(1.2, 0.8, 0.6);

    // Lower arm with forearm muscles
    const leftLowerArm = new THREE.Mesh(
      new THREE.CylinderGeometry(armLength * 0.06, armLength * 0.05, armLength * 0.45, 12),
      this.materials.skinBody
    );
    leftLowerArm.position.y = -armLength * 0.45;

    // Forearm muscles
    const leftForearmFlex = new THREE.Mesh(
      new THREE.CylinderGeometry(armLength * 0.07, armLength * 0.06, armLength * 0.3, 8),
      this.materials.skinBody
    );
    leftForearmFlex.position.set(armLength * 0.04, -armLength * 0.6, 0);
    leftForearmFlex.rotation.z = Math.PI / 6;

    // Hand
    const leftHand = new THREE.Mesh(
      new THREE.BoxGeometry(armLength * 0.08, armLength * 0.12, armLength * 0.03),
      this.materials.skinBody
    );
    leftHand.position.y = -armLength * 0.9;

    leftArmGroup.add(leftUpperArm);
    leftArmGroup.add(leftBicep);
    leftArmGroup.add(leftTricep);
    leftArmGroup.add(leftLowerArm);
    leftArmGroup.add(leftForearmFlex);
    leftArmGroup.add(leftHand);

    // Right arm (mirror of left)
    const rightArmGroup = leftArmGroup.clone();
    rightArmGroup.scale.x = -1;

    this.bodyParts.leftArm = leftArmGroup;
    this.bodyParts.rightArm = rightArmGroup;
    this.group.add(leftArmGroup);
    this.group.add(rightArmGroup);
  }

  private buildLegs(legHeight: number): void {
    // Left leg
    const leftLegGroup = new THREE.Group();

    // Upper leg (thigh) with quad muscles
    const leftThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(legHeight * 0.12, legHeight * 0.08, legHeight * 0.45, 12),
      this.materials.skinBody
    );

    // Quadriceps muscles
    const leftQuadFront = new THREE.Mesh(
      new THREE.BoxGeometry(legHeight * 0.15, legHeight * 0.35, legHeight * 0.08),
      this.materials.skinBody
    );
    leftQuadFront.position.set(0, -legHeight * 0.2, legHeight * 0.06);

    // Hamstring muscles
    const leftHamstring = new THREE.Mesh(
      new THREE.BoxGeometry(legHeight * 0.12, legHeight * 0.35, legHeight * 0.06),
      this.materials.skinBody
    );
    leftHamstring.position.set(0, -legHeight * 0.2, -legHeight * 0.06);

    // Glute muscles
    const leftGlute = new THREE.Mesh(
      new THREE.SphereGeometry(legHeight * 0.18, 12, 8),
      this.materials.skinBody
    );
    leftGlute.position.set(-legHeight * 0.08, legHeight * 0.1, 0);
    leftGlute.scale.set(1.5, 1.0, 1.2);

    // Lower leg (calf) with calf muscles
    const leftCalf = new THREE.Mesh(
      new THREE.CylinderGeometry(legHeight * 0.08, legHeight * 0.06, legHeight * 0.45, 12),
      this.materials.skinBody
    );
    leftCalf.position.y = -legHeight * 0.45;

    // Calf muscle
    const leftCalfMuscle = new THREE.Mesh(
      new THREE.SphereGeometry(legHeight * 0.12, 12, 8),
      this.materials.skinBody
    );
    leftCalfMuscle.position.set(0, -legHeight * 0.45, -legHeight * 0.04);
    leftCalfMuscle.scale.set(1.2, 1.5, 0.8);

    // Foot
    const leftFoot = new THREE.Mesh(
      new THREE.BoxGeometry(legHeight * 0.12, legHeight * 0.04, legHeight * 0.25),
      this.materials.skinBody
    );
    leftFoot.position.y = -legHeight * 0.9;
    leftFoot.position.z = legHeight * 0.1;

    leftLegGroup.add(leftThigh);
    leftLegGroup.add(leftQuadFront);
    leftLegGroup.add(leftHamstring);
    leftLegGroup.add(leftGlute);
    leftLegGroup.add(leftCalf);
    leftLegGroup.add(leftCalfMuscle);
    leftLegGroup.add(leftFoot);

    // Right leg (mirror of left)
    const rightLegGroup = leftLegGroup.clone();
    rightLegGroup.scale.x = -1;

    this.bodyParts.leftLeg = leftLegGroup;
    this.bodyParts.rightLeg = rightLegGroup;
    this.group.add(leftLegGroup);
    this.group.add(rightLegGroup);
  }

  private positionBodyParts(height: number): void {
    // Position head
    if (this.bodyParts.head) {
      this.bodyParts.head.position.y =
        height * this.proportions.legHeight +
        height * this.proportions.torsoHeight +
        height * this.proportions.neckHeight;
    }

    // Position torso
    if (this.bodyParts.torso) {
      this.bodyParts.torso.position.y = height * this.proportions.legHeight;
    }

    // Position arms
    if (this.bodyParts.leftArm) {
      this.bodyParts.leftArm.position.set(
        -height * this.proportions.shoulderWidth / 2 - 0.02,
        height * this.proportions.legHeight + height * this.proportions.torsoHeight * 0.85,
        0
      );
    }

    if (this.bodyParts.rightArm) {
      this.bodyParts.rightArm.position.set(
        height * this.proportions.shoulderWidth / 2 + 0.02,
        height * this.proportions.legHeight + height * this.proportions.torsoHeight * 0.85,
        0
      );
    }

    // Position legs
    if (this.bodyParts.leftLeg) {
      this.bodyParts.leftLeg.position.set(-0.08, height * this.proportions.legHeight * 0.5, 0);
    }

    if (this.bodyParts.rightLeg) {
      this.bodyParts.rightLeg.position.set(0.08, height * this.proportions.legHeight * 0.5, 0);
    }
  }

  private addMilitaryEquipment(): void {
    this.addTacticalVest();
    this.addHelmet();
    this.addWeapons();
    this.addPouches();
    this.addClassSpecificEquipment();
  }

  private addTacticalVest(): void {
    const vestGroup = new THREE.Group();

    // Main vest body
    const vestMain = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.5, 0.08),
      this.materials.tacticalVest
    );
    vestMain.position.y = 0.25;

    // Vest plates
    const frontPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.4, 0.02),
      this.materials.tacticalVest
    );
    frontPlate.position.set(0, 0.25, 0.05);

    // Shoulder straps
    const leftStrap = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.3, 0.04),
      this.materials.straps
    );
    leftStrap.position.set(-0.18, 0.4, 0);

    const rightStrap = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.3, 0.04),
      this.materials.straps
    );
    rightStrap.position.set(0.18, 0.4, 0);

    vestGroup.add(vestMain);
    vestGroup.add(frontPlate);
    vestGroup.add(leftStrap);
    vestGroup.add(rightStrap);

    this.equipment.tacticalVest = vestGroup;
    this.group.add(vestGroup);
  }

  private addHelmet(): void {
    const helmetGroup = new THREE.Group();

    // Main helmet shell
    const helmetShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 32, 16),
      this.materials.helmet
    );
    helmetShell.scale.y = 0.8; // Flatten slightly
    helmetShell.position.y = 0.05;

    // Helmet brim
    const brimGeometry = new THREE.TorusGeometry(0.14, 0.02, 8, 24, Math.PI);
    brimGeometry.rotateX(Math.PI / 2);
    const helmetBrim = new THREE.Mesh(brimGeometry, this.materials.helmet);
    helmetBrim.position.y = 0;

    // Night vision mount (for recon class)
    if (this.config.class === 'recon') {
      const nvMount = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.02, 0.08),
        this.materials.weaponMetal
      );
      nvMount.position.set(0, 0.14, 0);
      helmetGroup.add(nvMount);
    }

    helmetGroup.add(helmetShell);
    helmetGroup.add(helmetBrim);

    this.equipment.helmet = helmetGroup;
    this.group.add(helmetGroup);
  }

  private addWeapons(): void {
    const weaponGroup = new THREE.Group();

    switch (this.config.class) {
      case 'assault':
        this.createAssaultRifle(weaponGroup);
        break;
      case 'recon':
        this.createSniperRifle(weaponGroup);
        break;
      case 'marksman':
        this.createBattleRifle(weaponGroup);
        break;
      case 'engineer':
        this.createCarbine(weaponGroup);
        break;
      case 'medic':
        this.createSMG(weaponGroup);
        break;
    }

    this.equipment.weapon = weaponGroup;
    this.group.add(weaponGroup);
  }

  private createAssaultRifle(group: THREE.Group): void {
    // Assault rifle (M4-style)
    const receiver = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.25, 0.08),
      this.materials.weaponMetal
    );

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.3, 12),
      this.materials.weaponMetal
    );
    barrel.position.z = 0.15;
    barrel.rotation.x = Math.PI / 2;

    const magazine = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.15, 0.035),
      this.materials.weaponMetal
    );
    magazine.position.set(0, -0.15, 0.02);

    const pistolGrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.08, 0.04),
      this.materials.weaponPlastic
    );
    pistolGrip.position.set(0, -0.25, 0);

    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.12, 0.03),
      this.materials.weaponPlastic
    );
    stock.position.set(0, -0.32, -0.08);

    group.add(receiver);
    group.add(barrel);
    group.add(magazine);
    group.add(pistolGrip);
    group.add(stock);

    // Position in right hand
    group.position.set(0.3, 0.2, 0.1);
    group.rotation.y = Math.PI / 6;
  }

  private createSniperRifle(group: THREE.Group): void {
    // Sniper rifle with longer barrel
    const receiver = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.3, 0.09),
      this.materials.weaponMetal
    );

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.6, 12),
      this.materials.weaponMetal
    );
    barrel.position.z = 0.3;
    barrel.rotation.x = Math.PI / 2;

    const scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.15, 12),
      this.materials.weaponMetal
    );
    scope.position.set(0, 0.05, 0.05);
    scope.rotation.x = Math.PI / 2;

    const bipod = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.08, 0.02),
      this.materials.weaponMetal
    );
    bipod.position.set(0, 0.25, 0.45);

    group.add(receiver);
    group.add(barrel);
    group.add(scope);
    group.add(bipod);

    // Position for prone shooting
    group.position.set(0.4, 0.1, 0.05);
    group.rotation.x = Math.PI / 8;
  }

  private createBattleRifle(group: THREE.Group): void {
    // Battle rifle (DMR style)
    const receiver = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.28, 0.085),
      this.materials.weaponMetal
    );

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.45, 12),
      this.materials.weaponMetal
    );
    barrel.position.z = 0.225;
    barrel.rotation.x = Math.PI / 2;

    const scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.1, 12),
      this.materials.weaponMetal
    );
    scope.position.set(0, 0.04, 0.04);
    scope.rotation.x = Math.PI / 2;

    const magazine = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.12, 0.03),
      this.materials.weaponMetal
    );
    magazine.position.set(0, -0.12, 0.02);

    group.add(receiver);
    group.add(barrel);
    group.add(scope);
    group.add(magazine);

    group.position.set(0.35, 0.15, 0.08);
    group.rotation.y = Math.PI / 8;
  }

  private createCarbine(group: THREE.Group): void {
    // Carbine with attachments
    const receiver = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.22, 0.07),
      this.materials.weaponMetal
    );

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.25, 12),
      this.materials.weaponMetal
    );
    barrel.position.z = 0.125;
    barrel.rotation.x = Math.PI / 2;

    const flashlight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8),
      this.materials.weaponMetal
    );
    flashlight.position.set(0.04, 0, 0.05);
    flashlight.rotation.x = Math.PI / 2;

    const magazine = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.12, 0.03),
      this.materials.weaponMetal
    );
    magazine.position.set(0, -0.1, 0.02);

    group.add(receiver);
    group.add(barrel);
    group.add(flashlight);
    group.add(magazine);

    group.position.set(0.28, 0.18, 0.1);
    group.rotation.y = Math.PI / 4;
  }

  private createSMG(group: THREE.Group): void {
    // Submachine gun
    const receiver = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.18, 0.06),
      this.materials.weaponMetal
    );

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.18, 12),
      this.materials.weaponMetal
    );
    barrel.position.z = 0.09;
    barrel.rotation.x = Math.PI / 2;

    const magazine = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.15, 0.025),
      this.materials.weaponMetal
    );
    magazine.position.set(0, -0.08, 0.02);

    const foldingStock = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.08, 0.02),
      this.materials.weaponPlastic
    );
    foldingStock.position.set(0, -0.22, -0.06);

    group.add(receiver);
    group.add(barrel);
    group.add(magazine);
    group.add(foldingStock);

    group.position.set(0.25, 0.2, 0.12);
    group.rotation.y = Math.PI / 3;
  }

  private addPouches(): void {
    const pouchGroup = new THREE.Group();

    // Magazine pouches
    for (let i = 0; i < 3; i++) {
      const magPouch = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.08, 0.04),
        this.materials.pouches
      );
      magPouch.position.set(0.15, 0.2 - (i * 0.06), 0.05);
      pouchGroup.add(magPouch);
    }

    // Utility pouch
    const utilityPouch = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.1, 0.05),
      this.materials.pouches
    );
    utilityPouch.position.set(-0.15, 0.15, 0.05);
    pouchGroup.add(utilityPouch);

    this.equipment.pouches = pouchGroup;
    this.group.add(pouchGroup);
  }

  private addClassSpecificEquipment(): void {
    switch (this.config.class) {
      case 'assault':
        this.addGrenades();
        break;
      case 'recon':
        this.addBinoculars();
        this.addRadio();
        break;
      case 'marksman':
        this.addSpottingScope();
        break;
      case 'engineer':
        this.addToolkit();
        break;
      case 'medic':
        this.addMedicalKit();
        break;
    }
  }

  private addGrenades(): void {
    const grenadeGroup = new THREE.Group();

    for (let i = 0; i < 2; i++) {
      const grenade = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 12, 8),
        this.materials.weaponMetal
      );
      grenade.position.set(-0.2, 0.25 - (i * 0.06), 0.03);
      grenadeGroup.add(grenade);

      // Safety ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.015, 0.003, 4, 8),
        this.materials.weaponMetal
      );
      ring.position.set(-0.2, 0.25 - (i * 0.06), 0.045);
      grenadeGroup.add(ring);
    }

    this.equipment.grenades = grenadeGroup;
    this.group.add(grenadeGroup);
  }

  private addBinoculars(): void {
    const binocularGroup = new THREE.Group();

    // Main body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.03, 0.06),
      this.materials.weaponMetal
    );

    // Left lens
    const leftLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.04, 12),
      this.materials.weaponMetal
    );
    leftLens.position.set(-0.03, 0, 0.05);
    leftLens.rotation.x = Math.PI / 2;

    // Right lens
    const rightLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.04, 12),
      this.materials.weaponMetal
    );
    rightLens.position.set(0.03, 0, 0.05);
    rightLens.rotation.x = Math.PI / 2;

    binocularGroup.add(body);
    binocularGroup.add(leftLens);
    binocularGroup.add(rightLens);

    // Hang from chest
    binocularGroup.position.set(0, 0.3, 0.08);
    binocularGroup.rotation.x = Math.PI / 6;

    this.equipment.binoculars = binocularGroup;
    this.group.add(binocularGroup);
  }

  private addRadio(): void {
    const radioGroup = new THREE.Group();

    const radio = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.08, 0.03),
      this.materials.weaponPlastic
    );

    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.002, 0.002, 0.15, 6),
      this.materials.weaponMetal
    );
    antenna.position.set(0, 0.08, 0);

    const speaker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.01, 8),
      this.materials.weaponMetal
    );
    speaker.position.set(0, 0, 0.016);

    radioGroup.add(radio);
    radioGroup.add(antenna);
    radioGroup.add(speaker);

    // Position on back
    radioGroup.position.set(0, 0.3, -0.12);

    this.equipment.radio = radioGroup;
    this.group.add(radioGroup);
  }

  private addSpottingScope(): void {
    const scopeGroup = new THREE.Group();

    const scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.12, 12),
      this.materials.weaponMetal
    );
    scope.rotation.z = Math.PI / 2;

    const eyepiece = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8),
      this.materials.weaponMetal
    );
    eyepiece.position.set(-0.06, 0, 0);
    eyepiece.rotation.z = Math.PI / 2;

    scopeGroup.add(scope);
    scopeGroup.add(eyepiece);

    // Position in left hand
    scopeGroup.position.set(-0.3, 0.15, 0.1);
    scopeGroup.rotation.y = -Math.PI / 6;

    this.equipment.spottingScope = scopeGroup;
    this.group.add(scopeGroup);
  }

  private addToolkit(): void {
    const toolGroup = new THREE.Group();

    // Tool pouch
    const pouch = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, 0.04),
      this.materials.pouches
    );

    // Multitool
    const multitool = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.08, 0.01),
      this.materials.weaponMetal
    );
    multitool.position.set(0.02, -0.03, 0.025);

    // Wire cutters
    const cutters = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.06, 0.015),
      this.materials.weaponMetal
    );
    cutters.position.set(-0.02, -0.03, 0.025);

    toolGroup.add(pouch);
    toolGroup.add(multitool);
    toolGroup.add(cutters);

    // Position on belt
    toolGroup.position.set(-0.15, -0.1, 0.03);

    this.equipment.toolkit = toolGroup;
    this.group.add(toolGroup);
  }

  private addMedicalKit(): void {
    const medicGroup = new THREE.Group();

    // Medical pack
    const medPack = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.08, 0.06),
      this.materials.pouches
    );

    // Red cross
    const crossVertical = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.06, 0.01),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    crossVertical.position.set(0, 0, 0.031);

    const crossHorizontal = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.03, 0.01),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    crossHorizontal.position.set(0, 0, 0.031);

    medicGroup.add(medPack);
    medicGroup.add(crossVertical);
    medicGroup.add(crossHorizontal);

    // Position on back
    medicGroup.position.set(0, 0.1, -0.12);

    this.equipment.medicalKit = medicGroup;
    this.group.add(medicGroup);
  }

  private finalizeModel(): void {
    // Apply skeleton to all meshes that support it
    this.group.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        // Only bind skeleton if the mesh has proper skinning
        if (child.geometry && child.geometry.attributes.skinIndex) {
          try {
            child.bind(this.skeleton);
          } catch (error) {
            // Silently handle binding errors
            console.warn('Could not bind skeleton to mesh:', child.name || 'unnamed');
          }
        }

        // Add subtle normal variations for realism
        if (child.geometry) {
          child.geometry.computeVertexNormals();
        }
      }
    });

    // Apply team colors
    this.applyTeamColors();

    // Add LOD levels for performance
    this.createLOD();
  }

  private applyTeamColors(): void {
    const teamColor = this.config.team === 'alpha' ? 0x2d4a2b : 0x1a3a1a;

    // Update uniform colors based on team
    if (this.materials.uniformBase instanceof THREE.MeshPhysicalMaterial) {
      this.materials.uniformBase.color.setHex(teamColor);
    }

    if (this.materials.pouches instanceof THREE.MeshPhysicalMaterial) {
      this.materials.pouches.color.setHex(teamColor);
    }
  }

  private createLOD(): THREE.LOD {
    const lod = new THREE.LOD();

    // High detail (close range)
    lod.addLevel(this.group, 0);

    // Medium detail (medium range) - simplified version
    const mediumDetail = this.createMediumDetailVersion();
    lod.addLevel(mediumDetail, 10);

    // Low detail (far range) - very simplified
    const lowDetail = this.createLowDetailVersion();
    lod.addLevel(lowDetail, 50);

    return lod;
  }

  private createMediumDetailVersion(): THREE.Group {
    const mediumGroup = this.group.clone();

    // Simplify materials and remove small details
    mediumGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Use simpler materials
        child.material = new THREE.MeshLambertMaterial({
          color: (child.material as THREE.MeshPhysicalMaterial).color
        });

        // Remove small equipment items
        if (child.geometry.boundingSphere && child.geometry.boundingSphere.radius < 0.02) {
          child.visible = false;
        }
      }
    });

    return mediumGroup;
  }

  private createLowDetailVersion(): THREE.Group {
    const lowGroup = new THREE.Group();

    // Create very simplified shape
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.15, 1.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x2d4a2b })
    );

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0xd4a373 })
    );
    head.position.y = 0.9;

    lowGroup.add(body);
    lowGroup.add(head);

    return lowGroup;
  }

  // Animation methods
  public setBlendShape(name: string, value: number): void {
    if (this.blendShapes.hasOwnProperty(name)) {
      this.blendShapes[name] = Math.max(0, Math.min(1, value));
      this.updateBlendShapes();
    }
  }

  private updateBlendShapes(): void {
    // Update jaw opening
    if (this.morphTargets.jawOpen) {
      this.morphTargets.jawOpen.rotation.x = this.blendShapes.jawOpen * 0.3;
    }

    // Update eye blinking
    if (this.morphTargets.leftEye) {
      this.morphTargets.leftEye.scale.y = 1 - this.blendShapes.blinkLeft * 0.8;
    }

    if (this.morphTargets.rightEye) {
      this.morphTargets.rightEye.scale.y = 1 - this.blendShapes.blinkRight * 0.8;
    }

    // Breathing animation
    if (this.bodyParts.torso) {
      const breathScale = 1 + this.blendShapes.breath * 0.02;
      this.bodyParts.torso.scale.x = breathScale;
      this.bodyParts.torso.scale.z = breathScale;
    }
  }

  public playAnimation(animationName: string): void {
    // Animation system integration point
    // This would connect to a more complex animation system
    console.log(`Playing animation: ${animationName}`);
  }

  public updatePose(poseData: any): void {
    // Update skeleton bones based on pose data
    Object.keys(poseData).forEach(boneName => {
      const bone = this.skeleton.getBoneByName(boneName);
      if (bone && poseData[boneName]) {
        if (poseData[boneName].position) {
          bone.position.fromArray(poseData[boneName].position);
        }
        if (poseData[boneName].rotation) {
          bone.rotation.fromArray(poseData[boneName].rotation);
        }
        if (poseData[boneName].scale) {
          bone.scale.fromArray(poseData[boneName].scale);
        }
      }
    });

    this.skeleton.update();
  }

  public dispose(): void {
    // Clean up resources
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });

    Object.values(this.materials).forEach(material => {
      if (material.dispose) {
        material.dispose();
      }
    });
  }
}

export class MilitaryOperatorFactory {
  private static operatorClassConfigs = {
    assault: {
      equipment: ['assault-rifle', 'grenades', 'extra-ammo'],
      camoPattern: 'multicam' as const
    },
    recon: {
      equipment: ['sniper-rifle', 'binoculars', 'radio', 'suppressor'],
      camoPattern: 'woodland' as const
    },
    marksman: {
      equipment: ['battle-rifle', 'spotting-scope', 'bipod'],
      camoPattern: 'urban' as const
    },
    engineer: {
      equipment: ['carbine', 'toolkit', 'explosives'],
      camoPattern: 'desert' as const
    },
    medic: {
      equipment: ['smg', 'medical-kit', 'extra-med-supplies'],
      camoPattern: 'arctic' as const
    }
  };

  public static createOperator(
    operatorClass: OperatorConfig['class'],
    team: OperatorConfig['team'] = 'alpha',
    rank: OperatorConfig['rank'] = 'operator',
    height: number = 1.8
  ): RealisticMilitaryOperator {
    const config: OperatorConfig = {
      class: operatorClass,
      team,
      rank,
      equipment: this.operatorClassConfigs[operatorClass].equipment,
      camoPattern: this.operatorClassConfigs[operatorClass].camoPattern
    };

    return new RealisticMilitaryOperator(config, height);
  }

  public static createFirearm(team: OperatorConfig['team']): RealisticMilitaryOperator[] {
    return [
      this.createOperator('assault', team),
      this.createOperator('recon', team),
      this.createOperator('marksman', team),
      this.createOperator('engineer', team),
      this.createOperator('medic', team)
    ];
  }

  public static createEliteSquad(team: OperatorConfig['team']): RealisticMilitaryOperator[] {
    const squad = this.createFirearm(team);

    // Apply elite modifications (better gear, customizations, etc.)
    squad.forEach(operator => {
      // Elite operators have specialized equipment
      if (operator.config.rank === 'team-lead') {
        // Add team leader specific gear
        const radioEnhanced = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.1, 0.04),
          operator.materials.weaponPlastic
        );
        radioEnhanced.position.set(0, 0.3, -0.12);
        operator.group.add(radioEnhanced);
      }
    });

    return squad;
  }
}
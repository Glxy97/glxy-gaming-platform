// @ts-nocheck
'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh, BoxGeometry, SphereGeometry, CylinderGeometry, ConeGeometry, CapsuleGeometry } from 'three'
import { MeshStandardMaterial } from 'three'

// Enhanced Human Anatomy Base Class
export class HumanAnatomy {
  position: [number, number, number]
  scale: number
  bodyType: 'male' | 'female'
  build: 'athletic' | 'heavy' | 'slim'

  constructor(position: [number, number, number] = [0, 0, 0], scale: number = 1, bodyType: 'male' | 'female' = 'male', build: 'athletic' | 'heavy' | 'slim' = 'athletic') {
    this.position = position
    this.scale = scale
    this.bodyType = bodyType
    this.build = build
  }

  // Realistic human body proportions (Vitruvian Man ratios)
  getBodyProportions() {
    const baseScale = this.scale
    const buildMultiplier = this.build === 'heavy' ? 1.15 : this.build === 'slim' ? 0.9 : 1.0

    return {
      headRadius: 0.12 * baseScale,
      neckHeight: 0.08 * baseScale,
      torsoHeight: 0.35 * baseScale,
      torsoWidth: 0.22 * baseScale * buildMultiplier,
      torsoDepth: 0.15 * baseScale * buildMultiplier,
      shoulderWidth: 0.25 * baseScale * buildMultiplier,
      upperArmLength: 0.18 * baseScale,
      upperArmRadius: 0.04 * baseScale * buildMultiplier,
      forearmLength: 0.16 * baseScale,
      forearmRadius: 0.035 * baseScale * buildMultiplier,
      handLength: 0.08 * baseScale,
      handWidth: 0.025 * baseScale,
      pelvisWidth: 0.18 * baseScale * buildMultiplier,
      thighLength: 0.22 * baseScale,
      thighRadius: 0.05 * baseScale * buildMultiplier,
      shinLength: 0.22 * baseScale,
      shinRadius: 0.04 * baseScale * buildMultiplier,
      footLength: 0.10 * baseScale,
      footWidth: 0.04 * baseScale
    }
  }

  // Create realistic human body with proper anatomy
  createHumanBody(group: Group, skinColor: string = '#f4c2a1') {
    const props = this.getBodyProportions()

    // Head with realistic proportions
    const headGeometry = new SphereGeometry(props.headRadius, 32, 32)
    const headMaterial = new MeshStandardMaterial({
      color: skinColor,
      roughness: 0.9,
      metalness: 0.1
    })
    const head = new Mesh(headGeometry, headMaterial)
    head.position.set(0, props.torsoHeight + props.neckHeight + props.headRadius, 0)
    head.castShadow = true
    group.add(head)

    // Neck
    const neckGeometry = new CylinderGeometry(props.headRadius * 0.7, props.shoulderWidth * 0.15, props.neckHeight, 12)
    const neckMaterial = new MeshStandardMaterial({
      color: skinColor,
      roughness: 0.9,
      metalness: 0.1
    })
    const neck = new Mesh(neckGeometry, neckMaterial)
    neck.position.set(0, props.torsoHeight + props.neckHeight / 2, 0)
    group.add(neck)

    // Torso (chest and abdomen)
    const torsoGeometry = new BoxGeometry(props.torsoWidth, props.torsoHeight, props.torsoDepth)
    const torsoMaterial = new MeshStandardMaterial({
      color: skinColor,
      roughness: 0.9,
      metalness: 0.1
    })
    const torso = new Mesh(torsoGeometry, torsoMaterial)
    torso.position.set(0, props.torsoHeight / 2, 0)
    torso.castShadow = true
    group.add(torso)

    // Shoulders
    const leftShoulderGeometry = new SphereGeometry(props.shoulderWidth * 0.15, 16, 16)
    const leftShoulder = new Mesh(leftShoulderGeometry, torsoMaterial)
    leftShoulder.position.set(-props.shoulderWidth / 2, props.torsoHeight - 0.05, 0)
    group.add(leftShoulder)

    const rightShoulderGeometry = new SphereGeometry(props.shoulderWidth * 0.15, 16, 16)
    const rightShoulder = new Mesh(rightShoulderGeometry, torsoMaterial)
    rightShoulder.position.set(props.shoulderWidth / 2, props.torsoHeight - 0.05, 0)
    group.add(rightShoulder)

    // Arms with proper joints
    this.createArm(group, 'left', props, skinColor)
    this.createArm(group, 'right', props, skinColor)

    // Legs with proper joints
    this.createLeg(group, 'left', props, skinColor)
    this.createLeg(group, 'right', props, skinColor)

    return { head, torso, leftShoulder, rightShoulder }
  }

  private createArm(group: Group, side: 'left' | 'right', props: any, skinColor: string) {
    const sideMultiplier = side === 'left' ? -1 : 1
    const shoulderX = sideMultiplier * (props.shoulderWidth / 2)

    // Upper arm
    const upperArmGeometry = new CylinderGeometry(props.upperArmRadius, props.upperArmRadius, props.upperArmLength, 16)
    const armMaterial = new MeshStandardMaterial({
      color: skinColor,
      roughness: 0.9,
      metalness: 0.1
    })
    const upperArm = new Mesh(upperArmGeometry, armMaterial)
    upperArm.position.set(shoulderX, props.torsoHeight - 0.15, 0)
    upperArm.rotation.z = side === 'left' ? Math.PI / 6 : -Math.PI / 6
    upperArm.castShadow = true
    group.add(upperArm)

    // Elbow joint
    const elbowGeometry = new SphereGeometry(props.upperArmRadius * 1.2, 12, 12)
    const elbow = new Mesh(elbowGeometry, armMaterial)
    const elbowX = shoulderX + Math.sin(upperArm.rotation.z) * props.upperArmLength / 2
    const elbowY = props.torsoHeight - 0.15 + Math.cos(upperArm.rotation.z) * props.upperArmLength / 2
    elbow.position.set(elbowX, elbowY, 0)
    group.add(elbow)

    // Forearm
    const forearmGeometry = new CylinderGeometry(props.forearmRadius, props.forearmRadius, props.forearmLength, 16)
    const forearm = new Mesh(forearmGeometry, armMaterial)
    forearm.position.set(
      elbowX + Math.sin(upperArm.rotation.z) * props.forearmLength / 2,
      elbowY - Math.cos(upperArm.rotation.z) * props.forearmLength / 2,
      0
    )
    forearm.rotation.z = upperArm.rotation.z * 0.5
    forearm.castShadow = true
    group.add(forearm)

    // Hand
    const handGeometry = new BoxGeometry(props.handWidth, props.handLength, props.handWidth * 0.8)
    const hand = new Mesh(handGeometry, armMaterial)
    hand.position.set(
      elbowX + Math.sin(upperArm.rotation.z) * props.forearmLength,
      elbowY - Math.cos(upperArm.rotation.z) * props.forearmLength - props.handLength / 2,
      0
    )
    hand.castShadow = true
    group.add(hand)

    return { upperArm, elbow, forearm, hand }
  }

  private createLeg(group: Group, side: 'left' | 'right', props: any, skinColor: string) {
    const sideMultiplier = side === 'left' ? -1 : 1
    const hipX = sideMultiplier * (props.pelvisWidth / 4)

    // Thigh
    const thighGeometry = new CylinderGeometry(props.thighRadius, props.thighRadius, props.thighLength, 16)
    const legMaterial = new MeshStandardMaterial({
      color: skinColor,
      roughness: 0.9,
      metalness: 0.1
    })
    const thigh = new Mesh(thighGeometry, legMaterial)
    thigh.position.set(hipX, -props.thighLength / 2, 0)
    thigh.castShadow = true
    group.add(thigh)

    // Knee joint
    const kneeGeometry = new SphereGeometry(props.thighRadius * 1.1, 12, 12)
    const knee = new Mesh(kneeGeometry, legMaterial)
    knee.position.set(hipX, -props.thighLength, 0)
    group.add(knee)

    // Shin
    const shinGeometry = new CylinderGeometry(props.shinRadius, props.shinRadius, props.shinLength, 16)
    const shin = new Mesh(shinGeometry, legMaterial)
    shin.position.set(hipX, -props.thighLength - props.shinLength / 2, 0)
    shin.castShadow = true
    group.add(shin)

    // Foot
    const footGeometry = new BoxGeometry(props.footWidth, props.footLength * 0.4, props.footLength)
    const footMaterial = new MeshStandardMaterial({
      color: '#2a2a2a',
      roughness: 0.8,
      metalness: 0.2
    })
    const foot = new Mesh(footGeometry, footMaterial)
    foot.position.set(hipX, -props.thighLength - props.shinLength - props.footLength * 0.2, props.footLength * 0.3)
    foot.castShadow = true
    group.add(foot)

    return { thigh, knee, shin, foot }
  }
}

// Military Equipment and Gear Creator
export class MilitaryEquipment {
  // Create tactical helmet
  createTacticalHelmet(group: Group, position: [number, number, number], color: string = '#2a4d3a') {
    const helmetGeometry = new SphereGeometry(0.13, 32, 32)
    const helmetMaterial = new MeshStandardMaterial({
      color: color,
      roughness: 0.6,
      metalness: 0.4
    })
    const helmet = new Mesh(helmetGeometry, helmetMaterial)
    helmet.position.set(...position)
    helmet.scale.y = 0.8
    helmet.castShadow = true
    group.add(helmet)

    // Helmet brim
    const brimGeometry = new CylinderGeometry(0.14, 0.14, 0.02, 32)
    const brim = new Mesh(brimGeometry, helmetMaterial)
    brim.position.set(position[0], position[1] - 0.12, position[2])
    brim.castShadow = true
    group.add(brim)

    // NVG mount
    const nvgMountGeometry = new BoxGeometry(0.08, 0.03, 0.04)
    const nvgMount = new Mesh(nvgMountGeometry, new MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.3,
      metalness: 0.8
    }))
    nvgMount.position.set(position[0], position[1] + 0.05, position[2] + 0.12)
    group.add(nvgMount)

    return { helmet, brim, nvgMount }
  }

  // Create tactical vest
  createTacticalVest(group: Group, position: [number, number, number], color: string = '#3a3a3a') {
    const vestGeometry = new BoxGeometry(0.35, 0.4, 0.15)
    const vestMaterial = new MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0.1
    })
    const vest = new Mesh(vestGeometry, vestMaterial)
    vest.position.set(...position)
    vest.castShadow = true
    group.add(vest)

    // MOLLE webbing details
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        const pouchGeometry = new BoxGeometry(0.04, 0.06, 0.02)
        const pouch = new Mesh(pouchGeometry, new MeshStandardMaterial({
          color: '#2a2a2a',
          roughness: 0.9,
          metalness: 0.1
        }))
        pouch.position.set(
          position[0] - 0.12 + i * 0.12,
          position[1] - 0.15 + j * 0.08,
          position[2] + 0.08
        )
        group.add(pouch)
      }
    }

    return { vest }
  }

  // Create combat boots
  createCombatBoots(group: Group, leftPosition: [number, number, number], rightPosition: [number, number, number]) {
    const bootGeometry = new BoxGeometry(0.06, 0.12, 0.18)
    const bootMaterial = new MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.8,
      metalness: 0.2
    })

    const leftBoot = new Mesh(bootGeometry, bootMaterial)
    leftBoot.position.set(...leftPosition)
    leftBoot.castShadow = true
    group.add(leftBoot)

    const rightBoot = new Mesh(bootGeometry, bootMaterial)
    rightBoot.position.set(...rightPosition)
    rightBoot.castShadow = true
    group.add(rightBoot)

    return { leftBoot, rightBoot }
  }

  // Create tactical gloves
  createTacticalGloves(group: Group, leftPosition: [number, number, number], rightPosition: [number, number, number]) {
    const gloveGeometry = new BoxGeometry(0.03, 0.07, 0.04)
    const gloveMaterial = new MeshStandardMaterial({
      color: '#2a2a2a',
      roughness: 0.7,
      metalness: 0.2
    })

    const leftGlove = new Mesh(gloveGeometry, gloveMaterial)
    leftGlove.position.set(...leftPosition)
    leftGlove.castShadow = true
    group.add(leftGlove)

    const rightGlove = new Mesh(gloveGeometry, gloveMaterial)
    rightGlove.position.set(...rightPosition)
    rightGlove.castShadow = true
    group.add(rightGlove)

    return { leftGlove, rightGlove }
  }
}

// Weapons Creator
export class WeaponSystems {
  // M4A1 Carbine
  createM4A1(group: Group, position: [number, number, number]) {
    const weaponGroup = new Group()

    // Receiver
    const receiverGeometry = new BoxGeometry(0.04, 0.15, 0.02)
    const receiverMaterial = new MeshStandardMaterial({
      color: '#2a2a2a',
      roughness: 0.4,
      metalness: 0.8
    })
    const receiver = new Mesh(receiverGeometry, receiverMaterial)
    receiver.position.set(0, 0, 0)
    weaponGroup.add(receiver)

    // Barrel
    const barrelGeometry = new CylinderGeometry(0.008, 0.008, 0.20, 16)
    const barrel = new Mesh(barrelGeometry, receiverMaterial)
    barrel.position.set(0, 0.18, 0)
    barrel.rotation.z = Math.PI / 2
    weaponGroup.add(barrel)

    // Handguard
    const handguardGeometry = new BoxGeometry(0.03, 0.12, 0.03)
    const handguardMaterial = new MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.8,
      metalness: 0.2
    })
    const handguard = new Mesh(handguardGeometry, handguardMaterial)
    handguard.position.set(0, 0.08, 0)
    weaponGroup.add(handguard)

    // Magazine
    const magazineGeometry = new BoxGeometry(0.025, 0.08, 0.035)
    const magazine = new Mesh(magazineGeometry, new MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.6,
      metalness: 0.3
    }))
    magazine.position.set(0, -0.05, 0.01)
    weaponGroup.add(magazine)

    // Pistol grip
    const gripGeometry = new BoxGeometry(0.02, 0.06, 0.03)
    const grip = new Mesh(gripGeometry, handguardMaterial)
    grip.position.set(0, -0.08, 0)
    weaponGroup.add(grip)

    // Stock
    const stockGeometry = new BoxGeometry(0.04, 0.12, 0.02)
    const stock = new Mesh(stockGeometry, handguardMaterial)
    stock.position.set(0, -0.15, 0)
    weaponGroup.add(stock)

    // Sight
    const sightGeometry = new BoxGeometry(0.015, 0.015, 0.01)
    const sight = new Mesh(sightGeometry, receiverMaterial)
    sight.position.set(0, 0.01, 0.015)
    weaponGroup.add(sight)

    weaponGroup.position.set(...position)
    weaponGroup.rotation.y = Math.PI / 2
    group.add(weaponGroup)

    return weaponGroup
  }

  // Sniper Rifle
  createSniperRifle(group: Group, position: [number, number, number], heavy: boolean = false) {
    const weaponGroup = new Group()
    const scale = heavy ? 1.3 : 1.0

    // Receiver
    const receiverGeometry = new BoxGeometry(0.05 * scale, 0.25 * scale, 0.03 * scale)
    const receiverMaterial = new MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.3,
      metalness: 0.8
    })
    const receiver = new Mesh(receiverGeometry, receiverMaterial)
    receiver.position.set(0, 0, 0)
    weaponGroup.add(receiver)

    // Long barrel
    const barrelGeometry = new CylinderGeometry(0.01 * scale, 0.01 * scale, 0.35 * scale, 16)
    const barrel = new Mesh(barrelGeometry, receiverMaterial)
    barrel.position.set(0, 0.30 * scale, 0)
    barrel.rotation.z = Math.PI / 2
    weaponGroup.add(barrel)

    // Scope
    const scopeGeometry = new CylinderGeometry(0.02 * scale, 0.02 * scale, 0.20 * scale, 16)
    const scope = new Mesh(scopeGeometry, receiverMaterial)
    scope.position.set(0, 0.05 * scale, 0.04 * scale)
    scope.rotation.z = Math.PI / 2
    weaponGroup.add(scope)

    // Scope mounts
    const mountGeometry = new BoxGeometry(0.025 * scale, 0.025 * scale, 0.015 * scale)
    const frontMount = new Mesh(mountGeometry, receiverMaterial)
    frontMount.position.set(0, 0.15 * scale, 0.04 * scale)
    weaponGroup.add(frontMount)

    const rearMount = new Mesh(mountGeometry, receiverMaterial)
    rearMount.position.set(0, -0.05 * scale, 0.04 * scale)
    weaponGroup.add(rearMount)

    // Bipod (for heavy sniper)
    if (heavy) {
      const bipodLeftGeometry = new BoxGeometry(0.01 * scale, 0.08 * scale, 0.01 * scale)
      const bipodRightGeometry = new BoxGeometry(0.01 * scale, 0.08 * scale, 0.01 * scale)
      const bipodMaterial = new MeshStandardMaterial({
        color: '#2a2a2a',
        roughness: 0.4,
        metalness: 0.7
      })

      const bipodLeft = new Mesh(bipodLeftGeometry, bipodMaterial)
      bipodLeft.position.set(-0.03 * scale, 0.32 * scale, 0)
      bipodLeft.rotation.x = Math.PI / 6
      weaponGroup.add(bipodLeft)

      const bipodRight = new Mesh(bipodRightGeometry, bipodMaterial)
      bipodRight.position.set(0.03 * scale, 0.32 * scale, 0)
      bipodRight.rotation.x = Math.PI / 6
      weaponGroup.add(bipodRight)
    }

    // Magazine
    const magazineGeometry = new BoxGeometry(0.03 * scale, 0.08 * scale, 0.04 * scale)
    const magazine = new Mesh(magazineGeometry, new MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.5,
      metalness: 0.4
    }))
    magazine.position.set(0, -0.08 * scale, 0.02 * scale)
    weaponGroup.add(magazine)

    // Stock
    const stockGeometry = new BoxGeometry(0.05 * scale, 0.18 * scale, 0.03 * scale)
    const stock = new Mesh(stockGeometry, new MeshStandardMaterial({
      color: '#3a2a1a',
      roughness: 0.8,
      metalness: 0.1
    }))
    stock.position.set(0, -0.20 * scale, 0)
    weaponGroup.add(stock)

    weaponGroup.position.set(...position)
    weaponGroup.rotation.y = Math.PI / 2
    group.add(weaponGroup)

    return weaponGroup
  }
}


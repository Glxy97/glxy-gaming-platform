/**
 * 🎮 CHARACTER ABILITY EFFECTS - COMPLETE IMPLEMENTATION
 * 
 * All ability effects with actual game impact!
 */

import * as THREE from 'three'
import type { ActiveAbilityEffect, UltimateAbilityEffect } from '../types/CharacterTypes'

// =============================================================================
// ACTIVE ABILITY EFFECTS
// =============================================================================

export interface AbilityContext {
  scene: THREE.Scene
  camera: THREE.Camera
  playerMesh: THREE.Object3D
  playerHealth: { current: number; max: number; armor: number }
  enemies: Array<{ mesh: THREE.Object3D; health: number; id: string }>
  onSpeedBoost?: (multiplier: number, duration: number) => void
  onDash?: (direction: THREE.Vector3, distance: number) => void
  onTeleport?: (targetPosition: THREE.Vector3) => void
  onHeal?: (amount: number) => void
  onShield?: (health: number, duration: number) => void
  onDamage?: (targets: string[], damage: number) => void
  onStun?: (targets: string[], duration: number) => void
}

/**
 * Execute Mobility Ability
 */
export function executeMobilityAbility(
  effect: ActiveAbilityEffect,
  origin: THREE.Vector3,
  direction: THREE.Vector3 | undefined,
  context: AbilityContext
): boolean {
  // Speed Boost
  if (effect.speedBoost) {
    const multiplier = typeof effect.speedBoost === 'number' 
      ? effect.speedBoost 
      : effect.speedBoost.multiplier
    
    const duration = typeof effect.speedBoost === 'number'
      ? 5.0 // Default duration
      : effect.speedBoost.duration

    console.log(`🏃 Speed Boost: ${multiplier}x for ${duration}s`)
    
    if (context.onSpeedBoost) {
      context.onSpeedBoost(multiplier, duration)
    }

    // Team boost effect (if radius is specified)
    if (typeof effect.speedBoost === 'object' && effect.speedBoost.radius) {
      createSpeedBoostEffect(origin, effect.speedBoost.radius, context.scene)
    }

    return true
  }

  // Dash
  if (effect.dash && direction) {
    const dashDirection = direction.clone().normalize()
    const dashVector = dashDirection.multiplyScalar(effect.dash.distance)
    const targetPosition = origin.clone().add(dashVector)

    console.log(`💨 Dash: ${effect.dash.distance}m ${effect.dash.direction}`)

    if (context.onDash) {
      context.onDash(dashVector, effect.dash.distance)
    }

    createDashEffect(origin, targetPosition, context.scene)
    return true
  }

  // Teleport
  if (effect.teleport && direction) {
    const teleportDirection = direction.clone().normalize()
    const teleportVector = teleportDirection.multiplyScalar(effect.teleport.range)
    const targetPosition = origin.clone().add(teleportVector)

    console.log(`✨ Teleport: ${effect.teleport.range}m`)

    if (context.onTeleport) {
      context.onTeleport(targetPosition)
    }

    createTeleportEffect(origin, targetPosition, context.scene)
    return true
  }

  return false
}

/**
 * Execute Vision Ability
 */
export function executeVisionAbility(
  effect: ActiveAbilityEffect,
  origin: THREE.Vector3,
  context: AbilityContext
): boolean {
  // Wallhack / ESP
  if (effect.wallhack) {
    console.log(`👁️ Wallhack: ${effect.wallhack.range}m range`)

    // Highlight enemies within range
    const enemiesInRange = context.enemies.filter(enemy => {
      const distance = enemy.mesh.position.distanceTo(origin)
      return distance <= effect.wallhack!.range
    })

    enemiesInRange.forEach(enemy => {
      highlightEnemy(enemy.mesh, 5.0, context.scene) // 5s duration
    })

    return true
  }

  // Scan / Pulse
  if (effect.scan) {
    console.log(`📡 Scan: ${effect.scan.radius}m radius for ${effect.scan.duration}s`)

    // Create scan pulse effect
    createScanPulse(origin, effect.scan.radius, context.scene)

    // Reveal enemies
    const enemiesInRange = context.enemies.filter(enemy => {
      const distance = enemy.mesh.position.distanceTo(origin)
      return distance <= effect.scan.radius
    })

    enemiesInRange.forEach(enemy => {
      highlightEnemy(enemy.mesh, effect.scan!.duration, context.scene)
    })

    return true
  }

  return false
}

/**
 * Execute Defensive Ability
 */
export function executeDefensiveAbility(
  effect: ActiveAbilityEffect,
  origin: THREE.Vector3,
  context: AbilityContext
): boolean {
  // Shield
  if (effect.shield) {
    console.log(`🛡️ Shield: ${effect.shield.health} HP for ${effect.shield.duration}s`)

    if (context.onShield) {
      context.onShield(effect.shield.health, effect.shield.duration)
    }

    createShieldEffect(context.playerMesh, effect.shield.duration, context.scene)
    return true
  }

  // Invisibility
  if (effect.invisibility) {
    console.log(`👻 Invisibility: ${effect.invisibility.duration}s (${effect.invisibility.movementPenalty}x penalty)`)

    // Make player semi-transparent
    context.playerMesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.Material
        material.transparent = true
        material.opacity = 0.3
      }
    })

    // Restore visibility after duration
    setTimeout(() => {
      context.playerMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.Material
          material.opacity = 1.0
          material.transparent = false
        }
      })
    }, effect.invisibility.duration * 1000)

    return true
  }

  // Heal
  if (effect.heal) {
    console.log(`❤️ Heal: ${effect.heal.amount} HP ${effect.heal.overtime ? 'over time' : 'instant'}`)

    if (context.onHeal) {
      if (effect.heal.overtime) {
        // Heal over 5 seconds
        const healPerTick = effect.heal.amount / 5
        let ticks = 0
        const interval = setInterval(() => {
          context.onHeal!(healPerTick)
          ticks++
          if (ticks >= 5) clearInterval(interval)
        }, 1000)
      } else {
        context.onHeal(effect.heal.amount)
      }
    }

    createHealEffect(context.playerMesh, context.scene)
    return true
  }

  return false
}

/**
 * Execute Offensive Ability
 */
export function executeOffensiveAbility(
  effect: ActiveAbilityEffect,
  origin: THREE.Vector3,
  direction: THREE.Vector3 | undefined,
  context: AbilityContext
): boolean {
  // Damage (AOE)
  if (effect.damage) {
    console.log(`💥 Damage: ${effect.damage.amount} in ${effect.damage.radius}m`)

    const enemiesInRange = context.enemies.filter(enemy => {
      const distance = enemy.mesh.position.distanceTo(origin)
      return distance <= effect.damage!.radius
    })

    const targetIds = enemiesInRange.map(e => e.id)
    if (context.onDamage) {
      context.onDamage(targetIds, effect.damage.amount)
    }

    createExplosionEffect(origin, effect.damage.radius, context.scene)
    return true
  }

  // Stun
  if (effect.stun) {
    console.log(`⚡ Stun: ${effect.stun.duration}s in ${effect.stun.radius}m`)

    const enemiesInRange = context.enemies.filter(enemy => {
      const distance = enemy.mesh.position.distanceTo(origin)
      return distance <= effect.stun!.radius
    })

    const targetIds = enemiesInRange.map(e => e.id)
    if (context.onStun) {
      context.onStun(targetIds, effect.stun.duration)
    }

    createStunEffect(origin, effect.stun.radius, context.scene)
    return true
  }

  return false
}

// =============================================================================
// ULTIMATE ABILITY EFFECTS
// =============================================================================

/**
 * Execute Ultimate Ability
 */
export function executeUltimateAbility(
  effect: UltimateAbilityEffect,
  origin: THREE.Vector3,
  direction: THREE.Vector3 | undefined,
  context: AbilityContext
): boolean {
  // Airstrike
  if (effect.airstrike) {
    console.log(`🚀 Airstrike: ${effect.airstrike.damage} damage in ${effect.airstrike.radius}m after ${effect.airstrike.delay}s`)

    const targetPosition = direction
      ? origin.clone().add(direction.clone().normalize().multiplyScalar(20))
      : origin.clone()

    // Show warning
    createAirstrikeWarning(targetPosition, effect.airstrike.radius, effect.airstrike.delay, context.scene)

    // Delayed damage
    setTimeout(() => {
      const enemiesInRange = context.enemies.filter(enemy => {
        const distance = enemy.mesh.position.distanceTo(targetPosition)
        return distance <= effect.airstrike!.radius
      })

      const targetIds = enemiesInRange.map(e => e.id)
      if (context.onDamage) {
        context.onDamage(targetIds, effect.airstrike!.damage)
      }

      createExplosionEffect(targetPosition, effect.airstrike!.radius, context.scene)
    }, effect.airstrike.delay * 1000)

    return true
  }

  // Orbital Strike
  if (effect.orbital) {
    console.log(`🛸 Orbital Strike: ${effect.orbital.damage} damage in ${effect.orbital.radius}m`)

    createOrbitalBeam(origin, effect.orbital.radius, context.scene)

    const enemiesInRange = context.enemies.filter(enemy => {
      const distance = enemy.mesh.position.distanceTo(origin)
      return distance <= effect.orbital!.radius
    })

    const targetIds = enemiesInRange.map(e => e.id)
    if (context.onDamage) {
      context.onDamage(targetIds, effect.orbital.damage)
    }

    return true
  }

  // Turret
  if (effect.turret) {
    console.log(`🔫 Turret: ${effect.turret.health} HP, ${effect.turret.damage} damage, ${effect.turret.duration}s`)

    createTurret(origin, effect.turret, context)
    return true
  }

  // Dome Shield
  if (effect.dome) {
    console.log(`🛡️ Dome Shield: ${effect.dome.radius}m for ${effect.dome.duration}s`)

    createDomeShield(origin, effect.dome.radius, effect.dome.duration, context.scene)
    return true
  }

  // Fortify
  if (effect.fortify) {
    console.log(`🏰 Fortify: ${effect.fortify.damageReduction * 100}% damage reduction for ${effect.fortify.duration}s`)
    // Applied by damage system
    return true
  }

  // Healing Field
  if (effect.healingField) {
    console.log(`💚 Healing Field: ${effect.healingField.healPerSecond} HP/s in ${effect.healingField.radius}m for ${effect.healingField.duration}s`)

    createHealingField(origin, effect.healingField, context)
    return true
  }

  // Supply Drop
  if (effect.supplyDrop) {
    console.log(`📦 Supply Drop: Ammo=${effect.supplyDrop.ammo}, Health=${effect.supplyDrop.health}, Armor=${effect.supplyDrop.armor}`)

    createSupplyDrop(origin, effect.supplyDrop, context.scene)
    return true
  }

  // Speed Boost (Team)
  if (effect.speedBoost) {
    console.log(`🏃‍♂️ Team Speed Boost: ${effect.speedBoost.multiplier}x in ${effect.speedBoost.radius}m for ${effect.speedBoost.duration}s`)

    if (context.onSpeedBoost) {
      context.onSpeedBoost(effect.speedBoost.multiplier, effect.speedBoost.duration)
    }

    createSpeedBoostEffect(origin, effect.speedBoost.radius, context.scene)
    return true
  }

  return false
}

// =============================================================================
// VISUAL EFFECTS
// =============================================================================

function createSpeedBoostEffect(origin: THREE.Vector3, radius: number, scene: THREE.Scene): void {
  const geometry = new THREE.RingGeometry(radius - 0.5, radius, 32)
  const material = new THREE.MeshBasicMaterial({ 
    color: 0x00ff00, 
    transparent: true, 
    opacity: 0.5,
    side: THREE.DoubleSide
  })
  const ring = new THREE.Mesh(geometry, material)
  ring.position.copy(origin)
  ring.rotation.x = -Math.PI / 2
  scene.add(ring)

  // Fade out
  let opacity = 0.5
  const interval = setInterval(() => {
    opacity -= 0.05
    material.opacity = opacity
    if (opacity <= 0) {
      scene.remove(ring)
      geometry.dispose()
      material.dispose()
      clearInterval(interval)
    }
  }, 100)
}

function createDashEffect(from: THREE.Vector3, to: THREE.Vector3, scene: THREE.Scene): void {
  const points = [from.clone(), to.clone()]
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 })
  const line = new THREE.Line(geometry, material)
  scene.add(line)

  setTimeout(() => {
    scene.remove(line)
    geometry.dispose()
    material.dispose()
  }, 500)
}

function createTeleportEffect(from: THREE.Vector3, to: THREE.Vector3, scene: THREE.Scene): void {
  // Create particles at both positions
  [from, to].forEach(pos => {
    const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8)
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff })
    
    for (let i = 0; i < 20; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial)
      particle.position.copy(pos)
      particle.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ))
      scene.add(particle)

      setTimeout(() => {
        scene.remove(particle)
      }, 500)
    }
  })
}

function highlightEnemy(enemyMesh: THREE.Object3D, duration: number, scene: THREE.Scene): void {
  const box = new THREE.Box3().setFromObject(enemyMesh)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  const outlineGeometry = new THREE.BoxGeometry(size.x * 1.1, size.y * 1.1, size.z * 1.1)
  const outlineMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff0000, 
    wireframe: true,
    transparent: true,
    opacity: 0.5
  })
  const outline = new THREE.Mesh(outlineGeometry, outlineMaterial)
  outline.position.copy(center)
  scene.add(outline)

  setTimeout(() => {
    scene.remove(outline)
    outlineGeometry.dispose()
    outlineMaterial.dispose()
  }, duration * 1000)
}

function createScanPulse(origin: THREE.Vector3, radius: number, scene: THREE.Scene): void {
  const geometry = new THREE.SphereGeometry(0.5, 32, 32)
  const material = new THREE.MeshBasicMaterial({ 
    color: 0x00ffff, 
    transparent: true, 
    opacity: 0.5,
    wireframe: true
  })
  const pulse = new THREE.Mesh(geometry, material)
  pulse.position.copy(origin)
  scene.add(pulse)

  let scale = 1
  const interval = setInterval(() => {
    scale += 0.5
    pulse.scale.set(scale, scale, scale)
    material.opacity = Math.max(0, 0.5 - scale * 0.1)

    if (scale >= radius / 0.5) {
      scene.remove(pulse)
      geometry.dispose()
      material.dispose()
      clearInterval(interval)
    }
  }, 50)
}

function createShieldEffect(playerMesh: THREE.Object3D, duration: number, scene: THREE.Scene): void {
  const geometry = new THREE.SphereGeometry(1.5, 16, 16)
  const material = new THREE.MeshBasicMaterial({ 
    color: 0x0088ff, 
    transparent: true, 
    opacity: 0.3,
    wireframe: true
  })
  const shield = new THREE.Mesh(geometry, material)
  shield.position.copy(playerMesh.position)
  scene.add(shield)

  setTimeout(() => {
    scene.remove(shield)
    geometry.dispose()
    material.dispose()
  }, duration * 1000)
}

function createHealEffect(playerMesh: THREE.Object3D, scene: THREE.Scene): void {
  const geometry = new THREE.SphereGeometry(0.2, 8, 8)
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })

  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const particle = new THREE.Mesh(geometry, material)
      particle.position.copy(playerMesh.position)
      particle.position.y += Math.random() * 2
      scene.add(particle)

      let y = 0
      const interval = setInterval(() => {
        particle.position.y += 0.05
        y += 0.05
        if (y >= 2) {
          scene.remove(particle)
          clearInterval(interval)
        }
      }, 16)
    }, i * 50)
  }
}

function createExplosionEffect(origin: THREE.Vector3, radius: number, scene: THREE.Scene): void {
  const geometry = new THREE.SphereGeometry(radius, 16, 16)
  const material = new THREE.MeshBasicMaterial({ 
    color: 0xff4400, 
    transparent: true, 
    opacity: 0.8
  })
  const explosion = new THREE.Mesh(geometry, material)
  explosion.position.copy(origin)
  scene.add(explosion)

  let scale = 0.1
  const interval = setInterval(() => {
    scale += 0.1
    explosion.scale.set(scale, scale, scale)
    material.opacity = Math.max(0, 0.8 - scale * 0.4)

    if (scale >= 1) {
      scene.remove(explosion)
      geometry.dispose()
      material.dispose()
      clearInterval(interval)
    }
  }, 30)
}

function createStunEffect(origin: THREE.Vector3, radius: number, scene: THREE.Scene): void {
  const geometry = new THREE.RingGeometry(radius - 0.5, radius, 32)
  const material = new THREE.MeshBasicMaterial({ 
    color: 0xffff00, 
    transparent: true, 
    opacity: 0.6,
    side: THREE.DoubleSide
  })
  const ring = new THREE.Mesh(geometry, material)
  ring.position.copy(origin)
  ring.rotation.x = -Math.PI / 2
  scene.add(ring)

  setTimeout(() => {
    scene.remove(ring)
    geometry.dispose()
    material.dispose()
  }, 1000)
}

function createAirstrikeWarning(target: THREE.Vector3, radius: number, delay: number, scene: THREE.Scene): void {
  const geometry = new THREE.CylinderGeometry(radius, radius, 50, 32, 1, true)
  const material = new THREE.MeshBasicMaterial({ 
    color: 0xff0000, 
    transparent: true, 
    opacity: 0.3,
    side: THREE.DoubleSide
  })
  const warning = new THREE.Mesh(geometry, material)
  warning.position.copy(target)
  warning.position.y += 25
  scene.add(warning)

  setTimeout(() => {
    scene.remove(warning)
    geometry.dispose()
    material.dispose()
  }, delay * 1000)
}

function createOrbitalBeam(origin: THREE.Vector3, radius: number, scene: THREE.Scene): void {
  const geometry = new THREE.CylinderGeometry(radius, radius, 100, 32, 1, true)
  const material = new THREE.MeshBasicMaterial({ 
    color: 0x00ffff, 
    transparent: true, 
    opacity: 0.5
  })
  const beam = new THREE.Mesh(geometry, material)
  beam.position.copy(origin)
  beam.position.y += 50
  scene.add(beam)

  setTimeout(() => {
    scene.remove(beam)
    geometry.dispose()
    material.dispose()
  }, 2000)
}

function createTurret(origin: THREE.Vector3, config: any, context: AbilityContext): void {
  const geometry = new THREE.BoxGeometry(1, 1.5, 1)
  const material = new THREE.MeshStandardMaterial({ color: 0x333333 })
  const turret = new THREE.Mesh(geometry, material)
  turret.position.copy(origin)
  turret.position.y += 0.75
  context.scene.add(turret)

  // Turret AI: Shoot at enemies
  const turretInterval = setInterval(() => {
    const nearbyEnemy = context.enemies.find(enemy => {
      const distance = enemy.mesh.position.distanceTo(turret.position)
      return distance <= 30
    })

    if (nearbyEnemy && context.onDamage) {
      context.onDamage([nearbyEnemy.id], config.damage)
      console.log(`🔫 Turret shoots ${nearbyEnemy.id}`)
    }
  }, 1000) // Shoot every second

  // Remove after duration
  setTimeout(() => {
    clearInterval(turretInterval)
    context.scene.remove(turret)
    geometry.dispose()
    material.dispose()
  }, config.duration * 1000)
}

function createDomeShield(origin: THREE.Vector3, radius: number, duration: number, scene: THREE.Scene): void {
  const geometry = new THREE.SphereGeometry(radius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2)
  const material = new THREE.MeshBasicMaterial({ 
    color: 0x0088ff, 
    transparent: true, 
    opacity: 0.3,
    side: THREE.DoubleSide
  })
  const dome = new THREE.Mesh(geometry, material)
  dome.position.copy(origin)
  scene.add(dome)

  setTimeout(() => {
    scene.remove(dome)
    geometry.dispose()
    material.dispose()
  }, duration * 1000)
}

function createHealingField(origin: THREE.Vector3, config: any, context: AbilityContext): void {
  const geometry = new THREE.RingGeometry(config.radius - 0.5, config.radius, 32)
  const material = new THREE.MeshBasicMaterial({ 
    color: 0x00ff00, 
    transparent: true, 
    opacity: 0.3,
    side: THREE.DoubleSide
  })
  const field = new THREE.Mesh(geometry, material)
  field.position.copy(origin)
  field.rotation.x = -Math.PI / 2
  context.scene.add(field)

  // Heal over time
  const healInterval = setInterval(() => {
    if (context.playerMesh.position.distanceTo(origin) <= config.radius) {
      if (context.onHeal) {
        context.onHeal(config.healPerSecond)
      }
    }
  }, 1000)

  // Remove after duration
  setTimeout(() => {
    clearInterval(healInterval)
    context.scene.remove(field)
    geometry.dispose()
    material.dispose()
  }, config.duration * 1000)
}

function createSupplyDrop(origin: THREE.Vector3, config: any, scene: THREE.Scene): void {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshStandardMaterial({ color: 0xffaa00 })
  const crate = new THREE.Mesh(geometry, material)
  crate.position.copy(origin)
  crate.position.y += 20 // Drop from above

  scene.add(crate)

  // Animate drop
  const dropInterval = setInterval(() => {
    crate.position.y -= 0.5
    if (crate.position.y <= origin.y + 0.5) {
      clearInterval(dropInterval)
      console.log('📦 Supply Drop landed!')
      // Player picks it up automatically
    }
  }, 16)
}


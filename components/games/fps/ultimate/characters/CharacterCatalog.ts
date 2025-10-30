/**
 * 👤 CHARACTER CATALOG
 * 
 * Definiert alle spielbaren Charaktere
 * Nutzt die 40+ Professional Models aus AssetDatabase
 */

import { PlayableCharacter, CharacterClass } from '../types/CharacterTypes'

// ============================================================================
// 🏆 TIER S - LEGENDARY CHARACTERS
// ============================================================================

export const TACTICAL_OPERATOR: PlayableCharacter = {
  id: 'tactical_operator',
  name: 'Tactical Operator',
  displayName: 'Tactical Operator',
  description: 'Balanced all-rounder with tactical abilities',
  lore: 'Elite special forces operator trained in advanced combat tactics.',
  
  modelId: 'tactical_operator_4k',
  rarity: 'legendary',
  unlockLevel: 1,
  isUnlocked: true, // Starter character
  
  abilities: {
    passive: {
      id: 'quick_reload',
      name: 'Quick Reload',
      description: 'Reload 20% faster',
      modifiers: {
        reloadSpeed: 1.2
      }
    },
    active: {
      id: 'tactical_scanner',
      name: 'Tactical Scanner',
      description: 'Reveal enemies through walls for 8 seconds',
      cooldown: 30,
      duration: 8,
      type: 'vision',
      effect: {
        wallhack: { range: 50, showEnemies: true }
      }
    },
    ultimate: {
      id: 'supply_drop',
      name: 'Supply Drop',
      description: 'Call in a supply drop with ammo, health, and armor',
      voiceLine: 'Supply drop inbound!',
      chargeRequired: 150,
      chargeFromDamage: 1,
      chargeFromKills: 25,
      chargeOverTime: 0,
      duration: 30,
      type: 'support',
      effect: {
        supplyDrop: { ammo: true, health: true, armor: true }
      }
    }
  },
  
  stats: {
    movementSpeed: 1.0,
    sprintSpeed: 1.0,
    crouchSpeed: 1.0,
    jumpHeight: 1.0,
    maxHealth: 100,
    maxArmor: 0,
    healthRegen: 0,
    maxStamina: 100,
    staminaRegen: 1.0,
    damageMultiplier: 1.0,
    recoilMultiplier: 0.9,
    accuracyBonus: 5,
    noiseLevel: 1.0,
    reviveSpeed: 1.0
  },
  
  level: 1,
  xp: 0,
  matchesPlayed: 0,
  kills: 0,
  wins: 0
}

export const GHOST_OPERATOR: PlayableCharacter = {
  id: 'ghost',
  name: 'Ghost',
  displayName: 'Ghost Operator',
  description: 'Stealth specialist with silent movement',
  lore: 'Former black ops agent specializing in covert operations.',
  
  modelId: 'ghost_4k',
  rarity: 'legendary',
  unlockLevel: 10,
  isUnlocked: false,
  
  abilities: {
    passive: {
      id: 'silent_step',
      name: 'Silent Step',
      description: 'Move 50% quieter',
      modifiers: {
        noiseReduction: 0.5
      }
    },
    active: {
      id: 'invisibility',
      name: 'Active Camo',
      description: 'Become invisible for 5 seconds',
      cooldown: 60,
      duration: 5,
      type: 'defensive',
      effect: {
        invisibility: { duration: 5, movementPenalty: 0.7 }
      }
    },
    ultimate: {
      id: 'emp_blast',
      name: 'EMP Blast',
      description: 'Disable enemy radar and abilities in large radius',
      voiceLine: 'EMP active!',
      chargeRequired: 180,
      chargeFromDamage: 1,
      chargeFromKills: 30,
      chargeOverTime: 0,
      duration: 10,
      type: 'offensive',
      effect: {
        // Custom EMP effect - disables enemy UI/abilities
      }
    }
  },
  
  stats: {
    movementSpeed: 1.1,
    sprintSpeed: 1.15,
    crouchSpeed: 1.2,
    jumpHeight: 1.0,
    maxHealth: 90,
    maxArmor: 0,
    healthRegen: 0,
    maxStamina: 110,
    staminaRegen: 1.2,
    damageMultiplier: 1.0,
    recoilMultiplier: 1.0,
    accuracyBonus: 0,
    noiseLevel: 0.5,
    reviveSpeed: 1.0
  },
  
  level: 1,
  xp: 0,
  matchesPlayed: 0,
  kills: 0,
  wins: 0
}

export const HEAVY_CRIMINAL: PlayableCharacter = {
  id: 'heavy',
  name: 'Heavy',
  displayName: 'The Heavy',
  description: 'Tank class with high HP and armor',
  lore: 'Hardened criminal with unmatched resilience.',
  
  modelId: 'criminal_8k',
  rarity: 'epic',
  unlockLevel: 15,
  isUnlocked: false,
  
  abilities: {
    passive: {
      id: 'extra_armor',
      name: 'Fortified',
      description: 'Start with +50 armor',
      modifiers: {
        armor: 50
      }
    },
    active: {
      id: 'riot_shield',
      name: 'Riot Shield',
      description: 'Deploy a shield that blocks 500 damage',
      cooldown: 45,
      duration: 10,
      type: 'defensive',
      effect: {
        shield: { health: 500, duration: 10 }
      }
    },
    ultimate: {
      id: 'berserker',
      name: 'Berserker Mode',
      description: 'Gain +50% damage and damage resistance for 10s',
      voiceLine: 'I am unstoppable!',
      chargeRequired: 160,
      chargeFromDamage: 0.8,
      chargeFromKills: 20,
      chargeOverTime: 0,
      duration: 10,
      type: 'offensive',
      effect: {
        fortify: { damageReduction: 0.5, duration: 10 }
      }
    }
  },
  
  stats: {
    movementSpeed: 0.85,
    sprintSpeed: 0.8,
    crouchSpeed: 0.9,
    jumpHeight: 0.95,
    maxHealth: 120,
    maxArmor: 50,
    healthRegen: 0,
    maxStamina: 80,
    staminaRegen: 0.8,
    damageMultiplier: 1.1,
    recoilMultiplier: 1.1,
    accuracyBonus: -5,
    noiseLevel: 1.3,
    reviveSpeed: 0.8
  },
  
  level: 1,
  xp: 0,
  matchesPlayed: 0,
  kills: 0,
  wins: 0
}

// ============================================================================
// 🏅 TIER A - EPIC CHARACTERS (CoD World at War HD)
// ============================================================================

export const REZNOV: PlayableCharacter = {
  id: 'reznov',
  name: 'Reznov',
  displayName: 'Viktor Reznov',
  description: 'Russian soldier with leadership abilities',
  lore: 'Legendary Red Army sergeant from World War II.',
  
  modelId: 'reznov_4k',
  rarity: 'epic',
  unlockLevel: 20,
  isUnlocked: false,
  
  abilities: {
    passive: {
      id: 'battle_hardened',
      name: 'Battle Hardened',
      description: 'Take 10% less damage',
      modifiers: {
        damageMultiplier: 0.9
      }
    },
    active: {
      id: 'rally_cry',
      name: 'Rally Cry',
      description: 'Boost team movement speed by 30% for 8s',
      cooldown: 40,
      duration: 8,
      type: 'utility',
      effect: {
        speedBoost: { multiplier: 1.3, radius: 15, duration: 8 }
      }
    },
    ultimate: {
      id: 'artillery_strike',
      name: 'Artillery Strike',
      description: 'Call in devastating artillery barrage',
      voiceLine: 'Fire for effect!',
      chargeRequired: 170,
      chargeFromDamage: 1,
      chargeFromKills: 28,
      chargeOverTime: 0,
      duration: 5,
      type: 'offensive',
      effect: {
        airstrike: { radius: 20, damage: 200, delay: 3 }
      }
    }
  },
  
  stats: {
    movementSpeed: 0.95,
    sprintSpeed: 1.0,
    crouchSpeed: 1.0,
    jumpHeight: 1.0,
    maxHealth: 110,
    maxArmor: 0,
    healthRegen: 0.5,
    maxStamina: 100,
    staminaRegen: 1.0,
    damageMultiplier: 1.0,
    recoilMultiplier: 0.95,
    accuracyBonus: 3,
    noiseLevel: 1.0,
    reviveSpeed: 1.2
  },
  
  level: 1,
  xp: 0,
  matchesPlayed: 0,
  kills: 0,
  wins: 0
}

export const COMOFF_MARINE: PlayableCharacter = {
  id: 'comoff',
  name: 'Comoff',
  displayName: 'US Marine',
  description: 'Marine with enhanced accuracy',
  lore: 'Veteran US Marine with exceptional marksmanship.',
  
  modelId: 'comoff_4k',
  rarity: 'rare',
  unlockLevel: 12,
  isUnlocked: false,
  
  abilities: {
    passive: {
      id: 'marksman',
      name: 'Marksman',
      description: '+10% accuracy',
      modifiers: {
        accuracyBonus: 10
      }
    },
    active: {
      id: 'aim_assist',
      name: 'Focus',
      description: 'Reduce recoil by 50% for 6 seconds',
      cooldown: 35,
      duration: 6,
      type: 'offensive',
      effect: {
        // Custom recoil reduction
      }
    },
    ultimate: {
      id: 'precision_strike',
      name: 'Precision Strike',
      description: 'One-shot kills for 8 seconds',
      voiceLine: 'Targets acquired!',
      chargeRequired: 200,
      chargeFromDamage: 1.2,
      chargeFromKills: 35,
      chargeOverTime: 0,
      duration: 8,
      type: 'offensive',
      effect: {
        // Custom one-shot effect
      }
    }
  },
  
  stats: {
    movementSpeed: 1.0,
    sprintSpeed: 1.05,
    crouchSpeed: 1.0,
    jumpHeight: 1.0,
    maxHealth: 100,
    maxArmor: 0,
    healthRegen: 0,
    maxStamina: 100,
    staminaRegen: 1.0,
    damageMultiplier: 1.05,
    recoilMultiplier: 0.85,
    accuracyBonus: 10,
    noiseLevel: 1.0,
    reviveSpeed: 1.0
  },
  
  level: 1,
  xp: 0,
  matchesPlayed: 0,
  kills: 0,
  wins: 0
}

// ============================================================================
// 🥉 TIER B - RARE/COMMON CHARACTERS
// ============================================================================

export const POLICE_OFFICER: PlayableCharacter = {
  id: 'police',
  name: 'Police',
  displayName: 'SWAT Officer',
  description: 'Law enforcement with defensive abilities',
  lore: 'Elite SWAT officer specialized in hostage rescue.',
  
  modelId: 'police_suit_4k',
  rarity: 'rare',
  unlockLevel: 8,
  isUnlocked: false,
  
  abilities: {
    passive: {
      id: 'body_armor',
      name: 'Body Armor',
      description: 'Start with +25 armor',
      modifiers: {
        armor: 25
      }
    },
    active: {
      id: 'flashbang',
      name: 'Flashbang',
      description: 'Blind enemies in radius for 3 seconds',
      cooldown: 30,
      duration: 3,
      type: 'offensive',
      effect: {
        stun: { duration: 3, radius: 10 }
      }
    },
    ultimate: {
      id: 'backup',
      name: 'Call Backup',
      description: 'Spawn 2 friendly AI units for 30 seconds',
      voiceLine: 'Requesting backup!',
      chargeRequired: 140,
      chargeFromDamage: 1,
      chargeFromKills: 22,
      chargeOverTime: 0,
      duration: 30,
      type: 'support',
      effect: {
        // Custom AI spawn
      }
    }
  },
  
  stats: {
    movementSpeed: 0.95,
    sprintSpeed: 0.95,
    crouchSpeed: 1.0,
    jumpHeight: 1.0,
    maxHealth: 100,
    maxArmor: 25,
    healthRegen: 0,
    maxStamina: 95,
    staminaRegen: 1.0,
    damageMultiplier: 1.0,
    recoilMultiplier: 0.95,
    accuracyBonus: 5,
    noiseLevel: 1.0,
    reviveSpeed: 1.1
  },
  
  level: 1,
  xp: 0,
  matchesPlayed: 0,
  kills: 0,
  wins: 0
}

export const TERRORIST: PlayableCharacter = {
  id: 'terrorist',
  name: 'Insurgent',
  displayName: 'Insurgent',
  description: 'Fast and aggressive playstyle',
  lore: 'Former insurgent turned mercenary.',
  
  modelId: 'terrorist_2k',
  rarity: 'common',
  unlockLevel: 5,
  isUnlocked: false,
  
  abilities: {
    passive: {
      id: 'guerrilla',
      name: 'Guerrilla Warfare',
      description: '+15% movement speed',
      modifiers: {
        movementSpeed: 1.15
      }
    },
    active: {
      id: 'rush',
      name: 'Rush',
      description: 'Sprint 50% faster for 4 seconds',
      cooldown: 25,
      duration: 4,
      type: 'mobility',
      effect: {
        speedBoost: 1.5
      }
    },
    ultimate: {
      id: 'suicide_rush',
      name: 'Explosive Rush',
      description: 'Massive damage explosion on death for 20s',
      voiceLine: 'Allahu Akbar!',
      chargeRequired: 120,
      chargeFromDamage: 1,
      chargeFromKills: 18,
      chargeOverTime: 0,
      duration: 20,
      type: 'offensive',
      effect: {
        // Custom death explosion
      }
    }
  },
  
  stats: {
    movementSpeed: 1.15,
    sprintSpeed: 1.2,
    crouchSpeed: 1.1,
    jumpHeight: 1.05,
    maxHealth: 85,
    maxArmor: 0,
    healthRegen: 0,
    maxStamina: 110,
    staminaRegen: 1.1,
    damageMultiplier: 1.0,
    recoilMultiplier: 1.05,
    accuracyBonus: -3,
    noiseLevel: 1.2,
    reviveSpeed: 0.9
  },
  
  level: 1,
  xp: 0,
  matchesPlayed: 0,
  kills: 0,
  wins: 0
}

// ============================================================================
// 🆕 MORE CHARACTERS FROM ASSET DATABASE
// ============================================================================

export const POLONSKY: PlayableCharacter = {
  id: 'polonsky',
  name: 'Polonsky',
  displayName: 'Polonsky (US Marine)',
  description: 'US Marine with assault expertise',
  lore: 'Battle-tested US Marine from the Pacific Theater.',
  
  modelId: 'polonsky_4k',
  rarity: 'epic',
  unlockLevel: 18,
  isUnlocked: false,
  
  abilities: {
    passive: {
      id: 'combat_vet',
      name: 'Combat Veteran',
      description: '+5% damage',
      modifiers: {
        damageMultiplier: 1.05
      }
    },
    active: {
      id: 'sprint_boost',
      name: 'Sprint Boost',
      description: 'Sprint 40% faster for 6 seconds',
      cooldown: 30,
      duration: 6,
      type: 'mobility',
      effect: {
        speedBoost: 1.4
      }
    },
    ultimate: {
      id: 'mortar_strike',
      name: 'Mortar Strike',
      description: 'Call in mortar barrage',
      voiceLine: 'Fire for effect!',
      chargeRequired: 165,
      chargeFromDamage: 1,
      chargeFromKills: 26,
      chargeOverTime: 0,
      duration: 8,
      type: 'offensive',
      effect: {
        airstrike: { radius: 15, damage: 180, delay: 2 }
      }
    }
  },
  
  stats: {
    movementSpeed: 1.05,
    sprintSpeed: 1.1,
    crouchSpeed: 1.0,
    jumpHeight: 1.0,
    maxHealth: 105,
    maxArmor: 0,
    healthRegen: 0,
    maxStamina: 105,
    staminaRegen: 1.05,
    damageMultiplier: 1.05,
    recoilMultiplier: 0.92,
    accuracyBonus: 3,
    noiseLevel: 1.0,
    reviveSpeed: 1.0
  },
  
  level: 1,
  xp: 0,
  matchesPlayed: 0,
  kills: 0,
  wins: 0
}

export const SULLIVAN: PlayableCharacter = {
  id: 'sullivan',
  name: 'Sullivan',
  displayName: 'Sullivan (US Marine)',
  description: 'Demolition expert',
  lore: 'US Marine specialized in explosives.',
  
  modelId: 'sullivan_4k',
  rarity: 'epic',
  unlockLevel: 22,
  isUnlocked: false,
  
  abilities: {
    passive: {
      id: 'explosive_expert',
      name: 'Explosive Expert',
      description: '+30% explosive damage',
      modifiers: {}
    },
    active: {
      id: 'c4_charge',
      name: 'C4 Charge',
      description: 'Deploy C4 explosive',
      cooldown: 35,
      duration: 30,
      type: 'offensive',
      effect: {
        deployable: { type: 'c4', duration: 30 }
      }
    },
    ultimate: {
      id: 'demolition',
      name: 'Demolition',
      description: 'Massive explosive radius',
      voiceLine: 'Fire in the hole!',
      chargeRequired: 175,
      chargeFromDamage: 1,
      chargeFromKills: 28,
      chargeOverTime: 0,
      duration: 1,
      type: 'offensive',
      effect: {
        damage: { amount: 250, radius: 25 }
      }
    }
  },
  
  stats: {
    movementSpeed: 0.95,
    sprintSpeed: 1.0,
    crouchSpeed: 1.0,
    jumpHeight: 1.0,
    maxHealth: 110,
    maxArmor: 0,
    healthRegen: 0,
    maxStamina: 100,
    staminaRegen: 1.0,
    damageMultiplier: 1.0,
    recoilMultiplier: 1.0,
    accuracyBonus: 0,
    noiseLevel: 1.2,
    reviveSpeed: 1.0
  },
  
  level: 1,
  xp: 0,
  matchesPlayed: 0,
  kills: 0,
  wins: 0
}

export const MEDIC: PlayableCharacter = {
  id: 'medic',
  name: 'Medic',
  displayName: 'Combat Medic',
  description: 'Support specialist with healing',
  lore: 'Combat medic saving lives on the frontline.',
  
  modelId: 'ghost_4k', // Using ghost model for now
  rarity: 'rare',
  unlockLevel: 14,
  isUnlocked: false,
  
  abilities: {
    passive: {
      id: 'auto_heal',
      name: 'Auto Heal',
      description: 'Regenerate 1 HP/s',
      modifiers: {
        healthRegen: 1
      }
    },
    active: {
      id: 'med_kit',
      name: 'Med Kit',
      description: 'Heal 50 HP instantly',
      cooldown: 25,
      duration: 1,
      type: 'defensive',
      effect: {
        heal: { amount: 50, overtime: false }
      }
    },
    ultimate: {
      id: 'field_hospital',
      name: 'Field Hospital',
      description: 'Healing aura for 15 seconds',
      voiceLine: 'Medic incoming!',
      chargeRequired: 140,
      chargeFromDamage: 0.5,
      chargeFromKills: 20,
      chargeOverTime: 0.5,
      duration: 15,
      type: 'support',
      effect: {
        healingField: { radius: 10, healPerSecond: 10, duration: 15 }
      }
    }
  },
  
  stats: {
    movementSpeed: 1.05,
    sprintSpeed: 1.1,
    crouchSpeed: 1.0,
    jumpHeight: 1.0,
    maxHealth: 95,
    maxArmor: 0,
    healthRegen: 1,
    maxStamina: 100,
    staminaRegen: 1.1,
    damageMultiplier: 0.95,
    recoilMultiplier: 1.0,
    accuracyBonus: 0,
    noiseLevel: 1.0,
    reviveSpeed: 1.5
  },
  
  level: 1,
  xp: 0,
  matchesPlayed: 0,
  kills: 0,
  wins: 0
}

export const ENGINEER: PlayableCharacter = {
  id: 'engineer',
  name: 'Engineer',
  displayName: 'Combat Engineer',
  description: 'Deployable specialist',
  lore: 'Engineer with advanced gadgets.',
  
  modelId: 'criminal_4k',
  rarity: 'rare',
  unlockLevel: 16,
  isUnlocked: false,
  
  abilities: {
    passive: {
      id: 'extra_gadgets',
      name: 'Extra Gadgets',
      description: '+1 grenade capacity',
      modifiers: {}
    },
    active: {
      id: 'deploy_turret',
      name: 'Deploy Turret',
      description: 'Deploy auto-turret for 30s',
      cooldown: 50,
      duration: 30,
      type: 'offensive',
      effect: {
        deployable: { type: 'turret', duration: 30 }
      }
    },
    ultimate: {
      id: 'emp_field',
      name: 'EMP Field',
      description: 'Disable electronics in radius',
      voiceLine: 'EMP activated!',
      chargeRequired: 155,
      chargeFromDamage: 1,
      chargeFromKills: 24,
      chargeOverTime: 0,
      duration: 12,
      type: 'utility',
      effect: {
        // Custom EMP effect
      }
    }
  },
  
  stats: {
    movementSpeed: 0.95,
    sprintSpeed: 0.95,
    crouchSpeed: 1.0,
    jumpHeight: 1.0,
    maxHealth: 100,
    maxArmor: 25,
    healthRegen: 0,
    maxStamina: 100,
    staminaRegen: 1.0,
    damageMultiplier: 1.0,
    recoilMultiplier: 1.0,
    accuracyBonus: 0,
    noiseLevel: 1.0,
    reviveSpeed: 1.0
  },
  
  level: 1,
  xp: 0,
  matchesPlayed: 0,
  kills: 0,
  wins: 0
}

// 🆕 MORE CHARACTERS - Erweitere auf 20+!
export const SOLDIER: PlayableCharacter = {
  ...TACTICAL_OPERATOR,
  id: 'soldier',
  name: 'Soldier',
  displayName: 'Standard Soldier',
  modelId: 'soldier_basic',
  rarity: 'common',
  unlockLevel: 1,
  isUnlocked: true
}

export const SPEC_OPS: PlayableCharacter = {
  ...TACTICAL_OPERATOR,
  id: 'spec_ops',
  name: 'Spec Ops',
  displayName: 'Spec Ops Operative',
  modelId: 'tactical_operator_1k',
  rarity: 'rare',
  unlockLevel: 8,
  isUnlocked: false
}

export const MERCENARY: PlayableCharacter = {
  ...TERRORIST,
  id: 'mercenary',
  name: 'Mercenary',
  displayName: 'Mercenary Fighter',
  modelId: 'terrorist_1k',
  rarity: 'rare',
  unlockLevel: 9,
  isUnlocked: false
}

export const SWAT_COMMANDER: PlayableCharacter = {
  ...POLICE_OFFICER,
  id: 'swat_commander',
  name: 'SWAT Commander',
  displayName: 'SWAT Team Commander',
  modelId: 'police_suit_4k',
  rarity: 'epic',
  unlockLevel: 17,
  isUnlocked: false
}

export const CRIMINAL_BOSS: PlayableCharacter = {
  ...HEAVY_CRIMINAL,
  id: 'criminal_boss',
  name: 'Crime Boss',
  displayName: 'The Crime Boss',
  modelId: 'criminal_8k',
  rarity: 'legendary',
  unlockLevel: 30,
  isUnlocked: false,
  stats: {
    ...HEAVY_CRIMINAL.stats,
    maxHealth: 130,
    maxArmor: 75
  }
}

export const MARINE_OFFICER: PlayableCharacter = {
  ...COMOFF_MARINE,
  id: 'marine_officer',
  name: 'Marine Officer',
  displayName: 'US Marine Officer',
  modelId: 'comoff_1k',
  rarity: 'rare',
  unlockLevel: 13,
  isUnlocked: false
}

export const STEALTH_AGENT: PlayableCharacter = {
  ...GHOST_OPERATOR,
  id: 'stealth_agent',
  name: 'Stealth Agent',
  displayName: 'Shadow Agent',
  modelId: 'ghost_1k',
  rarity: 'epic',
  unlockLevel: 19,
  isUnlocked: false
}

export const SERGEANT_REZNOV: PlayableCharacter = {
  ...REZNOV,
  id: 'sergeant_reznov',
  name: 'Sgt. Reznov',
  displayName: 'Sergeant Viktor Reznov',
  modelId: 'reznov_1k',
  rarity: 'epic',
  unlockLevel: 21,
  isUnlocked: false
}

export const RIOT_OFFICER: PlayableCharacter = {
  ...POLICE_OFFICER,
  id: 'riot_officer',
  name: 'Riot Officer',
  displayName: 'Riot Control Officer',
  modelId: 'police_suit_2k',
  rarity: 'rare',
  unlockLevel: 11,
  isUnlocked: false
}

export const ELITE_GUARD: PlayableCharacter = {
  ...HEAVY_CRIMINAL,
  id: 'elite_guard',
  name: 'Elite Guard',
  displayName: 'Elite Security Guard',
  modelId: 'criminal_4k',
  rarity: 'epic',
  unlockLevel: 24,
  isUnlocked: false
}

// ============================================================================
// CHARACTER COLLECTIONS
// ============================================================================

export const ALL_CHARACTERS: PlayableCharacter[] = [
  // Starters (Level 1)
  TACTICAL_OPERATOR,
  SOLDIER,
  
  // Common/Rare (Level 5-15)
  TERRORIST,
  POLICE_OFFICER,
  SPEC_OPS,
  MERCENARY,
  RIOT_OFFICER,
  POLONSKY,
  SULLIVAN,
  MARINE_OFFICER,
  MEDIC,
  ENGINEER,
  
  // Epic (Level 15-25)
  COMOFF_MARINE,
  SWAT_COMMANDER,
  STEALTH_AGENT,
  GHOST_OPERATOR,
  SERGEANT_REZNOV,
  REZNOV,
  ELITE_GUARD,
  HEAVY_CRIMINAL,
  
  // Legendary (Level 25+)
  CRIMINAL_BOSS
]

export const STARTER_CHARACTERS: PlayableCharacter[] = [
  TACTICAL_OPERATOR
]

export const LEGENDARY_CHARACTERS: PlayableCharacter[] = ALL_CHARACTERS.filter(
  c => c.rarity === 'legendary'
)

export const EPIC_CHARACTERS: PlayableCharacter[] = ALL_CHARACTERS.filter(
  c => c.rarity === 'epic'
)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get character by ID
 */
export function getCharacterById(id: string): PlayableCharacter | undefined {
  return ALL_CHARACTERS.find(c => c.id === id)
}

/**
 * Get unlocked characters for player level
 */
export function getUnlockedCharacters(playerLevel: number): PlayableCharacter[] {
  return ALL_CHARACTERS.filter(c => 
    c.isUnlocked || (c.unlockLevel && c.unlockLevel <= playerLevel)
  )
}

/**
 * Get characters by rarity
 */
export function getCharactersByRarity(rarity: 'common' | 'rare' | 'epic' | 'legendary'): PlayableCharacter[] {
  return ALL_CHARACTERS.filter(c => c.rarity === rarity)
}

/**
 * Get character class (for UI grouping)
 */
export function getCharacterClass(character: PlayableCharacter): CharacterClass {
  // Determine class based on stats and abilities
  if (character.stats.maxHealth >= 110 || character.stats.maxArmor > 25) {
    return CharacterClass.TANK
  }
  if (character.abilities.active.type === 'vision' || character.abilities.passive.modifiers.noiseReduction) {
    return CharacterClass.RECON
  }
  if (character.abilities.ultimate.type === 'support') {
    return CharacterClass.SUPPORT
  }
  if (character.stats.damageMultiplier >= 1.05 || character.abilities.ultimate.type === 'offensive') {
    return CharacterClass.ASSAULT
  }
  return CharacterClass.SPECIALIST
}


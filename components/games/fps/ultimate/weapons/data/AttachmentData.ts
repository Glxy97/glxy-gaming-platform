/**
 * 🔧 ATTACHMENT DATA SYSTEM
 * Weapon attachment system for weapon customization
 * Integrated from GLXYWeapons.tsx (Oct 29, 2025)
 */

// ============================================================
// ENUMS
// ============================================================

/**
 * Types of weapon attachments
 */
export enum AttachmentType {
  BARREL = 'barrel',
  OPTIC = 'optic',
  UNDERBARREL = 'underbarrel',
  MAGAZINE = 'magazine',
  STOCK = 'stock',
  LASER = 'laser',
  GRIP = 'grip',
  MUZZLE = 'muzzle'
}

/**
 * Attachment rarity tiers
 */
export enum AttachmentRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

// ============================================================
// INTERFACES
// ============================================================

/**
 * Stat modifiers applied by an attachment
 *
 * @remarks
 * Positive values increase stat, negative values decrease
 * Example: recoil: -15 reduces recoil by 15 points
 */
export interface AttachmentEffect {
  damage?: number              // Base damage modification
  fireRate?: number            // Fire rate modification (RPM)
  accuracy?: number            // Accuracy modification (0-100)
  recoil?: number              // Recoil modification
  range?: number               // Effective range modification (meters)
  magazineSize?: number        // Magazine capacity modification
  reloadTime?: number          // Reload time modification (seconds)
  adsSpeed?: number            // ADS speed modification
  movementSpeed?: number       // Movement speed modification
  penetration?: number         // Wall penetration modification
}

/**
 * Complete attachment definition
 */
export interface AttachmentData {
  // ============================================================
  // IDENTIFICATION
  // ============================================================
  id: string                   // Unique identifier (e.g., "ar_silencer")
  name: string                 // Display name (e.g., "Tactical Silencer")
  type: AttachmentType         // Attachment slot type
  description?: string         // Optional flavor text

  // ============================================================
  // COMPATIBILITY
  // ============================================================
  compatibleWeapons?: string[] // Weapon IDs this works with (empty = all)
  compatibleTypes?: string[]   // Weapon types this works with (e.g., ["rifle", "smg"])

  // ============================================================
  // EFFECTS
  // ============================================================
  effect: AttachmentEffect     // Stat modifications applied

  // ============================================================
  // PROGRESSION
  // ============================================================
  unlockLevel: number          // Weapon level required to unlock
  rarity?: AttachmentRarity    // Visual rarity tier

  // ============================================================
  // VISUALS
  // ============================================================
  modelPath?: string           // Path to 3D model (optional)
  iconPath?: string            // Path to UI icon
}

/**
 * Attachment loadout for a weapon
 */
export interface WeaponAttachments {
  barrel?: string              // Equipped barrel attachment ID
  optic?: string               // Equipped optic attachment ID
  underbarrel?: string         // Equipped underbarrel attachment ID
  magazine?: string            // Equipped magazine attachment ID
  stock?: string               // Equipped stock attachment ID
  laser?: string               // Equipped laser attachment ID
  grip?: string                // Equipped grip attachment ID
  muzzle?: string              // Equipped muzzle attachment ID
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Apply attachment effect to weapon stats
 *
 * @param baseStats - Original weapon stats
 * @param effect - Attachment effect to apply
 * @returns Modified stats object
 */
export function applyAttachmentEffect<T extends Record<string, any>>(
  baseStats: T,
  effect: AttachmentEffect
): T {
  const modified = { ...baseStats }

  // Apply each effect property
  Object.keys(effect).forEach(key => {
    const effectValue = effect[key as keyof AttachmentEffect]
    if (effectValue !== undefined && key in modified) {
      const baseValue = modified[key]
      if (typeof baseValue === 'number' && typeof effectValue === 'number') {
        (modified as any)[key] = baseValue + effectValue
      }
    }
  })

  return modified
}

/**
 * Combine multiple attachment effects
 *
 * @param effects - Array of attachment effects
 * @returns Combined effect
 */
export function combineAttachmentEffects(effects: AttachmentEffect[]): AttachmentEffect {
  const combined: AttachmentEffect = {}

  effects.forEach(effect => {
    Object.keys(effect).forEach(key => {
      const k = key as keyof AttachmentEffect
      const value = effect[k]
      if (value !== undefined) {
        combined[k] = (combined[k] || 0) + value
      }
    })
  })

  return combined
}

/**
 * Validate attachment compatibility with weapon
 *
 * @param attachment - Attachment to check
 * @param weaponId - Weapon ID to check against
 * @param weaponType - Weapon type to check against
 * @returns True if compatible
 */
export function isAttachmentCompatible(
  attachment: AttachmentData,
  weaponId: string,
  weaponType: string
): boolean {
  // If no restrictions, compatible with all
  if (!attachment.compatibleWeapons && !attachment.compatibleTypes) {
    return true
  }

  // Check weapon ID whitelist
  if (attachment.compatibleWeapons && attachment.compatibleWeapons.length > 0) {
    if (!attachment.compatibleWeapons.includes(weaponId)) {
      return false
    }
  }

  // Check weapon type whitelist
  if (attachment.compatibleTypes && attachment.compatibleTypes.length > 0) {
    if (!attachment.compatibleTypes.includes(weaponType)) {
      return false
    }
  }

  return true
}

/**
 * Get attachment slot from type
 *
 * @param type - Attachment type
 * @returns Slot name for WeaponAttachments
 */
export function getAttachmentSlot(type: AttachmentType): keyof WeaponAttachments {
  return type as keyof WeaponAttachments
}

// ============================================================
// DEFAULT VALUES
// ============================================================

/**
 * Empty attachment loadout
 */
export const EMPTY_ATTACHMENTS: WeaponAttachments = {
  barrel: undefined,
  optic: undefined,
  underbarrel: undefined,
  magazine: undefined,
  stock: undefined,
  laser: undefined,
  grip: undefined,
  muzzle: undefined
}

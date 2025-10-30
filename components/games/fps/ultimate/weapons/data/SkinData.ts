/**
 * 🎨 WEAPON SKIN SYSTEM
 * Cosmetic weapon customization system
 * Integrated from GLXYWeapons.tsx (Oct 29, 2025)
 */

// ============================================================
// ENUMS
// ============================================================

/**
 * Skin rarity tiers (determines value and visual effects)
 */
export enum SkinRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic'
}

/**
 * Visual effect types for skins
 */
export enum SkinEffectType {
  GLOW = 'glow',
  PARTICLE = 'particle',
  ANIMATED = 'animated',
  HOLOGRAPHIC = 'holographic',
  REACTIVE = 'reactive',        // Changes based on kills/performance
  KILL_COUNTER = 'kill_counter'
}

// ============================================================
// INTERFACES
// ============================================================

/**
 * Visual effect definition for a skin
 */
export interface SkinEffect {
  type: SkinEffectType         // Effect type
  intensity?: number           // Effect intensity (0-1)
  color?: string               // Primary color (hex)
  secondaryColor?: string      // Secondary color (hex)
  speed?: number               // Animation speed (if applicable)
}

/**
 * Complete weapon skin definition
 */
export interface WeaponSkinData {
  // ============================================================
  // IDENTIFICATION
  // ============================================================
  id: string                   // Unique identifier (e.g., "m4a1_dragon_lore")
  name: string                 // Display name (e.g., "Dragon Lore")
  weaponId: string             // Compatible weapon ID
  description?: string         // Optional flavor text

  // ============================================================
  // RARITY & VALUE
  // ============================================================
  rarity: SkinRarity           // Rarity tier
  price: number                // Purchase/craft cost
  tradeable?: boolean          // Can be traded with other players
  marketable?: boolean         // Can be sold on marketplace

  // ============================================================
  // VISUALS
  // ============================================================
  texturePath: string          // Path to skin texture
  normalMapPath?: string       // Optional normal map
  roughnessMapPath?: string    // Optional roughness map
  metallicMapPath?: string     // Optional metallic map

  // Color overrides (if not using textures)
  baseColor?: string           // Primary color (hex)
  accentColor?: string         // Accent color (hex)

  // Visual effects
  effects?: SkinEffect[]       // Special visual effects

  // ============================================================
  // PROGRESSION
  // ============================================================
  unlockLevel?: number         // Player level required
  challengeRequired?: string   // Challenge ID to unlock (optional)
  limited?: boolean            // Limited edition skin
  seasonExclusive?: string     // Season ID (if seasonal)

  // ============================================================
  // METADATA
  // ============================================================
  collection?: string          // Skin collection name
  artist?: string              // Artist credit
  releaseDate?: Date           // Release date
}

/**
 * Skin wear levels (quality/condition)
 */
export enum SkinWear {
  FACTORY_NEW = 'factory_new',
  MINIMAL_WEAR = 'minimal_wear',
  FIELD_TESTED = 'field_tested',
  WELL_WORN = 'well_worn',
  BATTLE_SCARRED = 'battle_scarred'
}

/**
 * Player's owned skin instance
 */
export interface OwnedSkin {
  skinId: string               // Reference to WeaponSkinData
  wear?: SkinWear              // Wear level (optional)
  statTrak?: number            // Kill counter (optional)
  acquiredDate: Date           // When obtained
  customName?: string          // Custom name tag (optional)
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get rarity color for UI display
 *
 * @param rarity - Skin rarity
 * @returns Hex color code
 */
export function getRarityColor(rarity: SkinRarity): string {
  switch (rarity) {
    case SkinRarity.COMMON:
      return '#b0c3d9' // Light gray
    case SkinRarity.RARE:
      return '#4b69ff' // Blue
    case SkinRarity.EPIC:
      return '#8847ff' // Purple
    case SkinRarity.LEGENDARY:
      return '#d32ce6' // Pink
    case SkinRarity.MYTHIC:
      return '#eb4b4b' // Red
    default:
      return '#ffffff'
  }
}

/**
 * Get rarity multiplier for pricing
 *
 * @param rarity - Skin rarity
 * @returns Price multiplier
 */
export function getRarityMultiplier(rarity: SkinRarity): number {
  switch (rarity) {
    case SkinRarity.COMMON:
      return 1.0
    case SkinRarity.RARE:
      return 2.5
    case SkinRarity.EPIC:
      return 5.0
    case SkinRarity.LEGENDARY:
      return 10.0
    case SkinRarity.MYTHIC:
      return 25.0
    default:
      return 1.0
  }
}

/**
 * Get wear value (0-1, lower is better condition)
 *
 * @param wear - Skin wear level
 * @returns Numeric wear value
 */
export function getWearValue(wear: SkinWear): number {
  switch (wear) {
    case SkinWear.FACTORY_NEW:
      return 0.0
    case SkinWear.MINIMAL_WEAR:
      return 0.2
    case SkinWear.FIELD_TESTED:
      return 0.4
    case SkinWear.WELL_WORN:
      return 0.6
    case SkinWear.BATTLE_SCARRED:
      return 0.8
    default:
      return 0.5
  }
}

/**
 * Calculate total skin value based on rarity and wear
 *
 * @param skin - Skin data
 * @param wear - Wear level
 * @returns Calculated value
 */
export function calculateSkinValue(skin: WeaponSkinData, wear?: SkinWear): number {
  let value = skin.price * getRarityMultiplier(skin.rarity)

  // Apply wear depreciation
  if (wear) {
    const wearValue = getWearValue(wear)
    value = value * (1 - wearValue * 0.5) // Max 50% depreciation
  }

  return Math.round(value)
}

/**
 * Check if skin is currently available
 *
 * @param skin - Skin data
 * @returns True if available
 */
export function isSkinAvailable(skin: WeaponSkinData): boolean {
  // Limited editions might be unavailable
  if (skin.limited) {
    return false // Would check against current time/event
  }

  // Seasonal exclusives check
  if (skin.seasonExclusive) {
    return false // Would check against current season
  }

  return true
}

/**
 * Get display name with wear suffix
 *
 * @param skin - Skin data
 * @param wear - Wear level
 * @returns Display name
 */
export function getSkinDisplayName(skin: WeaponSkinData, wear?: SkinWear): string {
  let name = skin.name

  if (wear) {
    const wearSuffix = wear
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    name += ` (${wearSuffix})`
  }

  return name
}

// ============================================================
// DEFAULT VALUES
// ============================================================

/**
 * Default skin (no cosmetics applied)
 */
export const DEFAULT_SKIN: Partial<WeaponSkinData> = {
  rarity: SkinRarity.COMMON,
  tradeable: false,
  marketable: false,
  effects: []
}

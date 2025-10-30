/**
 * 🔍 Asset Validator
 * 
 * Validiert und testet die Asset-Database
 * Zeigt Recommendations und Statistics
 */

import { 
  CHARACTER_ASSETS, 
  WEAPON_ASSETS, 
  MAP_ASSETS,
  BALANCED_SELECTOR,
  QUALITY_SELECTOR,
  PERFORMANCE_SELECTOR,
  SmartAssetSelector
} from './AssetDatabase'

export class AssetValidator {
  
  /**
   * Validiere alle Assets in der Database
   */
  validate(): ValidationReport {
    const report: ValidationReport = {
      valid: true,
      errors: [],
      warnings: [],
      stats: {
        totalAssets: CHARACTER_ASSETS.length + WEAPON_ASSETS.length + MAP_ASSETS.length,
        characters: CHARACTER_ASSETS.length,
        weapons: WEAPON_ASSETS.length,
        maps: MAP_ASSETS.length
      }
    }

    // Validiere Characters
    CHARACTER_ASSETS.forEach(asset => {
      if (!asset.path || !asset.path.startsWith('/')) {
        report.errors.push(`Invalid path for character: ${asset.id}`)
        report.valid = false
      }
      if (asset.score < 10 || asset.score > 20) {
        report.warnings.push(`Unusual score for ${asset.id}: ${asset.score}`)
      }
    })

    // Validiere Weapons
    WEAPON_ASSETS.forEach(asset => {
      if (!asset.path || !asset.path.startsWith('/')) {
        report.errors.push(`Invalid path for weapon: ${asset.id}`)
        report.valid = false
      }
    })

    // Validiere Maps
    MAP_ASSETS.forEach(asset => {
      if (!asset.path || !asset.path.startsWith('/')) {
        report.errors.push(`Invalid path for map: ${asset.id}`)
        report.valid = false
      }
    })

    return report
  }

  /**
   * Zeige detaillierte Asset-Statistiken
   */
  printStats(): void {
    console.log('\n🎯 ============================================')
    console.log('   ASSET DATABASE STATISTICS')
    console.log('   ============================================\n')

    // Characters
    console.log('👤 CHARACTERS:')
    console.log(`   Total: ${CHARACTER_ASSETS.length}`)
    console.log(`   Ultra Quality (4K-8K): ${CHARACTER_ASSETS.filter(a => a.quality === 'ultra').length}`)
    console.log(`   High Quality (1K-2K): ${CHARACTER_ASSETS.filter(a => a.quality === 'high').length}`)
    console.log(`   Medium Quality: ${CHARACTER_ASSETS.filter(a => a.quality === 'medium').length}`)
    
    const avgCharScore = CHARACTER_ASSETS.reduce((sum, a) => sum + a.score, 0) / CHARACTER_ASSETS.length
    console.log(`   Average Score: ${avgCharScore.toFixed(2)}/20`)

    // Weapons
    console.log('\n🔫 WEAPONS:')
    console.log(`   Total: ${WEAPON_ASSETS.length}`)
    console.log(`   Ultra Quality: ${WEAPON_ASSETS.filter(a => a.quality === 'ultra').length}`)
    console.log(`   High Quality: ${WEAPON_ASSETS.filter(a => a.quality === 'high').length}`)
    console.log(`   Medium Quality: ${WEAPON_ASSETS.filter(a => a.quality === 'medium').length}`)

    // Maps
    console.log('\n🗺️ MAPS:')
    console.log(`   Total: ${MAP_ASSETS.length}`)
    MAP_ASSETS.forEach(map => {
      console.log(`   - ${map.name} (${map.quality})`)
    })

    console.log('\n============================================\n')
  }

  /**
   * Zeige Recommendations für verschiedene Scenarios
   */
  printRecommendations(): void {
    console.log('\n🏆 ============================================')
    console.log('   SMART ASSET RECOMMENDATIONS')
    console.log('   ============================================\n')

    // Balanced Mode
    console.log('⚖️ BALANCED MODE (Default):')
    const balanced = BALANCED_SELECTOR.getRecommendations()
    console.log(`   Player: ${balanced.player_best_quality.name}`)
    console.log(`   Enemy Near: ${balanced.enemy_near.name}`)
    console.log(`   Enemy Mid: ${balanced.enemy_mid.name}`)
    console.log(`   Enemy Far: ${balanced.enemy_far.name}`)
    console.log(`   Weapon: ${balanced.weapon_best.name}`)
    console.log(`   Map: ${balanced.map_best.name}`)

    // Quality Mode
    console.log('\n🎨 QUALITY MODE (Max Visuals):')
    const quality = QUALITY_SELECTOR.getRecommendations()
    console.log(`   Player: ${quality.player_best_quality.name}`)
    console.log(`   Enemy Near: ${quality.enemy_near.name}`)
    console.log(`   Weapon: ${quality.weapon_best.name}`)
    console.log(`   Map: ${quality.map_best.name}`)

    // Performance Mode
    console.log('\n⚡ PERFORMANCE MODE (Max FPS):')
    const perf = PERFORMANCE_SELECTOR.getRecommendations()
    console.log(`   Player: ${perf.player_best_quality.name}`)
    console.log(`   Enemy Near: ${perf.enemy_near.name}`)
    console.log(`   Enemy Mid: ${perf.enemy_mid.name}`)
    console.log(`   Enemy Far: ${perf.enemy_far.name}`)
    console.log(`   Weapon: ${perf.weapon_best.name}`)
    console.log(`   Map: ${perf.map_best.name}`)

    console.log('\n============================================\n')
  }

  /**
   * Zeige TOP 5 Assets jeder Kategorie
   */
  printTopAssets(): void {
    console.log('\n⭐ ============================================')
    console.log('   TOP 5 ASSETS (by Score)')
    console.log('   ============================================\n')

    // Top Characters
    const topChars = [...CHARACTER_ASSETS].sort((a, b) => b.score - a.score).slice(0, 5)
    console.log('👤 TOP 5 CHARACTERS:')
    topChars.forEach((asset, i) => {
      console.log(`   ${i + 1}. ${asset.name}`)
      console.log(`      Score: ${asset.score}/20 (Visual: ${asset.visual}, Perf: ${asset.performance})`)
      console.log(`      Quality: ${asset.quality} ${asset.textureResolution ? `(${asset.textureResolution})` : ''}`)
    })

    // Top Weapons
    const topWeapons = [...WEAPON_ASSETS].sort((a, b) => b.score - a.score).slice(0, 5)
    console.log('\n🔫 TOP 5 WEAPONS:')
    topWeapons.forEach((asset, i) => {
      console.log(`   ${i + 1}. ${asset.name}`)
      console.log(`      Score: ${asset.score}/20 (Visual: ${asset.visual}, Perf: ${asset.performance})`)
      console.log(`      Quality: ${asset.quality} ${asset.textureResolution ? `(${asset.textureResolution})` : ''}`)
    })

    console.log('\n============================================\n')
  }

  /**
   * Test Smart Asset Selection
   */
  testSmartSelection(): void {
    console.log('\n🧪 ============================================')
    console.log('   SMART SELECTION TEST')
    console.log('   ============================================\n')

    const selector = BALANCED_SELECTOR

    // Test Player Selection
    console.log('TEST 1: Player Character Selection')
    const player = selector.selectBestCharacter('player')
    console.log(`   ✅ Selected: ${player.name}`)
    console.log(`   Quality: ${player.quality} (${player.textureResolution})`)
    console.log(`   Score: ${player.score}/20`)

    // Test Enemy Selection (verschiedene Distanzen)
    console.log('\nTEST 2: Enemy Character Selection (Distance-based LOD)')
    
    const enemyNear = selector.selectBestCharacter('enemy', 15)
    console.log(`   Distance 15m: ${enemyNear.name}`)
    console.log(`   Quality: ${enemyNear.quality} (${enemyNear.textureResolution})`)

    const enemyMid = selector.selectBestCharacter('enemy', 35)
    console.log(`   Distance 35m: ${enemyMid.name}`)
    console.log(`   Quality: ${enemyMid.quality} (${enemyMid.textureResolution})`)

    const enemyFar = selector.selectBestCharacter('enemy', 75)
    console.log(`   Distance 75m: ${enemyFar.name}`)
    console.log(`   Quality: ${enemyFar.quality} (${enemyFar.textureResolution})`)

    // Test Weapon Selection
    console.log('\nTEST 3: Weapon Selection')
    const weapon = selector.selectBestWeapon('rifle')
    console.log(`   ✅ Selected: ${weapon.name}`)
    console.log(`   Quality: ${weapon.quality} (${weapon.textureResolution})`)
    console.log(`   Score: ${weapon.score}/20`)

    // Test Map Selection
    console.log('\nTEST 4: Map Selection')
    const map = selector.selectBestMap()
    console.log(`   ✅ Selected: ${map.name}`)
    console.log(`   Quality: ${map.quality}`)
    console.log(`   Score: ${map.score}/20`)

    console.log('\n============================================\n')
  }

  /**
   * Vollständiger Report
   */
  generateFullReport(): void {
    console.log('\n\n')
    console.log('╔════════════════════════════════════════════╗')
    console.log('║   🎯 ASSET DATABASE VALIDATION REPORT     ║')
    console.log('╚════════════════════════════════════════════╝')

    // Validation
    const validation = this.validate()
    console.log('\n🔍 VALIDATION:')
    if (validation.valid) {
      console.log('   ✅ All assets are valid!')
    } else {
      console.log('   ❌ Validation errors found:')
      validation.errors.forEach(err => console.log(`      - ${err}`))
    }
    if (validation.warnings.length > 0) {
      console.log('   ⚠️ Warnings:')
      validation.warnings.forEach(warn => console.log(`      - ${warn}`))
    }

    // Statistics
    this.printStats()

    // Top Assets
    this.printTopAssets()

    // Recommendations
    this.printRecommendations()

    // Smart Selection Test
    this.testSmartSelection()

    console.log('\n╔════════════════════════════════════════════╗')
    console.log('║   ✅ ASSET DATABASE: PRODUCTION-READY!    ║')
    console.log('╚════════════════════════════════════════════╝\n')
  }
}

// ============================================================================
// INTERFACES
// ============================================================================

interface ValidationReport {
  valid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    totalAssets: number
    characters: number
    weapons: number
    maps: number
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Run full asset validation & report
 * Usage: import { runAssetValidation } from './AssetValidator'
 *        runAssetValidation()
 */
export function runAssetValidation(): void {
  const validator = new AssetValidator()
  validator.generateFullReport()
}

/**
 * Quick validation check
 */
export function quickValidate(): boolean {
  const validator = new AssetValidator()
  const report = validator.validate()
  
  if (!report.valid) {
    console.error('❌ Asset Database validation failed:')
    report.errors.forEach(err => console.error(`   - ${err}`))
    return false
  }
  
  console.log(`✅ Asset Database valid: ${report.stats.totalAssets} assets`)
  return true
}


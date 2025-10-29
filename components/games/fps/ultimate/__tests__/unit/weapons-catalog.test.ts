/**
 * Unit Tests for Weapons Catalog
 * Tests the complete weapon arsenal integration
 */

import { describe, it, expect } from 'vitest'
import {
  WEAPONS_CATALOG,
  getWeaponById,
  getWeaponsByType,
  getWeaponsByCategory,
  getWeaponsAtLevel
} from '../../weapons/data/weapons-catalog'
import { WeaponType } from '../../weapons/data/WeaponData'

describe('Weapons Catalog', () => {
  describe('Catalog Integrity', () => {
    it('should contain exactly 20 weapons', () => {
      expect(WEAPONS_CATALOG).toHaveLength(20)
    })

    it('should have all weapons with unique IDs', () => {
      const ids = WEAPONS_CATALOG.map(w => w.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(WEAPONS_CATALOG.length)
    })

    it('should have all weapons with required fields', () => {
      WEAPONS_CATALOG.forEach(weapon => {
        expect(weapon.id).toBeDefined()
        expect(weapon.name).toBeDefined()
        expect(weapon.type).toBeDefined()
        expect(weapon.damage).toBeGreaterThan(0)
        expect(weapon.magazineSize).toBeGreaterThan(0)
        expect(weapon.fireRate).toBeGreaterThan(0)
      })
    })

    it('should have valid price and unlock levels', () => {
      WEAPONS_CATALOG.forEach(weapon => {
        if (weapon.price !== undefined) {
          expect(weapon.price).toBeGreaterThanOrEqual(0)
        }
        if (weapon.unlockLevel !== undefined) {
          expect(weapon.unlockLevel).toBeGreaterThanOrEqual(1)
          expect(weapon.unlockLevel).toBeLessThanOrEqual(30)
        }
      })
    })
  })

  describe('Weapon Categories', () => {
    it('should have 3 assault rifles', () => {
      const category = getWeaponsByCategory('Assault Rifles')
      expect(category).toHaveLength(3)
    })

    it('should have 3 submachine guns', () => {
      const category = getWeaponsByCategory('Submachine Guns')
      expect(category).toHaveLength(3)
    })

    it('should have 2 shotguns', () => {
      const category = getWeaponsByCategory('Shotguns')
      expect(category).toHaveLength(2)
    })

    it('should have 3 sniper rifles', () => {
      const category = getWeaponsByCategory('Sniper Rifles')
      expect(category).toHaveLength(3)
    })

    it('should have 2 light machine guns', () => {
      const category = getWeaponsByCategory('Light Machine Guns')
      expect(category).toHaveLength(2)
    })

    it('should have 4 pistols', () => {
      const category = getWeaponsByCategory('Pistols')
      expect(category).toHaveLength(4)
    })

    it('should have 2 energy weapons', () => {
      const category = getWeaponsByCategory('Energy Weapons')
      expect(category).toHaveLength(2)
    })

    it('should have 1 explosive weapon', () => {
      const category = getWeaponsByCategory('Explosives')
      expect(category).toHaveLength(1)
    })
  })

  describe('getWeaponById', () => {
    it('should find weapon by valid ID', () => {
      const weapon = getWeaponById('glxy_ar15_tactical')
      expect(weapon).toBeDefined()
      expect(weapon?.name).toBe('GLXY AR-15 Tactical')
    })

    it('should return undefined for invalid ID', () => {
      const weapon = getWeaponById('non_existent_weapon')
      expect(weapon).toBeUndefined()
    })

    it('should find all 20 weapons by their IDs', () => {
      const testIds = [
        'glxy_ar15_tactical',
        'glxy_br16_marksman',
        'glxy_c8_carbine',
        'glxy_smg9',
        'glxy_pdw45',
        'glxy_tac_smg',
        'glxy_sg12_combat',
        'glxy_as24_auto',
        'glxy_sr50_intervention',
        'glxy_msr762',
        'glxy_lsr556',
        'glxy_lmg249_saw',
        'glxy_slm_rpk',
        'glxy_p19_sidearm',
        'glxy_hp50_desert',
        'glxy_mp18_auto',
        'glxy_tp92_tactical',
        'glxy_pr1_plasma',
        'glxy_rgx_railgun',
        'glxy_rl8_havoc'
      ]

      testIds.forEach(id => {
        const weapon = getWeaponById(id)
        expect(weapon).toBeDefined()
      })
    })
  })

  describe('getWeaponsByType', () => {
    it('should find pistol weapons', () => {
      const pistols = getWeaponsByType(WeaponType.PISTOL)
      expect(pistols.length).toBeGreaterThan(0)
      pistols.forEach(w => {
        expect(w.type).toBe(WeaponType.PISTOL)
      })
    })

    it('should find rifle weapons', () => {
      const rifles = getWeaponsByType(WeaponType.RIFLE)
      expect(rifles.length).toBeGreaterThan(0)
      rifles.forEach(w => {
        expect(w.type).toBe(WeaponType.RIFLE)
      })
    })

    it('should find sniper weapons', () => {
      const snipers = getWeaponsByType(WeaponType.SNIPER)
      expect(snipers.length).toBeGreaterThan(0)
      snipers.forEach(w => {
        expect(w.type).toBe(WeaponType.SNIPER)
      })
    })
  })

  describe('getWeaponsAtLevel', () => {
    it('should return starter weapon at level 1', () => {
      const weapons = getWeaponsAtLevel(1)
      expect(weapons.length).toBeGreaterThan(0)

      // All returned weapons should be unlockable at level 1
      weapons.forEach(w => {
        expect(w.unlockLevel || 1).toBeLessThanOrEqual(1)
      })
    })

    it('should return more weapons at level 10', () => {
      const level1 = getWeaponsAtLevel(1)
      const level10 = getWeaponsAtLevel(10)
      expect(level10.length).toBeGreaterThan(level1.length)
    })

    it('should return all weapons at level 30', () => {
      const weapons = getWeaponsAtLevel(30)
      expect(weapons).toHaveLength(20)
    })

    it('should respect unlock levels', () => {
      const weapons = getWeaponsAtLevel(15)
      weapons.forEach(w => {
        expect(w.unlockLevel || 1).toBeLessThanOrEqual(15)
      })
    })
  })

  describe('Weapon Stats Balance', () => {
    it('should have balanced damage ranges', () => {
      WEAPONS_CATALOG.forEach(weapon => {
        // Damage should be reasonable (10-250)
        expect(weapon.damage).toBeGreaterThanOrEqual(10)
        expect(weapon.damage).toBeLessThanOrEqual(300)
      })
    })

    it('should have valid fire rates', () => {
      WEAPONS_CATALOG.forEach(weapon => {
        // Fire rate should be reasonable (30-1200 RPM)
        expect(weapon.fireRate).toBeGreaterThanOrEqual(30)
        expect(weapon.fireRate).toBeLessThanOrEqual(1200)
      })
    })

    it('should have realistic magazine sizes', () => {
      WEAPONS_CATALOG.forEach(weapon => {
        // Magazine sizes should be realistic (1-100)
        expect(weapon.magazineSize).toBeGreaterThanOrEqual(1)
        expect(weapon.magazineSize).toBeLessThanOrEqual(100)
      })
    })

    it('should have valid accuracy values', () => {
      WEAPONS_CATALOG.forEach(weapon => {
        // Accuracy should be 0-100
        expect(weapon.accuracy).toBeGreaterThanOrEqual(0)
        expect(weapon.accuracy).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('Weapon Properties', () => {
    it('should have recoil patterns for all weapons', () => {
      WEAPONS_CATALOG.forEach(weapon => {
        expect(weapon.recoilPattern).toBeDefined()
        expect(weapon.recoilPattern.vertical).toHaveLength(30)
        expect(weapon.recoilPattern.horizontal).toHaveLength(30)
      })
    })

    it('should have sound paths for all weapons', () => {
      WEAPONS_CATALOG.forEach(weapon => {
        expect(weapon.soundPaths).toBeDefined()
        expect(weapon.soundPaths.fire).toBeDefined()
        expect(weapon.soundPaths.reload_mag_out).toBeDefined()
        expect(weapon.soundPaths.reload_mag_in).toBeDefined()
      })
    })

    it('should have model paths for all weapons', () => {
      WEAPONS_CATALOG.forEach(weapon => {
        expect(weapon.modelPath).toBeDefined()
        expect(weapon.modelPath).toContain('/models/weapons/')
      })
    })
  })

  describe('Special Weapons', () => {
    it('should have plasma rifle with energy properties', () => {
      const plasma = getWeaponById('glxy_pr1_plasma')
      expect(plasma).toBeDefined()
      expect(plasma?.specialProperties).toContain('energy_damage')
      expect(plasma?.muzzleFlashColor).toBe('#00ffff')  // Cyan
    })

    it('should have railgun with charge fire', () => {
      const railgun = getWeaponById('glxy_rgx_railgun')
      expect(railgun).toBeDefined()
      expect(railgun?.specialProperties).toContain('charge_fire')
      expect(railgun?.penetration).toBe(100)  // Max penetration
    })

    it('should have rocket launcher with explosive properties', () => {
      const rocket = getWeaponById('glxy_rl8_havoc')
      expect(rocket).toBeDefined()
      expect(rocket?.specialProperties).toContain('explosive')
      expect(rocket?.specialProperties).toContain('splash_damage')
      expect(rocket?.damage).toBeGreaterThanOrEqual(200)
    })
  })
})

/**
 * GameModeManager Unit Tests
 * 
 * @description TDD: Tests FIRST before implementation!
 * @author Glxy97 + Claude Sonnet 4.5
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import type { GameMode, GameConfig } from '../../types/GameTypes'

// ============================================================================
// IMPORT - REAL IMPLEMENTATION! (TDD Complete!)
// ============================================================================

/**
 * NACHDENKEN: Warum Tests zuerst?
 * 
 * 1. Zwingt uns API Design zu durchdenken ✅
 * 2. Stellt sicher dass Code testbar ist ✅
 * 3. Dokumentiert erwartetes Verhalten ✅
 * 4. Verhindert Regression ✅
 * 5. Gibt sofortiges Feedback ✅
 * 
 * PROFESSIONELL: Wir haben Tests geschrieben, jetzt nutzen wir echte Implementation!
 */

import { GameModeManager } from '../../core/GameModeManager'

// ============================================================================
// TESTS - DURCHDACHT & PROFESSIONELL
// ============================================================================

describe('GameModeManager', () => {
  let manager: GameModeManager
  
  beforeEach(() => {
    // LOGISCH: Fresh instance for each test
    manager = new GameModeManager()
  })
  
  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================
  
  describe('Initialization', () => {
    /**
     * NACHDENKEN: Was muss beim Start funktionieren?
     * - Default mode sollte zombie sein (aktueller Zustand)
     * - Alle 4 Modi sollten verfügbar sein
     * - Configs sollten korrekt initialisiert sein
     */
    
    it('should start in zombie mode', () => {
      // KORREKT: Test erwartetes Default-Verhalten
      expect(manager.currentMode).toBe('zombie')
    })
    
    it('should have all 4 game modes available', () => {
      // INTELLIGENT: Teste dass alle Modi da sind
      const modes = manager.availableModes
      
      expect(modes).toHaveLength(4)
      expect(modes).toContain('zombie')
      expect(modes).toContain('team-deathmatch')
      expect(modes).toContain('free-for-all')
      expect(modes).toContain('gun-game')
    })
    
    it('should have valid config for each mode', () => {
      // PROFESSIONELL: Teste jede Konfiguration
      const modes: GameMode[] = ['zombie', 'team-deathmatch', 'free-for-all', 'gun-game']
      
      modes.forEach(mode => {
        const config = manager.getModeConfig(mode)
        
        // RICHTIG: Validiere alle wichtigen Properties
        expect(config).toBeDefined()
        expect(config.mode).toBe(mode)
        expect(config.maxPlayers).toBeGreaterThan(0)
        expect(config.timeLimit).toBeGreaterThanOrEqual(0)
        expect(config.scoreLimit).toBeGreaterThanOrEqual(0)
        expect(typeof config.respawn).toBe('boolean')
        expect(config.teams).toBeGreaterThanOrEqual(0)
      })
    })
  })
  
  // ==========================================================================
  // MODE CHANGE TESTS
  // ==========================================================================
  
  describe('changeMode', () => {
    /**
     * NACHDENKEN: Was muss beim Mode-Wechsel passieren?
     * - Mode sollte gewechselt werden
     * - Listeners sollten benachrichtigt werden
     * - Invalide Modi sollten rejected werden
     * - State sollte konsistent bleiben
     */
    
    it('should change mode successfully', () => {
      // LOGISCH: Test normale Operation
      manager.changeMode('team-deathmatch')
      
      expect(manager.currentMode).toBe('team-deathmatch')
    })
    
    it('should notify listeners when mode changes', () => {
      // PROFESSIONELL: Test Event System
      const listener = jest.fn()
      manager.onModeChange(listener)
      
      manager.changeMode('free-for-all')
      
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith('free-for-all')
    })
    
    it('should notify multiple listeners', () => {
      // INTELLIGENT: Test mehrere Listeners
      const listener1 = jest.fn()
      const listener2 = jest.fn()
      const listener3 = jest.fn()
      
      manager.onModeChange(listener1)
      manager.onModeChange(listener2)
      manager.onModeChange(listener3)
      
      manager.changeMode('gun-game')
      
      expect(listener1).toHaveBeenCalledWith('gun-game')
      expect(listener2).toHaveBeenCalledWith('gun-game')
      expect(listener3).toHaveBeenCalledWith('gun-game')
    })
    
    it('should throw error for invalid mode', () => {
      // KORREKT: Test Error Handling
      expect(() => {
        manager.changeMode('invalid-mode' as GameMode)
      }).toThrow('Invalid game mode')
    })
    
    it('should allow changing to same mode', () => {
      // NACHDENKEN: Sollte man zum selben Mode wechseln können? Ja!
      // Use case: Reset current mode state
      manager.changeMode('zombie')
      
      expect(() => {
        manager.changeMode('zombie')
      }).not.toThrow()
      
      expect(manager.currentMode).toBe('zombie')
    })
  })
  
  // ==========================================================================
  // CONFIG TESTS
  // ==========================================================================
  
  describe('getModeConfig', () => {
    /**
     * NACHDENKEN: Was ist wichtig bei Configs?
     * - Config sollte existieren
     * - Config sollte COPY sein, nicht Reference
     * - Config sollte richtige Werte haben
     */
    
    it('should return config for current mode', () => {
      // LOGISCH: Default mode = zombie
      const config = manager.getModeConfig()
      
      expect(config.mode).toBe('zombie')
    })
    
    it('should return config for specific mode', () => {
      // PROFESSIONELL: Test mit Parameter
      const config = manager.getModeConfig('team-deathmatch')
      
      expect(config.mode).toBe('team-deathmatch')
      expect(config.teams).toBe(2)
      expect(config.maxPlayers).toBe(16)
    })
    
    it('should return copy, not reference', () => {
      // INTELLIGENT: Test Immutability
      const config1 = manager.getModeConfig()
      const config2 = manager.getModeConfig()
      
      expect(config1).toEqual(config2) // Same values
      expect(config1).not.toBe(config2) // Different objects
    })
    
    it('should throw error for invalid mode', () => {
      // KORREKT: Test Error Handling
      expect(() => {
        manager.getModeConfig('invalid' as GameMode)
      }).toThrow('No config for mode')
    })
    
    /**
     * PROFESSIONELL: Test Mode-Specific Configs
     */
    describe('Mode-Specific Configs', () => {
      it('zombie mode should have correct settings', () => {
        const config = manager.getModeConfig('zombie')
        
        expect(config.maxPlayers).toBe(1)
        expect(config.timeLimit).toBe(0) // Infinite
        expect(config.scoreLimit).toBe(0) // Survival
        expect(config.respawn).toBe(false) // One life
        expect(config.teams).toBe(0) // No teams
      })
      
      it('team-deathmatch should have correct settings', () => {
        const config = manager.getModeConfig('team-deathmatch')
        
        expect(config.maxPlayers).toBe(16)
        expect(config.timeLimit).toBe(600) // 10 minutes
        expect(config.scoreLimit).toBe(100)
        expect(config.respawn).toBe(true)
        expect(config.teams).toBe(2)
      })
      
      it('free-for-all should have correct settings', () => {
        const config = manager.getModeConfig('free-for-all')
        
        expect(config.maxPlayers).toBe(8)
        expect(config.scoreLimit).toBe(50)
        expect(config.respawn).toBe(true)
        expect(config.teams).toBe(0) // FFA = no teams
      })
      
      it('gun-game should have correct settings', () => {
        const config = manager.getModeConfig('gun-game')
        
        expect(config.maxPlayers).toBe(8)
        expect(config.scoreLimit).toBe(20) // 20 kills to win
        expect(config.respawn).toBe(true)
        expect(config.teams).toBe(0)
      })
    })
  })
  
  // ==========================================================================
  // VALIDATION TESTS
  // ==========================================================================
  
  describe('isValidMode', () => {
    /**
     * NACHDENKEN: Validation ist wichtig!
     * - Alle echten Modi sollten valid sein
     * - Invalide Modi sollten rejected werden
     */
    
    it('should return true for valid modes', () => {
      // KORREKT: Test alle validen Modi
      expect(manager.isValidMode('zombie')).toBe(true)
      expect(manager.isValidMode('team-deathmatch')).toBe(true)
      expect(manager.isValidMode('free-for-all')).toBe(true)
      expect(manager.isValidMode('gun-game')).toBe(true)
    })
    
    it('should return false for invalid modes', () => {
      // INTELLIGENT: Test invalide Modi
      expect(manager.isValidMode('invalid' as GameMode)).toBe(false)
      expect(manager.isValidMode('capture-flag' as GameMode)).toBe(false) // Not implemented yet
    })
  })
  
  // ==========================================================================
  // EVENT LISTENER TESTS
  // ==========================================================================
  
  describe('onModeChange', () => {
    /**
     * NACHDENKEN: Event System muss robust sein!
     * - Listeners müssen called werden
     * - Unsubscribe muss funktionieren
     * - Keine Memory Leaks
     */
    
    it('should call listener when mode changes', () => {
      const listener = jest.fn()
      manager.onModeChange(listener)
      
      manager.changeMode('team-deathmatch')
      
      expect(listener).toHaveBeenCalled()
    })
    
    it('should return unsubscribe function', () => {
      // PROFESSIONELL: Test Cleanup
      const listener = jest.fn()
      const unsubscribe = manager.onModeChange(listener)
      
      expect(typeof unsubscribe).toBe('function')
    })
    
    it('should stop calling listener after unsubscribe', () => {
      // INTELLIGENT: Test Memory Leak Prevention
      const listener = jest.fn()
      const unsubscribe = manager.onModeChange(listener)
      
      manager.changeMode('free-for-all')
      expect(listener).toHaveBeenCalledTimes(1)
      
      // Unsubscribe
      unsubscribe()
      
      manager.changeMode('gun-game')
      expect(listener).toHaveBeenCalledTimes(1) // Still 1, not 2!
    })
    
    it('should not break with multiple unsubscribes', () => {
      // KORREKT: Test Edge Case
      const listener = jest.fn()
      const unsubscribe = manager.onModeChange(listener)
      
      unsubscribe()
      unsubscribe() // Call twice
      
      expect(() => {
        manager.changeMode('team-deathmatch')
      }).not.toThrow()
    })
  })
  
  // ==========================================================================
  // GAME STATE TESTS
  // ==========================================================================
  
  describe('Game State Management', () => {
    /**
     * NACHDENKEN: Game state ist kritisch!
     * - Game kann nur einmal gestartet werden
     * - Game kann gestoppt werden
     * - State transitions müssen korrekt sein
     */
    
    it('should start game successfully', () => {
      // LOGISCH: Normal case
      expect(() => {
        manager.startGame()
      }).not.toThrow()
    })
    
    it('should throw error when starting already running game', () => {
      // KORREKT: Test Error Case
      manager.startGame()
      
      expect(() => {
        manager.startGame()
      }).toThrow('Game is already running')
    })
    
    it('should end game successfully', () => {
      // PROFESSIONELL: Test State Transition
      manager.startGame()
      
      expect(() => {
        manager.endGame()
      }).not.toThrow()
    })
    
    it('should allow restarting after end', () => {
      // INTELLIGENT: Test Full Cycle
      manager.startGame()
      manager.endGame()
      
      expect(() => {
        manager.startGame()
      }).not.toThrow()
    })
  })
  
  // ==========================================================================
  // INTEGRATION TESTS (with other components - later)
  // ==========================================================================
  
  describe('Integration Scenarios', () => {
    /**
     * NACHDENKEN: Wie wird GameModeManager verwendet?
     * - Im Engine
     * - Mit UI
     * - Mit anderen Managern
     */
    
    it('should handle rapid mode changes', () => {
      // INTELLIGENT: Stress Test
      const listener = jest.fn()
      manager.onModeChange(listener)
      
      manager.changeMode('team-deathmatch')
      manager.changeMode('free-for-all')
      manager.changeMode('gun-game')
      manager.changeMode('zombie')
      
      expect(listener).toHaveBeenCalledTimes(4)
      expect(manager.currentMode).toBe('zombie')
    })
    
    it('should maintain consistency during mode change', () => {
      // KORREKT: Test Consistency
      manager.changeMode('team-deathmatch')
      
      const config = manager.getModeConfig()
      expect(config.mode).toBe(manager.currentMode)
    })
  })
})

// ============================================================================
// COVERAGE NOTES
// ============================================================================

/**
 * PROFESSIONELL: Was testen wir?
 * 
 * ✅ Initialization
 * ✅ Mode Changes
 * ✅ Config Retrieval
 * ✅ Validation
 * ✅ Event Listeners
 * ✅ Game State
 * ✅ Error Handling
 * ✅ Edge Cases
 * ✅ Integration Scenarios
 * 
 * Coverage Ziel: 80%+
 * 
 * Was testen wir NICHT?
 * ❌ Private Methods (testen durch public API)
 * ❌ Simple Getters (zu trivial)
 * ❌ Three.js Integration (too complex for unit tests)
 */

/**
 * NÄCHSTE SCHRITTE:
 * 
 * 1. Diese Tests laufen lassen → sollten ALLE PASSEN (wegen Mock)
 * 2. Echte Implementation schreiben
 * 3. Tests gegen echte Implementation laufen lassen
 * 4. Refactoren bis alle Tests grün sind
 * 5. Coverage checken (80%+)
 * 
 * Das ist TDD! 🎯
 */


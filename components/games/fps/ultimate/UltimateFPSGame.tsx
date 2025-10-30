/**
 * 🎮 ULTIMATE FPS GAME - COMPLETE REACT WRAPPER
 * 
 * Professional Integration of all Systems & UIs
 */

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { UltimateFPSEngineV4 } from './core/UltimateFPSEngineV4'
import type { GameState } from './core/GameFlowManager'
import type { PlayableCharacter } from './types/CharacterTypes'
import type { GameSettings } from './ui/SettingsMenuUI'

// UI Components
import MainMenuUI from './ui/MainMenuUI'
import InGameMenuUI from './ui/InGameMenuUI'
import SettingsMenuUI from './ui/SettingsMenuUI'
import MatchSummaryUI from './ui/MatchSummaryUI'
import CharacterSelectionUI from './ui/CharacterSelectionUI'
import WeaponLoadoutUI from './ui/WeaponLoadoutUI'
import LeaderboardUI from './ui/LeaderboardUI'
import KillFeedUI from './ui/KillFeedUI'
import KillCamUI from './ui/KillCamUI'

// Types
import type { KillCamData } from './systems/KillCamSystem'

interface UIData {
  playerLevel: number
  playerXP: number
  playerName: string
  selectedCharacter: PlayableCharacter
  stats: {
    kills: number
    deaths: number
    headshots: number
    accuracy: number
    score: number
    xpEarned: number
    longestKillDistance: number
    killStreak: number
    damageDealt: number
  }
  matchTime: number
  victory: boolean
  weaponProgressionManager: any
  availableWeapons: string[]
  settings: GameSettings
}

export const UltimateFPSGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<UltimateFPSEngineV4 | null>(null)
  
  const [gameState, setGameState] = useState<GameState>('mainMenu')
  const [uiData, setUIData] = useState<UIData | null>(null)
  const [showKillCam, setShowKillCam] = useState(false)
  const [killCamData, setKillCamData] = useState<KillCamData | null>(null)

  // Initialize Engine
  useEffect(() => {
    if (!containerRef.current || engineRef.current) return

    console.log('🎮 Initializing Ultimate FPS Game...')

    const engine = new UltimateFPSEngineV4(
      containerRef.current,
      (stats) => {
        // Stats update callback (silent - logged only on significant changes)
        // console.log('📊 Stats Update:', stats)
      },
      (result) => {
        // Game end callback
        console.log('🏁 Game End:', result)
        engineRef.current?.getGameFlowManager().showMatchSummary()
      },
      false // Multiplayer disabled for now
    )

    // Set UI Render Callback (silent to reduce console spam)
    engine.setUIRenderCallback((state: GameState, data: any) => {
      // console.log(`🎮 UI Update: ${state}`)
      setGameState(state)
      setUIData(data)
    })

    engineRef.current = engine

    // Start with main menu
    engine.getGameFlowManager().showMainMenu()

    // Cleanup
    return () => {
      console.log('🛑 Cleaning up engine...')
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  // Handle UI Actions
  const handleStartGame = () => {
    console.log('🎮 Starting game...')
    engineRef.current?.getGameFlowManager().startGame()
  }

  const handleCharacterSelect = () => {
    console.log('👤 Opening character selection...')
    engineRef.current?.getGameFlowManager().showCharacterSelect()
  }

  const handleLoadout = () => {
    console.log('🔫 Opening loadout...')
    engineRef.current?.getGameFlowManager().showLoadout()
  }

  const handleSettings = () => {
    console.log('⚙️ Opening settings...')
    engineRef.current?.getGameFlowManager().showSettings()
  }

  const handleLeaderboards = () => {
    console.log('🏆 Opening leaderboards...')
    engineRef.current?.getGameFlowManager().showLeaderboards()
  }

  const handleResume = () => {
    console.log('▶️ Resuming game...')
    engineRef.current?.getGameFlowManager().resumeGame()
  }

  const handleLeaveMatch = () => {
    console.log('🚪 Leaving match...')
    engineRef.current?.getGameFlowManager().leaveMatch()
  }

  const handleCharacterSelected = (character: PlayableCharacter) => {
    console.log(`👤 Character selected: ${character.displayName}`)
    engineRef.current?.getGameFlowManager().selectCharacter(character)
    engineRef.current?.getGameFlowManager().goBack()
  }

  const handleSettingsChange = (newSettings: GameSettings) => {
    console.log('⚙️ Settings changed')
    engineRef.current?.getGameFlowManager().updateSettings(newSettings)
  }

  const handleMatchSummaryContinue = () => {
    console.log('✅ Continue from match summary')
    engineRef.current?.getGameFlowManager().showMainMenu()
  }

  const handleCloseUI = () => {
    console.log('❌ Closing UI')
    engineRef.current?.getGameFlowManager().goBack()
  }

  const handleSkipKillCam = () => {
    setShowKillCam(false)
    setKillCamData(null)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Game Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#000'
        }}
      />

      {/* Kill Feed (Always visible in-game) */}
      {gameState === 'inGame' && <KillFeedUI />}

      {/* Kill Cam Overlay */}
      {showKillCam && killCamData && (
        <KillCamUI killCam={killCamData} onSkip={handleSkipKillCam} />
      )}

      {/* UI Overlays */}
      {gameState === 'mainMenu' && uiData && (
        <MainMenuUI
          playerLevel={uiData.playerLevel}
          playerXP={uiData.playerXP}
          playerName={uiData.playerName}
          selectedCharacter={uiData.selectedCharacter}
          onStartGame={handleStartGame}
          onCharacterSelect={handleCharacterSelect}
          onLoadout={handleLoadout}
          onSettings={handleSettings}
          onLeaderboards={handleLeaderboards}
        />
      )}

      {gameState === 'paused' && uiData && (
        <InGameMenuUI
          onResume={handleResume}
          onLoadout={handleLoadout}
          onCharacterSelect={handleCharacterSelect}
          onSettings={handleSettings}
          onLeaveMatch={handleLeaveMatch}
          matchTime={uiData.matchTime}
          kills={uiData.stats.kills}
          deaths={uiData.stats.deaths}
          score={uiData.stats.score}
        />
      )}

      {gameState === 'settings' && uiData && (
        <SettingsMenuUI
          onClose={handleCloseUI}
          settings={uiData.settings}
          onSettingsChange={handleSettingsChange}
        />
      )}

      {gameState === 'matchSummary' && uiData && (
        <MatchSummaryUI
          stats={uiData.stats}
          victory={uiData.victory}
          matchDuration={uiData.matchTime}
          onContinue={handleMatchSummaryContinue}
        />
      )}

      {gameState === 'characterSelect' && uiData && (
        <CharacterSelectionUI
          playerLevel={uiData.playerLevel}
          onSelect={handleCharacterSelected}
          onClose={handleCloseUI}
          initialCharacter={uiData.selectedCharacter}
        />
      )}

      {gameState === 'loadout' && uiData && (
        <WeaponLoadoutUI
          weaponProgressionManager={uiData.weaponProgressionManager}
          availableWeapons={uiData.availableWeapons}
          onClose={handleCloseUI}
        />
      )}

      {gameState === 'leaderboards' && uiData && (
        <LeaderboardUI
          weaponProgressionManager={uiData.weaponProgressionManager}
          playerLevel={uiData.playerLevel}
          playerStats={uiData.stats}
          onClose={handleCloseUI}
        />
      )}
    </div>
  )
}

export default UltimateFPSGame

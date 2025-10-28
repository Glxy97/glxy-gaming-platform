export interface GameMode {
  id: string
  name: string
  description: string
  maxPlayers: number
  teamBased: boolean
  timeLimit: number // in seconds
  scoreLimit: number
  rules: GameModeRules
}

export interface GameModeRules {
  friendlyFire: boolean
  respawnEnabled: boolean
  respawnTime: number
  weaponPickup: boolean
  healthRegeneration: boolean
  scorePerKill: number
  scorePerAssist: number
  scorePerDeath: number
}

export interface GameState {
  mode: GameMode
  timeRemaining: number
  scores: Map<string, number>
  teams: Map<string, string>
  isActive: boolean
  isPaused: boolean
  roundNumber: number
  matchStartTime: number
}

export class GameModeManager {
  private gameModes: Map<string, GameMode> = new Map()
  private currentGame: GameState | null = null
  private onGameEnd: ((winner: string, finalScores: Map<string, number>) => void) | null = null
  private onScoreChange: ((playerId: string, newScore: number) => void) | null = null

  constructor() {
    this.initializeGameModes()
  }

  private initializeGameModes(): void {
    // Free For All - Every player for themselves
    const freeForAll: GameMode = {
      id: 'ffa',
      name: 'Free For All',
      description: 'Jeder gegen jeden. Der Spieler mit den meisten Kills gewinnt.',
      maxPlayers: 8,
      teamBased: false,
      timeLimit: 600, // 10 minutes
      scoreLimit: 50,
      rules: {
        friendlyFire: false,
        respawnEnabled: true,
        respawnTime: 5,
        weaponPickup: true,
        healthRegeneration: false,
        scorePerKill: 1,
        scorePerAssist: 0,
        scorePerDeath: 0
      }
    }

    // Team Deathmatch - Two teams compete
    const teamDeathmatch: GameMode = {
      id: 'tdm',
      name: 'Team Deathmatch',
      description: 'Zwei Teams kämpfen gegeneinander. Das Team mit den meisten Kills gewinnt.',
      maxPlayers: 10,
      teamBased: true,
      timeLimit: 900, // 15 minutes
      scoreLimit: 100,
      rules: {
        friendlyFire: false,
        respawnEnabled: true,
        respawnTime: 8,
        weaponPickup: true,
        healthRegeneration: false,
        scorePerKill: 1,
        scorePerAssist: 0,
        scorePerDeath: 0
      }
    }

    // Survival - Players fight against waves of enemies
    const survival: GameMode = {
      id: 'survival',
      name: 'Überleben',
      description: 'Kämpfe gegen Wellen von Gegnern. Wie lange kannst du überleben?',
      maxPlayers: 4,
      teamBased: true,
      timeLimit: 0, // No time limit
      scoreLimit: 0, // No score limit
      rules: {
        friendlyFire: false,
        respawnEnabled: false,
        respawnTime: 0,
        weaponPickup: true,
        healthRegeneration: true,
        scorePerKill: 1,
        scorePerAssist: 0,
        scorePerDeath: -1
      }
    }

    // Capture the Flag - Teams try to capture enemy flags
    const captureTheFlag: GameMode = {
      id: 'ctf',
      name: 'Flagge erobern',
      description: 'Erobere die gegnerische Flagge und bring sie zu deiner Basis.',
      maxPlayers: 12,
      teamBased: true,
      timeLimit: 1200, // 20 minutes
      scoreLimit: 5,
      rules: {
        friendlyFire: false,
        respawnEnabled: true,
        respawnTime: 10,
        weaponPickup: true,
        healthRegeneration: false,
        scorePerKill: 0,
        scorePerAssist: 0,
        scorePerDeath: 0
      }
    }

    // King of the Hill - Control a central area
    const kingOfTheHill: GameMode = {
      id: 'koth',
      name: 'König des Hügels',
      description: 'Halte die zentrale Zone so lange wie möglich kontrolliert.',
      maxPlayers: 8,
      teamBased: true,
      timeLimit: 600, // 10 minutes
      scoreLimit: 200, // Points for controlling zone
      rules: {
        friendlyFire: false,
        respawnEnabled: true,
        respawnTime: 6,
        weaponPickup: true,
        healthRegeneration: false,
        scorePerKill: 1,
        scorePerAssist: 0,
        scorePerDeath: 0
      }
    }

    this.gameModes.set('ffa', freeForAll)
    this.gameModes.set('tdm', teamDeathmatch)
    this.gameModes.set('survival', survival)
    this.gameModes.set('ctf', captureTheFlag)
    this.gameModes.set('koth', kingOfTheHill)
  }

  public startGame(modeId: string, players: string[]): boolean {
    const gameMode = this.gameModes.get(modeId)
    if (!gameMode) {
      console.error(`Game mode ${modeId} not found`)
      return false
    }

    if (players.length > gameMode.maxPlayers) {
      console.error(`Too many players for mode ${modeId}. Max: ${gameMode.maxPlayers}`)
      return false
    }

    // Initialize game state
    this.currentGame = {
      mode: gameMode,
      timeRemaining: gameMode.timeLimit,
      scores: new Map(),
      teams: new Map(),
      isActive: true,
      isPaused: false,
      roundNumber: 1,
      matchStartTime: Date.now()
    }

    // Initialize player scores
    players.forEach(playerId => {
      this.currentGame!.scores.set(playerId, 0)
    })

    // Assign teams if team-based mode
    if (gameMode.teamBased) {
      this.assignTeams(players)
    }

    console.log(`Started game mode: ${gameMode.name} with ${players.length} players`)
    return true
  }

  private assignTeams(players: string[]): void {
    if (!this.currentGame) return

    const teamCount = 2 // For now, always 2 teams
    players.forEach((playerId, index) => {
      const teamId = `team_${(index % teamCount) + 1}`
      this.currentGame!.teams.set(playerId, teamId)
    })
  }

  public update(deltaTime: number): void {
    if (!this.currentGame || !this.currentGame.isActive || this.currentGame.isPaused) {
      return
    }

    // Update time remaining
    if (this.currentGame.mode.timeLimit > 0) {
      this.currentGame.timeRemaining -= deltaTime
      if (this.currentGame.timeRemaining <= 0) {
        this.endGame('Time limit reached')
        return
      }
    }

    // Check score limit
    if (this.currentGame.mode.scoreLimit > 0) {
      for (const [playerId, score] of this.currentGame.scores) {
        if (score >= this.currentGame.mode.scoreLimit) {
          this.endGame(playerId)
          return
        }
      }

      // Check team scores for team-based modes
      if (this.currentGame.mode.teamBased) {
        const teamScores = this.calculateTeamScores()
        for (const [teamId, score] of teamScores) {
          if (score >= this.currentGame.mode.scoreLimit) {
            this.endGame(teamId)
            return
          }
        }
      }
    }
  }

  private calculateTeamScores(): Map<string, number> {
    if (!this.currentGame) return new Map()

    const teamScores = new Map<string, number>()
    
    this.currentGame.scores.forEach((score, playerId) => {
      const teamId = this.currentGame!.teams.get(playerId)
      if (teamId) {
        teamScores.set(teamId, (teamScores.get(teamId) || 0) + score)
      }
    })

    return teamScores
  }

  public onPlayerKill(killerId: string, victimId: string, assisters: string[] = []): void {
    if (!this.currentGame || !this.currentGame.isActive) return

    const rules = this.currentGame.mode.rules

    // Award kill score
    const killerScore = this.currentGame.scores.get(killerId) || 0
    const newKillerScore = killerScore + rules.scorePerKill
    this.currentGame.scores.set(killerId, newKillerScore)

    // Award assist scores
    assisters.forEach(assisterId => {
      const assistScore = this.currentGame!.scores.get(assisterId) || 0
      const newAssistScore = assistScore + rules.scorePerAssist
      this.currentGame!.scores.set(assisterId, newAssistScore)
    })

    // Apply death penalty
    const victimScore = this.currentGame.scores.get(victimId) || 0
    const newVictimScore = Math.max(0, victimScore + rules.scorePerDeath)
    this.currentGame.scores.set(victimId, newVictimScore)

    // Notify about score changes
    if (this.onScoreChange) {
      this.onScoreChange(killerId, newKillerScore)
      assisters.forEach(assisterId => {
        const assistScore = this.currentGame!.scores.get(assisterId) || 0
        this.onScoreChange!(assisterId, assistScore)
      })
      this.onScoreChange(victimId, newVictimScore)
    }

    console.log(`Kill: ${killerId} killed ${victimId}. Assistants: ${assisters.join(', ')}`)
  }

  public onPlayerScore(playerId: string, points: number, reason: string): void {
    if (!this.currentGame || !this.currentGame.isActive) return

    const currentScore = this.currentGame.scores.get(playerId) || 0
    const newScore = currentScore + points
    this.currentGame.scores.set(playerId, newScore)

    if (this.onScoreChange) {
      this.onScoreChange(playerId, newScore)
    }

    console.log(`Score: ${playerId} earned ${points} points for ${reason}`)
  }

  private endGame(winner: string): void {
    if (!this.currentGame) return

    this.currentGame.isActive = false
    console.log(`Game ended. Winner: ${winner}`)

    if (this.onGameEnd) {
      this.onGameEnd(winner, this.currentGame.scores)
    }
  }

  public pauseGame(): void {
    if (this.currentGame) {
      this.currentGame.isPaused = true
      console.log('Game paused')
    }
  }

  public resumeGame(): void {
    if (this.currentGame) {
      this.currentGame.isPaused = false
      console.log('Game resumed')
    }
  }

  public endCurrentGame(): void {
    if (this.currentGame) {
      this.currentGame.isActive = false
      console.log('Game ended by user')
    }
  }

  public getGameModes(): GameMode[] {
    return Array.from(this.gameModes.values())
  }

  public getCurrentGame(): GameState | null {
    return this.currentGame
  }

  public getPlayerScore(playerId: string): number {
    return this.currentGame?.scores.get(playerId) || 0
  }

  public getPlayerTeam(playerId: string): string | null {
    return this.currentGame?.teams.get(playerId) || null
  }

  public getLeaderboard(): Array<{ playerId: string; score: number; team?: string }> {
    if (!this.currentGame) return []

    return Array.from(this.currentGame.scores.entries())
      .map(([playerId, score]) => ({
        playerId,
        score,
        team: this.currentGame!.teams.get(playerId)
      }))
      .sort((a, b) => b.score - a.score)
  }

  public getTeamLeaderboard(): Array<{ teamId: string; score: number; players: string[] }> {
    if (!this.currentGame) return []

    const teamScores = new Map<string, { score: number; players: string[] }>()

    this.currentGame.scores.forEach((score, playerId) => {
      const teamId = this.currentGame!.teams.get(playerId)
      if (teamId) {
        if (!teamScores.has(teamId)) {
          teamScores.set(teamId, { score: 0, players: [] })
        }
        const teamData = teamScores.get(teamId)!
        teamData.score += score
        teamData.players.push(playerId)
      }
    })

    return Array.from(teamScores.entries())
      .map(([teamId, data]) => ({
        teamId,
        score: data.score,
        players: data.players
      }))
      .sort((a, b) => b.score - a.score)
  }

  public setGameEndCallback(callback: (winner: string, finalScores: Map<string, number>) => void): void {
    this.onGameEnd = callback
  }

  public setScoreChangeCallback(callback: (playerId: string, newScore: number) => void): void {
    this.onScoreChange = callback
  }

  public isGameActive(): boolean {
    return this.currentGame?.isActive || false
  }

  public isGamePaused(): boolean {
    return this.currentGame?.isPaused || false
  }

  public getTimeRemaining(): number {
    return this.currentGame?.timeRemaining || 0
  }

  public formatTimeRemaining(): string {
    const timeRemaining = this.getTimeRemaining()
    const minutes = Math.floor(timeRemaining / 60)
    const seconds = Math.floor(timeRemaining % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}
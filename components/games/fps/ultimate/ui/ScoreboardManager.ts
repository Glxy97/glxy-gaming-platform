/**
 * 📊 SCOREBOARD MANAGER
 * 
 * In-game scoreboard display (Hold Tab)
 * - Player List (Name, Kills, Deaths, Score)
 * - Team Separation (if team-based)
 * - Ping Indicator
 * - Sort by Score
 * - Real-time Updates
 */

export interface PlayerScore {
  id: string
  name: string
  kills: number
  deaths: number
  assists: number
  score: number
  ping: number
  team?: 'red' | 'blue'
  isLocalPlayer: boolean
}

export interface ScoreboardData {
  players: PlayerScore[]
  isTeamBased: boolean
  gameMode: string
  timeRemaining?: number
  scoreLimit?: number
  redTeamScore?: number
  blueTeamScore?: number
}

export class ScoreboardManager {
  private players: Map<string, PlayerScore> = new Map()
  private isTeamBased: boolean = false
  private gameMode: string = 'Free For All'
  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement, gameMode: string = 'Free For All', isTeamBased: boolean = false) {
    this.canvas = canvas
    this.gameMode = gameMode
    this.isTeamBased = isTeamBased
    console.log('📊 Scoreboard Manager initialized')
  }

  /**
   * Add or update player
   */
  updatePlayer(player: PlayerScore): void {
    this.players.set(player.id, player)
  }

  /**
   * Remove player
   */
  removePlayer(playerId: string): void {
    this.players.delete(playerId)
  }

  /**
   * Get sorted players
   */
  getSortedPlayers(): PlayerScore[] {
    const players = Array.from(this.players.values())
    
    if (this.isTeamBased) {
      // Sort by team first, then by score
      return players.sort((a, b) => {
        if (a.team !== b.team) {
          return a.team === 'red' ? -1 : 1
        }
        return b.score - a.score
      })
    } else {
      // Sort by score
      return players.sort((a, b) => b.score - a.score)
    }
  }

  /**
   * Get team scores
   */
  getTeamScores(): { red: number; blue: number } {
    let red = 0
    let blue = 0
    
    this.players.forEach(player => {
      if (player.team === 'red') red += player.score
      if (player.team === 'blue') blue += player.score
    })
    
    return { red, blue }
  }

  /**
   * Render scoreboard
   */
  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const players = this.getSortedPlayers()
    
    ctx.save()
    
    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    const boardWidth = Math.min(800, width * 0.8)
    const boardHeight = Math.min(600, height * 0.8)
    const x = (width - boardWidth) / 2
    const y = (height - boardHeight) / 2
    
    ctx.fillRect(x, y, boardWidth, boardHeight)
    
    // Border
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, boardWidth, boardHeight)
    
    // Title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(this.gameMode.toUpperCase(), width / 2, y + 50)
    
    // Team Scores (if team-based)
    if (this.isTeamBased) {
      const teamScores = this.getTeamScores()
      
      ctx.font = 'bold 24px Arial'
      ctx.fillStyle = '#ff4444'
      ctx.fillText(`RED: ${teamScores.red}`, x + boardWidth * 0.25, y + 90)
      
      ctx.fillStyle = '#4444ff'
      ctx.fillText(`BLUE: ${teamScores.blue}`, x + boardWidth * 0.75, y + 90)
    }
    
    // Column Headers
    const headerY = y + (this.isTeamBased ? 130 : 100)
    this.renderHeaders(ctx, x, headerY, boardWidth)
    
    // Player Rows
    let rowY = headerY + 40
    const rowHeight = 35
    
    players.forEach((player, index) => {
      this.renderPlayerRow(ctx, player, x, rowY, boardWidth, index)
      rowY += rowHeight
    })
    
    // Footer
    ctx.fillStyle = '#999999'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Press TAB to close', width / 2, y + boardHeight - 20)
    
    ctx.restore()
  }

  /**
   * Render column headers
   */
  private renderHeaders(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    ctx.fillStyle = '#00ff88'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'left'
    
    const padding = 20
    
    // Team indicator (if team-based)
    if (this.isTeamBased) {
      ctx.fillText('TEAM', x + padding, y)
    }
    
    // Player name
    ctx.fillText('PLAYER', x + (this.isTeamBased ? 80 : padding), y)
    
    // Stats
    ctx.textAlign = 'center'
    const statsStartX = x + width * 0.6
    const statSpacing = (width * 0.4 - 40) / 4
    
    ctx.fillText('K', statsStartX + statSpacing * 0, y)
    ctx.fillText('D', statsStartX + statSpacing * 1, y)
    ctx.fillText('A', statsStartX + statSpacing * 2, y)
    ctx.fillText('SCORE', statsStartX + statSpacing * 3, y)
    ctx.fillText('PING', statsStartX + statSpacing * 4, y)
    
    // Underline
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x + 10, y + 10)
    ctx.lineTo(x + width - 10, y + 10)
    ctx.stroke()
  }

  /**
   * Render player row
   */
  private renderPlayerRow(
    ctx: CanvasRenderingContext2D,
    player: PlayerScore,
    x: number,
    y: number,
    width: number,
    index: number
  ): void {
    // Alternating row background
    if (index % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.fillRect(x + 10, y - 20, width - 20, 32)
    }
    
    // Highlight local player
    if (player.isLocalPlayer) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.2)'
      ctx.fillRect(x + 10, y - 20, width - 20, 32)
      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 2
      ctx.strokeRect(x + 10, y - 20, width - 20, 32)
    }
    
    const padding = 20
    
    // Team indicator
    if (this.isTeamBased && player.team) {
      ctx.fillStyle = player.team === 'red' ? '#ff4444' : '#4444ff'
      ctx.fillRect(x + padding, y - 15, 40, 22)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(player.team.toUpperCase(), x + padding + 20, y)
    }
    
    // Player name
    ctx.fillStyle = player.isLocalPlayer ? '#00ff88' : '#ffffff'
    ctx.font = player.isLocalPlayer ? 'bold 16px Arial' : '16px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(player.name, x + (this.isTeamBased ? 80 : padding), y)
    
    // Stats
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    
    const statsStartX = x + width * 0.6
    const statSpacing = (width * 0.4 - 40) / 4
    
    ctx.fillText(player.kills.toString(), statsStartX + statSpacing * 0, y)
    ctx.fillText(player.deaths.toString(), statsStartX + statSpacing * 1, y)
    ctx.fillText(player.assists.toString(), statsStartX + statSpacing * 2, y)
    ctx.fillText(player.score.toString(), statsStartX + statSpacing * 3, y)
    
    // Ping (color-coded)
    const pingColor = player.ping < 50 ? '#00ff88' : player.ping < 100 ? '#ffaa00' : '#ff4444'
    ctx.fillStyle = pingColor
    ctx.fillText(player.ping.toString(), statsStartX + statSpacing * 4, y)
  }

  /**
   * Clear all players
   */
  clear(): void {
    this.players.clear()
  }

  /**
   * Get scoreboard data
   */
  getData(): ScoreboardData {
    const teamScores = this.getTeamScores()
    
    return {
      players: this.getSortedPlayers(),
      isTeamBased: this.isTeamBased,
      gameMode: this.gameMode,
      redTeamScore: this.isTeamBased ? teamScores.red : undefined,
      blueTeamScore: this.isTeamBased ? teamScores.blue : undefined
    }
  }

  /**
   * Set game mode
   */
  setGameMode(gameMode: string, isTeamBased: boolean): void {
    this.gameMode = gameMode
    this.isTeamBased = isTeamBased
  }
}


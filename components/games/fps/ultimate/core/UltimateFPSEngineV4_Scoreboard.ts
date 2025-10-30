/**
 * 📊 SCOREBOARD UPDATE HELPER
 * 
 * Helper method for UltimateFPSEngineV4 to update scoreboard
 * (Separate file to avoid circular dependencies)
 */

export function updateScoreboardForEngine(engine: any): void {
  // Update player (local player)
  engine.scoreboardManager.updatePlayer({
    id: 'player',
    name: 'PLAYER',
    kills: engine.gameState.kills || 0,
    deaths: engine.gameState.deaths || 0,
    assists: engine.gameState.assists || 0,
    score: engine.gameState.score || 0,
    ping: 0,
    isLocalPlayer: true
  })

  // Update AI enemies as players (for demo)
  engine.enemies.forEach((enemy: any, index: number) => {
    if (enemy.health > 0) {
      engine.scoreboardManager.updatePlayer({
        id: enemy.id,
        name: `AI ${index + 1}`,
        kills: Math.floor(Math.random() * 5),
        deaths: Math.floor(Math.random() * 3),
        assists: Math.floor(Math.random() * 2),
        score: Math.floor(Math.random() * 500),
        ping: Math.floor(Math.random() * 100) + 10,
        isLocalPlayer: false
      })
    }
  })
}


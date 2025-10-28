// @ts-nocheck
/**
 * UNO Game Validator
 * Server-side validation for UNO game moves and logic
 */

export interface UnoCard {
  color: 'red' | 'blue' | 'green' | 'yellow' | 'wild'
  type: 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild_draw4'
  value?: number // For number cards
}

export interface UnoGameState {
  currentCard: UnoCard
  direction: 'clockwise' | 'counterclockwise'
  currentPlayer: string
  players: { id: string; handCount: number }[]
  drawCount: number
  deckCount: number
}

export interface UnoMove {
  card: UnoCard
  playerId: string
  selectedColor?: 'red' | 'blue' | 'green' | 'yellow' // For wild cards
}

export interface ValidationResult {
  valid: boolean
  reason?: string
  correctedMove?: UnoMove
}

export class UnoValidator {
  /**
   * Validate a UNO move
   */
  static validateMove(move: UnoMove, gameState: UnoGameState, playerHand: UnoCard[]): ValidationResult {
    try {
      // Validate player turn
      if (move.playerId !== gameState.currentPlayer) {
        return { valid: false, reason: 'Not your turn' }
      }

      // Validate card is in player's hand
      if (!this.isCardInHand(move.card, playerHand)) {
        return { valid: false, reason: 'Card not in hand' }
      }

      // Validate card can be played
      if (!this.canPlayCard(move.card, gameState.currentCard)) {
        return { valid: false, reason: 'Card cannot be played' }
      }

      // Validate wild card color selection
      if (this.isWildCard(move.card) && !move.selectedColor) {
        return { valid: false, reason: 'Wild card requires color selection' }
      }

      // Validate non-wild cards don't have color selection
      if (!this.isWildCard(move.card) && move.selectedColor) {
        return { valid: false, reason: 'Non-wild cards cannot have color selection' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, reason: 'Validation error: ' + error }
    }
  }

  /**
   * Check if card is in player's hand
   */
  private static isCardInHand(card: UnoCard, hand: UnoCard[]): boolean {
    return hand.some(handCard => 
      handCard.color === card.color &&
      handCard.type === card.type &&
      handCard.value === card.value
    )
  }

  /**
   * Check if card can be played
   */
  private static canPlayCard(card: UnoCard, currentCard: UnoCard): boolean {
    // Wild cards can always be played
    if (this.isWildCard(card)) {
      return true
    }

    // Same color
    if (card.color === currentCard.color) {
      return true
    }

    // Same type (for action cards)
    if (card.type === currentCard.type) {
      return true
    }

    // Same number (for number cards)
    if (card.type === 'number' && currentCard.type === 'number' && card.value === currentCard.value) {
      return true
    }

    return false
  }

  /**
   * Check if card is a wild card
   */
  private static isWildCard(card: UnoCard): boolean {
    return card.type === 'wild' || card.type === 'wild_draw4'
  }

  /**
   * Apply move to game state
   */
  static applyMove(gameState: UnoGameState, move: UnoMove): UnoGameState {
    const newState = { ...gameState }

    // Update current card
    newState.currentCard = move.card

    // Handle wild card color selection
    if (this.isWildCard(move.card) && move.selectedColor) {
      newState.currentCard.color = move.selectedColor
    }

    // Handle special cards
    switch (move.card.type) {
      case 'reverse':
        newState.direction = newState.direction === 'clockwise' ? 'counterclockwise' : 'clockwise'
        break
      case 'draw2':
        newState.drawCount = 2
        break
      case 'wild_draw4':
        newState.drawCount = 4
        break
      case 'skip':
        // Skip handled in turn management
        break
    }

    return newState
  }

  /**
   * Get next player
   */
  static getNextPlayer(gameState: UnoGameState, skipCount: number = 0): string {
    const currentIndex = gameState.players.findIndex(p => p.id === gameState.currentPlayer)
    const direction = gameState.direction === 'clockwise' ? 1 : -1
    const skipOffset = skipCount * direction
    
    let nextIndex = currentIndex + direction + skipOffset
    
    // Wrap around
    if (nextIndex >= gameState.players.length) {
      nextIndex = nextIndex - gameState.players.length
    } else if (nextIndex < 0) {
      nextIndex = gameState.players.length + nextIndex
    }

    return gameState.players[nextIndex].id
  }

  /**
   * Update player hand count
   */
  static updatePlayerHandCount(gameState: UnoGameState, playerId: string, change: number): UnoGameState {
    const newState = { ...gameState }
    newState.players = gameState.players.map(player => 
      player.id === playerId 
        ? { ...player, handCount: Math.max(0, player.handCount + change) }
        : player
    )
    return newState
  }

  /**
   * Check if player has UNO (1 card left)
   */
  static hasUno(playerHandCount: number): boolean {
    return playerHandCount === 1
  }

  /**
   * Check if player won (0 cards left)
   */
  static hasWon(playerHandCount: number): boolean {
    return playerHandCount === 0
  }

  /**
   * Validate draw card action
   */
  static validateDrawCard(playerId: string, gameState: UnoGameState, cardCount: number = 1): ValidationResult {
    if (playerId !== gameState.currentPlayer) {
      return { valid: false, reason: 'Not your turn' }
    }

    if (cardCount < 1 || cardCount > 10) {
      return { valid: false, reason: 'Invalid card count' }
    }

    if (gameState.deckCount < cardCount) {
      return { valid: false, reason: 'Not enough cards in deck' }
    }

    return { valid: true }
  }

  /**
   * Validate game state
   */
  static validateGameState(gameState: UnoGameState): ValidationResult {
    // Check if current player exists
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)
    if (!currentPlayer) {
      return { valid: false, reason: 'Current player not found' }
    }

    // Check if current player has cards
    if (currentPlayer.handCount <= 0) {
      return { valid: false, reason: 'Current player has no cards' }
    }

    // Validate draw count
    if (gameState.drawCount < 0) {
      return { valid: false, reason: 'Invalid draw count' }
    }

    // Validate deck count
    if (gameState.deckCount < 0) {
      return { valid: false, reason: 'Invalid deck count' }
    }

    return { valid: true }
  }

  /**
   * Check if game is over
   */
  static isGameOver(gameState: UnoGameState): boolean {
    return gameState.players.some(player => player.handCount === 0)
  }

  /**
   * Get winner
   */
  static getWinner(gameState: UnoGameState): string | null {
    const winner = gameState.players.find(player => player.handCount === 0)
    return winner ? winner.id : null
  }

  /**
   * Calculate score for a hand
   */
  static calculateHandScore(hand: UnoCard[]): number {
    let score = 0

    for (const card of hand) {
      switch (card.type) {
        case 'number':
          score += card.value || 0
          break
        case 'skip':
        case 'reverse':
        case 'draw2':
          score += 20
          break
        case 'wild':
        case 'wild_draw4':
          score += 50
          break
      }
    }

    return score
  }

  /**
   * Generate valid moves for a player
   */
  static getValidMoves(playerHand: UnoCard[], currentCard: UnoCard): UnoCard[] {
    return playerHand.filter(card => this.canPlayCard(card, currentCard))
  }

  /**
   * Check if player must draw cards
   */
  static mustDrawCards(gameState: UnoGameState): boolean {
    return gameState.drawCount > 0
  }

  /**
   * Reset draw count
   */
  static resetDrawCount(gameState: UnoGameState): UnoGameState {
    return { ...gameState, drawCount: 0 }
  }

  /**
   * Validate card structure
   */
  static validateCard(card: UnoCard): ValidationResult {
    const validColors = ['red', 'blue', 'green', 'yellow', 'wild']
    const validTypes = ['number', 'skip', 'reverse', 'draw2', 'wild', 'wild_draw4']

    if (!validColors.includes(card.color)) {
      return { valid: false, reason: 'Invalid card color' }
    }

    if (!validTypes.includes(card.type)) {
      return { valid: false, reason: 'Invalid card type' }
    }

    if (card.type === 'number' && (card.value === undefined || card.value < 0 || card.value > 9)) {
      return { valid: false, reason: 'Invalid number card value' }
    }

    if (card.type !== 'number' && card.value !== undefined) {
      return { valid: false, reason: 'Non-number cards cannot have values' }
    }

    return { valid: true }
  }
}

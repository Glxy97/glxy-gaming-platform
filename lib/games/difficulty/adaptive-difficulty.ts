// @ts-nocheck
export interface PlayerProfile {
  id: string
  name: string
  skillLevel: number
  playStyle: 'aggressive' | 'defensive' | 'balanced' | 'tactical'
  preferredWeapons: string[]
  accuracy: number
  reactionTime: number
  survivalRate: number
  killDeathRatio: number
  objectivesCompleted: number
  timePlayed: number
  adaptability: number
}

export interface DifficultySettings {
  enemyHealth: number
  enemyDamage: number
  enemySpeed: number
  enemyAccuracy: number
  enemyCount: number
  spawnRate: number
  resourceAvailability: number
  objectiveDifficulty: number
  environmentalHazards: number
  aiIntelligence: number
}

export interface PerformanceMetrics {
  recentKills: number[]
  recentDeaths: number[]
  hitAccuracy: number[]
  reactionTimes: number[]
  survivalTimes: number[]
  objectiveCompletionTimes: number[]
  weaponUsage: Map<string, number>
  tacticalDecisions: number[]
}

export class AdaptiveDifficultySystem {
  private playerProfile: PlayerProfile
  private currentDifficulty: number = 1.0
  private difficultySettings: DifficultySettings
  private performanceMetrics: PerformanceMetrics
  private adaptationHistory: AdaptationEvent[]
  private predictiveModel: PredictiveDifficultyModel
  private dynamicBalancer: DynamicDifficultyBalancer
  
  constructor(initialProfile?: Partial<PlayerProfile>) {
    this.playerProfile = {
      id: 'player_1',
      name: 'Player',
      skillLevel: 0.5,
      playStyle: 'balanced',
      preferredWeapons: [],
      accuracy: 0.5,
      reactionTime: 500,
      survivalRate: 0.5,
      killDeathRatio: 1.0,
      objectivesCompleted: 0,
      timePlayed: 0,
      adaptability: 0.5,
      ...initialProfile
    }
    
    this.performanceMetrics = this.initializeMetrics()
    this.difficultySettings = this.initializeDifficultySettings()
    this.adaptationHistory = []
    this.predictiveModel = new PredictiveDifficultyModel()
    this.dynamicBalancer = new DynamicDifficultyBalancer()
  }
  
  private initializeMetrics(): PerformanceMetrics {
    return {
      recentKills: [],
      recentDeaths: [],
      hitAccuracy: [],
      reactionTimes: [],
      survivalTimes: [],
      objectiveCompletionTimes: [],
      weaponUsage: new Map(),
      tacticalDecisions: []
    }
  }
  
  private initializeDifficultySettings(): DifficultySettings {
    return {
      enemyHealth: 1.0,
      enemyDamage: 1.0,
      enemySpeed: 1.0,
      enemyAccuracy: 0.5,
      enemyCount: 1.0,
      spawnRate: 1.0,
      resourceAvailability: 1.0,
      objectiveDifficulty: 1.0,
      environmentalHazards: 0.5,
      aiIntelligence: 0.5
    }
  }
  
  public updatePerformance(metrics: Partial<PerformanceMetrics>): void {
    // Update performance metrics
    if (metrics.recentKills) {
      this.performanceMetrics.recentKills.push(...metrics.recentKills)
      this.performanceMetrics.recentKills = this.performanceMetrics.recentKills.slice(-20)
    }
    
    if (metrics.recentDeaths) {
      this.performanceMetrics.recentDeaths.push(...metrics.recentDeaths)
      this.performanceMetrics.recentDeaths = this.performanceMetrics.recentDeaths.slice(-10)
    }
    
    if (metrics.hitAccuracy) {
      this.performanceMetrics.hitAccuracy.push(...metrics.hitAccuracy)
      this.performanceMetrics.hitAccuracy = this.performanceMetrics.hitAccuracy.slice(-50)
    }
    
    if (metrics.reactionTimes) {
      this.performanceMetrics.reactionTimes.push(...metrics.reactionTimes)
      this.performanceMetrics.reactionTimes = this.performanceMetrics.reactionTimes.slice(-30)
    }
    
    if (metrics.survivalTimes) {
      this.performanceMetrics.survivalTimes.push(...metrics.survivalTimes)
      this.performanceMetrics.survivalTimes = this.performanceMetrics.survivalTimes.slice(-10)
    }
    
    if (metrics.objectiveCompletionTimes) {
      this.performanceMetrics.objectiveCompletionTimes.push(...metrics.objectiveCompletionTimes)
      this.performanceMetrics.objectiveCompletionTimes = this.performanceMetrics.objectiveCompletionTimes.slice(-15)
    }
    
    if (metrics.weaponUsage) {
      metrics.weaponUsage.forEach((count, weapon) => {
        this.performanceMetrics.weaponUsage.set(weapon, count)
      })
    }
    
    if (metrics.tacticalDecisions) {
      this.performanceMetrics.tacticalDecisions.push(...metrics.tacticalDecisions)
      this.performanceMetrics.tacticalDecisions = this.performanceMetrics.tacticalDecisions.slice(-25)
    }
    
    // Update player profile based on new metrics
    this.updatePlayerProfile()
    
    // Adapt difficulty based on performance
    this.adaptDifficulty()
  }
  
  private updatePlayerProfile(): void {
    // Calculate skill level based on performance
    const skillFactors = this.calculateSkillFactors()
    this.playerProfile.skillLevel = this.calculateOverallSkill(skillFactors)
    
    // Update play style based on behavior patterns
    this.playerProfile.playStyle = this.analyzePlayStyle()
    
    // Update specific attributes
    this.playerProfile.accuracy = this.calculateAccuracy()
    this.playerProfile.reactionTime = this.calculateReactionTime()
    this.playerProfile.survivalRate = this.calculateSurvivalRate()
    this.playerProfile.killDeathRatio = this.calculateKillDeathRatio()
    this.playerProfile.adaptability = this.calculateAdaptability()
  }
  
  private calculateSkillFactors(): SkillFactors {
    const recentKills = this.performanceMetrics.recentKills
    const recentDeaths = this.performanceMetrics.recentDeaths
    const hitAccuracy = this.performanceMetrics.hitAccuracy
    const survivalTimes = this.performanceMetrics.survivalTimes
    const objectiveCompletions = this.performanceMetrics.objectiveCompletionTimes.length
    
    return {
      combatEffectiveness: this.calculateCombatEffectiveness(recentKills, recentDeaths),
      accuracy: hitAccuracy.length > 0 ? hitAccuracy.reduce((a, b) => a + b, 0) / hitAccuracy.length : 0.5,
      survival: survivalTimes.length > 0 ? survivalTimes.reduce((a, b) => a + b, 0) / survivalTimes.length : 300,
      objectiveCompletion: objectiveCompletions / Math.max(1, objectiveCompletions + 5),
      consistency: this.calculateConsistency()
    }
  }
  
  private calculateOverallSkill(factors: SkillFactors): number {
    const weights = {
      combatEffectiveness: 0.3,
      accuracy: 0.25,
      survival: 0.2,
      objectiveCompletion: 0.15,
      consistency: 0.1
    }
    
    return (
      factors.combatEffectiveness * weights.combatEffectiveness +
      factors.accuracy * weights.accuracy +
      (Math.min(factors.survival / 600, 1)) * weights.survival +
      factors.objectiveCompletion * weights.objectiveCompletion +
      factors.consistency * weights.consistency
    )
  }
  
  private calculateCombatEffectiveness(kills: number[], deaths: number[]): number {
    const totalKills = kills.reduce((a, b) => a + b, 0)
    const totalDeaths = deaths.reduce((a, b) => a + b, 0)
    const kdr = totalDeaths > 0 ? totalKills / totalDeaths : totalKills
    
    return Math.min(1, kdr / 2) // Normalize to 0-1 range
  }
  
  private calculateConsistency(): number {
    const allMetrics = [
      ...this.performanceMetrics.hitAccuracy,
      ...this.performanceMetrics.reactionTimes.map(rt => 1 / Math.max(rt, 100)),
      ...this.performanceMetrics.survivalTimes.map(st => Math.min(st / 600, 1))
    ]
    
    if (allMetrics.length === 0) return 0.5
    
    const mean = allMetrics.reduce((a, b) => a + b, 0) / allMetrics.length
    const variance = allMetrics.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / allMetrics.length
    const standardDeviation = Math.sqrt(variance)
    
    // Lower standard deviation = higher consistency
    return Math.max(0, 1 - standardDeviation)
  }
  
  private analyzePlayStyle(): 'aggressive' | 'defensive' | 'balanced' | 'tactical' {
    const factors = this.calculatePlayStyleFactors()
    
    if (factors.aggression > 0.7 && factors.defense < 0.4) {
      return 'aggressive'
    } else if (factors.defense > 0.7 && factors.aggression < 0.4) {
      return 'defensive'
    } else if (factors.tactics > 0.6) {
      return 'tactical'
    } else {
      return 'balanced'
    }
  }
  
  private calculatePlayStyleFactors(): PlayStyleFactors {
    const recentKills = this.performanceMetrics.recentKills
    const recentDeaths = this.performanceMetrics.recentDeaths
    const survivalTimes = this.performanceMetrics.survivalTimes
    const tacticalDecisions = this.performanceMetrics.tacticalDecisions
    
    const aggression = recentKills.length > 0 ? 
      recentKills.reduce((a, b) => a + b, 0) / Math.max(1, recentKills.length + recentDeaths.length) : 0.5
    
    const defense = survivalTimes.length > 0 ?
      Math.min(survivalTimes.reduce((a, b) => a + b, 0) / survivalTimes.length / 600, 1) : 0.5
    
    const tactics = tacticalDecisions.length > 0 ?
      tacticalDecisions.reduce((a, b) => a + b, 0) / tacticalDecisions.length : 0.5
    
    return { aggression, defense, tactics }
  }
  
  private calculateAccuracy(): number {
    const accuracies = this.performanceMetrics.hitAccuracy
    if (accuracies.length === 0) return 0.5
    
    return Math.min(1, accuracies.reduce((a, b) => a + b, 0) / accuracies.length)
  }
  
  private calculateReactionTime(): number {
    const reactionTimes = this.performanceMetrics.reactionTimes
    if (reactionTimes.length === 0) return 500
    
    return reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
  }
  
  private calculateSurvivalRate(): number {
    const survivalTimes = this.performanceMetrics.survivalTimes
    if (survivalTimes.length === 0) return 0.5
    
    const avgSurvivalTime = survivalTimes.reduce((a, b) => a + b, 0) / survivalTimes.length
    return Math.min(1, avgSurvivalTime / 600) // Normalize to 600 seconds = 100%
  }
  
  private calculateKillDeathRatio(): number {
    const kills = this.performanceMetrics.recentKills.reduce((a, b) => a + b, 0)
    const deaths = this.performanceMetrics.recentDeaths.reduce((a, b) => a + b, 0)
    
    return deaths > 0 ? kills / deaths : kills
  }
  
  private calculateAdaptability(): number {
    // Measure how quickly the player adapts to difficulty changes
    const adaptations = this.adaptationHistory.slice(-10)
    if (adaptations.length === 0) return 0.5
    
    const improvementRate = adaptations.reduce((sum, event) => {
      return sum + (event.performanceAfter - event.performanceBefore)
    }, 0) / adaptations.length
    
    return Math.max(0, Math.min(1, 0.5 + improvementRate))
  }
  
  private adaptDifficulty(): void {
    const playerSkill = this.playerProfile.skillLevel
    const recentPerformance = this.calculateRecentPerformance()
    const predictedPerformance = this.predictiveModel.predictPerformance(
      this.playerProfile, 
      this.currentDifficulty
    )
    
    // Calculate target difficulty
    const targetDifficulty = this.dynamicBalancer.calculateTargetDifficulty(
      playerSkill,
      recentPerformance,
      predictedPerformance
    )
    
    // Apply smooth difficulty transitions
    const difficultyChange = (targetDifficulty - this.currentDifficulty) * 0.1
    this.currentDifficulty += difficultyChange
    
    // Clamp difficulty to reasonable bounds
    this.currentDifficulty = Math.max(0.1, Math.min(3.0, this.currentDifficulty))
    
    // Update difficulty settings based on current difficulty
    this.updateDifficultySettings()
    
    // Record adaptation event
    this.recordAdaptationEvent(recentPerformance, predictedPerformance)
  }
  
  private calculateRecentPerformance(): number {
    const weights = {
      accuracy: 0.3,
      survival: 0.3,
      combatEffectiveness: 0.25,
      objectives: 0.15
    }
    
    const accuracy = this.calculateAccuracy()
    const survival = this.calculateSurvivalRate()
    const combatEffectiveness = this.calculateCombatEffectiveness(
      this.performanceMetrics.recentKills,
      this.performanceMetrics.recentDeaths
    )
    const objectives = Math.min(1, this.performanceMetrics.objectiveCompletionTimes.length / 10)
    
    return (
      accuracy * weights.accuracy +
      survival * weights.survival +
      combatEffectiveness * weights.combatEffectiveness +
      objectives * weights.objectives
    )
  }
  
  private updateDifficultySettings(): void {
    const difficulty = this.currentDifficulty
    
    // Apply non-linear scaling for more dramatic effects at higher difficulties
    const healthMultiplier = 1 + (difficulty - 1) * 0.5
    const damageMultiplier = 1 + (difficulty - 1) * 0.3
    const speedMultiplier = 1 + (difficulty - 1) * 0.2
    const accuracyMultiplier = Math.min(0.95, 0.3 + difficulty * 0.2)
    const countMultiplier = 1 + (difficulty - 1) * 0.4
    const spawnMultiplier = 1 + (difficulty - 1) * 0.3
    const resourceMultiplier = Math.max(0.3, 1.5 - difficulty * 0.2)
    const hazardMultiplier = Math.min(1, difficulty * 0.3)
    const aiMultiplier = Math.min(1, difficulty * 0.4)
    
    this.difficultySettings = {
      enemyHealth: healthMultiplier,
      enemyDamage: damageMultiplier,
      enemySpeed: speedMultiplier,
      enemyAccuracy: accuracyMultiplier,
      enemyCount: countMultiplier,
      spawnRate: spawnMultiplier,
      resourceAvailability: resourceMultiplier,
      objectiveDifficulty: difficulty,
      environmentalHazards: hazardMultiplier,
      aiIntelligence: aiMultiplier
    }
  }
  
  private recordAdaptationEvent(recentPerformance: number, predictedPerformance: number): void {
    const event: AdaptationEvent = {
      timestamp: Date.now(),
      difficultyBefore: this.currentDifficulty,
      difficultyAfter: this.currentDifficulty,
      performanceBefore: recentPerformance,
      performanceAfter: recentPerformance,
      adaptationType: this.determineAdaptationType(recentPerformance, predictedPerformance),
      playerState: { ...this.playerProfile }
    }
    
    this.adaptationHistory.push(event)
    
    // Keep only recent history
    if (this.adaptationHistory.length > 50) {
      this.adaptationHistory = this.adaptationHistory.slice(-50)
    }
  }
  
  private determineAdaptationType(recentPerformance: number, predictedPerformance: number): AdaptationType {
    const performanceDifference = recentPerformance - predictedPerformance
    
    if (performanceDifference > 0.2) {
      return 'increase_difficulty'
    } else if (performanceDifference < -0.2) {
      return 'decrease_difficulty'
    } else {
      return 'maintain_difficulty'
    }
  }
  
  public getCurrentDifficultySettings(): DifficultySettings {
    return { ...this.difficultySettings }
  }
  
  public getPlayerProfile(): PlayerProfile {
    return { ...this.playerProfile }
  }
  
  public getAdaptationHistory(): AdaptationEvent[] {
    return [...this.adaptationHistory]
  }
  
  public predictOptimalDifficulty(): number {
    return this.predictiveModel.predictOptimalDifficulty(this.playerProfile)
  }
  
  public getDifficultyInsights(): DifficultyInsights {
    return {
      currentDifficulty: this.currentDifficulty,
      optimalDifficulty: this.predictOptimalDifficulty(),
      playerSkill: this.playerProfile.skillLevel,
      adaptationTrend: this.analyzeAdaptationTrend(),
      performanceStability: this.analyzePerformanceStability(),
      recommendations: this.generateRecommendations()
    }
  }
  
  private analyzeAdaptationTrend(): 'improving' | 'declining' | 'stable' {
    const recentAdaptations = this.adaptationHistory.slice(-10)
    if (recentAdaptations.length < 5) return 'stable'
    
    const trend = recentAdaptations.reduce((sum, event) => {
      return sum + (event.performanceAfter - event.performanceBefore)
    }, 0) / recentAdaptations.length
    
    if (trend > 0.05) return 'improving'
    if (trend < -0.05) return 'declining'
    return 'stable'
  }
  
  private analyzePerformanceStability(): 'stable' | 'volatile' | 'improving' | 'declining' {
    const performances = this.adaptationHistory.slice(-20).map(event => event.performanceAfter)
    if (performances.length < 10) return 'stable'
    
    const mean = performances.reduce((a, b) => a + b, 0) / performances.length
    const variance = performances.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / performances.length
    const standardDeviation = Math.sqrt(variance)
    
    if (standardDeviation < 0.1) return 'stable'
    if (standardDeviation > 0.3) return 'volatile'
    
    const trend = performances[performances.length - 1] - performances[0]
    if (trend > 0.1) return 'improving'
    if (trend < -0.1) return 'declining'
    
    return 'stable'
  }
  
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const insights = this.getDifficultyInsights()
    
    if (insights.currentDifficulty > insights.optimalDifficulty + 0.3) {
      recommendations.push('Consider reducing difficulty - player is struggling')
    } else if (insights.currentDifficulty < insights.optimalDifficulty - 0.3) {
      recommendations.push('Consider increasing difficulty - player is not challenged')
    }
    
    if (insights.adaptationTrend === 'declining') {
      recommendations.push('Player performance is declining - provide more resources or guidance')
    }
    
    if (insights.performanceStability === 'volatile') {
      recommendations.push('Player performance is inconsistent - consider more gradual difficulty changes')
    }
    
    if (this.playerProfile.accuracy < 0.4) {
      recommendations.push('Player has low accuracy - consider adding aim assistance')
    }
    
    if (this.playerProfile.survivalRate < 0.3) {
      recommendations.push('Player dies frequently - consider adding more health pickups')
    }
    
    return recommendations
  }
}

// Supporting classes and interfaces
interface SkillFactors {
  combatEffectiveness: number
  accuracy: number
  survival: number
  objectiveCompletion: number
  consistency: number
}

interface PlayStyleFactors {
  aggression: number
  defense: number
  tactics: number
}

interface AdaptationEvent {
  timestamp: number
  difficultyBefore: number
  difficultyAfter: number
  performanceBefore: number
  performanceAfter: number
  adaptationType: AdaptationType
  playerState: PlayerProfile
}

type AdaptationType = 'increase_difficulty' | 'decrease_difficulty' | 'maintain_difficulty'

interface DifficultyInsights {
  currentDifficulty: number
  optimalDifficulty: number
  playerSkill: number
  adaptationTrend: 'improving' | 'declining' | 'stable'
  performanceStability: 'stable' | 'volatile' | 'improving' | 'declining'
  recommendations: string[]
}

class PredictiveDifficultyModel {
  private modelData: ModelData[] = []
  
  predictPerformance(profile: PlayerProfile, difficulty: number): number {
    // Simple linear model with multiple factors
    const basePerformance = profile.skillLevel
    
    // Difficulty impact
    const difficultyImpact = (difficulty - 1) * 0.3
    
    // Play style modifiers
    const styleModifier = this.getStyleModifier(profile.playStyle)
    
    // Adaptability bonus
    const adaptabilityBonus = profile.adaptability * 0.2
    
    // Predicted performance
    const predictedPerformance = Math.max(0, Math.min(1, 
      basePerformance - difficultyImpact + styleModifier + adaptabilityBonus
    ))
    
    return predictedPerformance
  }
  
  predictOptimalDifficulty(profile: PlayerProfile): number {
    // Find difficulty that would result in ~0.6 performance (challenging but achievable)
    let optimalDifficulty = 1.0
    let bestDiff = Infinity
    
    for (let difficulty = 0.1; difficulty <= 3.0; difficulty += 0.1) {
      const predictedPerformance = this.predictPerformance(profile, difficulty)
      const diff = Math.abs(predictedPerformance - 0.6)
      
      if (diff < bestDiff) {
        bestDiff = diff
        optimalDifficulty = difficulty
      }
    }
    
    return optimalDifficulty
  }
  
  private getStyleModifier(playStyle: string): number {
    switch (playStyle) {
      case 'aggressive': return 0.1
      case 'defensive': return 0.05
      case 'tactical': return 0.15
      case 'balanced': return 0
      default: return 0
    }
  }
  
  trainModel(trainingData: ModelData[]): void {
    this.modelData = trainingData
  }
}

interface ModelData {
  profile: PlayerProfile
  difficulty: number
  actualPerformance: number
}

class DynamicDifficultyBalancer {
  calculateTargetDifficulty(
    playerSkill: number, 
    recentPerformance: number, 
    predictedPerformance: number
  ): number {
    // Base difficulty on player skill
    let targetDifficulty = playerSkill
    
    // Adjust based on recent performance
    const performanceDeviation = recentPerformance - 0.6 // Target 60% performance
    targetDifficulty += performanceDeviation * 0.5
    
    // Consider prediction accuracy
    const predictionError = Math.abs(recentPerformance - predictedPerformance)
    if (predictionError > 0.2) {
      // Model is inaccurate, be more conservative
      targetDifficulty *= 0.9
    }
    
    // Apply smoothing and bounds
    targetDifficulty = Math.max(0.1, Math.min(3.0, targetDifficulty))
    
    return targetDifficulty
  }
}
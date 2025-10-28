/**
 * GLXY Gaming Platform - Game Mechanics Framework
 *
 * Umfassende Sammlung von Spielmechanik-Templates und Balancing-Formeln
 * für die GLXY Gaming Platform. Spezialisiert auf Multiplayer-Competitive Gaming.
 *
 * @version 1.0.0
 * @author GLXY Game Design Team
 */

import { z } from 'zod'
import { GameMechanic, BalanceMetrics, RiskRewardProfile, GameGenre } from './game-designer-agent'

// ===== CORE MECHANICS =====

/**
 * Universal Combat System Framework
 */
export interface CombatSystemFramework {
  id: string
  name: string
  type: CombatType
  damageModel: DamageModel
  accuracySystem: AccuracySystem
  rangeSystem: RangeSystem
  cooldownSystem: CooldownSystem
  criticalSystem: CriticalSystem
  statusEffects: StatusEffectSystem
  resourceSystem: ResourceSystem
  balance: CombatBalance
}

export type CombatType = 'hitscan' | 'projectile' | 'melee' | 'area' | 'dot' | 'hybrid'

export interface DamageModel {
  type: DamageType
  calculation: DamageCalculation
  scaling: DamageScaling
  mitigation: DamageMitigation
  variance: DamageVariance
}

export type DamageType = 'flat' | 'percentage' | 'scaling' | 'exponential' | 'logarithmic'
export type DamageCalculation = 'base' | 'skill-based' | 'attribute-based' | 'position-based' | 'combo-based'

export interface DamageScaling {
  enabled: boolean
  formula: ScalingFormula
  multipliers: DamageMultiplier[]
  caps: DamageCap[]
}

export interface ScalingFormula {
  type: 'linear' | 'exponential' | 'logarithmic' | 's-curve'
  base: number
  coefficient: number
  exponent?: number
  offset?: number
}

export interface DamageMultiplier {
  type: 'critical' | 'weakness' | 'resistance' | 'position' | 'combo'
  value: number
  condition: string
}

export interface DamageCap {
  type: 'minimum' | 'maximum' | 'percentage'
  value: number
  appliesTo: string[]
}

export interface DamageMitigation {
  armor: ArmorSystem
  resistance: ResistanceSystem
  evasion: EvasionSystem
  blocking: BlockingSystem
}

export interface ArmorSystem {
  enabled: boolean
  type: 'flat' | 'percentage' | 'threshold'
  calculation: string
  penetration: boolean
}

export interface ResistanceSystem {
  elements: ElementResistance[]
  stacking: StackingBehavior
}

export interface ElementResistance {
  element: string
  value: number
  type: 'percentage' | 'flat'
}

export interface StackingBehavior {
  type: 'additive' | 'multiplicative' | 'diminishing-returns'
  cap: number
}

export interface EvasionSystem {
  enabled: boolean
  baseChance: number
  scaling: ScalingFormula
  accuracyCounter: boolean
}

export interface BlockingSystem {
  enabled: boolean
  type: 'directional' | 'timing' | 'percentage'
  successChance: number
  damageReduction: number
}

export interface DamageVariance {
  enabled: boolean
  range: [number, number]
  distribution: 'uniform' | 'normal' | 'weighted'
  factors: VarianceFactor[]
}

export interface VarianceFactor {
  type: 'distance' | 'angle' | 'movement' | 'skill'
  impact: number
}

export interface AccuracySystem {
  type: AccuracyType
  baseAccuracy: number
  falloff: AccuracyFalloff
  modifiers: AccuracyModifier[]
  spread: SpreadSystem
}

export type AccuracyType = 'hitscan' | 'projectile' | 'hybrid'

export interface AccuracyFalloff {
  enabled: boolean
  startDistance: number
  endDistance: number
  endAccuracy: number
  curve: 'linear' | 'exponential' | 'logarithmic'
}

export interface AccuracyModifier {
  type: 'movement' | 'stance' | 'aiming' | 'cover' | 'skill'
  modifier: number
  condition: string
}

export interface SpreadSystem {
  enabled: boolean
  baseSpread: number
  maxSpread: number
  increasePerShot: number
  decreaseRate: number
  recoil: RecoilSystem
}

export interface RecoilSystem {
  pattern: RecoilPattern
  intensity: number
  recovery: number
  control: boolean
}

export interface RecoilPattern {
  type: 'linear' | 'circular' | 'random' | 'pattern'
  parameters: number[]
}

export interface RangeSystem {
  type: RangeType
  effectiveRange: number
  maximumRange: number
  damageFalloff: RangeFalloff
  areaOfEffect: AreaOfEffect
}

export type RangeType = 'melee' | 'ranged' | 'mixed'

export interface RangeFalloff {
  enabled: boolean
  startDistance: number
  endDistance: number
  damageMultiplier: number
}

export interface AreaOfEffect {
  enabled: boolean
  shape: 'circle' | 'cone' | 'line' | 'custom'
  radius: number
  damageProfile: AOEDamageProfile
}

export interface AOEDamageProfile {
  type: 'flat' | 'falloff' | 'inverse-square'
  centerDamage: number
  edgeDamage: number
}

export interface CooldownSystem {
  type: CooldownType
  baseCooldown: number
  reduction: CooldownReduction[]
  sharing: CooldownSharing
}

export type CooldownType = 'fixed' | 'variable' | 'charge-based' | 'resource-based'

export interface CooldownReduction {
  type: 'stat' | 'item' | 'skill' | 'external'
  value: number
  source: string
}

export interface CooldownSharing {
  enabled: boolean
  groups: string[]
  sharingType: 'reset' | 'add' | 'average'
}

export interface CriticalSystem {
  enabled: boolean
  baseChance: number
  damageMultiplier: number
  scaling: CriticalScaling
  effects: CriticalEffect[]
}

export interface CriticalScaling {
  type: 'flat' | 'percentage' | 'exponential'
  formula: ScalingFormula
  cap: number
}

export interface CriticalEffect {
  type: 'damage' | 'stun' | 'knockback' | 'status'
  value: number
  duration?: number
}

export interface StatusEffectSystem {
  enabled: boolean
  effects: StatusEffect[]
  stacking: StatusStacking
  cleansing: StatusCleansing
  immunity: StatusImmunity
}

export interface StatusEffect {
  id: string
  name: string
  type: StatusType
  duration: number
  stacking: boolean
  dispellable: boolean
  effects: StatusEffectImpact[]
}

export type StatusType = 'buff' | 'debuff' | 'crowd-control' | 'damage' | 'healing'
export interface StatusEffectImpact {
  type: 'attribute' | 'damage' | 'healing' | 'movement' | 'special'
  value: number
  attribute?: string
}

export interface StatusStacking {
  enabled: boolean
  maxStacks: number
  stackingType: 'additive' | 'multiplicative' | 'refresh'
}

export interface StatusCleansing {
  enabled: boolean
  types: StatusType[]
  conditions: string[]
}

export interface StatusImmunity {
  enabled: boolean
  types: StatusType[]
  duration: number
  sources: string[]
}

export interface ResourceSystem {
  resources: GameResource[]
  regeneration: RegenerationSystem
  consumption: ConsumptionSystem
  management: ManagementSystem
}

export interface GameResource {
  id: string
  name: string
  type: ResourceType
  maxValue: number
  currentValue: number
  regeneration: RegenerationRate
}

export type ResourceType = 'health' | 'mana' | 'energy' | 'stamina' | 'ammo' | 'special' | 'custom'

export interface RegenerationRate {
  enabled: boolean
  rate: number
  interval: number
  condition: string
}

export interface RegenerationSystem {
  enabled: boolean
  resources: string[]
  conditions: RegenerationCondition[]
  multipliers: RegenerationMultiplier[]
}

export interface RegenerationCondition {
  type: 'combat' | 'out-of-combat' | 'time' | 'position' | 'custom'
  requirement: string
  effect: string
}

export interface RegenerationMultiplier {
  type: 'stat' | 'item' | 'skill' | 'environment'
  value: number
  source: string
}

export interface ConsumptionSystem {
  enabled: boolean
  resources: string[]
  costs: ResourceCost[]
  efficiencies: CostEfficiency[]
}

export interface ResourceCost {
  action: string
  resource: string
  amount: number
  scaling: ScalingFormula
}

export interface CostEfficiency {
  type: 'stat' | 'item' | 'skill'
  resource: string
  reduction: number
  condition: string
}

export interface ManagementSystem {
  enabled: boolean
  pooling: boolean
  conversion: ResourceConversion[]
  optimization: ResourceOptimization[]
}

export interface ResourceConversion {
  from: string
  to: string
  ratio: number
  efficiency: number
}

export interface ResourceOptimization {
  type: 'usage' | 'generation' | 'efficiency'
  method: string
  impact: number
}

export interface CombatBalance {
  damagePerSecond: DPSBalance
  survivability: SurvivabilityBalance
  utility: UtilityBalance
  scaling: ScalingBalance
}

export interface DPSBalance {
  minimum: number
  maximum: number
  average: number
  variance: number
  scaling: ScalingFormula
}

export interface SurvivabilityBalance {
  effectiveHealth: number
  mitigation: number
  evasion: number
  regeneration: number
}

export interface UtilityBalance {
  crowdControl: number
  mobility: number
  support: number
  versatility: number
}

export interface ScalingBalance {
  earlyGame: number
  midGame: number
  lateGame: number
  consistency: number
}

// ===== MOVEMENT MECHANICS =====

/**
 * Advanced Movement System Framework
 */
export interface MovementSystemFramework {
  id: string
  name: string
  type: MovementType
  baseMovement: BaseMovement
  advancedMovement: AdvancedMovement[]
  physics: MovementPhysics
  environment: EnvironmentalInteraction
  constraints: MovementConstraints
  balance: MovementBalance
}

export type MovementType = 'linear' | 'physics-based' | 'grid-based' | 'node-based' | 'hybrid'

export interface BaseMovement {
  speed: number
  acceleration: number
  deceleration: number
  friction: number
  turnSpeed: number
}

export interface AdvancedMovement {
  id: string
  name: string
  type: AdvancedMovementType
  requirements: MovementRequirement[]
  effects: MovementEffect[]
  cost: MovementCost
}

export type AdvancedMovementType =
  | 'jump' | 'double-jump' | 'dash' | 'sprint' | 'slide' | 'wall-run' | 'climb' | 'fly' | 'teleport' | 'grapple' | 'drift'

export interface MovementRequirement {
  type: 'resource' | 'condition' | 'cooldown' | 'equipment'
  value: string | number
}

export interface MovementEffect {
  type: 'speed' | 'direction' | 'position' | 'state'
  value: number | string
  duration?: number
}

export interface MovementCost {
  type: 'resource' | 'cooldown' | 'stamina'
  value: number
  resource?: string
}

export interface MovementPhysics {
  gravity: PhysicsParameter
  friction: PhysicsParameter
  airResistance: PhysicsParameter
  collision: CollisionSystem
}

export interface PhysicsParameter {
  enabled: boolean
  value: number
  scaling: ScalingFormula
}

export interface CollisionSystem {
  enabled: boolean
  type: 'box' | 'sphere' | 'capsule' | 'mesh'
  layers: CollisionLayer[]
  response: CollisionResponse
}

export interface CollisionLayer {
  name: string
  collisionWith: string[]
  block: boolean
  overlap: boolean
}

export interface CollisionResponse {
  type: 'stop' | 'slide' | 'bounce' | 'custom'
  parameters: number[]
}

export interface EnvironmentalInteraction {
  terrain: TerrainInteraction[]
  weather: WeatherEffect[]
  hazards: HazardSystem[]
  benefits: BenefitSystem[]
}

export interface TerrainInteraction {
  terrain: string
  effect: TerrainEffect
  multiplier: number
}

export interface TerrainEffect {
  speed: number
  mobility: number
  visibility: number
  special: string[]
}

export interface WeatherEffect {
  weather: string
  impact: WeatherImpact
  duration: number
}

export interface WeatherImpact {
  movement: number
  visibility: number
  accuracy: number
  special: string[]
}

export interface HazardSystem {
  hazards: Hazard[]
  damage: HazardDamage
  mitigation: HazardMitigation
}

export interface Hazard {
  id: string
  name: string
  type: 'damage' | 'movement' | 'status' | 'environmental'
  effect: string
  area: string
}

export interface HazardDamage {
  type: DamageType
  amount: number
  interval: number
  scaling: ScalingFormula
}

export interface HazardMitigation {
  methods: string[]
  effectiveness: number[]
  requirements: string[]
}

export interface BenefitSystem {
  benefits: Benefit[]
  conditions: BenefitCondition[]
  stacking: boolean
}

export interface Benefit {
  id: string
  name: string
  type: 'movement' | 'resource' | 'combat' | 'utility'
  effect: string
  duration: number
}

export interface BenefitCondition {
  type: 'position' | 'action' | 'time' | 'status'
  requirement: string
}

export interface MovementConstraints {
  boundaries: BoundarySystem
  restrictions: MovementRestriction[]
  penalties: MovementPenalty[]
}

export interface BoundarySystem {
  enabled: boolean
  type: 'hard' | 'soft' | 'wrap' | 'custom'
  shape: 'box' | 'sphere' | 'custom'
  response: string
}

export interface MovementRestriction {
  type: 'area' | 'condition' | 'status' | 'equipment'
  effect: string
  severity: number
}

export interface MovementPenalty {
  trigger: string
  effect: string
  duration: number
  stacking: boolean
}

export interface MovementBalance {
  speed: SpeedBalance
  mobility: MobilityBalance
  positioning: PositioningBalance
  accessibility: AccessibilityBalance
}

export interface SpeedBalance {
  base: number
  maximum: number
  average: number
  variance: number
}

export interface MobilityBalance {
  options: number
  effectiveness: number
  risk: number
  reward: number
}

export interface PositioningBalance {
  control: number
  flexibility: number
  predictability: number
  counterplay: number
}

export interface AccessibilityBalance {
  complexity: number
  learningCurve: number
  mastery: number
  accessibility: number
}

// ===== PROGRESSION MECHANICS =====

/**
 * Comprehensive Progression System Framework
 */
export interface ProgressionSystemFramework {
  id: string
  name: string
  type: ProgressionSystemType
  experience: ExperienceSystem
  levels: LevelSystem
  skills: SkillSystem
  achievements: AchievementSystem
  mastery: MasterySystem
  social: SocialProgression
  balance: ProgressionBalance
}

export type ProgressionSystemType = 'linear' | 'exponential' | 'logarithmic' | 's-curve' | 'custom'

export interface ExperienceSystem {
  sources: ExperienceSource[]
  calculation: ExperienceCalculation
  multipliers: ExperienceMultiplier[]
  caps: ExperienceCap[]
}

export interface ExperienceSource {
  id: string
  name: string
  type: ExperienceSourceType
  amount: number
  scaling: ScalingFormula
  conditions: string[]
}

export type ExperienceSourceType = 'action' | 'time' | 'completion' | 'achievement' | 'social' | 'custom'

export interface ExperienceCalculation {
  baseFormula: ScalingFormula
  modifiers: ExperienceModifier[]
  rounding: 'floor' | 'ceil' | 'round'
}

export interface ExperienceModifier {
  type: 'stat' | 'item' | 'skill' | 'social' | 'environment'
  value: number
  condition: string
}

export interface ExperienceMultiplier {
  type: 'global' | 'source' | 'period' | 'group'
  value: number
  condition: string
  duration?: number
}

export interface ExperienceCap {
  type: 'daily' | 'weekly' | 'level' | 'total'
  value: number
  reset: string
}

export interface LevelSystem {
  progression: LevelProgression
  rewards: LevelReward[]
  milestones: LevelMilestone[]
  prestige: PrestigeSystem
}

export interface LevelProgression {
  type: ProgressionSystemType
  formula: ScalingFormula
  maxLevel: number
  curve: ProgressionCurve
}

export interface ProgressionCurve {
  acceleration: number
  plateau: number
  variance: number
  adjustment: ProgressionAdjustment[]
}

export interface ProgressionAdjustment {
  level: number
  multiplier: number
  reason: string
}

export interface LevelReward {
  level: number
  rewards: RewardType[]
  choices: RewardChoice[]
  notifications: NotificationSystem[]
}

export type RewardType = 'currency' | 'item' | 'skill-point' | 'ability' | 'cosmetic' | 'title' | 'stat' | 'custom' | 'starting-speed' | 'unlock-hard-mode' | 'unlock-sprint-mode' | 'master-title' | 'golden-tetris-block' | 'master-mode' | 'tetris-badge' | 'tetris-master-title' | 'golden-block-badge' | 'tournament-badge' | 'exclusive-skin' | 'weekly-top-badge' | 'rating'
export interface RewardChoice {
  options: RewardOption[]
  required: number
}

export interface RewardOption {
  type: RewardType
  id: string
  quantity?: number
  requirements: string[]
}

export interface NotificationSystem {
  enabled: boolean
  type: 'popup' | 'toast' | 'animation' | 'sound' | 'custom'
  message: string
  duration: number
}

export interface LevelMilestone {
  level: number
  name: string
  description: string
  rewards: RewardType[]
  unlocks: UnlockType[]
  celebrations: MilestoneCelebration[]
}

export type UnlockType = 'feature' | 'area' | 'ability' | 'mode' | 'difficulty' | 'custom' | 'master-mode'
export interface MilestoneCelebration {
  type: 'animation' | 'effect' | 'sound' | 'popup' | 'custom'
  duration: number
  impact: 'visual' | 'audio' | 'both'
}

export interface PrestigeSystem {
  enabled: boolean
  requirements: PrestigeRequirement[]
  rewards: PrestigeReward[]
  scaling: PrestigeScaling
}

export interface PrestigeRequirement {
  type: 'level' | 'achievement' | 'time' | 'mastery' | 'custom'
  value: number | string
}

export interface PrestigeReward {
  type: RewardType
  permanent: boolean
  scaling: boolean
  cosmetic: boolean
}

export interface PrestigeScaling {
  multiplier: number
  benefit: string
  cap: number
}

export interface SkillSystem {
  skills: Skill[]
  trees: SkillTree[]
  points: SkillPointSystem
  progression: SkillProgression
}

export interface Skill {
  id: string
  name: string
  description: string
  type: SkillType
  category: SkillCategory
  maxLevel: number
  currentLevel: number
  requirements: SkillRequirement[]
  effects: SkillEffect[]
  scaling: SkillScaling
}

export type SkillType = 'active' | 'passive' | 'toggle' | 'ultimate' | 'hybrid'
export type SkillCategory = 'combat' | 'movement' | 'defense' | 'utility' | 'social' | 'crafting' | 'custom'

export interface SkillRequirement {
  type: 'level' | 'skill' | 'stat' | 'item' | 'achievement' | 'custom'
  value: string | number
}

export interface SkillEffect {
  type: 'stat' | 'ability' | 'resource' | 'custom'
  target: string
  value: number
  scaling: ScalingFormula
}

export interface SkillScaling {
  enabled: boolean
  formula: ScalingFormula
  cap: number
  breakpoints: SkillBreakpoint[]
}

export interface SkillBreakpoint {
  level: number
  effect: string
  value: number
}

export interface SkillTree {
  id: string
  name: string
  description: string
  skills: string[]
  layout: SkillTreeLayout
  requirements: SkillTreeRequirement[]
}

export interface SkillTreeLayout {
  type: 'linear' | 'branching' | 'web' | 'custom'
  connections: SkillConnection[]
  positions: SkillPosition[]
}

export interface SkillConnection {
  from: string
  to: string
  requirement: string
  type: 'required' | 'optional' | 'exclusive'
}

export interface SkillPosition {
  skill: string
  x: number
  y: number
  tier: number
}

export interface SkillTreeRequirement {
  type: 'level' | 'skill' | 'achievement' | 'custom'
  value: string | number
}

export interface SkillPointSystem {
  type: 'fixed' | 'variable' | 'regenerating'
  source: SkillPointSource[]
  maximum: number
  respec: SkillRespecSystem
}

export interface SkillPointSource {
  type: 'level' | 'achievement' | 'quest' | 'item' | 'custom'
  amount: number
  frequency: string
}

export interface SkillRespecSystem {
  enabled: boolean
  cost: RespecCost
  restrictions: RespecRestriction[]
  confirmation: boolean
}

export interface RespecCost {
  type: 'currency' | 'item' | 'free' | 'custom'
  value: number
  scaling: ScalingFormula
}

export interface RespecRestriction {
  type: 'cooldown' | 'level' | 'location' | 'custom'
  value: string | number
}

export interface SkillProgression {
  experience: SkillExperience
  practice: SkillPractice
  mastery: SkillMastery
}

export interface SkillExperience {
  enabled: boolean
  sources: SkillExperienceSource[]
  calculation: ScalingFormula
  caps: SkillExperienceCap[]
}

export interface SkillExperienceSource {
  action: string
  skill: string
  amount: number
  condition: string
}

export interface SkillExperienceCap {
  type: 'daily' | 'session' | 'total'
  value: number
  skill: string
}

export interface SkillPractice {
  enabled: boolean
  metrics: SkillPracticeMetric[]
  improvement: SkillImprovement[]
}

export interface SkillPracticeMetric {
  type: 'accuracy' | 'speed' | 'efficiency' | 'consistency' | 'custom'
  measurement: string
  tracking: boolean
}

export interface SkillImprovement {
  type: 'passive' | 'active' | 'bonus'
  condition: string
  effect: string
  value: number
}

export interface SkillMastery {
  enabled: boolean
  levels: SkillMasteryLevel[]
  rewards: SkillMasteryReward[]
  challenges: SkillMasteryChallenge[]
}

export interface SkillMasteryLevel {
  level: number
  name: string
  requirements: SkillMasteryRequirement[]
  effects: SkillMasteryEffect[]
}

export interface SkillMasteryRequirement {
  type: 'usage' | 'success' | 'combination' | 'custom'
  value: number
  measurement: string
}

export interface SkillMasteryEffect {
  type: 'enhancement' | 'new-ability' | 'passive' | 'cosmetic'
  description: string
  value: number | string
}

export interface SkillMasteryReward {
  type: RewardType
  value: number | string
  cosmetic: boolean
}

export interface SkillMasteryChallenge {
  id: string
  name: string
  description: string
  requirements: SkillChallengeRequirement[]
  rewards: RewardType[]
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
}

export interface SkillChallengeRequirement {
  type: 'skill-level' | 'combination' | 'performance' | 'custom'
  value: string | number
}

export interface AchievementSystem {
  categories: AchievementCategory[]
  tracking: AchievementTracking
  rewards: AchievementReward[]
  display: AchievementDisplay
}

export interface AchievementCategory {
  id: string
  name: string
  description: string
  icon: string
  achievements: Achievement[]
  completionReward: RewardType[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  type: AchievementType
  difficulty: AchievementDifficulty
  rarity: AchievementRarity
  requirements: AchievementRequirement[]
  rewards: RewardType[]
  hidden: boolean
  repeatable: boolean
  tracking: AchievementTrackingSettings
}

export type AchievementType = 'progress' | 'collection' | 'challenge' | 'exploration' | 'social' | 'mastery' | 'custom'
export type AchievementDifficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'extreme' | 'impossible'
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'

export interface AchievementRequirement {
  type: 'stat' | 'action' | 'combination' | 'time' | 'custom'
  value: string | number
  operator: 'equals' | 'greater-than' | 'less-than' | 'cumulative' | 'maximum'
}

export interface AchievementTrackingSettings {
  progress: boolean
  progressVisible: boolean
  milestones: AchievementMilestone[]
}

export interface AchievementMilestone {
  percentage: number
  notification: boolean
  reward?: RewardType
}

export interface AchievementTracking {
  realtime: boolean
  batching: boolean
  persistence: boolean
  validation: AchievementValidation[]
}

export interface AchievementValidation {
  type: 'anti-cheat' | 'time-gate' | 'legitimacy' | 'custom'
  enabled: boolean
  parameters: ValidationParameter[]
}

export interface ValidationParameter {
  name: string
  value: string | number
  comparison: string
}

export interface AchievementReward {
  type: RewardType
  value: number | string
  scaling: boolean
  cosmetic: boolean
  announcement: boolean
}

export interface AchievementDisplay {
  notification: AchievementNotification[]
  showcase: AchievementShowcase
  comparison: AchievementComparison
}

export interface AchievementNotification {
  trigger: 'unlock' | 'progress' | 'milestone'
  type: 'popup' | 'toast' | 'animation' | 'sound' | 'custom'
  duration: number
  content: NotificationContent
}

export interface NotificationContent {
  title: string
  description: string
  icon: string
  color: string
  sound: string
}

export interface AchievementShowcase {
  enabled: boolean
  layout: 'grid' | 'list' | 'timeline' | 'custom'
  filtering: AchievementFilter[]
  sorting: AchievementSorting[]
}

export interface AchievementFilter {
  type: 'category' | 'difficulty' | 'rarity' | 'progress' | 'custom'
  options: string[]
}

export interface AchievementSorting {
  type: 'date' | 'difficulty' | 'rarity' | 'progress' | 'name' | 'custom'
  direction: 'ascending' | 'descending'
}

export interface AchievementComparison {
  enabled: boolean
  scope: ComparisonScope[]
  privacy: ComparisonPrivacy
}

export interface ComparisonScope {
  type: 'global' | 'friends' | 'guild' | 'server' | 'custom'
  enabled: boolean
}

export interface ComparisonPrivacy {
  public: boolean
  friends: boolean
  guild: boolean
  anonymous: boolean
}

export interface MasterySystem {
  tracks: MasteryTrack[]
  progression: MasteryProgression
  recognition: MasteryRecognition
  community: MasteryCommunity
}

export interface MasteryTrack {
  id: string
  name: string
  description: string
  type: MasteryType
  levels: MasteryLevel[]
  requirements: MasteryTrackRequirement[]
  rewards: MasteryReward[]
}

export type MasteryType = 'skill' | 'character' | 'weapon' | 'role' | 'game-mode' | 'custom'

export interface MasteryLevel {
  level: number
  name: string
  requirements: MasteryLevelRequirement[]
  effects: MasteryEffect[]
  cosmetics: MasteryCosmetic[]
}

export interface MasteryLevelRequirement {
  type: 'usage' | 'performance' | 'achievement' | 'combination' | 'custom'
  value: string | number
  measurement: string
}

export interface MasteryEffect {
  type: 'stat' | 'ability' | 'resource' | 'custom'
  target: string
  value: number
  scaling: ScalingFormula
}

export interface MasteryCosmetic {
  type: 'title' | 'badge' | 'effect' | 'custom'
  id: string
  name: string
  description: string
  rarity: AchievementRarity
}

export interface MasteryTrackRequirement {
  type: 'level' | 'skill' | 'achievement' | 'custom'
  value: string | number
}

export interface MasteryReward {
  type: RewardType
  value: number | string
  permanent: boolean
  display: boolean
}

export interface MasteryProgression {
  tracking: MasteryTracking
  acceleration: MasteryAcceleration
  caps: MasteryCap[]
}

export interface MasteryTracking {
  metrics: MasteryMetric[]
  realtime: boolean
  aggregation: 'session' | 'daily' | 'total' | 'custom'
}

export interface MasteryMetric {
  name: string
  type: 'usage' | 'performance' | 'efficiency' | 'consistency' | 'custom'
  calculation: string
  weighting: number
}

export interface MasteryAcceleration {
  enabled: boolean
  multipliers: MasteryMultiplier[]
  bonuses: MasteryBonus[]
}

export interface MasteryMultiplier {
  type: 'stat' | 'item' | 'event' | 'social' | 'custom'
  value: number
  condition: string
  duration?: number
}

export interface MasteryBonus {
  type: 'accelerated' | 'bonus-points' | 'skipping' | 'custom'
  value: number
  condition: string
}

export interface MasteryCap {
  type: 'daily' | 'weekly' | 'session' | 'total'
  value: number
  track: string
}

export interface MasteryRecognition {
  titles: MasteryTitle[]
  badges: MasteryBadge[]
  leaderboards: MasteryLeaderboard[]
  showcases: MasteryShowcase[]
}

export interface MasteryTitle {
  id: string
  name: string
  requirement: MasteryTitleRequirement
  display: TitleDisplay
}

export interface MasteryTitleRequirement {
  type: 'level' | 'achievement' | 'ranking' | 'custom'
  value: string | number
}

export interface TitleDisplay {
  prefix: boolean
  suffix: boolean
  color: string
  icon: string
}

export interface MasteryBadge {
  id: string
  name: string
  description: string
  icon: string
  rarity: AchievementRarity
  requirement: MasteryBadgeRequirement
  display: BadgeDisplay
}

export interface MasteryBadgeRequirement {
  type: 'achievement' | 'mastery' | 'performance' | 'custom'
  value: string | number
  measurement?: string
}

export interface BadgeDisplay {
  position: 'profile' | 'nameplate' | 'both' | 'custom'
  size: 'small' | 'medium' | 'large'
  animation: boolean
}

export interface MasteryLeaderboard {
  id: string
  name: string
  type: 'individual' | 'team' | 'guild' | 'global'
  metric: string
  timeframe: LeaderboardTimeframe
  rewards: LeaderboardReward[]
}

export interface LeaderboardTimeframe {
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'all-time'
  reset: string
}

export interface LeaderboardReward {
  rank: [number, number]
  rewards: RewardType[]
  display: boolean
}

export interface MasteryShowcase {
  enabled: boolean
  layout: ShowcaseLayout
  filtering: ShowcaseFilter[]
  sharing: ShowcaseSharing
}

export interface ShowcaseLayout {
  type: 'grid' | 'timeline' | 'highlights' | 'custom'
  customization: ShowcaseCustomization[]
}

export interface ShowcaseCustomization {
  type: 'background' | 'theme' | 'animation' | 'custom'
  options: string[]
}

export interface ShowcaseFilter {
  type: 'category' | 'rarity' | 'recent' | 'custom'
  options: string[]
}

export interface ShowcaseSharing {
  enabled: boolean
  platforms: string[]
  privacy: SharingPrivacy
}

export interface SharingPrivacy {
  public: boolean
  friends: boolean
  guild: boolean
  custom: boolean
}

export interface MasteryCommunity {
  comparison: MasteryComparison
  mentorship: MasteryMentorship
  events: MasteryEvent[]
}

export interface MasteryComparison {
  enabled: boolean
  anonymity: boolean
  metrics: ComparisonMetric[]
}

export interface ComparisonMetric {
  name: string
  type: 'relative' | 'absolute' | 'percentile'
  display: boolean
}

export interface MasteryMentorship {
  enabled: boolean
  roles: MentorshipRole[]
  benefits: MentorshipBenefit[]
}

export interface MentorshipRole {
  type: 'mentor' | 'mentee' | 'peer'
  requirements: MentorshipRequirement[]
  responsibilities: string[]
}

export interface MentorshipRequirement {
  type: 'mastery' | 'achievement' | 'time' | 'custom'
  value: string | number
}

export interface MentorshipBenefit {
  type: 'bonus' | 'recognition' | 'access' | 'custom'
  value: string | number
}

export interface MasteryEvent {
  id: string
  name: string
  description: string
  type: 'challenge' | 'competition' | 'learning' | 'custom'
  schedule: EventSchedule
  participation: EventParticipation
  rewards: RewardType[]
}

export interface EventSchedule {
  start: string
  end: string
  recurring: boolean
  frequency: string
}

export interface EventParticipation {
  requirements: EventRequirement[]
  rules: string[]
  scoring: EventScoring
}

export interface EventRequirement {
  type: 'level' | 'mastery' | 'achievement' | 'custom'
  value: string | number
}

export interface EventScoring {
  metric: string
  calculation: string
  weighting: number
}

export interface SocialProgression {
  guilds: GuildProgression
  teams: TeamProgression
  friendships: FriendshipProgression
  leaderboards: SocialLeaderboard[]
}

export interface GuildProgression {
  levels: GuildLevel[]
  activities: GuildActivity[]
  rewards: GuildReward[]
  contributions: GuildContribution[]
}

export interface GuildLevel {
  level: number
  name: string
  requirements: GuildRequirement[]
  benefits: GuildBenefit[]
  unlocks: string[]
}

export interface GuildRequirement {
  type: 'members' | 'activity' | 'contributions' | 'achievements' | 'custom'
  value: number | string
  timeframe?: string
}

export interface GuildBenefit {
  type: 'stat' | 'resource' | 'access' | 'cosmetic' | 'custom'
  description: string
  value: number | string
}

export interface GuildActivity {
  id: string
  name: string
  type: 'raid' | 'quest' | 'challenge' | 'social' | 'custom'
  requirements: GuildActivityRequirement[]
  rewards: RewardType[]
  contribution: GuildContribution
}

export interface GuildActivityRequirement {
  type: 'member-count' | 'level' | 'skill' | 'custom'
  value: string | number
}

export interface GuildContribution {
  metric: string
  value: number
  distribution: 'equal' | 'performance' | 'role' | 'custom'
}

export interface GuildReward {
  type: RewardType
  value: number | string
  distribution: 'individual' | 'guild' | 'hybrid'
}

export interface TeamProgression {
  chemistry: TeamChemistry
  achievements: TeamAchievement[]
  rankings: TeamRanking[]
  rewards: TeamReward[]
}

export interface TeamChemistry {
  enabled: boolean
  metrics: ChemistryMetric[]
  bonuses: ChemistryBonus[]
}

export interface ChemistryMetric {
  name: string
  factors: ChemistryFactor[]
  calculation: string
}

export interface ChemistryFactor {
  type: 'playtime' | 'communication' | 'coordination' | 'success' | 'custom'
  weight: number
}

export interface ChemistryBonus {
  threshold: number
  effect: string
  value: number
  duration: number
}

export interface TeamAchievement {
  id: string
  name: string
  description: string
  requirements: TeamRequirement[]
  rewards: RewardType[]
  tracking: boolean
}

export interface TeamRequirement {
  type: 'performance' | 'coordination' | 'consistency' | 'custom'
  value: string | number
}

export interface TeamRanking {
  type: 'regional' | 'global' | 'seasonal' | 'custom'
  metric: string
  timeframe: LeaderboardTimeframe
  rewards: LeaderboardReward[]
}

export interface TeamReward {
  distribution: 'equal' | 'performance' | 'role' | 'captain'
  rewards: RewardType[]
}

export interface FriendshipProgression {
  levels: FriendshipLevel[]
  activities: FriendshipActivity[]
  benefits: FriendshipBenefit[]
  gifts: FriendshipGift[]
}

export interface FriendshipLevel {
  level: number
  name: string
  requirements: FriendshipRequirement[]
  benefits: string[]
}

export interface FriendshipRequirement {
  type: 'playtime' | 'interaction' | 'achievement' | 'custom'
  value: number
  timeframe?: string
}

export interface FriendshipActivity {
  type: 'game' | 'chat' | 'gift' | 'achievement' | 'custom'
  value: number
  bonus: string
}

export interface FriendshipBenefit {
  type: 'bonus' | 'access' | 'cosmetic' | 'custom'
  description: string
  value: number | string
}

export interface FriendshipGift {
  type: 'item' | 'currency' | 'cosmetic' | 'custom'
  value: number | string
  cooldown: number
  requirements: FriendshipRequirement[]
}

export interface SocialLeaderboard {
  id: string
  name: string
  type: SocialLeaderboardType
  metric: string
  timeframe: LeaderboardTimeframe
  participants: LeaderboardParticipant[]
  rewards: LeaderboardReward[]
}

export type SocialLeaderboardType = 'individual' | 'team' | 'guild' | 'friend' | 'global' | 'custom'

export interface LeaderboardParticipant {
  type: 'player' | 'team' | 'guild'
  filters: ParticipantFilter[]
}

export interface ParticipantFilter {
  type: 'level' | 'region' | 'activity' | 'custom'
  value: string | number
}

export interface ProgressionBalance {
  pacing: PacingBalance
  difficulty: DifficultyBalance
  rewards: RewardBalance
  retention: RetentionBalance
}

export interface PacingBalance {
  earlyGame: number
  midGame: number
  lateGame: number
  consistency: number
}

export interface DifficultyBalance {
  accessibility: number
  challenge: number
  mastery: number
  scaling: number
}

export interface RewardBalance {
  frequency: number
  value: number
  variety: number
  motivation: number
}

export interface RetentionBalance {
  hooks: number
  progression: number
  social: number
  longTerm: number
}

// ===== MECHANICS TEMPLATES =====

/**
 * Pre-built mechanics templates for common game types
 */
export class GameMechanicsTemplates {
  /**
   * FPS Combat System Template
   */
  static createFPSCombatSystem(): CombatSystemFramework {
    return {
      id: 'fps-combat-system',
      name: 'FPS Combat System',
      type: 'hitscan',
      damageModel: {
        type: 'flat',
        calculation: 'skill-based',
        scaling: {
          enabled: true,
          formula: {
            type: 'linear',
            base: 100,
            coefficient: 0.1
          },
          multipliers: [
            {
              type: 'critical',
              value: 2.0,
              condition: 'headshot'
            },
            {
              type: 'weakness',
              value: 1.5,
              condition: 'body-shot'
            }
          ],
          caps: [
            {
              type: 'maximum',
              value: 200,
              appliesTo: ['damage']
            }
          ]
        },
        mitigation: {
          armor: {
            enabled: true,
            type: 'percentage',
            calculation: 'damage * (1 - armor_value / 100)',
            penetration: true
          },
          resistance: {
            elements: [],
            stacking: {
              type: 'multiplicative',
              cap: 0.9
            }
          },
          evasion: {
            enabled: false,
            baseChance: 0,
            scaling: {
              type: 'linear',
              base: 0,
              coefficient: 0.01
            },
            accuracyCounter: false
          },
          blocking: {
            enabled: false,
            type: 'percentage',
            successChance: 0,
            damageReduction: 0
          }
        },
        variance: {
          enabled: true,
          range: [0.9, 1.1],
          distribution: 'normal',
          factors: [
            {
              type: 'distance',
              impact: 0.1
            },
            {
              type: 'movement',
              impact: 0.05
            }
          ]
        }
      },
      accuracySystem: {
        type: 'hitscan',
        baseAccuracy: 1.0,
        falloff: {
          enabled: true,
          startDistance: 20,
          endDistance: 100,
          endAccuracy: 0.3,
          curve: 'exponential'
        },
        modifiers: [
          {
            type: 'movement',
            modifier: -0.2,
            condition: 'moving'
          },
          {
            type: 'stance',
            modifier: 0.1,
            condition: 'crouching'
          },
          {
            type: 'aiming',
            modifier: 0.15,
            condition: 'aiming-down-sights'
          }
        ],
        spread: {
          enabled: true,
          baseSpread: 0.01,
          maxSpread: 0.1,
          increasePerShot: 0.02,
          decreaseRate: 0.05,
          recoil: {
            pattern: {
              type: 'pattern',
              parameters: [0.1, 0.05, 0.02, 0.01]
            },
            intensity: 0.5,
            recovery: 0.8,
            control: true
          }
        }
      },
      rangeSystem: {
        type: 'ranged',
        effectiveRange: 50,
        maximumRange: 100,
        damageFalloff: {
          enabled: true,
          startDistance: 20,
          endDistance: 100,
          damageMultiplier: 0.3
        },
        areaOfEffect: {
          enabled: false,
          shape: 'circle',
          radius: 0,
          damageProfile: {
            type: 'flat',
            centerDamage: 0,
            edgeDamage: 0
          }
        }
      },
      cooldownSystem: {
        type: 'fixed',
        baseCooldown: 0.1,
        reduction: [],
        sharing: {
          enabled: false,
          groups: [],
          sharingType: 'reset'
        }
      },
      criticalSystem: {
        enabled: true,
        baseChance: 0.05,
        damageMultiplier: 2.0,
        scaling: {
          type: 'percentage',
          formula: {
            type: 'linear',
            base: 0.05,
            coefficient: 0.001
          },
          cap: 0.15
        },
        effects: [
          {
            type: 'damage',
            value: 2.0
          }
        ]
      },
      statusEffects: {
        enabled: true,
        effects: [
          {
            id: 'suppression',
            name: 'Suppression',
            type: 'debuff',
            duration: 2,
            stacking: false,
            dispellable: true,
            effects: [
              {
                type: 'attribute',
                value: -0.3,
                attribute: 'accuracy'
              }
            ]
          }
        ],
        stacking: {
          enabled: false,
          maxStacks: 1,
          stackingType: 'refresh'
        },
        cleansing: {
          enabled: true,
          types: ['debuff'],
          conditions: ['medkit', 'cover']
        },
        immunity: {
          enabled: false,
          types: [],
          duration: 0,
          sources: []
        }
      },
      resourceSystem: {
        resources: [
          {
            id: 'health',
            name: 'Health',
            type: 'health',
            maxValue: 100,
            currentValue: 100,
            regeneration: {
              enabled: true,
              rate: 1,
              interval: 1,
              condition: 'out-of-combat'
            }
          },
          {
            id: 'ammo',
            name: 'Ammunition',
            type: 'ammo',
            maxValue: 30,
            currentValue: 30,
            regeneration: {
              enabled: false,
              rate: 0,
              interval: 0,
              condition: ''
            }
          }
        ],
        regeneration: {
          enabled: true,
          resources: ['health'],
          conditions: [
            {
              type: 'out-of-combat',
              requirement: 'no-damage-for-5s',
              effect: 'health-regeneration'
            }
          ],
          multipliers: []
        },
        consumption: {
          enabled: true,
          resources: ['ammo'],
          costs: [
            {
              action: 'shoot',
              resource: 'ammo',
              amount: 1,
              scaling: {
                type: 'linear',
                base: 1,
                coefficient: 0
              }
            }
          ],
          efficiencies: []
        },
        management: {
          enabled: true,
          pooling: false,
          conversion: [],
          optimization: []
        }
      },
      balance: {
        damagePerSecond: {
          minimum: 50,
          maximum: 150,
          average: 100,
          variance: 0.2,
          scaling: {
            type: 'linear',
            base: 100,
            coefficient: 0.1
          }
        },
        survivability: {
          effectiveHealth: 150,
          mitigation: 0.3,
          evasion: 0,
          regeneration: 1
        },
        utility: {
          crowdControl: 0.2,
          mobility: 0.8,
          support: 0.1,
          versatility: 0.6
        },
        scaling: {
          earlyGame: 0.8,
          midGame: 1.0,
          lateGame: 1.2,
          consistency: 0.9
        }
      }
    }
  }

  /**
   * Chess Movement System Template
   */
  static createChessMovementSystem(): MovementSystemFramework {
    return {
      id: 'chess-movement-system',
      name: 'Chess Movement System',
      type: 'grid-based',
      baseMovement: {
        speed: 1,
        acceleration: 0,
        deceleration: 0,
        friction: 0,
        turnSpeed: 0
      },
      advancedMovement: [],
      physics: {
        gravity: {
          enabled: false,
          value: 0,
          scaling: {
            type: 'linear',
            base: 0,
            coefficient: 0
          }
        },
        friction: {
          enabled: false,
          value: 0,
          scaling: {
            type: 'linear',
            base: 0,
            coefficient: 0
          }
        },
        airResistance: {
          enabled: false,
          value: 0,
          scaling: {
            type: 'linear',
            base: 0,
            coefficient: 0
          }
        },
        collision: {
          enabled: true,
          type: 'box',
          layers: [
            {
              name: 'pieces',
              collisionWith: ['pieces', 'board'],
              block: true,
              overlap: false
            }
          ],
          response: {
            type: 'stop',
            parameters: []
          }
        }
      },
      environment: {
        terrain: [],
        weather: [],
        hazards: [],
        benefits: []
      },
      constraints: {
        boundaries: {
          enabled: true,
          type: 'hard',
          shape: 'box',
          response: 'stop'
        },
        restrictions: [
          {
            type: 'condition',
            effect: 'piece-specific-movement',
            severity: 1
          }
        ],
        penalties: []
      },
      balance: {
        speed: {
          base: 1,
          maximum: 1,
          average: 1,
          variance: 0
        },
        mobility: {
          options: 6,
          effectiveness: 0.8,
          risk: 0.5,
          reward: 0.9
        },
        positioning: {
          control: 0.9,
          flexibility: 0.7,
          predictability: 0.6,
          counterplay: 0.9
        },
        accessibility: {
          complexity: 0.3,
          learningCurve: 0.4,
          mastery: 0.9,
          accessibility: 0.7
        }
      }
    }
  }

  /**
   * Racing Physics System Template
   */
  static createRacingPhysicsSystem(): MovementSystemFramework {
    return {
      id: 'racing-physics-system',
      name: 'Racing Physics System',
      type: 'physics-based',
      baseMovement: {
        speed: 50,
        acceleration: 10,
        deceleration: 15,
        friction: 0.8,
        turnSpeed: 60
      },
      advancedMovement: [
        {
          id: 'drift',
          name: 'Drift',
          type: 'drift',
          requirements: [
            {
              type: 'condition',
              value: 'high-speed-turn'
            },
            {
              type: 'resource',
              value: 'tire-traction'
            }
          ],
          effects: [
            {
              type: 'direction',
              value: 'sideways'
            },
            {
              type: 'speed',
              value: 'maintain'
            }
          ],
          cost: {
            type: 'resource',
            value: 0.1,
            resource: 'tire-traction'
          }
        },
        {
          id: 'nitro',
          name: 'Nitro Boost',
          type: 'dash',
          requirements: [
            {
              type: 'resource',
              value: 'nitro'
            }
          ],
          effects: [
            {
              type: 'speed',
              value: 2.0,
              duration: 3
            }
          ],
          cost: {
            type: 'resource',
            value: 1,
            resource: 'nitro'
          }
        }
      ],
      physics: {
        gravity: {
          enabled: true,
          value: 9.81,
          scaling: {
            type: 'linear',
            base: 9.81,
            coefficient: 0
          }
        },
        friction: {
          enabled: true,
          value: 0.8,
          scaling: {
            type: 'linear',
            base: 0.8,
            coefficient: 0
          }
        },
        airResistance: {
          enabled: true,
          value: 0.1,
          scaling: {
            type: 'exponential',
            base: 0.1,
            coefficient: 0.01,
            exponent: 2
          }
        },
        collision: {
          enabled: true,
          type: 'box',
          layers: [
            {
              name: 'vehicles',
              collisionWith: ['vehicles', 'environment'],
              block: true,
              overlap: false
            }
          ],
          response: {
            type: 'bounce',
            parameters: [0.5, 0.3]
          }
        }
      },
      environment: {
        terrain: [
          {
            terrain: 'asphalt',
            effect: {
              speed: 1.0,
              mobility: 1.0,
              visibility: 1.0,
              special: []
            },
            multiplier: 1.0
          },
          {
            terrain: 'dirt',
            effect: {
              speed: 0.8,
              mobility: 0.9,
              visibility: 1.0,
              special: ['drift-bonus']
            },
            multiplier: 0.9
          },
          {
            terrain: 'wet',
            effect: {
              speed: 0.7,
              mobility: 0.6,
              visibility: 0.8,
              special: ['hydroplaning-risk']
            },
            multiplier: 0.7
          }
        ],
        weather: [
          {
            weather: 'rain',
            impact: {
              movement: 0.8,
              visibility: 0.7,
              accuracy: 0.9,
              special: ['reduced-traction']
            },
            duration: 0
          },
          {
            weather: 'fog',
            impact: {
              movement: 0.9,
              visibility: 0.3,
              accuracy: 0.5,
              special: ['limited-visibility']
            },
            duration: 0
          }
        ],
        hazards: [],
        benefits: []
      },
      constraints: {
        boundaries: {
          enabled: true,
          type: 'soft',
          shape: 'custom',
          response: 'redirect-to-track'
        },
        restrictions: [],
        penalties: [
          {
            trigger: 'off-track',
            effect: 'speed-reduction',
            duration: 2,
            stacking: false
          }
        ]
      },
      balance: {
        speed: {
          base: 50,
          maximum: 200,
          average: 100,
          variance: 0.3
        },
        mobility: {
          options: 3,
          effectiveness: 0.9,
          risk: 0.6,
          reward: 0.8
        },
        positioning: {
          control: 0.8,
          flexibility: 0.7,
          predictability: 0.5,
          counterplay: 0.7
        },
        accessibility: {
          complexity: 0.4,
          learningCurve: 0.5,
          mastery: 0.9,
          accessibility: 0.6
        }
      }
    }
  }

  /**
   * Tetris Progression System Template
   */
  static createTetrisProgressionSystem(): ProgressionSystemFramework {
    return {
      id: 'tetris-progression-system',
      name: 'Tetris Progression System',
      type: 'exponential',
      experience: {
        sources: [
          {
            id: 'line-clear',
            name: 'Line Clear',
            type: 'action',
            amount: 100,
            scaling: {
              type: 'exponential',
              base: 100,
              coefficient: 1.5,
              exponent: 0.5
            },
            conditions: ['complete-line']
          },
          {
            id: 'tetris',
            name: 'Tetris',
            type: 'action',
            amount: 800,
            scaling: {
              type: 'linear',
              base: 800,
              coefficient: 0
            },
            conditions: ['clear-four-lines']
          },
          {
            id: 'level-complete',
            name: 'Level Complete',
            type: 'completion',
            amount: 1000,
            scaling: {
              type: 'exponential',
              base: 1000,
              coefficient: 1.2
            },
            conditions: ['clear-10-lines']
          }
        ],
        calculation: {
          baseFormula: {
            type: 'linear',
            base: 0,
            coefficient: 1
          },
          modifiers: [
            {
              type: 'stat',
              value: 0.1,
              condition: 'combo-active'
            }
          ],
          rounding: 'round'
        },
        multipliers: [
          {
            type: 'source',
            value: 4.0,
            condition: 'tetris'
          },
          {
            type: 'period',
            value: 1.5,
            condition: 'double-score-weekend',
            duration: 86400
          }
        ],
        caps: []
      },
      levels: {
        progression: {
          type: 'exponential',
          formula: {
            type: 'exponential',
            base: 1000,
            coefficient: 1.5
          },
          maxLevel: 15,
          curve: {
            acceleration: 1.2,
            plateau: 0.8,
            variance: 0.1,
            adjustment: []
          }
        },
        rewards: [
          {
            level: 1,
            rewards: ['starting-speed'],
            choices: [],
            notifications: []
          },
          {
            level: 5,
            rewards: ['unlock-hard-mode'],
            choices: [],
            notifications: [
              {
                enabled: true,
                type: 'popup',
                message: 'Hard Mode Unlocked!',
                duration: 3
              }
            ]
          },
          {
            level: 10,
            rewards: ['unlock-sprint-mode'],
            choices: [],
            notifications: [
              {
                enabled: true,
                type: 'animation',
                message: 'Sprint Mode Available!',
                duration: 5
              }
            ]
          }
        ],
        milestones: [
          {
            level: 15,
            name: 'Tetris Master',
            description: 'Reached maximum level in Tetris',
            rewards: ['master-title', 'golden-tetris-block'],
            unlocks: ['master-mode'],
            celebrations: [
              {
                type: 'animation',
                duration: 5,
                impact: 'both'
              }
            ]
          }
        ],
        prestige: {
          enabled: false,
          requirements: [],
          rewards: [],
          scaling: {
            multiplier: 1.0,
            benefit: '',
            cap: 0
          }
        }
      },
      skills: {
        skills: [
          {
            id: 'piece-rotation',
            name: 'Piece Rotation Mastery',
            description: 'Improve piece rotation speed and precision',
            type: 'passive',
            category: 'utility',
            maxLevel: 5,
            currentLevel: 0,
            requirements: [],
            effects: [
              {
                type: 'stat',
                target: 'rotation-speed',
                value: 0.2,
                scaling: {
                  type: 'linear',
                  base: 0.2,
                  coefficient: 0.1
                }
              }
            ],
            scaling: {
              enabled: true,
              formula: {
                type: 'linear',
                base: 0.2,
                coefficient: 0.1
              },
              cap: 1.0,
              breakpoints: [
                {
                  level: 3,
                  effect: 'instant-rotation',
                  value: 1
                }
              ]
            }
          }
        ],
        trees: [
          {
            id: 'tetris-skills',
            name: 'Tetris Skills',
            description: 'Master the art of Tetris',
            skills: ['piece-rotation'],
            layout: {
              type: 'linear',
              connections: [],
              positions: [
                {
                  skill: 'piece-rotation',
                  x: 0,
                  y: 0,
                  tier: 1
                }
              ]
            },
            requirements: []
          }
        ],
        points: {
          type: 'fixed',
          source: [
            {
              type: 'level',
              amount: 1,
              frequency: 'per-level'
            }
          ],
          maximum: 50,
          respec: {
            enabled: true,
            cost: {
              type: 'currency',
              value: 100,
              scaling: {
                type: 'linear',
                base: 100,
                coefficient: 50
              }
            },
            restrictions: [],
            confirmation: true
          }
        },
        progression: {
          experience: {
            enabled: true,
            sources: [
              {
                action: 'use-skill',
                skill: 'piece-rotation',
                amount: 10,
                condition: 'successful-rotation'
              }
            ],
            calculation: {
              type: 'linear',
              base: 10,
              coefficient: 1
            },
            caps: []
          },
          practice: {
            enabled: true,
            metrics: [
              {
                type: 'accuracy',
                measurement: 'rotation-accuracy',
                tracking: true
              }
            ],
            improvement: [
              {
                type: 'passive',
                condition: '100-successful-rotations',
                effect: 'speed-bonus',
                value: 0.05
              }
            ]
          },
          mastery: {
            enabled: true,
            levels: [
              {
                level: 1,
                name: 'Rotation Novice',
                requirements: [
                  {
                    type: 'usage',
                    value: 100,
                    measurement: 'successful-rotations'
                  }
                ],
                effects: [
                  {
                    type: 'enhancement',
                    description: '5% faster rotation',
                    value: 0.05
                  }
                ]
              }
            ],
            rewards: [
              {
                type: 'cosmetic',
                value: 'rotation-novice-badge',
                cosmetic: true
              }
            ],
            challenges: []
          }
        }
      },
      achievements: {
        categories: [
          {
            id: 'tetris-achievements',
            name: 'Tetris Achievements',
            description: 'Master the classic block-dropping puzzle',
            icon: 'tetris-icon',
            achievements: [
              {
                id: 'first-tetris',
                name: 'First Tetris',
                description: 'Clear four lines at once',
                type: 'challenge',
                difficulty: 'easy',
                rarity: 'common',
                requirements: [
                  {
                    type: 'action',
                    value: 'clear-four-lines',
                    operator: 'equals'
                  }
                ],
                rewards: ['tetris-badge'],
                hidden: false,
                repeatable: false,
                tracking: {
                  progress: true,
                  progressVisible: true,
                  milestones: []
                }
              }
            ],
            completionReward: ['tetris-master-title']
          }
        ],
        tracking: {
          realtime: true,
          batching: false,
          persistence: true,
          validation: [
            {
              type: 'anti-cheat',
              enabled: true,
              parameters: []
            }
          ]
        },
        rewards: [
          {
            type: 'cosmetic',
            value: 'achievement-badge',
            scaling: false,
            cosmetic: true,
            announcement: true
          }
        ],
        display: {
          notification: [
            {
              trigger: 'unlock',
              type: 'popup',
              duration: 3,
              content: {
                title: 'Achievement Unlocked!',
                description: '',
                icon: 'achievement-icon',
                color: 'gold',
                sound: 'achievement-sound'
              }
            }
          ],
          showcase: {
            enabled: true,
            layout: 'grid',
            filtering: [
              {
                type: 'category',
                options: ['tetris-achievements']
              }
            ],
            sorting: [
              {
                type: 'date',
                direction: 'descending'
              }
            ]
          },
          comparison: {
            enabled: true,
            scope: [
              {
                type: 'friends',
                enabled: true
              }
            ],
            privacy: {
              public: true,
              friends: true,
              guild: false,
              anonymous: false
            }
          }
        }
      },
      mastery: {
        tracks: [
          {
            id: 'tetris-mastery',
            name: 'Tetris Mastery',
            description: 'Master the art of Tetris',
            type: 'skill',
            levels: [
              {
                level: 1,
                name: 'Block Dropper',
                requirements: [
                  {
                    type: 'performance',
                    value: 100,
                    measurement: 'total-lines-cleared'
                  }
                ],
                effects: [
                  {
                    type: 'stat',
                    target: 'drop-speed',
                    value: 0.05,
                    scaling: {
                      type: 'linear',
                      base: 0.05,
                      coefficient: 0.01
                    }
                  }
                ],
                cosmetics: [
                  {
                    type: 'badge',
                    id: 'block-dropper-badge',
                    name: 'Block Dropper',
                    description: 'Cleared 100 lines',
                    rarity: 'common'
                  }
                ]
              }
            ],
            requirements: [],
            rewards: [
              {
                type: 'cosmetic',
                value: 'mastery-badge',
                permanent: true,
                display: true
              }
            ]
          }
        ],
        progression: {
          tracking: {
            metrics: [
              {
                name: 'lines-cleared',
                type: 'performance',
                calculation: 'sum(lines-cleared)',
                weighting: 1.0
              }
            ],
            realtime: true,
            aggregation: 'total'
          },
          acceleration: {
            enabled: false,
            multipliers: [],
            bonuses: []
          },
          caps: []
        },
        recognition: {
          titles: [
            {
              id: 'tetris-master',
              name: 'Tetris Master',
              requirement: {
                type: 'achievement',
                value: 'level-10'
              },
              display: {
                prefix: false,
                suffix: true,
                color: 'gold',
                icon: 'tetris-icon'
              }
            }
          ],
          badges: [
            {
              id: 'speed-demon',
              name: 'Speed Demon',
              description: 'Achieve lightning-fast clearing speed',
              icon: 'speed-icon',
              rarity: 'epic',
              requirement: {
                type: 'performance',
                value: 60,
                measurement: 'lines-per-minute'
              },
              display: {
                position: 'nameplate',
                size: 'medium',
                animation: true
              }
            }
          ],
          leaderboards: [
            {
              id: 'tetris-lines',
              name: 'Most Lines Cleared',
              type: 'individual',
              metric: 'total-lines-cleared',
              timeframe: {
                type: 'all-time',
                reset: 'never'
              },
              rewards: [
                {
                  rank: [1, 1],
                  rewards: ['golden-block-badge'],
                  display: true
                }
              ]
            }
          ],
          showcases: [
            {
              enabled: true,
              layout: {
                type: 'highlights',
                customization: [
                  {
                    type: 'theme',
                    options: ['tetris-classic', 'modern', 'minimalist']
                  }
                ]
              },
              filtering: [
                {
                  type: 'recent',
                  options: ['last-week', 'last-month']
                }
              ],
              sharing: {
                enabled: true,
                platforms: ['twitter', 'facebook', 'discord'],
                privacy: {
                  public: false,
                  friends: true,
                  guild: true,
                  custom: true
                }
              }
            }
          ]
        },
        community: {
          comparison: {
            enabled: true,
            anonymity: false,
            metrics: [
              {
                name: 'mastery-level',
                type: 'absolute',
                display: true
              },
              {
                name: 'lines-cleared',
                type: 'percentile',
                display: true
              }
            ]
          },
          mentorship: {
            enabled: false,
            roles: [],
            benefits: []
          },
          events: [
            {
              id: 'tetris-tournament',
              name: 'Tetris Tournament',
              description: 'Compete against other players in timed challenges',
              type: 'competition',
              schedule: {
                start: '2024-01-01T00:00:00Z',
                end: '2024-01-07T23:59:59Z',
                recurring: true,
                frequency: 'weekly'
              },
              participation: {
                requirements: [
                  {
                    type: 'level',
                    value: 5
                  }
                ],
                rules: [
                  'No cheating',
                  'Time limit: 5 minutes',
                  'Standard Tetris rules apply'
                ],
                scoring: {
                  metric: 'lines-cleared',
                  calculation: 'sum(lines-cleared)',
                  weighting: 1.0
                }
              },
              rewards: ['tournament-badge', 'exclusive-skin']
            }
          ]
        }
      },
      social: {
        guilds: {
          levels: [],
          activities: [],
          rewards: [],
          contributions: []
        },
        teams: {
          chemistry: {
            enabled: false,
            metrics: [],
            bonuses: []
          },
          achievements: [],
          rankings: [],
          rewards: []
        },
        friendships: {
          levels: [],
          activities: [],
          benefits: [],
          gifts: []
        },
        leaderboards: [
          {
            id: 'tetris-global',
            name: 'Global Tetris Leaderboard',
            type: 'individual',
            metric: 'total-lines-cleared',
            timeframe: {
              type: 'weekly',
              reset: 'every-monday-00:00'
            },
            participants: [
              {
                type: 'player',
                filters: [
                  {
                    type: 'activity',
                    value: 'active-last-week'
                  }
                ]
              }
            ],
            rewards: [
              {
                rank: [1, 10],
                rewards: ['weekly-top-badge'],
                display: true
              }
            ]
          }
        ]
      },
      balance: {
        pacing: {
          earlyGame: 1.2,
          midGame: 1.0,
          lateGame: 0.8,
          consistency: 0.9
        },
        difficulty: {
          accessibility: 0.8,
          challenge: 0.7,
          mastery: 0.9,
          scaling: 1.1
        },
        rewards: {
          frequency: 0.9,
          value: 0.8,
          variety: 0.7,
          motivation: 0.9
        },
        retention: {
          hooks: 0.8,
          progression: 0.9,
          social: 0.3,
          longTerm: 0.8
        }
      }
    }
  }
}

// ===== VALIDATION SCHEMAS =====

export const CombatSystemFrameworkSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['hitscan', 'projectile', 'melee', 'area', 'dot', 'hybrid']),
  damageModel: z.object({
    type: z.enum(['flat', 'percentage', 'scaling', 'exponential', 'logarithmic']),
    calculation: z.enum(['base', 'skill-based', 'attribute-based', 'position-based', 'combo-based']),
    scaling: z.object({
      enabled: z.boolean(),
      formula: z.object({
        type: z.enum(['linear', 'exponential', 'logarithmic', 's-curve']),
        base: z.number(),
        coefficient: z.number(),
        exponent: z.number().optional(),
        offset: z.number().optional()
      }),
      multipliers: z.array(z.object({
        type: z.enum(['critical', 'weakness', 'resistance', 'position', 'combo']),
        value: z.number(),
        condition: z.string()
      })),
      caps: z.array(z.object({
        type: z.enum(['minimum', 'maximum', 'percentage']),
        value: z.number(),
        appliesTo: z.array(z.string())
      }))
    }),
    mitigation: z.object({
      armor: z.object({
        enabled: z.boolean(),
        type: z.enum(['flat', 'percentage', 'threshold']),
        calculation: z.string(),
        penetration: z.boolean()
      }),
      resistance: z.object({
        elements: z.array(z.object({
          element: z.string(),
          value: z.number(),
          type: z.enum(['percentage', 'flat'])
        })),
        stacking: z.object({
          type: z.enum(['additive', 'multiplicative', 'diminishing-returns']),
          cap: z.number()
        })
      }),
      evasion: z.object({
        enabled: z.boolean(),
        baseChance: z.number(),
        scaling: z.object({
          type: z.enum(['linear', 'exponential', 'logarithmic', 's-curve']),
          base: z.number(),
          coefficient: z.number()
        }),
        accuracyCounter: z.boolean()
      }),
      blocking: z.object({
        enabled: z.boolean(),
        type: z.enum(['directional', 'timing', 'percentage']),
        successChance: z.number(),
        damageReduction: z.number()
      })
    }),
    variance: z.object({
      enabled: z.boolean(),
      range: z.tuple([z.number(), z.number()]),
      distribution: z.enum(['uniform', 'normal', 'weighted']),
      factors: z.array(z.object({
        type: z.enum(['distance', 'angle', 'movement', 'skill']),
        impact: z.number()
      }))
    })
  }),
  accuracySystem: z.object({
    type: z.enum(['hitscan', 'projectile', 'hybrid']),
    baseAccuracy: z.number(),
    falloff: z.object({
      enabled: z.boolean(),
      startDistance: z.number(),
      endDistance: z.number(),
      endAccuracy: z.number(),
      curve: z.enum(['linear', 'exponential', 'logarithmic'])
    }),
    modifiers: z.array(z.object({
      type: z.enum(['movement', 'stance', 'aiming', 'cover', 'skill']),
      modifier: z.number(),
      condition: z.string()
    })),
    spread: z.object({
      enabled: z.boolean(),
      baseSpread: z.number(),
      maxSpread: z.number(),
      increasePerShot: z.number(),
      decreaseRate: z.number(),
      recoil: z.object({
        pattern: z.object({
          type: z.enum(['linear', 'circular', 'random', 'pattern']),
          parameters: z.array(z.number())
        }),
        intensity: z.number(),
        recovery: z.number(),
        control: z.boolean()
      })
    })
  }),
  rangeSystem: z.object({
    type: z.enum(['melee', 'ranged', 'mixed']),
    effectiveRange: z.number(),
    maximumRange: z.number(),
    damageFalloff: z.object({
      enabled: z.boolean(),
      startDistance: z.number(),
      endDistance: z.number(),
      damageMultiplier: z.number()
    }),
    areaOfEffect: z.object({
      enabled: z.boolean(),
      shape: z.enum(['circle', 'cone', 'line', 'custom']),
      radius: z.number(),
      damageProfile: z.object({
        type: z.enum(['flat', 'falloff', 'inverse-square']),
        centerDamage: z.number(),
        edgeDamage: z.number()
      })
    })
  }),
  cooldownSystem: z.object({
    type: z.enum(['fixed', 'variable', 'charge-based', 'resource-based']),
    baseCooldown: z.number(),
    reduction: z.array(z.object({
      type: z.enum(['stat', 'item', 'skill', 'external']),
      value: z.number(),
      source: z.string()
    })),
    sharing: z.object({
      enabled: z.boolean(),
      groups: z.array(z.string()),
      sharingType: z.enum(['reset', 'add', 'average'])
    })
  }),
  criticalSystem: z.object({
    enabled: z.boolean(),
    baseChance: z.number(),
    damageMultiplier: z.number(),
    scaling: z.object({
      type: z.enum(['flat', 'percentage', 'exponential']),
      formula: z.object({
        type: z.enum(['linear', 'exponential', 'logarithmic', 's-curve']),
        base: z.number(),
        coefficient: z.number()
      }),
      cap: z.number()
    }),
    effects: z.array(z.object({
      type: z.enum(['damage', 'stun', 'knockback', 'status']),
      value: z.number(),
      duration: z.number().optional()
    }))
  }),
  statusEffects: z.object({
    enabled: z.boolean(),
    effects: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['buff', 'debuff', 'crowd-control', 'damage', 'healing']),
      duration: z.number(),
      stacking: z.boolean(),
      dispellable: z.boolean(),
      effects: z.array(z.object({
        type: z.enum(['attribute', 'damage', 'healing', 'movement', 'special']),
        value: z.number(),
        attribute: z.string().optional()
      }))
    })),
    stacking: z.object({
      enabled: z.boolean(),
      maxStacks: z.number(),
      stackingType: z.enum(['additive', 'multiplicative', 'refresh'])
    }),
    cleansing: z.object({
      enabled: z.boolean(),
      types: z.array(z.enum(['buff', 'debuff', 'crowd-control', 'damage', 'healing'])),
      conditions: z.array(z.string())
    }),
    immunity: z.object({
      enabled: z.boolean(),
      types: z.array(z.enum(['buff', 'debuff', 'crowd-control', 'damage', 'healing'])),
      duration: z.number(),
      sources: z.array(z.string())
    })
  }),
  resourceSystem: z.object({
    resources: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['health', 'mana', 'energy', 'stamina', 'ammo', 'special', 'custom']),
      maxValue: z.number(),
      currentValue: z.number(),
      regeneration: z.object({
        enabled: z.boolean(),
        rate: z.number(),
        interval: z.number(),
        condition: z.string()
      })
    })),
    regeneration: z.object({
      enabled: z.boolean(),
      resources: z.array(z.string()),
      conditions: z.array(z.object({
        type: z.enum(['combat', 'out-of-combat', 'time', 'position', 'custom']),
        requirement: z.string(),
        effect: z.string()
      })),
      multipliers: z.array(z.object({
        type: z.enum(['stat', 'item', 'skill', 'environment']),
        value: z.number(),
        source: z.string()
      }))
    }),
    consumption: z.object({
      enabled: z.boolean(),
      resources: z.array(z.string()),
      costs: z.array(z.object({
        action: z.string(),
        resource: z.string(),
        amount: z.number(),
        scaling: z.object({
          type: z.enum(['linear', 'exponential', 'logarithmic', 's-curve']),
          base: z.number(),
          coefficient: z.number()
        })
      })),
      efficiencies: z.array(z.object({
        type: z.enum(['stat', 'item', 'skill']),
        resource: z.string(),
        reduction: z.number(),
        condition: z.string()
      }))
    }),
    management: z.object({
      enabled: z.boolean(),
      pooling: z.boolean(),
      conversion: z.array(z.object({
        from: z.string(),
        to: z.string(),
        ratio: z.number(),
        efficiency: z.number()
      })),
      optimization: z.array(z.object({
        type: z.enum(['usage', 'generation', 'efficiency']),
        method: z.string(),
        impact: z.number()
      }))
    })
  }),
  balance: z.object({
    damagePerSecond: z.object({
      minimum: z.number(),
      maximum: z.number(),
      average: z.number(),
      variance: z.number(),
      scaling: z.object({
        type: z.enum(['linear', 'exponential', 'logarithmic', 's-curve']),
        base: z.number(),
        coefficient: z.number()
      })
    }),
    survivability: z.object({
      effectiveHealth: z.number(),
      mitigation: z.number(),
      evasion: z.number(),
      regeneration: z.number()
    }),
    utility: z.object({
      crowdControl: z.number(),
      mobility: z.number(),
      support: z.number(),
      versatility: z.number()
    }),
    scaling: z.object({
      earlyGame: z.number(),
      midGame: z.number(),
      lateGame: z.number(),
      consistency: z.number()
    })
  })
})

export const MovementSystemFrameworkSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['linear', 'physics-based', 'grid-based', 'node-based', 'hybrid']),
  baseMovement: z.object({
    speed: z.number(),
    acceleration: z.number(),
    deceleration: z.number(),
    friction: z.number(),
    turnSpeed: z.number()
  }),
  advancedMovement: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['jump', 'double-jump', 'dash', 'sprint', 'slide', 'wall-run', 'climb', 'fly', 'teleport', 'grapple']),
    requirements: z.array(z.object({
      type: z.enum(['resource', 'condition', 'cooldown', 'equipment']),
      value: z.union([z.string(), z.number()])
    })),
    effects: z.array(z.object({
      type: z.enum(['speed', 'direction', 'position', 'state']),
      value: z.union([z.number(), z.string()]),
      duration: z.number().optional()
    })),
    cost: z.object({
      type: z.enum(['resource', 'cooldown', 'stamina']),
      value: z.number(),
      resource: z.string().optional()
    })
  })),
  physics: z.object({
    gravity: z.object({
      enabled: z.boolean(),
      value: z.number(),
      scaling: z.object({
        type: z.enum(['linear', 'exponential', 'logarithmic', 's-curve']),
        base: z.number(),
        coefficient: z.number()
      })
    }),
    friction: z.object({
      enabled: z.boolean(),
      value: z.number(),
      scaling: z.object({
        type: z.enum(['linear', 'exponential', 'logarithmic', 's-curve']),
        base: z.number(),
        coefficient: z.number()
      })
    }),
    airResistance: z.object({
      enabled: z.boolean(),
      value: z.number(),
      scaling: z.object({
        type: z.enum(['linear', 'exponential', 'logarithmic', 's-curve']),
        base: z.number(),
        coefficient: z.number()
      })
    }),
    collision: z.object({
      enabled: z.boolean(),
      type: z.enum(['box', 'sphere', 'capsule', 'mesh']),
      layers: z.array(z.object({
        name: z.string(),
        collisionWith: z.array(z.string()),
        block: z.boolean(),
        overlap: z.boolean()
      })),
      response: z.object({
        type: z.enum(['stop', 'slide', 'bounce', 'custom']),
        parameters: z.array(z.number())
      })
    })
  }),
  environment: z.object({
    terrain: z.array(z.object({
      terrain: z.string(),
      effect: z.object({
        speed: z.number(),
        mobility: z.number(),
        visibility: z.number(),
        special: z.array(z.string())
      }),
      multiplier: z.number()
    })),
    weather: z.array(z.object({
      weather: z.string(),
      impact: z.object({
        movement: z.number(),
        visibility: z.number(),
        accuracy: z.number(),
        special: z.array(z.string())
      }),
      duration: z.number()
    })),
    hazards: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['damage', 'movement', 'status', 'environmental']),
      effect: z.string(),
      area: z.string()
    })),
    benefits: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['movement', 'resource', 'combat', 'utility']),
      effect: z.string(),
      duration: z.number()
    }))
  }),
  constraints: z.object({
    boundaries: z.object({
      enabled: z.boolean(),
      type: z.enum(['hard', 'soft', 'wrap', 'custom']),
      shape: z.enum(['box', 'sphere', 'custom']),
      response: z.string()
    }),
    restrictions: z.array(z.object({
      type: z.enum(['area', 'condition', 'status', 'equipment']),
      effect: z.string(),
      severity: z.number()
    })),
    penalties: z.array(z.object({
      trigger: z.string(),
      effect: z.string(),
      duration: z.number(),
      stacking: z.boolean()
    }))
  }),
  balance: z.object({
    speed: z.object({
      base: z.number(),
      maximum: z.number(),
      average: z.number(),
      variance: z.number()
    }),
    mobility: z.object({
      options: z.number(),
      effectiveness: z.number(),
      risk: z.number(),
      reward: z.number()
    }),
    positioning: z.object({
      control: z.number(),
      flexibility: z.number(),
      predictability: z.number(),
      counterplay: z.number()
    }),
    accessibility: z.object({
      complexity: z.number(),
      learningCurve: z.number(),
      mastery: z.number(),
      accessibility: z.number()
    })
  })
})

// Default exports
export default GameMechanicsTemplates
/**
 * 📋 KILL FEED MANAGER
 * 
 * Live kill log display (top-right corner)
 * - Killer + Weapon Icon + Victim
 * - Headshot Icons (💀)
 * - Killstreak Indicators
 * - Color-coded (Enemy/Friendly)
 * - Fade-out Animation
 */

export interface KillFeedEntry {
  id: string
  killer: string
  victim: string
  weapon: string
  isHeadshot: boolean
  killstreak?: number
  timestamp: number
  isPlayer: boolean // true if player is the killer
}

export interface KillFeedConfig {
  maxEntries: number
  entryLifetime: number // milliseconds
  fadeOutDuration: number // milliseconds
  position: { top: number; right: number }
  entryHeight: number
}

const DEFAULT_CONFIG: KillFeedConfig = {
  maxEntries: 5,
  entryLifetime: 5000, // 5 seconds
  fadeOutDuration: 1000, // 1 second fade
  position: { top: 80, right: 20 },
  entryHeight: 35
}

export class KillFeedManager {
  private entries: KillFeedEntry[] = []
  private config: KillFeedConfig
  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement, config?: Partial<KillFeedConfig>) {
    this.canvas = canvas
    this.config = { ...DEFAULT_CONFIG, ...config }
    console.log('📋 Kill Feed Manager initialized')
  }

  /**
   * Add kill to feed
   */
  addKill(kill: Omit<KillFeedEntry, 'id' | 'timestamp'>): void {
    const entry: KillFeedEntry = {
      ...kill,
      id: `kill_${Date.now()}_${Math.random()}`,
      timestamp: Date.now()
    }

    this.entries.unshift(entry) // Add to beginning

    // Remove oldest if exceeds max
    if (this.entries.length > this.config.maxEntries) {
      this.entries.pop()
    }

    console.log(`📋 Kill Feed: ${kill.killer} [${kill.weapon}] ${kill.victim}${kill.isHeadshot ? ' 💀' : ''}`)
  }

  /**
   * Update (remove expired entries)
   */
  update(): void {
    const now = Date.now()
    this.entries = this.entries.filter(entry => {
      const age = now - entry.timestamp
      return age < this.config.entryLifetime + this.config.fadeOutDuration
    })
  }

  /**
   * Render kill feed
   */
  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.entries.length === 0) return

    const now = Date.now()
    const { position, entryHeight } = this.config

    ctx.save()

    // Font settings
    ctx.font = 'bold 14px "Arial", sans-serif'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    ctx.shadowBlur = 4

    this.entries.forEach((entry, index) => {
      const age = now - entry.timestamp
      const y = position.top + index * entryHeight

      // Calculate opacity (fade out at the end)
      let opacity = 1.0
      if (age > this.config.entryLifetime) {
        const fadeProgress = (age - this.config.entryLifetime) / this.config.fadeOutDuration
        opacity = 1 - fadeProgress
      }

      // Draw entry
      this.renderEntry(ctx, entry, width - position.right, y, opacity)
    })

    ctx.restore()
  }

  /**
   * Render single entry
   */
  private renderEntry(
    ctx: CanvasRenderingContext2D,
    entry: KillFeedEntry,
    x: number,
    y: number,
    opacity: number
  ): void {
    // Colors
    const killerColor = entry.isPlayer ? '#00ff88' : '#ff4444'
    const victimColor = '#cccccc'
    const weaponColor = '#ffaa00'
    const headshotColor = '#ff0000'

    // Measurements
    const killerText = entry.killer
    const weaponText = `[${this.getWeaponShortName(entry.weapon)}]`
    const victimText = entry.victim
    const headshotIcon = entry.isHeadshot ? ' 💀' : ''
    const killstreakText = entry.killstreak && entry.killstreak > 2 ? ` (${entry.killstreak}x)` : ''

    // Measure widths
    const killerWidth = ctx.measureText(killerText).width
    const weaponWidth = ctx.measureText(weaponText).width
    const victimWidth = ctx.measureText(victimText).width
    const headshotWidth = entry.isHeadshot ? ctx.measureText(headshotIcon).width : 0
    const killstreakWidth = entry.killstreak && entry.killstreak > 2 ? ctx.measureText(killstreakText).width : 0

    // Total width
    const spacing = 8
    const totalWidth = killerWidth + weaponWidth + victimWidth + headshotWidth + killstreakWidth + spacing * 4

    // Background
    ctx.globalAlpha = opacity * 0.7
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(x - totalWidth - 10, y - 14, totalWidth + 20, 28)

    // Border
    ctx.strokeStyle = entry.isPlayer ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.strokeRect(x - totalWidth - 10, y - 14, totalWidth + 20, 28)

    // Text rendering
    ctx.globalAlpha = opacity
    let currentX = x - totalWidth

    // Killer name
    ctx.fillStyle = killerColor
    ctx.fillText(killerText, currentX, y)
    currentX += killerWidth + spacing

    // Weapon
    ctx.fillStyle = weaponColor
    ctx.fillText(weaponText, currentX, y)
    currentX += weaponWidth + spacing

    // Victim name
    ctx.fillStyle = victimColor
    ctx.fillText(victimText, currentX, y)
    currentX += victimWidth + spacing

    // Headshot icon
    if (entry.isHeadshot) {
      ctx.fillStyle = headshotColor
      ctx.fillText(headshotIcon, currentX, y)
      currentX += headshotWidth + spacing
    }

    // Killstreak
    if (entry.killstreak && entry.killstreak > 2) {
      ctx.fillStyle = '#ffaa00'
      ctx.font = 'bold 12px "Arial", sans-serif'
      ctx.fillText(killstreakText, currentX, y)
      ctx.font = 'bold 14px "Arial", sans-serif'
    }

    ctx.globalAlpha = 1.0
  }

  /**
   * Get short weapon name
   */
  private getWeaponShortName(weapon: string): string {
    const shortNames: Record<string, string> = {
      // Assault Rifles
      'AK-47': 'AK47',
      'M4A1': 'M4',
      'SCAR-H': 'SCAR',
      'AUG': 'AUG',
      'FAMAS': 'FAMAS',
      'G36C': 'G36',
      
      // SMGs
      'MP5': 'MP5',
      'UMP45': 'UMP',
      'P90': 'P90',
      'Vector': 'Vector',
      'MP7': 'MP7',
      
      // Sniper Rifles
      'AWP': 'AWP',
      'Barrett': 'M82',
      'Kar98k': 'Kar98',
      'R700': 'R700',
      'DSR-50': 'DSR',
      
      // Shotguns
      'SPAS-12': 'SPAS',
      'AA-12': 'AA12',
      'Model 1887': 'M1887',
      
      // LMGs
      'M249': 'M249',
      'RPK': 'RPK',
      'MG42': 'MG42',
      
      // Pistols
      'Desert Eagle': 'Deagle',
      'M1911': 'M1911',
      'Glock-18': 'Glock',
      'USP-S': 'USP',
      
      // Default
      'pistol': 'Pistol',
      'assault': 'AR',
      'sniper': 'Sniper',
      'smg': 'SMG',
      'shotgun': 'Shotgun',
      'lmg': 'LMG'
    }

    return shortNames[weapon] || weapon.substring(0, 8).toUpperCase()
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = []
  }

  /**
   * Get all entries
   */
  getEntries(): KillFeedEntry[] {
    return [...this.entries]
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<KillFeedConfig>): void {
    this.config = { ...this.config, ...config }
  }
}


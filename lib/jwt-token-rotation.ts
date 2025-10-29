/**
 * 🔐 JWT Token Rotation System
 * Implementiert automatische Token-Erneuerung für erhöhte Sicherheit
 * 
 * Features:
 * - Refresh Token Mechanism
 * - Token Blacklisting
 * - Automatic Rotation
 * - Redis-backed Storage
 */

import { SignJWT, jwtVerify } from 'jose'
import { Redis } from 'ioredis'
import { v4 as uuidv4 } from 'uuid'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production'
)

const ACCESS_TOKEN_EXPIRY = '15m' // Kurze Lebenszeit für Access Tokens
const REFRESH_TOKEN_EXPIRY = '7d' // Längere Lebenszeit für Refresh Tokens

export interface TokenPair {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date
}

export interface RefreshTokenPayload {
  userId: string
  jti: string // JWT ID für Token-Tracking
  iat: number
  exp: number
}

export class JWTRotationService {
  private redis: Redis | null = null

  constructor() {
    // Redis optional - funktioniert auch ohne für Development
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL)
      }
    } catch (error) {
      console.warn('[JWT Rotation] Redis nicht verfügbar, Token-Rotation läuft ohne Persistenz')
    }
  }

  /**
   * Erstellt ein neues Token-Paar (Access + Refresh)
   */
  async createTokenPair(userId: string, additionalClaims?: Record<string, any>): Promise<TokenPair> {
    const jti = uuidv4()
    const now = Math.floor(Date.now() / 1000)

    // Access Token (kurze Lebenszeit)
    const accessToken = await new SignJWT({
      userId,
      type: 'access',
      ...additionalClaims
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime('15m')
      .setJti(jti)
      .sign(JWT_SECRET)

    // Refresh Token (längere Lebenszeit)
    const refreshToken = await new SignJWT({
      userId,
      type: 'refresh'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime('7d')
      .setJti(jti)
      .sign(JWT_SECRET)

    // Speichere Refresh Token in Redis (wenn verfügbar)
    if (this.redis) {
      const refreshTokenKey = `refresh_token:${userId}:${jti}`
      await this.redis.setex(refreshTokenKey, 7 * 24 * 60 * 60, JSON.stringify({
        jti,
        userId,
        createdAt: new Date().toISOString()
      }))
    }

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: new Date(now * 1000 + 15 * 60 * 1000),
      refreshTokenExpiresAt: new Date(now * 1000 + 7 * 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Verifiziert einen Access Token
   */
  async verifyAccessToken(token: string): Promise<any> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      
      if (payload.type !== 'access') {
        throw new Error('Invalid token type')
      }

      // Prüfe ob Token blacklisted ist
      if (this.redis && payload.jti) {
        const isBlacklisted = await this.redis.get(`blacklist:${payload.jti}`)
        if (isBlacklisted) {
          throw new Error('Token has been revoked')
        }
      }

      return payload
    } catch (error) {
      throw new Error('Invalid or expired access token')
    }
  }

  /**
   * Erneuert ein Token-Paar mit einem Refresh Token
   */
  async refreshTokenPair(refreshToken: string): Promise<TokenPair> {
    try {
      // Verifiziere Refresh Token
      const { payload } = await jwtVerify(refreshToken, JWT_SECRET)

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type')
      }

      const userId = payload.userId as string
      const jti = payload.jti as string

      // Prüfe ob Refresh Token noch gültig ist (Redis)
      if (this.redis) {
        const refreshTokenKey = `refresh_token:${userId}:${jti}`
        const storedToken = await this.redis.get(refreshTokenKey)
        
        if (!storedToken) {
          throw new Error('Refresh token not found or expired')
        }

        // Lösche alten Refresh Token
        await this.redis.del(refreshTokenKey)
      }

      // Erstelle neues Token-Paar
      return await this.createTokenPair(userId)
    } catch (error) {
      throw new Error('Invalid or expired refresh token')
    }
  }

  /**
   * Widerruft einen Access Token (Blacklist)
   */
  async revokeAccessToken(token: string): Promise<void> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      
      if (this.redis && payload.jti && payload.exp) {
        const ttl = payload.exp - Math.floor(Date.now() / 1000)
        if (ttl > 0) {
          await this.redis.setex(`blacklist:${payload.jti}`, ttl, '1')
        }
      }
    } catch (error) {
      // Token bereits ungültig, nichts zu tun
    }
  }

  /**
   * Widerruft alle Tokens eines Users
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    if (!this.redis) return

    // Finde alle Refresh Tokens des Users
    const pattern = `refresh_token:${userId}:*`
    const keys = await this.redis.keys(pattern)

    // Lösche alle Refresh Tokens
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }

  /**
   * Cleanup: Entferne abgelaufene Tokens (Wartungsaufgabe)
   */
  async cleanup(): Promise<number> {
    if (!this.redis) return 0

    let cleaned = 0

    // Cleanup Refresh Tokens
    const refreshKeys = await this.redis.keys('refresh_token:*')
    for (const key of refreshKeys) {
      const ttl = await this.redis.ttl(key)
      if (ttl <= 0) {
        await this.redis.del(key)
        cleaned++
      }
    }

    // Cleanup Blacklist
    const blacklistKeys = await this.redis.keys('blacklist:*')
    for (const key of blacklistKeys) {
      const ttl = await this.redis.ttl(key)
      if (ttl <= 0) {
        await this.redis.del(key)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Schließe Redis-Verbindung
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
    }
  }
}

// Singleton-Instanz
export const jwtRotation = new JWTRotationService()

/**
 * Middleware-Helper: Token aus Request extrahieren
 */
export function extractTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  
  return parts[1]
}

/**
 * Middleware-Helper: Token automatisch erneuern wenn nötig
 */
export async function autoRefreshToken(accessToken: string, refreshToken: string): Promise<TokenPair | null> {
  try {
    // Versuche Access Token zu verifizieren
    await jwtRotation.verifyAccessToken(accessToken)
    return null // Token noch gültig, keine Erneuerung nötig
  } catch (error) {
    // Access Token abgelaufen, versuche mit Refresh Token zu erneuern
    try {
      return await jwtRotation.refreshTokenPair(refreshToken)
    } catch (refreshError) {
      // Beide Tokens ungültig
      return null
    }
  }
}


/**
 * Secure Communication Layer für GLXY Gaming Platform
 * Enterprise-grade verschlüsselte Kommunikation und TLS-Konfiguration
 */

import { createHash, createCipheriv, createDecipheriv, randomBytes, createHmac } from 'crypto'
import { z } from 'zod'

// TLS/SSL Konfiguration
export const TLS_CONFIG = {
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-CHACHA20-POLY1305',
    'ECDHE-ECDSA-CHACHA20-POLY1305'
  ].join(':'),
  honorCipherOrder: true,
  ecdhCurve: 'auto',
  dhparam: 2048
}

// Enhanced HTTPS Security Headers
export const SECURITY_HEADERS = {
  // Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Content Security Policy (Enhanced)
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'nonce-{CSP_NONCE}' https://apis.google.com https://www.googletagmanager.com",
    "style-src 'self' 'nonce-{CSP_NONCE}' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' wss: https:",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
    "block-all-mixed-content"
  ].join('; '),

  // Additional Security Headers
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',

  // Remove server information
  'Server': '',
  'X-Powered-By': ''
}

// End-to-End Encryption für sensitive Kommunikation
export class SecureMessaging {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY_LENGTH = 32
  private static readonly IV_LENGTH = 16
  private static readonly TAG_LENGTH = 16

  static generateSecureKey(): Buffer {
    return randomBytes(this.KEY_LENGTH)
  }

  static encrypt(plaintext: string, key: Buffer): {
    encrypted: string
    iv: string
    tag: string
  } {
    const iv = randomBytes(this.IV_LENGTH)
    const cipher = createCipheriv(this.ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    }
  }

  static decrypt(encryptedData: {
    encrypted: string
    iv: string
    tag: string
  }, key: Buffer): string {
    const decipher = createDecipheriv(
      this.ALGORITHM,
      key,
      Buffer.from(encryptedData.iv, 'hex')
    )

    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  // Secure key exchange für Echtzeit-Kommunikation
  static generateKeyExchange(): {
    publicKey: string
    privateKey: string
  } {
    // In production: Use ECDH key exchange
    const keyPair = {
      publicKey: randomBytes(32).toString('hex'),
      privateKey: randomBytes(32).toString('hex')
    }

    return keyPair
  }
}

// WebSocket Secure Communication
export class SecureWebSocket {
  private encryptionKey: Buffer | null = null

  constructor(private userId: string) {}

  async establishSecureChannel(peerPublicKey: string): Promise<void> {
    // Implementiere ECDH Key Exchange
    // Für Demo-Zwecke verwenden wir einen statischen Schlüssel
    this.encryptionKey = createHash('sha256')
      .update(`${this.userId}:${peerPublicKey}`)
      .digest()
  }

  encryptMessage(message: any): string {
    if (!this.encryptionKey) {
      throw new Error('Secure channel not established')
    }

    const plaintext = JSON.stringify(message)
    const encrypted = SecureMessaging.encrypt(plaintext, this.encryptionKey)

    return JSON.stringify({
      type: 'encrypted',
      data: encrypted,
      timestamp: Date.now()
    })
  }

  decryptMessage(encryptedMessage: string): any {
    if (!this.encryptionKey) {
      throw new Error('Secure channel not established')
    }

    try {
      const parsed = JSON.parse(encryptedMessage)

      if (parsed.type !== 'encrypted') {
        throw new Error('Invalid message type')
      }

      const decrypted = SecureMessaging.decrypt(parsed.data, this.encryptionKey)
      return JSON.parse(decrypted)
    } catch (error) {
      throw new Error('Failed to decrypt message')
    }
  }
}

// API Request Signing für Integrität
export class APIRequestSigning {
  static signRequest(
    method: string,
    url: string,
    body: string,
    timestamp: number,
    secretKey: string
  ): string {
    const message = `${method}\n${url}\n${body}\n${timestamp}`

    return createHmac('sha256', secretKey)
      .update(message)
      .digest('hex')
  }

  static verifySignature(
    signature: string,
    method: string,
    url: string,
    body: string,
    timestamp: number,
    secretKey: string
  ): boolean {
    const expectedSignature = this.signRequest(method, url, body, timestamp, secretKey)

    // Timing-safe comparison
    return signature.length === expectedSignature.length &&
           createHmac('sha256', 'compare')
             .update(signature)
             .digest('hex') ===
           createHmac('sha256', 'compare')
             .update(expectedSignature)
             .digest('hex')
  }
}

// Certificate Pinning für Mobile Apps
export const CERTIFICATE_PINS = {
  'glxy.at': [
    'sha256/YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=', // Hauptzertifikat
    'sha256/sRHdihwgkaib1P1gxX8HFszlD+7/gTfNvuAybgLPNis='  // Backup-Zertifikat
  ]
}

// Nginx TLS Konfiguration
export const NGINX_TLS_CONFIG = `
# Enhanced TLS Configuration für GLXY Gaming Platform

# SSL Protocols
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

# Cipher Suites (für TLSv1.2)
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

# TLS 1.3 Cipher Suites
ssl_conf_command Ciphersuites TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256;

# SSL Session Configuration
ssl_session_cache shared:SSL:50m;
ssl_session_timeout 1d;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# SSL Certificate Configuration
ssl_certificate /etc/letsencrypt/live/glxy.at/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/glxy.at/privkey.pem;
ssl_trusted_certificate /etc/letsencrypt/live/glxy.at/chain.pem;

# Perfect Forward Secrecy
ssl_ecdh_curve X25519:prime256v1:secp384r1;

# SSL Buffer Size Optimization
ssl_buffer_size 4k;

# HSTS Header (bereits in Security Headers definiert)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
`

// CORS Konfiguration
export const CORS_CONFIG = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'https://glxy.at',
      'https://www.glxy.at',
      // Für Development
      ...(process.env.NODE_ENV === 'development' ? [
        'http://localhost:3000',
        'http://localhost:3001'
      ] : [])
    ]

    // API-Aufrufe ohne Origin (z.B. Server-to-Server) erlauben
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'), false)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Request-ID',
    'X-Signature',
    'X-Timestamp'
  ],
  exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining'],
  maxAge: 86400 // 24 Stunden
}

// Network Security Monitoring
export class NetworkSecurityMonitor {
  private static suspiciousPatterns = [
    /sql.*injection/i,
    /<script.*>/i,
    /javascript:/i,
    /eval\(/i,
    /union.*select/i,
    /<iframe.*>/i
  ]

  static analyzeRequest(request: {
    method: string
    url: string
    headers: Record<string, string>
    body?: string
    ip: string
  }): {
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    threats: string[]
    shouldBlock: boolean
  } {
    const threats: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'

    // Analysiere URL auf verdächtige Muster
    const fullRequest = `${request.url} ${request.body || ''} ${JSON.stringify(request.headers)}`

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(fullRequest)) {
        threats.push(`Suspicious pattern detected: ${pattern.source}`)
        riskLevel = 'high'
      }
    }

    // Analysiere Request-Rate
    // (In Produktion: Redis-basierte Rate-Limiting-Analyse)

    // Analysiere Request-Größe
    const bodySize = request.body?.length || 0
    if (bodySize > 1024 * 1024) { // 1MB
      threats.push('Unusually large request body')
      if (riskLevel === 'low') riskLevel = 'medium'
    }

    // Analysiere User-Agent
    const userAgent = request.headers['user-agent'] || ''
    if (!userAgent || userAgent.length < 10) {
      threats.push('Missing or suspicious user agent')
      if (riskLevel === 'low') riskLevel = 'medium'
    }

    return {
      riskLevel,
      threats,
      shouldBlock: riskLevel === 'high' || threats.length >= 3
    }
  }

  static logSecurityEvent(event: {
    type: 'blocked_request' | 'suspicious_activity' | 'rate_limit_exceeded'
    request: any
    threats: string[]
    timestamp: Date
  }) {
    console.log('🛡️ Security Event:', {
      ...event,
      timestamp: event.timestamp.toISOString()
    })

    // In Produktion: An SIEM/Security-Monitoring-System senden
  }
}

// Let's Encrypt Integration Helper
export const LETSENCRYPT_CONFIG = {
  // Automatische Zertifikatserneuerung
  renewCommand: 'certbot renew --nginx --quiet',

  // Webhook für automatische Deployment-Updates
  webhookUrl: '/api/webhooks/ssl-renewal',

  // Challenge-Konfiguration für Domain-Validierung
  challengePath: '/.well-known/acme-challenge/',

  // Staging-Umgebung für Tests
  staging: process.env.NODE_ENV !== 'production'
}

export default {
  TLS_CONFIG,
  SECURITY_HEADERS,
  SecureMessaging,
  SecureWebSocket,
  APIRequestSigning,
  CERTIFICATE_PINS,
  NGINX_TLS_CONFIG,
  CORS_CONFIG,
  NetworkSecurityMonitor,
  LETSENCRYPT_CONFIG
}
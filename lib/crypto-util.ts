import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

function getKey() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET || 'fallback-secret'
  // Derive 32-byte key via SHA-256
  return crypto.createHash('sha256').update(secret).digest()
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12)
  const key = getKey()
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decrypt(b64: string): string {
  const buf = Buffer.from(b64, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const key = getKey()
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(data), decipher.final()])
  return dec.toString('utf8')
}


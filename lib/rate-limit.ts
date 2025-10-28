// @ts-nocheck
import { NextRequest } from 'next/server';
import { CacheManager } from './redis';

export interface RateLimitConfig {
  tokensPerInterval: number;
  interval: string;
}

export interface RateLimitResult {
  limit: number;
  remaining: number;
  reset: Date;
  success: boolean;
  allowed?: boolean;
}

export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = { tokensPerInterval: 10, interval: '1h' }
): Promise<RateLimitResult> {
  const ip = getClientIP(request);
  const key = `rate_limit:${ip}`;
  
  const windowMs = parseInterval(config.interval);
  const now = Date.now();
  
  try {
    // Use Redis for distributed rate limiting
    const current = await CacheManager.incr(key, Math.ceil(windowMs / 1000));
    const tokensRemaining = Math.max(0, config.tokensPerInterval - current);
    const success = tokensRemaining > 0;
    
    return {
      limit: config.tokensPerInterval,
      remaining: success ? tokensRemaining - 1 : 0,
      reset: new Date(now + windowMs),
      success
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open in case of Redis errors
    return {
      limit: config.tokensPerInterval,
      remaining: config.tokensPerInterval,
      reset: new Date(now + windowMs),
      success: true
    };
  }
}

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}

export async function checkSignupRateLimit(request: NextRequest): Promise<RateLimitResult> {
  return rateLimit(request, { tokensPerInterval: 1000, interval: '1m' });
}

export async function checkLoginRateLimit(request: NextRequest): Promise<RateLimitResult> {
  return rateLimit(request, { tokensPerInterval: 10, interval: '15m' });
}

export function formatRateLimitError(result: RateLimitResult): string {
  const resetTime = Math.ceil((result.reset.getTime() - Date.now()) / 1000 / 60);
  return `Rate limit exceeded. Try again in ${resetTime} minutes.`;
}

function parseInterval(interval: string): number {
  const match = interval.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid interval format');
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: throw new Error('Invalid time unit');
  }
}

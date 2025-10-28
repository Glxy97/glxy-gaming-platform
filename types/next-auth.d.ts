/**
 * TypeScript type definitions for NextAuth v5
 *
 * This file extends the default NextAuth types to include custom fields
 * like user ID in the session object.
 *
 * Note: The main type extensions are already done in lib/auth.ts,
 * but this file ensures they're available project-wide.
 */

import 'next-auth'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  /**
   * Extended Session interface
   *
   * Adds user ID and additional fields to the default session
   */
  interface Session {
    user: {
      id: string
      email: string
      username?: string | null
      name?: string | null
      image?: string | null
      level?: number
      globalXP?: number
    } & DefaultSession['user']
  }

  /**
   * Extended User interface
   *
   * Includes security fields for login attempt tracking
   */
  interface User {
    id: string
    email: string
    username?: string | null
    name?: string | null
    image?: string | null
    loginAttempts?: number | null
    lockedUntil?: Date | null
  }
}

declare module '@auth/core/jwt' {
  /**
   * Extended JWT interface
   *
   * Adds custom fields to the JWT token
   */
  interface JWT {
    id: string
    email: string
    username?: string | null
  }
}

export {}

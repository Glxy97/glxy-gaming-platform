/**
 * NextAuth v5 API Route Handler
 *
 * This file exports the GET and POST handlers for NextAuth authentication.
 * All authentication requests are handled through this catch-all route.
 *
 * Routes:
 * - GET/POST /api/auth/signin - Sign in page
 * - GET/POST /api/auth/signout - Sign out
 * - GET/POST /api/auth/callback/:provider - OAuth callback
 * - GET /api/auth/csrf - CSRF token
 * - GET /api/auth/session - Get current session
 * - GET /api/auth/providers - List available providers
 */

import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers

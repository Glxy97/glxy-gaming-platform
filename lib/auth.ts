import NextAuth, { type DefaultSession } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'
import type { Provider } from 'next-auth/providers'

/**
 * NextAuth v5 Configuration
 *
 * Features:
 * - Prisma adapter for database session management
 * - Credentials provider with bcryptjs password hashing
 * - OAuth providers: GitHub, Google
 * - Extended session with user ID
 * - Security: Account lockout after failed login attempts
 * - Account linking for OAuth providers
 * - Custom sign-in page
 */

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      username?: string | null
      name?: string | null
      image?: string | null
      role?: 'USER' | 'MODERATOR' | 'ADMIN'
    }
  }

  interface User {
    username?: string | null
    loginAttempts?: number | null
    lockedUntil?: Date | null
    role?: 'USER' | 'MODERATOR' | 'ADMIN'
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    email: string
    username?: string | null
  }
}

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

// Validate required environment variables for OAuth
const validateOAuthConfig = () => {
  const warnings: string[] = []

  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    warnings.push('GitHub OAuth credentials not configured')
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    warnings.push('Google OAuth credentials not configured')
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('[NextAuth] OAuth Configuration Warnings:')
    warnings.forEach(warning => console.warn(`  - ${warning}`))
  }
}

// Run validation on startup
validateOAuthConfig()

const providers: Provider[] = [
  CredentialsProvider({
    id: 'credentials',
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email', placeholder: 'user@example.com' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Email und Passwort sind erforderlich')
      }

      const email = credentials.email as string
      const password = credentials.password as string

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          image: true,
          password: true,
          loginAttempts: true,
          lockedUntil: true,
          lastLogin: true,
          emailVerified: true,
        },
      })

      if (!user) {
        throw new Error('Ungültige Anmeldedaten')
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
        throw new Error(`Account gesperrt. Versuchen Sie es in ${minutesLeft} Minuten erneut.`)
      }

      // Check email verification
      if (!user.emailVerified) {
        throw new Error('E-Mail-Adresse nicht verifiziert. Bitte prüfen Sie Ihre E-Mails.')
      }

      // Verify password
      const isPasswordValid = await compare(password, user.password)

      if (!isPasswordValid) {
        // Increment login attempts
        const newAttempts = (user.loginAttempts || 0) + 1
        const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS

        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: newAttempts,
            lockedUntil: shouldLock
              ? new Date(Date.now() + LOCKOUT_DURATION_MS)
              : null,
          },
        })

        if (shouldLock) {
          throw new Error('Zu viele fehlgeschlagene Anmeldeversuche. Account wurde für 15 Minuten gesperrt.')
        }

        throw new Error('Ungültige Anmeldedaten')
      }

      // Reset login attempts and update last login on successful login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLogin: new Date(),
        },
      })

      // Return user object (password excluded)
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        image: user.image,
      }
    },
  }),
]

// Add GitHub OAuth provider if credentials are configured
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          username: null, // User must choose username
        }
      },
    })
  )
}

// Add Google OAuth provider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          username: null, // User must choose username
        }
      },
    })
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  trustHost: true, // Required for proxies (nginx, docker)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    pkceCodeVerifier: {
      name: 'authjs.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    state: {
      name: 'authjs.state',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900, // 15 minutes - State should be short-lived
      },
    },
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, trigger, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.username = user.username
      }

      // OAuth sign in - check if user needs username setup
      if (account?.provider !== 'credentials' && user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true },
        })

        // Mark that username setup is needed if username is missing
        if (!dbUser?.username) {
          token.needsUsernameSetup = true
        }
      }

      // Handle token updates
      if (trigger === 'update') {
        // Fetch fresh user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            image: true,
          },
        })

        if (dbUser) {
          token.email = dbUser.email
          token.username = dbUser.username
          token.name = dbUser.name
          token.picture = dbUser.image
        }
      }

      return token
    },
    async session({ session, token }) {
      // Add user ID and additional fields to session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.username = token.username as string | null
        // @ts-ignore - Add needsUsernameSetup flag
        session.user.needsUsernameSetup = token.needsUsernameSetup || false
      }

      return session
    },
    async redirect({ url, baseUrl }) {
      // Check if this is an OAuth callback (contains /api/auth/callback/)
      const isOAuthCallback = url.includes('/api/auth/callback/')

      // After OAuth login, always redirect to /profile
      // The profile page will check if username setup is needed
      if (isOAuthCallback) {
        return `${baseUrl}/profile`
      }

      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async signIn({ user, account, profile }) {
      // For OAuth providers, ensure user has required fields
      if (account?.provider !== 'credentials') {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          })

          if (existingUser) {
            // Update last login and email verification for existing users
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                lastLogin: new Date(),
                emailVerified: new Date(), // Ensure OAuth users are verified
                // Update profile picture if changed
                image: user.image || existingUser.image,
              },
            })
          }
          // For new users, Prisma Adapter will create the user automatically
          // emailVerified will be set by the adapter

          return true
        } catch (error) {
          console.error('[NextAuth] OAuth sign-in error:', error)
          return false
        }
      }

      return true
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      const provider = account?.provider || 'unknown'
      console.log(`[NextAuth] User signed in: ${user.email} via ${provider} (isNewUser: ${isNewUser})`)

      if (isNewUser) {
        console.log(`[NextAuth] New user registered: ${user.email} via ${provider}`)
      }
    },
    async signOut(params) {
      const email = 'token' in params ? params.token?.email : undefined
      console.log(`[NextAuth] User signed out: ${email || 'unknown'}`)
    },
    async linkAccount({ user, account }) {
      console.log(`[NextAuth] Account linked: ${account.provider} for user ${user.email}`)
    },
  },
  debug: process.env.NODE_ENV === 'development',
})

import { PrismaClient } from '@prisma/client'
import fs from 'fs'

/**
 * Enhanced Database Connection with Performance Optimizations
 * Imports optimized configuration for production gaming performance
 */

// Import optimized prisma client for production use
import { prisma as optimizedPrisma } from './db-optimized'

// For backwards compatibility, export the optimized client
export const prisma = optimizedPrisma

// Legacy client for fallback (if needed)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const legacyPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = legacyPrisma

// Export both for flexibility
export { legacyPrisma }
export default prisma

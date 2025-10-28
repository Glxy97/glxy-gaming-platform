// Re-export auth from lib/auth.ts
// This file exists to support @/auth imports (root-level alias)
export { handlers, auth, signIn, signOut } from '@/lib/auth'

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock next-auth to avoid ESM issues
jest.mock('next-auth', () => ({
  default: jest.fn(),
  getServerSession: jest.fn(),
}))

jest.mock('next-auth/providers/credentials', () => ({
  default: jest.fn(() => ({ id: 'credentials' })),
}))

jest.mock('next-auth/providers/google', () => ({
  default: jest.fn(() => ({ id: 'google' })),
}))

jest.mock('next-auth/providers/github', () => ({
  default: jest.fn(() => ({ id: 'github' })),
}))

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

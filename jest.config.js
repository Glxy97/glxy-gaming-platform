const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node', // Use node environment for Prisma/server tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  // Exclude Playwright e2e tests from Jest
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/e2e/',
    '\\.spec\\.ts$',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.js',
  ],
  // Transform ESM modules from node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!(@auth|next-auth|uuid|@ungap|@prisma/client|jose|preact|preact-render-to-string|cookie)/)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)

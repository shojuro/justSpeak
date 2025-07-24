const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/(.*)$': '<rootDir>/$1',
    // Mock problematic ESM modules
    '^isows$': '<rootDir>/__mocks__/isows.js',
    '^@supabase/ssr$': '<rootDir>/__mocks__/@supabase/ssr.js',
    // Mock Next.js server module
    '^next/server$': '<rootDir>/__mocks__/next/server.js',
    // Mock logger for tests
    '^@/lib/logger$': '<rootDir>/__mocks__/lib/logger.js',
    // Mock Redis for tests
    '^@/lib/redis$': '<rootDir>/__mocks__/lib/redis.js'
  },
  testPathIgnorePatterns: ['/node_modules/', '/node_modules.old/', '/.next/', '/e2e/'],
  transformIgnorePatterns: [
    // Allow transformation of specific ESM modules
    'node_modules/(?!(isows|@supabase/realtime-js|@supabase/supabase-js|@supabase/ssr)/)'
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.js',
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
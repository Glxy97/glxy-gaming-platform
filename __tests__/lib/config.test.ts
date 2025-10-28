import { getSettings } from '@/lib/config'

describe('config', () => {
  it('should return settings object with default values', () => {
    const settings = getSettings()
    expect(settings).toBeDefined()
    expect(settings.env).toBeDefined()
    expect(settings.apiBaseUrl).toBeDefined()
    expect(settings.features).toBeDefined()
  })

  it('should parse environment variables correctly', () => {
    // Save original values
    const originalEnv = process.env

    // Mock environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ENV: 'staging',
      NEXT_PUBLIC_API_BASE_URL: 'https://api.staging.glxy.at',
      NEXT_PUBLIC_FEATURE_ROOMS: 'false',
      NEXT_PUBLIC_FEATURE_ACHV: 'true'
    }

    // Clear cache
    jest.resetModules()

    // Import fresh copy of config module
    const { getSettings } = require('@/lib/config')

    const settings = getSettings()
    expect(settings.env).toBe('staging')
    expect(settings.apiBaseUrl).toBe('https://api.staging.glxy.at')
    expect(settings.features.rooms).toBe(false)
    expect(settings.features.achievements).toBe(true)

    // Restore original environment
    process.env = originalEnv
  })
})
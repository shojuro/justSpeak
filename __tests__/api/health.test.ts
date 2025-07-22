import { NextRequest } from 'next/server'
import { GET } from '@/app/api/health/route'

describe('/api/health', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return basic health status', async () => {
    const req = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('status', 'ok')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('environment')
    expect(data).toHaveProperty('version')
    expect(data).toHaveProperty('services')
  })

  it('should NOT expose API keys', async () => {
    process.env.OPENAI_API_KEY = 'sk-1234567890abcdef'
    process.env.ELEVENLABS_API_KEY = 'el-1234567890abcdef'
    process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db'

    const req = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(req)
    const data = await response.json()

    // Ensure response doesn't contain any sensitive data
    const responseText = JSON.stringify(data)
    expect(responseText).not.toContain('sk-')
    expect(responseText).not.toContain('el-')
    expect(responseText).not.toContain('postgresql://')
    expect(responseText).not.toContain('pass')
    expect(responseText).not.toContain('1234567890abcdef')
  })

  it('should show service configuration status', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    process.env.DATABASE_URL = 'postgresql://test'
    process.env.REDIS_ENABLED = 'true'

    const req = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(req)
    const data = await response.json()

    expect(data.services).toEqual({
      database: true,
      openai: true,
      redis: true,
    })
  })

  it('should handle missing environment variables', async () => {
    delete process.env.OPENAI_API_KEY
    delete process.env.DATABASE_URL
    delete process.env.REDIS_URL
    delete process.env.REDIS_ENABLED

    const req = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(req)
    const data = await response.json()

    expect(data.services).toEqual({
      database: false,
      openai: false,
      redis: false,
    })
  })

  it('should not expose key prefixes or lengths', async () => {
    process.env.OPENAI_API_KEY = 'sk-1234567890abcdef'

    const req = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(req)
    const data = await response.json()

    // The old endpoints exposed these, ensure they're not present
    expect(data).not.toHaveProperty('keyPrefix')
    expect(data).not.toHaveProperty('keyLength')
    expect(data).not.toHaveProperty('apis')
    expect(data).not.toHaveProperty('configuration')
  })
})
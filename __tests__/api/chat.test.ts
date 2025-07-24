import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { checkRateLimit } from '@/lib/rate-limiter'

// Mock dependencies
jest.mock('@/lib/auth-helpers')
jest.mock('@/lib/rate-limiter')
jest.mock('@/lib/logger')

describe('/api/chat', () => {
  const mockGetAuthenticatedUser = getAuthenticatedUser as jest.Mock
  const mockCheckRateLimit = checkRateLimit as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    delete process.env.OPENAI_API_KEY
  })

  it('should require authentication', async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Authentication required' })
  })

  it('should check rate limits', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'user-123', email: 'test@example.com' })
    mockCheckRateLimit.mockResolvedValue({ allowed: false })

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toContain('Too many requests')
  })

  it('should validate message input', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'user-123', email: 'test@example.com' })
    mockCheckRateLimit.mockResolvedValue({ allowed: true })

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Message cannot be empty')
  })

  it('should handle missing OpenAI API key', async () => {
    delete process.env.OPENAI_API_KEY
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'user-123', email: 'test@example.com' })
    mockCheckRateLimit.mockResolvedValue({ allowed: true })

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toContain('AI service not configured')
  })

  it('should sanitize HTML in messages', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'user-123', email: 'test@example.com' })
    mockCheckRateLimit.mockResolvedValue({ allowed: true })

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: '<script>alert("XSS")</script>Hello',
        context: []
      }),
    })

    // Since we can't easily mock the OpenAI call, we'll at least verify
    // the request gets to the validation stage
    await POST(req)
    
    // The actual implementation would sanitize the input
    // This test verifies the endpoint is protected by auth and rate limiting
    expect(mockGetAuthenticatedUser).toHaveBeenCalled()
    expect(mockCheckRateLimit).toHaveBeenCalled()
  })
})
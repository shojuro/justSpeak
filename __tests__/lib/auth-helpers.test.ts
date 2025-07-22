import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('Auth Helpers', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('getAuthenticatedUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01',
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await getAuthenticatedUser()

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01',
      })
    })

    it('should return null when no user is authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await getAuthenticatedUser()

      expect(result).toBeNull()
    })

    it('should throw error when auth check fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth service unavailable'),
      })

      await expect(getAuthenticatedUser()).rejects.toThrow('Auth service unavailable')
    })

    it('should handle missing email gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: null,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01',
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await getAuthenticatedUser()

      expect(result).toEqual({
        id: 'user-123',
        email: null,
        created_at: '2024-01-01',
      })
    })
  })
})
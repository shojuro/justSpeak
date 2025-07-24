import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { db } from '@/lib/supabase-db'

// Mock Supabase server client
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

// Mock database layer
jest.mock('@/lib/supabase-db', () => ({
  db: {
    users: {
      findByAuthId: jest.fn(),
      create: jest.fn(),
    },
    userStats: {
      create: jest.fn(),
    },
  },
}))

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('Auth Helpers', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient)
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

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: {
            user: mockUser,
            access_token: 'mock-token',
            refresh_token: 'mock-refresh'
          }
        },
        error: null,
      })

      // Mock db response
      ;(db.users.findByAuthId as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01',
      })

      const result = await getAuthenticatedUser()

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01',
      })
    })

    it('should return null when no user is authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await getAuthenticatedUser()

      expect(result).toBeNull()
    })

    it('should throw error when database check fails', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01',
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: {
            user: mockUser,
            access_token: 'mock-token',
            refresh_token: 'mock-refresh'
          }
        },
        error: null,
      })

      // Mock db error
      ;(db.users.findByAuthId as jest.Mock).mockRejectedValue(new Error('Database unavailable'))

      await expect(getAuthenticatedUser()).rejects.toThrow('Database unavailable')
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

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: {
            user: mockUser,
            access_token: 'mock-token',
            refresh_token: 'mock-refresh'
          }
        },
        error: null,
      })

      // Mock db response
      ;(db.users.findByAuthId as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: null,
        created_at: '2024-01-01',
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
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { db, type User } from '@/lib/supabase-db'

/**
 * Get authenticated user from Supabase session and ensure they exist in our database
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = createServerSupabaseClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return null
  }

  try {
    // Check if user exists in our database
    let user = await db.users.findByAuthId(session.user.id)
    return user
  } catch (error: any) {
    // User doesn't exist, create them
    if (error.code === 'PGRST116') { // Not found
      const newUser = await db.users.create({
        auth_id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
        age_group: 'adult'
      })

      // Create initial stats record
      await db.userStats.create({
        user_id: newUser.id
      })

      return newUser
    }
    
    throw error
  }
}

/**
 * Update user's talk time statistics
 */
export async function updateUserStats(userId: string, talkTime: number, speaker: 'user' | 'ai') {
  // Only track user talk time
  if (speaker === 'user' && talkTime > 0) {
    await db.userStats.incrementTalkTime(userId, talkTime)
  }
}
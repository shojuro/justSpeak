import { supabaseDb } from './supabase-db'
import { logger } from './logger'
import { retry, retryStrategies } from './retry'

export class DatabaseTransaction {
  private operations: Array<() => Promise<any>> = []
  private rollbackOperations: Array<() => Promise<any>> = []

  /**
   * Add an operation to the transaction
   * @param operation The database operation to perform
   * @param rollback The operation to undo the change if transaction fails
   */
  add(
    operation: () => Promise<any>,
    rollback?: () => Promise<any>
  ): DatabaseTransaction {
    this.operations.push(operation)
    if (rollback) {
      this.rollbackOperations.push(rollback)
    }
    return this
  }

  /**
   * Execute all operations in the transaction
   * If any operation fails, attempt to rollback previous operations
   */
  async execute(): Promise<any[]> {
    const results: any[] = []
    const completedOperations: number[] = []

    try {
      // Execute all operations
      for (let i = 0; i < this.operations.length; i++) {
        logger.debug(`Executing transaction operation ${i + 1}/${this.operations.length}`)
        
        const result = await retry(
          this.operations[i],
          retryStrategies.database
        )
        
        results.push(result)
        completedOperations.push(i)
      }

      logger.info(`Transaction completed successfully with ${results.length} operations`)
      return results
    } catch (error) {
      logger.error('Transaction failed, attempting rollback', error)
      
      // Rollback in reverse order
      for (let i = completedOperations.length - 1; i >= 0; i--) {
        const rollbackIndex = completedOperations[i]
        if (this.rollbackOperations[rollbackIndex]) {
          try {
            await this.rollbackOperations[rollbackIndex]()
            logger.debug(`Rolled back operation ${rollbackIndex + 1}`)
          } catch (rollbackError) {
            logger.error(`Failed to rollback operation ${rollbackIndex + 1}`, rollbackError)
          }
        }
      }
      
      throw error
    }
  }
}

// Helper to ensure database is initialized
function ensureDb() {
  if (!supabaseDb) {
    throw new Error('Database not initialized')
  }
  return supabaseDb
}

// Transaction helpers for common operations
export const transactions = {
  /**
   * Create a session with messages in a transaction
   */
  async createSessionWithMessages(
    sessionData: any,
    messages: any[]
  ): Promise<{ session: any; messages: any[] }> {
    const transaction = new DatabaseTransaction()
    
    let sessionId: string

    // Add session creation
    transaction.add(
      async () => {
        const { data, error } = await ensureDb()
          .from('sessions')
          .insert(sessionData)
          .select()
          .single()
        
        if (error) throw error
        sessionId = data?.id as string
        return data
      },
      // Rollback: delete the session
      async () => {
        if (sessionId) {
          await ensureDb()
            .from('sessions')
            .delete()
            .eq('id', sessionId)
        }
      }
    )

    // Add message creation
    const messageIds: string[] = []
    
    for (const message of messages) {
      transaction.add(
        async () => {
          const { data, error } = await ensureDb()
            .from('messages')
            .insert({ ...message, session_id: sessionId })
            .select()
            .single()
          
          if (error) throw error
          messageIds.push(data?.id as string)
          return data
        },
        // Rollback: delete the message
        async () => {
          if (messageIds.length > 0) {
            await ensureDb()
              .from('messages')
              .delete()
              .in('id', messageIds)
          }
        }
      )
    }

    const results = await transaction.execute()
    
    return {
      session: results[0],
      messages: results.slice(1),
    }
  },

  /**
   * End a session and update user stats in a transaction
   */
  async endSessionAndUpdateStats(
    sessionId: string,
    sessionUpdates: any,
    userId: string,
    talkTimeSeconds: number
  ): Promise<{ session: any; stats: any }> {
    const transaction = new DatabaseTransaction()
    
    // Update session
    transaction.add(
      async () => {
        const { data, error } = await ensureDb()
          .from('sessions')
          .update(sessionUpdates)
          .eq('id', sessionId)
          .select()
          .single()
        
        if (error) throw error
        return data
      }
    )

    // Update user stats
    transaction.add(
      async () => {
        // Get current stats
        const { data: currentStats } = await ensureDb()
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (currentStats) {
          // Update existing stats
          const { data, error } = await ensureDb()
            .from('user_stats')
            .update({
              total_talk_time: (currentStats.total_talk_time as number) + talkTimeSeconds,
              daily_talk_time: (currentStats.daily_talk_time as number) + talkTimeSeconds,
              weekly_talk_time: (currentStats.weekly_talk_time as number) + talkTimeSeconds,
              monthly_talk_time: (currentStats.monthly_talk_time as number) + talkTimeSeconds,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .select()
            .single()
          
          if (error) throw error
          return data
        } else {
          // Create new stats
          const { data, error } = await ensureDb()
            .from('user_stats')
            .insert({
              user_id: userId,
              total_talk_time: talkTimeSeconds,
              daily_talk_time: talkTimeSeconds,
              weekly_talk_time: talkTimeSeconds,
              monthly_talk_time: talkTimeSeconds,
            })
            .select()
            .single()
          
          if (error) throw error
          return data
        }
      }
    )

    const results = await transaction.execute()
    
    return {
      session: results[0],
      stats: results[1],
    }
  },

  /**
   * Save message with assessment in a transaction
   */
  async saveMessageWithAssessment(
    messageData: any,
    assessmentData: any
  ): Promise<{ message: any; assessment: any }> {
    const transaction = new DatabaseTransaction()
    
    let messageId: string

    // Save message
    transaction.add(
      async () => {
        const { data, error } = await ensureDb()
          .from('messages')
          .insert(messageData)
          .select()
          .single()
        
        if (error) throw error
        messageId = data?.id as string
        return data
      },
      // Rollback: delete the message
      async () => {
        if (messageId) {
          await ensureDb()
            .from('messages')
            .delete()
            .eq('id', messageId)
        }
      }
    )

    // Save assessment
    transaction.add(
      async () => {
        const { data, error } = await ensureDb()
          .from('assessments')
          .insert({ ...assessmentData, message_id: messageId })
          .select()
          .single()
        
        if (error) throw error
        return data
      }
    )

    const results = await transaction.execute()
    
    return {
      message: results[0],
      assessment: results[1],
    }
  },
}
import { CircuitBreakerFactory } from './circuit-breaker'
import { retry, retryStrategies } from './retry'
import { logger } from './logger'
import { OPENAI_CONFIG } from './constants'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

class OpenAIService {
  private circuitBreaker = CircuitBreakerFactory.create('openai', {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    halfOpenRequests: 3,
  })

  async sendMessage(
    messages: OpenAIMessage[],
    options: {
      temperature?: number
      maxTokens?: number
      model?: string
    } = {}
  ): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const requestBody = {
      model: options.model || OPENAI_CONFIG.MODEL,
      messages,
      temperature: options.temperature ?? OPENAI_CONFIG.TEMPERATURE,
      max_tokens: options.maxTokens ?? OPENAI_CONFIG.MAX_TOKENS,
      frequency_penalty: OPENAI_CONFIG.FREQUENCY_PENALTY,
      presence_penalty: OPENAI_CONFIG.PRESENCE_PENALTY,
    }

    // Wrap the API call with circuit breaker and retry logic
    const response = await retry(
      () => this.circuitBreaker.execute(
        () => this.makeAPICall(apiKey, requestBody)
      ),
      retryStrategies.externalService
    )

    return response.choices[0]?.message?.content || ''
  }

  private async makeAPICall(
    apiKey: string,
    body: any
  ): Promise<OpenAIResponse> {
    const startTime = Date.now()
    
    try {
      logger.debug('Making OpenAI API call', {
        model: body.model,
        messageCount: body.messages.length,
      })

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      })

      const duration = Date.now() - startTime

      if (!response.ok) {
        const error = await response.text()
        logger.error('OpenAI API error', {
          status: response.status,
          error,
          duration,
        })
        
        throw new Error(`OpenAI API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      
      logger.info('OpenAI API call successful', {
        duration,
        tokensUsed: data.usage?.total_tokens,
      })

      return data
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.error('OpenAI API call failed', {
        error,
        duration,
      })
      
      throw error
    }
  }

  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats()
  }
}

// Export singleton instance
export const openAIService = new OpenAIService()
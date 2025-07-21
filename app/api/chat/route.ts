import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { AssessmentService } from '@/lib/assessment-service'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { db } from '@/lib/supabase-db'
import { AppError, asyncHandler } from '@/lib/error-handler'
import { messageValidation, userValidation, validateRequestBody } from '@/lib/validation'
import { RedisRateLimiter } from '@/lib/redis'
import { createRequestLogger, logger } from '@/lib/logger'
import { withCors } from '@/lib/cors'
import { sanitizeInput, validateMessageLength, sanitizeSessionId } from '@/lib/sanitization'

import { RATE_LIMITS, MESSAGE_LIMITS, BLOCKED_TOPICS, OPENAI_CONFIG, SESSION_CONFIG } from '@/lib/constants'

// Initialize rate limiter
const rateLimiter = new RedisRateLimiter()

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  message: string
  context: Message[]
  ageGroup?: 'elementary' | 'middle' | 'high' | 'adult'
  mode?: 'conversation' | 'learning'
  sessionId?: string
}

// Generate fingerprint for rate limiting (combines multiple factors)
function generateFingerprint(req: NextRequest): string {
  // Get real IP (considering proxies)
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'
  
  // Additional fingerprinting factors
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const acceptLanguage = req.headers.get('accept-language') || 'unknown'
  const acceptEncoding = req.headers.get('accept-encoding') || 'unknown'
  
  // Create a composite fingerprint
  const fingerprint = `${ip}:${userAgent}:${acceptLanguage}:${acceptEncoding}`
  
  // Hash the fingerprint for consistency and privacy
  const { createHash } = require('crypto')
  return createHash('sha256').update(fingerprint).digest('hex')
}

// Check rate limit using Redis
async function checkRateLimit(fingerprint: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  return rateLimiter.checkRateLimit(fingerprint, RATE_LIMITS.MAX_REQUESTS, RATE_LIMITS.WINDOW_MS)
}

// Validate and sanitize input
function validateInput(message: string): { isValid: boolean; error?: string; sanitized?: string } {
  // Use the new sanitization function
  const validation = validateMessageLength(message, MESSAGE_LIMITS.MAX_MESSAGE_LENGTH)
  
  if (!validation.isValid) {
    return { isValid: false, error: validation.error }
  }

  // Check for blocked content
  const lowerMessage = validation.sanitized.toLowerCase()
  for (const topic of BLOCKED_TOPICS) {
    if (lowerMessage.includes(topic)) {
      return { isValid: true, sanitized: validation.sanitized } // We'll handle redirection in the prompt
    }
  }

  return { isValid: true, sanitized: validation.sanitized }
}

// Build learning prompt for grammar correction mode
function buildLearningPrompt(ageGroup: string): string {
  const basePrompt = `You are an expert English language tutor helping students improve their English through conversation. You will analyze their comments, provide corrections, and create detailed feedback.

For each user message, follow this process:

1. ASSESS the student's comment for:
   - Grammar errors
   - Spelling mistakes
   - Punctuation issues
   - Vocabulary usage
   - Sentence structure

2. RESPOND naturally to continue the conversation

3. PROVIDE CORRECTIONS in this format:

📝 Language Assessment:

**Corrections Made:**
[List each correction with explanation]

**Your message rewritten:**
[Provide the corrected version]

**Key areas to practice:**
[List 2-3 specific issues in order of importance]

4. CONTINUE the conversation with a follow-up question

Remember:
- Be encouraging and supportive
- Use simple explanations
- Focus on major errors first
- Maintain natural conversation flow
- Note: Corrections are only shown in learning mode, not during regular conversation`

  const ageAdjustments = {
    elementary: `
- Use very simple explanations
- Focus only on basic errors
- Be extra encouraging`,
    middle: `
- Use clear, straightforward explanations
- Focus on common grammar mistakes
- Balance correction with encouragement`,
    high: `
- Provide more detailed explanations
- Include advanced grammar points
- Challenge them appropriately`,
    adult: `
- Provide comprehensive explanations
- Include nuanced language points
- Treat as an equal learner`
  }

  return basePrompt + (ageAdjustments[ageGroup as keyof typeof ageAdjustments] || ageAdjustments.adult)
}

// Build conversation prompt based on age group and mode
function buildSystemPrompt(ageGroup: string, mode: string = 'conversation'): string {
  if (mode === 'learning') {
    return buildLearningPrompt(ageGroup)
  }
  const basePrompt = `You are a friendly, patient English conversation partner named TalkTime. Your goal is to help students practice speaking English through natural, engaging conversations.

Core Guidelines:
- Be genuinely curious and interested in what the student shares
- Respond naturally - mix questions with statements, reactions, and your own thoughts
- Keep the conversation flowing naturally, don't interrogate
- Celebrate their effort to speak English, not perfection
- Never correct grammar or pronunciation unless asked
- Keep responses concise (2-3 sentences usually)
- Be encouraging and supportive

Conversation Style:
- React with genuine interest: "Oh wow!", "That's fascinating!", "I had no idea!"
- Share related thoughts: "That reminds me of...", "I've always wondered about..."
- Ask follow-up questions only when natural, not constantly
- Sometimes just acknowledge and build on what they said
- Use simple, clear language appropriate for English learners

Content Safety:
- If inappropriate topics come up, gently redirect: "That's interesting! Speaking of [related safe topic]..."
- Keep conversations positive and age-appropriate
- Focus on everyday topics: hobbies, school, family, dreams, favorite things`

  const agePrompts = {
    elementary: `
Age Group: Elementary (9-12 years)
- Use simple vocabulary and short sentences
- Be extra enthusiastic and playful
- Topics: school, friends, pets, games, favorite foods, family activities
- Example: "Wow, you have a pet hamster? That's so cool! What's the funniest thing your hamster does?"`,
    
    middle: `
Age Group: Middle School (13-15 years)
- Use everyday vocabulary with some variety
- Be relatable and understanding
- Topics: friends, hobbies, music, sports, school subjects, weekend plans
- Example: "Oh, you like playing basketball! I bet that's exciting. Do you play with friends or on a team?"`,
    
    high: `
Age Group: High School+ (16+ years)
- Use natural, conversational vocabulary
- Be respectful and treat as an equal
- Topics: interests, goals, current events (safe ones), college plans, hobbies
- Example: "That's an interesting perspective on social media. How do you balance online time with other activities?"`,
    
    adult: `
Age Group: Adult
- Use full vocabulary range appropriately
- Professional but friendly tone
- Topics: work, travel, culture, hobbies, life experiences, goals
- Example: "Working remotely has really changed things, hasn't it? What's been the biggest adjustment for you?"`
  }

  return basePrompt + (agePrompts[ageGroup as keyof typeof agePrompts] || agePrompts.adult)
}

export async function POST(req: NextRequest) {
  const logger = createRequestLogger(req)
  
  try {
    logger.info('Chat API request received')
    console.log('Chat API called at:', new Date().toISOString())
    
    // Check if authentication is required (trim whitespace)
    const requireAuth = process.env.REQUIRE_AUTH?.trim() === 'true'
    
    // Try to get authenticated user
    let user = null
    try {
      user = await getAuthenticatedUser()
    } catch (error) {
      logger.debug('Auth check failed', { error })
      
      // If auth is required and user is not authenticated, return 401
      if (requireAuth) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }
    
    // In production, always require authentication
    if (requireAuth && !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Check if API key is configured and trim any whitespace
    const apiKey = process.env.OPENAI_API_KEY?.trim()
    
    // Log API key status without exposing sensitive data
    logger.debug('API Key check', {
      exists: !!apiKey,
      configured: !!apiKey && apiKey.length > 0,
      length: apiKey ? apiKey.length : 0
    })
    console.log('OpenAI API Key configured:', !!apiKey, 'Length:', apiKey ? apiKey.length : 0)
    
    if (!apiKey) {
      logger.error('OpenAI API key not configured')
      console.error('OpenAI API key missing in environment')
      return NextResponse.json(
        { error: 'AI service not configured. Please check API configuration.' },
        { status: 503 }
      )
    }

    // Generate fingerprint for rate limiting
    const fingerprint = generateFingerprint(req)
    
    // Check rate limit
    const rateLimit = await checkRateLimit(fingerprint)
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
            'Retry-After': retryAfter.toString(),
          }
        }
      )
    }

    // Parse request body
    let body: ChatRequest
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }
    
    const { message, context = [], ageGroup = 'adult', mode = 'conversation', sessionId } = body

    // Validate and sanitize input
    const validation = validateInput(message)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }
    
    // Use sanitized message
    const sanitizedMessage = validation.sanitized!
    const sanitizedSessionId = sessionId ? sanitizeSessionId(sessionId) : undefined

    // Limit context to prevent token overflow
    const limitedContext = context.slice(-SESSION_CONFIG.MAX_CONTEXT_MESSAGES)

    // Build messages array for OpenAI
    const messages: Message[] = [
      {
        role: 'system',
        content: buildSystemPrompt(ageGroup, mode)
      },
      ...limitedContext,
      {
        role: 'user',
        content: sanitizedMessage
      }
    ]

    // Log the request metadata
    logger.info('Chat API Request', {
      messageLength: sanitizedMessage.length,
      contextSize: limitedContext.length,
      model: 'gpt-4o-mini',
      ageGroup,
      mode
    })

    // Call OpenAI API
    const requestBody = {
      model: 'gpt-4o-mini', // Changed from gpt-4-turbo-preview for reliability
      messages,
      temperature: 0.8,
      max_tokens: 1500, // Increased from 400 to allow longer responses
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    }
    
    // Log API usage without exposing key
    logger.debug('Using OpenAI API', {
      keyConfigured: true,
      model: requestBody.model
    })
    
    console.log('Calling OpenAI API with model:', requestBody.model)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log('OpenAI API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      logger.error('OpenAI API error', new Error(errorText), {
        status: response.status,
        statusText: response.statusText
      })
      
      // Parse error if possible
      let errorMessage = 'AI service error'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error?.message || errorMessage
        
        // If it's an invalid API key error, provide helpful message
        if (errorMessage.includes('Incorrect API key') || errorMessage.includes('invalid_api_key')) {
          console.error('Invalid OpenAI API key detected')
          return NextResponse.json({
            reply: "I'm having trouble connecting to the AI service. Please check that the OpenAI API key is valid. In the meantime, let's continue our conversation!",
            conversationId: sanitizedSessionId || randomUUID(),
            error: 'Invalid API key - please update in Vercel environment variables'
          })
        }
      } catch (e) {
        // If not JSON, use the text
        errorMessage = errorText || errorMessage
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    const reply = data.choices[0]?.message?.content || "I didn't quite catch that. Could you tell me more?"

    // Log conversation metadata for monitoring
    logger.info('Conversation processed', {
      ageGroup,
      mode,
      messageLength: message.length,
      responseLength: reply.length,
      contextSize: limitedContext.length
    })

    // Database operations are optional for now
    let sessionIdToReturn = sanitizedSessionId || randomUUID()
    let assessmentData = null
    
    // Try to save to database if user is authenticated
    if (user) {
      try {
        // Get or create session
        let session = null
        if (sanitizedSessionId) {
          // Verify session belongs to user
          const sessions = await db.sessions.findByUserId(user.id, 50)
          session = sessions.find(s => s.id === sanitizedSessionId && !s.end_time) || null
        }
        
        if (!session) {
          // Create new session if none provided or not found
          session = await db.sessions.create({
            user_id: user.id,
            mode: mode,
            start_time: new Date().toISOString(),
            user_talk_time: 0,
            ai_talk_time: 0
          })
        }
        
        sessionIdToReturn = session.id
        
        // Save user message
        const userMessage = await db.messages.create({
          session_id: session.id,
          role: 'user',
          content: sanitizedMessage,
          timestamp: new Date().toISOString()
        })
        
        // Save AI response
        await db.messages.create({
          session_id: session.id,
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString()
        })
        
        // Parse and save assessment if in learning mode
        if (mode === 'learning') {
          const assessment = AssessmentService.parseAssessment(
            reply,
            sanitizedMessage,
            user.id,
            session.id,
            mode
          )
          
          if (assessment) {
            // Save assessment to database
            const savedAssessment = await db.assessments.create({
              session_id: session.id,
              user_id: user.id,
              message_id: userMessage.id,
              original_text: assessment.originalText,
              corrected_text: assessment.correctedText,
              corrections: assessment.corrections,
              areas_to_improve: assessment.areasToImprove,
              assessment_notes: assessment.assessmentNotes
            })
            
            assessmentData = {
              correctedText: savedAssessment.corrected_text,
              corrections: savedAssessment.corrections,
              areasToImprove: savedAssessment.areas_to_improve
            }
          }
        }
      } catch (dbError) {
        logger.warn('Database operations failed, continuing without saving', { error: dbError })
      }
    }
    
    // Parse assessment for display even without database
    if (!assessmentData && mode === 'learning') {
      const assessment = AssessmentService.parseAssessment(
        reply,
        sanitizedMessage,
        'temp-user',
        sessionIdToReturn,
        mode
      )
      
      if (assessment) {
        assessmentData = {
          correctedText: assessment.correctedText,
          corrections: assessment.corrections,
          areasToImprove: assessment.areasToImprove
        }
      }
    }

    return NextResponse.json({
      reply,
      conversationId: sessionIdToReturn,
      assessment: assessmentData
    })

  } catch (error) {
    logger.error('Chat API error', error as Error)
    console.error('Chat API error details:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Something went wrong. Please try again.'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        errorMessage = 'AI service not configured'
        statusCode = 503
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment.'
        statusCode = 429
      } else if (error.message.includes('Invalid API key')) {
        errorMessage = 'AI service authentication failed'
        statusCode = 503
      }
    }
    
    // Never expose error details in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        // Only include details in development
        ...(isDevelopment && {
          debug: {
            message: error instanceof Error ? error.message : 'Unknown error',
            type: error instanceof Error ? error.constructor.name : typeof error
          }
        })
      },
      { status: statusCode }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || ''
  
  // Define allowed origins
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    // Production domains
    'https://justspeak.vercel.app',
    'https://justspeak.app', // Add your custom domain here
  ]
  
  // Also allow Vercel preview URLs
  if (origin && (origin.includes('.vercel.app') || origin.includes('vercel.app'))) {
    allowedOrigins.push(origin)
  }
  
  // Check if origin is allowed
  const isAllowed = process.env.NODE_ENV === 'development' 
    ? allowedOrigins.includes(origin) || origin === 'null' // Allow file:// in dev only
    : allowedOrigins.includes(origin)
  
  if (!isAllowed) {
    return new NextResponse(null, { status: 403 })
  }
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
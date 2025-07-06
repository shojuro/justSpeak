import { NextRequest, NextResponse } from 'next/server'
import { AssessmentService } from '@/lib/assessment-service'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { db } from '@/lib/supabase-db'

// Security: Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Constants
const RATE_LIMIT_MAX = 30 // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_MESSAGE_LENGTH = 1000
const MAX_CONTEXT_MESSAGES = 10

// Content safety keywords to filter
const BLOCKED_TOPICS = [
  'sexual', 'violence', 'harm', 'illegal', 'drugs', 'hate'
]

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

// Check rate limit
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false
  }

  userLimit.count++
  return true
}

// Validate and sanitize input
function validateInput(message: string): { isValid: boolean; error?: string } {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Message is required' }
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { isValid: false, error: 'Message is too long' }
  }

  // Check for blocked content
  const lowerMessage = message.toLowerCase()
  for (const topic of BLOCKED_TOPICS) {
    if (lowerMessage.includes(topic)) {
      return { isValid: true } // We'll handle redirection in the prompt
    }
  }

  return { isValid: true }
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
  try {
    // Try to get authenticated user (optional for now)
    let user = null
    try {
      user = await getAuthenticatedUser()
    } catch (error) {
      console.warn('Auth check failed, continuing without user:', error)
    }
    
    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      console.error('OpenAI API key not configured.')
      return NextResponse.json(
        { error: 'AI service not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 503 }
      )
    }

    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body: ChatRequest = await req.json()
    const { message, context = [], ageGroup = 'adult', mode = 'conversation', sessionId } = body

    // Validate input
    const validation = validateInput(message)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Limit context to prevent token overflow
    const limitedContext = context.slice(-MAX_CONTEXT_MESSAGES)

    // Build messages array for OpenAI
    const messages: Message[] = [
      {
        role: 'system',
        content: buildSystemPrompt(ageGroup, mode)
      },
      ...limitedContext,
      {
        role: 'user',
        content: message
      }
    ]

    // Log the request for debugging
    console.log('Chat API Request:', {
      timestamp: new Date().toISOString(),
      messageLength: message.length,
      contextSize: limitedContext.length,
      model: 'gpt-3.5-turbo', // Changed to more reliable model
      ageGroup,
      mode
    })

    // Call OpenAI API
    const requestBody = {
      model: 'gpt-3.5-turbo', // Changed from gpt-4-turbo-preview for reliability
      messages,
      temperature: 0.8,
      max_tokens: 400,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    }
    
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      
      // Parse error if possible
      let errorMessage = 'AI service error'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error?.message || errorMessage
      } catch (e) {
        // If not JSON, use the text
        errorMessage = errorText || errorMessage
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    const reply = data.choices[0]?.message?.content || "I didn't quite catch that. Could you tell me more?"

    // Log conversation metadata (not content) for monitoring
    console.log('Conversation:', {
      timestamp: new Date().toISOString(),
      ageGroup,
      mode,
      messageLength: message.length,
      responseLength: reply.length,
      contextSize: limitedContext.length
    })

    // Database operations are optional for now
    let sessionIdToReturn = sessionId || crypto.randomUUID()
    let assessmentData = null
    
    // Try to save to database if user is authenticated
    if (user) {
      try {
        // Get or create session
        let session
        if (sessionId) {
          // Verify session belongs to user
          const sessions = await db.sessions.findByUserId(user.id, 50)
          session = sessions.find(s => s.id === sessionId && !s.end_time)
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
          content: message,
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
            message,
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
        console.warn('Database operations failed, continuing without saving:', dbError)
      }
    }
    
    // Parse assessment for display even without database
    if (!assessmentData && mode === 'learning') {
      const assessment = AssessmentService.parseAssessment(
        reply,
        message,
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
    console.error('Chat API error:', error)
    
    // In development, return more detailed errors
    const isDevelopment = process.env.NODE_ENV === 'development'
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: isDevelopment 
          ? `API Error: ${errorMessage}` 
          : 'Something went wrong. Please try again.',
        details: isDevelopment ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
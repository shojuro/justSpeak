import { NextRequest, NextResponse } from 'next/server'

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

// Build conversation prompt based on age group
function buildSystemPrompt(ageGroup: string): string {
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
    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('OpenAI API key not configured')
      return NextResponse.json(
        { error: 'AI service not configured' },
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
    const { message, context = [], ageGroup = 'adult' } = body

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
        content: buildSystemPrompt(ageGroup)
      },
      ...limitedContext,
      {
        role: 'user',
        content: message
      }
    ]

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.8,
        max_tokens: 150,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      })
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status)
      throw new Error('AI service error')
    }

    const data = await response.json()
    const reply = data.choices[0]?.message?.content || "I didn't quite catch that. Could you tell me more?"

    // Log conversation metadata (not content) for monitoring
    console.log('Conversation:', {
      timestamp: new Date().toISOString(),
      ageGroup,
      messageLength: message.length,
      responseLength: reply.length,
      contextSize: limitedContext.length
    })

    return NextResponse.json({
      reply,
      conversationId: crypto.randomUUID() // For future session tracking
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
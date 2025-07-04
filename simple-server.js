const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static('.'))

// Rate limiting store
const rateLimitStore = new Map()
const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW = 60 * 1000

// Check rate limit
function checkRateLimit(ip) {
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

// Build conversation prompt
function buildSystemPrompt(ageGroup = 'adult') {
  const basePrompt = `You are a friendly, patient English conversation partner. Your goal is to help students practice speaking English through natural, engaging conversations.

Core Guidelines:
- Be genuinely curious and interested in what the student shares
- Respond naturally - mix questions with statements, reactions, and your own thoughts
- Keep the conversation flowing naturally, don't interrogate
- Never correct grammar or pronunciation
- Keep responses concise (2-3 sentences usually)
- Be encouraging and supportive

Conversation Style:
- React with genuine interest: "Oh wow!", "That's fascinating!"
- Share related thoughts: "That reminds me of...", "I've always wondered about..."
- Ask follow-up questions only when natural
- Sometimes just acknowledge and build on what they said`

  return basePrompt
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return res.status(503).json({ error: 'AI service not configured' })
    }

    const ip = req.ip || 'unknown'
    
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many requests. Please wait.' })
    }

    const { message, context = [] } = req.body

    if (!message || message.length > 1000) {
      return res.status(400).json({ error: 'Invalid message' })
    }

    const messages = [
      {
        role: 'system',
        content: buildSystemPrompt()
      },
      ...context.slice(-10),
      {
        role: 'user',
        content: message
      }
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.8,
        max_tokens: 400
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API error')
    }

    const data = await response.json()
    const reply = data.choices[0]?.message?.content || "I didn't quite catch that. Could you tell me more?"

    res.json({ reply })

  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log('Make sure to set OPENAI_API_KEY in your .env file')
})
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs').promises
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Session storage (in production, use Redis or database)
const sessions = new Map()
const LOGS_DIR = path.join(__dirname, 'logs')

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static('.'))

// Rate limiting store
const rateLimitStore = new Map()
const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW = 60 * 1000

// Helper functions for logging
async function ensureLogsDir() {
  try {
    await fs.access(LOGS_DIR)
  } catch {
    await fs.mkdir(LOGS_DIR, { recursive: true })
  }
}

async function logConversation(sessionId, data) {
  await ensureLogsDir()
  const date = new Date().toISOString().split('T')[0]
  const logFile = path.join(LOGS_DIR, `conversations-${date}.json`)
  
  try {
    let logs = []
    try {
      const existing = await fs.readFile(logFile, 'utf8')
      logs = JSON.parse(existing)
    } catch {
      // File doesn't exist yet
    }
    
    logs.push({
      sessionId,
      timestamp: new Date().toISOString(),
      ...data
    })
    
    await fs.writeFile(logFile, JSON.stringify(logs, null, 2))
  } catch (error) {
    console.error('Failed to log conversation:', error)
  }
}

async function updateSessionMetrics(sessionId, metrics) {
  const session = sessions.get(sessionId) || {
    id: sessionId,
    startTime: new Date().toISOString(),
    userSpeakingTime: 0,
    aiSpeakingTime: 0,
    messages: []
  }
  
  sessions.set(sessionId, { ...session, ...metrics })
  
  // Also save to daily metrics file
  await ensureLogsDir()
  const date = new Date().toISOString().split('T')[0]
  const metricsFile = path.join(LOGS_DIR, `metrics-${date}.json`)
  
  try {
    let dailyMetrics = {}
    try {
      const existing = await fs.readFile(metricsFile, 'utf8')
      dailyMetrics = JSON.parse(existing)
    } catch {
      // File doesn't exist yet
    }
    
    if (!dailyMetrics[sessionId]) {
      dailyMetrics[sessionId] = {
        startTime: session.startTime,
        userSpeakingTime: 0,
        aiSpeakingTime: 0,
        messageCount: 0
      }
    }
    
    dailyMetrics[sessionId].userSpeakingTime = session.userSpeakingTime
    dailyMetrics[sessionId].aiSpeakingTime = session.aiSpeakingTime
    dailyMetrics[sessionId].messageCount = session.messages.length
    dailyMetrics[sessionId].lastUpdate = new Date().toISOString()
    
    await fs.writeFile(metricsFile, JSON.stringify(dailyMetrics, null, 2))
  } catch (error) {
    console.error('Failed to update metrics:', error)
  }
}

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

// Speech endpoint for ElevenLabs
app.post('/api/speech', async (req, res) => {
  try {
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY
    if (!elevenLabsKey || elevenLabsKey === 'your_elevenlabs_api_key_here') {
      return res.status(503).json({ error: 'Speech service not configured' })
    }

    const { text, voiceId = 'pFZP5JQG7iQjIQuC4Bku' } = req.body // Hope's voice

    if (!text || text.length > 5000) {
      return res.status(400).json({ error: 'Invalid text' })
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.85,
            style: 0.5,
            use_speaker_boost: true
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error('ElevenLabs API error')
    }

    const audioBuffer = await response.arrayBuffer()
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength
    })
    res.send(Buffer.from(audioBuffer))

  } catch (error) {
    console.error('Speech error:', error)
    res.status(500).json({ error: 'Failed to generate speech' })
  }
})

// Session management endpoints
app.post('/api/session/start', (req, res) => {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  sessions.set(sessionId, {
    id: sessionId,
    startTime: new Date().toISOString(),
    userSpeakingTime: 0,
    aiSpeakingTime: 0,
    messages: []
  })
  res.json({ sessionId })
})

app.post('/api/session/update', async (req, res) => {
  const { sessionId, speakingTime, speaker } = req.body
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(400).json({ error: 'Invalid session' })
  }
  
  const session = sessions.get(sessionId)
  if (speaker === 'user') {
    session.userSpeakingTime += speakingTime
  } else if (speaker === 'ai') {
    session.aiSpeakingTime += speakingTime
  }
  
  await updateSessionMetrics(sessionId, session)
  res.json({ success: true })
})

app.get('/api/metrics/daily', async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0]
  const metricsFile = path.join(LOGS_DIR, `metrics-${date}.json`)
  
  try {
    const data = await fs.readFile(metricsFile, 'utf8')
    const metrics = JSON.parse(data)
    
    // Calculate totals
    let totalUserTime = 0
    let totalAiTime = 0
    let totalMessages = 0
    
    Object.values(metrics).forEach(session => {
      totalUserTime += session.userSpeakingTime || 0
      totalAiTime += session.aiSpeakingTime || 0
      totalMessages += session.messageCount || 0
    })
    
    res.json({
      date,
      sessions: Object.keys(metrics).length,
      totalUserTime,
      totalAiTime,
      totalMessages,
      details: metrics
    })
  } catch (error) {
    res.json({
      date,
      sessions: 0,
      totalUserTime: 0,
      totalAiTime: 0,
      totalMessages: 0,
      details: {}
    })
  }
})

app.get('/api/metrics/weekly', async (req, res) => {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)
  
  const weeklyData = []
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const date = d.toISOString().split('T')[0]
    const metricsFile = path.join(LOGS_DIR, `metrics-${date}.json`)
    
    try {
      const data = await fs.readFile(metricsFile, 'utf8')
      const metrics = JSON.parse(data)
      
      let dayTotal = 0
      Object.values(metrics).forEach(session => {
        dayTotal += session.userSpeakingTime || 0
      })
      
      weeklyData.push({
        date,
        userSpeakingTime: dayTotal,
        sessions: Object.keys(metrics).length
      })
    } catch {
      weeklyData.push({
        date,
        userSpeakingTime: 0,
        sessions: 0
      })
    }
  }
  
  res.json({ weeklyData })
})

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

    const { message, context = [], sessionId } = req.body

    if (!message || message.length > 1000) {
      return res.status(400).json({ error: 'Invalid message' })
    }
    
    // Log the conversation
    if (sessionId) {
      await logConversation(sessionId, {
        userMessage: message,
        userMessageLength: message.length
      })
      
      // Update session with message
      const session = sessions.get(sessionId)
      if (session) {
        session.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() })
      }
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
    
    // Log AI response
    if (sessionId) {
      await logConversation(sessionId, {
        aiResponse: reply,
        aiResponseLength: reply.length
      })
      
      // Update session with AI message
      const session = sessions.get(sessionId)
      if (session) {
        session.messages.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() })
        await updateSessionMetrics(sessionId, session)
      }
    }

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

// Serve dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log('Make sure to set OPENAI_API_KEY in your .env file')
})
import { NextRequest, NextResponse } from 'next/server'

// Mock responses for testing without OpenAI
const mockResponses = [
  "That's really interesting! Tell me more about that.",
  "I'd love to hear more details about your experience.",
  "That sounds fascinating! What happened next?",
  "How did that make you feel?",
  "What do you think about that?",
  "That's a great point! Have you considered...",
  "I understand. Can you elaborate on that?",
  "Interesting perspective! What led you to that conclusion?",
  "That must have been quite an experience!",
  "Thanks for sharing that with me. What else is on your mind?"
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message } = body
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }
    
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Pick a random response
    const reply = mockResponses[Math.floor(Math.random() * mockResponses.length)]
    
    return NextResponse.json({
      reply,
      conversationId: 'mock-' + Date.now(),
      note: 'This is a mock response. Set up your OpenAI API key for real conversations.'
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
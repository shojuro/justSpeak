export interface Assessment {
  id: string
  sessionId: string
  userId: string
  timestamp: Date
  
  // Student's original message
  originalText: string
  
  // Corrected version
  correctedText: string
  
  // Detailed corrections
  corrections: Correction[]
  
  // Areas to work on
  areasToImprove: string[]
  
  // Overall assessment
  assessmentNotes: string
  
  // Student info
  studentAge?: string
  mode: 'conversation' | 'learning'
}

export interface Correction {
  type: 'grammar' | 'spelling' | 'punctuation' | 'vocabulary' | 'structure'
  original: string
  corrected: string
  explanation: string
  position?: number
}

export interface SessionLog {
  id: string
  userId: string
  startTime: Date
  endTime?: Date
  
  // Talk time in seconds
  userTalkTime: number
  aiTalkTime: number
  
  // Assessments from this session
  assessments: Assessment[]
  
  // Session metadata
  mode: 'conversation' | 'learning'
  ageGroup: string
}

export interface UserStats {
  userId: string
  
  // Talk time aggregates (in seconds)
  dailyTalkTime: number
  weeklyTalkTime: number
  monthlyTalkTime: number
  totalTalkTime: number
  
  // Common issues
  commonIssues: {
    type: string
    count: number
    examples: string[]
  }[]
  
  // Progress tracking
  improvementAreas: {
    area: string
    firstSeen: Date
    lastSeen: Date
    occurrences: number
    improved: boolean
  }[]
}
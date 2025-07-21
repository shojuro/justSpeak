/**
 * Utilities for detecting complete sentences in speech
 */

// Common sentence endings
const SENTENCE_ENDINGS = ['.', '!', '?', '。', '！', '？']

// Common pause words that might indicate more is coming
const PAUSE_INDICATORS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'i mean', 'well',
  'so', 'and', 'but', 'or', 'because', 'since', 'although',
  'the', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'for'
]

// Question starters that usually need completion
const QUESTION_STARTERS = [
  'what', 'when', 'where', 'why', 'who', 'how', 'which',
  'could', 'would', 'should', 'can', 'will', 'do', 'does', 'did',
  'is', 'are', 'was', 'were', 'have', 'has', 'had'
]

/**
 * Check if a transcript appears to be a complete thought
 */
export function isLikelyComplete(transcript: string): boolean {
  if (!transcript || transcript.length < 3) return false
  
  const trimmed = transcript.trim().toLowerCase()
  const words = trimmed.split(/\s+/)
  const lastWord = words[words.length - 1]
  const lastChar = trimmed[trimmed.length - 1]
  
  // Check for explicit sentence endings
  if (SENTENCE_ENDINGS.includes(lastChar)) {
    return true
  }
  
  // Very short utterances (1-2 words) might be complete
  if (words.length <= 2) {
    return true
  }
  
  // Check if it ends with a pause word (likely incomplete)
  if (PAUSE_INDICATORS.includes(lastWord)) {
    return false
  }
  
  // Check if it starts with a question word but is very short
  const firstWord = words[0]
  if (QUESTION_STARTERS.includes(firstWord) && words.length < 4) {
    return false
  }
  
  // Check for common complete patterns
  const completePatterns = [
    /thank you$/i,
    /thanks$/i,
    /please$/i,
    /yes$/i,
    /no$/i,
    /okay$/i,
    /ok$/i,
    /sure$/i,
    /right$/i,
    /correct$/i,
    /exactly$/i,
    /absolutely$/i,
    /definitely$/i,
    /maybe$/i,
    /sorry$/i,
    /hello$/i,
    /hi$/i,
    /bye$/i,
    /goodbye$/i,
    /see you$/i,
    /talk to you later$/i,
    /have a nice day$/i,
    /good morning$/i,
    /good afternoon$/i,
    /good evening$/i,
    /good night$/i
  ]
  
  for (const pattern of completePatterns) {
    if (pattern.test(trimmed)) {
      return true
    }
  }
  
  // If we have a reasonable length sentence (>5 words), it might be complete
  if (words.length > 5) {
    // Check if the last few words form a complete phrase
    const lastThreeWords = words.slice(-3).join(' ')
    const seemsComplete = !PAUSE_INDICATORS.includes(lastWord) &&
                         !lastThreeWords.match(/\b(going to|want to|need to|have to|would like to)$/i)
    
    return seemsComplete
  }
  
  // Default to waiting for more
  return false
}

/**
 * Calculate dynamic silence delay based on transcript
 */
export function calculateSilenceDelay(
  transcript: string, 
  baseDelay: number,
  isLikelyComplete: boolean
): number {
  const words = transcript.trim().split(/\s+/)
  
  // If it seems complete, use shorter delay
  if (isLikelyComplete) {
    return Math.min(baseDelay * 0.6, 1000)
  }
  
  // For questions or incomplete thoughts, wait longer
  const firstWord = words[0]?.toLowerCase()
  if (QUESTION_STARTERS.includes(firstWord)) {
    return baseDelay * 1.2
  }
  
  // For very short utterances, wait a bit longer
  if (words.length < 3) {
    return baseDelay * 1.1
  }
  
  return baseDelay
}
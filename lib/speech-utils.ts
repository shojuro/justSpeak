/**
 * Speech processing utilities for language learners
 */

// Common sentence-ending punctuation patterns
const SENTENCE_END_PATTERNS = /[.!?]+$/

// Common conversational phrase endings that might indicate completion
const PHRASE_ENDINGS = [
  'you know',
  'i think',
  'i guess',
  'i mean',
  'right',
  'okay',
  'you see',
  'i suppose',
  'isn\'t it',
  'aren\'t they',
  'don\'t you think',
  'what do you think',
  'that\'s all',
  'i\'m done',
  'i\'m finished',
  'that\'s it',
  'thank you',
  'thanks',
  'please',
  'yes',
  'no',
  'maybe',
  'i agree',
  'i disagree',
  'exactly',
  'absolutely',
  'definitely',
  'of course',
  'sure',
]

// Question words that often start incomplete thoughts
const QUESTION_STARTERS = [
  'what',
  'where',
  'when',
  'who',
  'why',
  'how',
  'which',
  'whose',
  'whom',
]

/**
 * Detects if a transcript appears to be a complete thought
 * @param transcript The current speech transcript
 * @returns Object with completion status and confidence
 */
export function detectSentenceCompletion(transcript: string): {
  isComplete: boolean
  confidence: number
  reason: string
} {
  if (!transcript) {
    return { isComplete: false, confidence: 0, reason: 'empty' }
  }

  const trimmed = transcript.trim().toLowerCase()
  const words = trimmed.split(/\s+/)
  const lastWord = words[words.length - 1]
  const wordCount = words.length

  // Check for explicit punctuation
  if (SENTENCE_END_PATTERNS.test(transcript.trim())) {
    return { isComplete: true, confidence: 0.95, reason: 'punctuation' }
  }

  // Check for common phrase endings
  for (const ending of PHRASE_ENDINGS) {
    if (trimmed.endsWith(ending)) {
      return { isComplete: true, confidence: 0.8, reason: 'phrase_ending' }
    }
  }

  // Very short utterances (< 3 words) are often complete
  if (wordCount < 3) {
    return { isComplete: true, confidence: 0.7, reason: 'short_utterance' }
  }

  // Check if it's an incomplete question
  const startsWithQuestion = QUESTION_STARTERS.includes(words[0])
  if (startsWithQuestion && wordCount < 5) {
    return { isComplete: false, confidence: 0.7, reason: 'incomplete_question' }
  }

  // Check for trailing conjunctions (often incomplete)
  const trailingConjunctions = ['and', 'but', 'or', 'so', 'because', 'if', 'when', 'while']
  if (trailingConjunctions.includes(lastWord)) {
    return { isComplete: false, confidence: 0.8, reason: 'trailing_conjunction' }
  }

  // Check for incomplete phrases
  const incompletePatterns = [
    /\b(is|are|was|were|have|has|had|will|would|should|could|might|may)\s*$/,
    /\b(the|a|an)\s*$/,
    /\b(to|of|in|on|at|for|with|from)\s*$/,
  ]
  
  for (const pattern of incompletePatterns) {
    if (pattern.test(trimmed)) {
      return { isComplete: false, confidence: 0.75, reason: 'incomplete_phrase' }
    }
  }

  // Default: consider complete if > 10 words (likely a full thought)
  if (wordCount > 10) {
    return { isComplete: true, confidence: 0.6, reason: 'long_utterance' }
  }

  // Otherwise, we're not sure
  return { isComplete: false, confidence: 0.5, reason: 'uncertain' }
}

/**
 * Determines if we should process the transcript based on silence and completion
 * @param transcript The current transcript
 * @param silenceElapsed How long silence has been detected (ms)
 * @param silenceThreshold The configured silence threshold (ms)
 * @returns Whether to process the transcript
 */
export function shouldProcessTranscript(
  transcript: string,
  silenceElapsed: number,
  silenceThreshold: number
): boolean {
  const completion = detectSentenceCompletion(transcript)
  
  // Always process if we've exceeded the silence threshold
  if (silenceElapsed >= silenceThreshold) {
    return true
  }
  
  // Process early if we're highly confident it's complete
  if (completion.isComplete && completion.confidence > 0.8) {
    // But still wait at least 3 seconds for language learners
    return silenceElapsed >= 3000
  }
  
  // Don't process if we're confident it's incomplete
  if (!completion.isComplete && completion.confidence > 0.7) {
    return false
  }
  
  // Otherwise, wait for full silence threshold
  return false
}
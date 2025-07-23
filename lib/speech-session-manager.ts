/**
 * Speech Session Manager
 * Manages speech recognition sessions to prevent premature processing
 * and handles echo cancellation logic
 */

export class SpeechSessionManager {
  private accumulatedTranscript: string = ''
  private lastProcessedTranscript: string = ''
  private sessionStartTime: number = 0
  private lastUpdateTime: number = 0
  private isSessionActive: boolean = false
  private finalTranscripts: Set<string> = new Set()

  startSession() {
    this.accumulatedTranscript = ''
    this.finalTranscripts.clear()
    this.sessionStartTime = Date.now()
    this.lastUpdateTime = Date.now()
    this.isSessionActive = true
  }

  endSession() {
    this.isSessionActive = false
    const finalTranscript = this.getFinalTranscript()
    this.lastProcessedTranscript = finalTranscript
    return finalTranscript
  }

  addTranscript(transcript: string, isFinal: boolean = false) {
    if (!this.isSessionActive) return

    this.lastUpdateTime = Date.now()

    if (isFinal) {
      // Store final transcripts separately to ensure they're not lost
      this.finalTranscripts.add(transcript)
    }

    // For continuous recognition, we want to accumulate all transcripts
    // but avoid duplicates from interim results
    if (!this.accumulatedTranscript.includes(transcript)) {
      this.accumulatedTranscript = transcript
    }
  }

  getFinalTranscript(): string {
    // Combine all final transcripts if available
    if (this.finalTranscripts.size > 0) {
      return Array.from(this.finalTranscripts).join(' ').trim()
    }
    // Otherwise return the accumulated transcript
    return this.accumulatedTranscript.trim()
  }

  getCurrentTranscript(): string {
    return this.accumulatedTranscript
  }

  getTimeSinceLastUpdate(): number {
    return Date.now() - this.lastUpdateTime
  }

  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime
  }

  isActive(): boolean {
    return this.isSessionActive
  }

  wasAlreadyProcessed(transcript: string): boolean {
    return transcript === this.lastProcessedTranscript
  }

  clear() {
    this.accumulatedTranscript = ''
    this.finalTranscripts.clear()
    this.lastUpdateTime = Date.now()
  }
}

/**
 * AI Speech Filter
 * Filters out AI's own speech to prevent echo/feedback loops
 */
export class AISpeechFilter {
  private static commonAIPhrases = [
    // Greetings and introductions
    "hello i'm talktime",
    "hello i am talktime",
    "hi i'm talktime",
    "hi i am talktime",
    "friendly english conversation partner",
    "english conversation partner",
    "conversation partner",
    
    // Common AI responses
    "what would you like to talk about",
    "what do you want to talk about",
    "how can i help you",
    "i'm here to help",
    "i am here to help",
    "let's practice english",
    "feel free to ask",
    "please feel free",
    "that's a great question",
    "that's interesting",
    "let me help you",
    "i understand",
    "i see",
    
    // Error messages
    "i'm sorry",
    "i am sorry",
    "sorry i didn't",
    "sorry i did not",
    "could you please repeat",
    "please try again",
    "let me try again",
    
    // Transition phrases
    "speaking of",
    "by the way",
    "that reminds me",
    "furthermore",
    "additionally",
    "in other words",
    
    // Closing phrases
    "is there anything else",
    "anything else i can help",
    "do you have any other questions",
    "feel free to ask more"
  ]

  private static recentAIResponses: string[] = []
  private static readonly MAX_RECENT_RESPONSES = 10

  static addAIResponse(response: string) {
    // Store recent AI responses to filter out echoes
    this.recentAIResponses.unshift(response.toLowerCase())
    if (this.recentAIResponses.length > this.MAX_RECENT_RESPONSES) {
      this.recentAIResponses.pop()
    }
  }

  static isAISpeech(transcript: string): boolean {
    const lowerTranscript = transcript.toLowerCase().trim()
    
    // Check if it's empty or too short
    if (lowerTranscript.length < 3) return true
    
    // Check against common AI phrases
    for (const phrase of this.commonAIPhrases) {
      if (lowerTranscript.includes(phrase)) {
        return true
      }
    }
    
    // Check against recent AI responses (exact or close matches)
    for (const recent of this.recentAIResponses) {
      // Check for exact match
      if (lowerTranscript === recent) {
        return true
      }
      
      // Check for partial match (AI response contained in transcript)
      if (recent.length > 20 && lowerTranscript.includes(recent.substring(0, 20))) {
        return true
      }
      
      // Check for transcript contained in AI response (echo of partial response)
      if (lowerTranscript.length > 10 && recent.includes(lowerTranscript)) {
        return true
      }
    }
    
    // Check for typical AI speech patterns
    const aiPatterns = [
      /^(hello|hi|hey) (i'm|i am|my name is)/i,
      /^(sure|certainly|of course|absolutely)[,.]? (i'd|i would|let me)/i,
      /^i (can help|understand|see|appreciate|hear)/i,
      /^that's (a great|an excellent|interesting|a good)/i,
      /^thank you for (sharing|asking|telling)/i
    ]
    
    for (const pattern of aiPatterns) {
      if (pattern.test(lowerTranscript)) {
        return true
      }
    }
    
    return false
  }

  static getSimilarityScore(text1: string, text2: string): number {
    const s1 = text1.toLowerCase().trim()
    const s2 = text2.toLowerCase().trim()
    
    if (s1 === s2) return 1.0
    if (s1.includes(s2) || s2.includes(s1)) return 0.8
    
    // Simple word overlap similarity
    const words1 = new Set(s1.split(/\s+/))
    const words2 = new Set(s2.split(/\s+/))
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }
}

/**
 * Voice Synthesis State Manager
 * Ensures voice synthesis is properly initialized before use
 */
export class VoiceSynthesisStateManager {
  private static instance: VoiceSynthesisStateManager | null = null
  private isReady: boolean = false
  private hasTestedSynthesis: boolean = false
  private voicesLoaded: boolean = false
  private initPromise: Promise<boolean> | null = null

  static getInstance(): VoiceSynthesisStateManager {
    if (!this.instance) {
      this.instance = new VoiceSynthesisStateManager()
    }
    return this.instance
  }

  async initialize(): Promise<boolean> {
    // Return existing promise if initialization is in progress
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this._initialize()
    return this.initPromise
  }

  private async _initialize(): Promise<boolean> {
    console.log('VoiceSynthesisStateManager: Starting initialization')

    // Check if synthesis is available
    if (!window.speechSynthesis) {
      console.error('VoiceSynthesisStateManager: speechSynthesis not available')
      return false
    }

    try {
      // Step 1: Load voices
      await this.loadVoices()
      
      // Step 2: Test synthesis
      await this.testSynthesis()
      
      // Step 3: Mark as ready
      this.isReady = true
      console.log('VoiceSynthesisStateManager: Initialization complete')
      return true
    } catch (error) {
      console.error('VoiceSynthesisStateManager: Initialization failed', error)
      return false
    }
  }

  private async loadVoices(): Promise<void> {
    return new Promise((resolve) => {
      const loadVoicesWithRetry = (attempts: number = 0) => {
        const voices = window.speechSynthesis.getVoices()
        
        if (voices.length > 0) {
          this.voicesLoaded = true
          console.log(`VoiceSynthesisStateManager: Loaded ${voices.length} voices`)
          resolve()
          return
        }

        if (attempts < 10) {
          // Retry with exponential backoff
          setTimeout(() => loadVoicesWithRetry(attempts + 1), 100 * Math.pow(2, attempts))
        } else {
          // Give up but mark as loaded anyway (some browsers don't report voices)
          console.warn('VoiceSynthesisStateManager: No voices found after retries')
          this.voicesLoaded = true
          resolve()
        }
      }

      // Try loading immediately
      loadVoicesWithRetry()

      // Also listen for the voiceschanged event
      window.speechSynthesis.onvoiceschanged = () => {
        if (!this.voicesLoaded) {
          loadVoicesWithRetry()
        }
      }
    })
  }

  private async testSynthesis(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create a test utterance
        const testUtterance = new SpeechSynthesisUtterance('')
        testUtterance.volume = 0 // Silent
        testUtterance.rate = 10 // Fast
        
        let timeout: NodeJS.Timeout
        
        testUtterance.onend = () => {
          clearTimeout(timeout)
          this.hasTestedSynthesis = true
          console.log('VoiceSynthesisStateManager: Test synthesis successful')
          resolve()
        }
        
        testUtterance.onerror = () => {
          clearTimeout(timeout)
          console.error('VoiceSynthesisStateManager: Test synthesis failed')
          reject(new Error('Test synthesis failed'))
        }
        
        // Set timeout
        timeout = setTimeout(() => {
          window.speechSynthesis.cancel()
          this.hasTestedSynthesis = true // Mark as tested even if it timed out
          console.warn('VoiceSynthesisStateManager: Test synthesis timed out')
          resolve() // Resolve anyway
        }, 2000)
        
        // Speak the test utterance
        window.speechSynthesis.speak(testUtterance)
      } catch (error) {
        console.error('VoiceSynthesisStateManager: Test synthesis error', error)
        reject(error)
      }
    })
  }

  getReadyState(): { isReady: boolean; voicesLoaded: boolean; hasTestedSynthesis: boolean } {
    return {
      isReady: this.isReady,
      voicesLoaded: this.voicesLoaded,
      hasTestedSynthesis: this.hasTestedSynthesis
    }
  }

  isFullyReady(): boolean {
    return this.isReady && this.voicesLoaded && this.hasTestedSynthesis
  }
}
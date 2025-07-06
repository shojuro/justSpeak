import { Assessment, Correction, SessionLog } from '@/types/assessment'

export class AssessmentService {
  /**
   * Parse AI response to extract assessment data
   */
  static parseAssessment(
    aiResponse: string,
    originalMessage: string,
    userId: string,
    sessionId: string,
    mode: 'conversation' | 'learning'
  ): Assessment | null {
    // Only parse assessments in learning mode
    if (mode !== 'learning') {
      return null
    }

    try {
      const assessment: Assessment = {
        id: crypto.randomUUID(),
        sessionId,
        userId,
        timestamp: new Date(),
        originalText: originalMessage,
        correctedText: '',
        corrections: [],
        areasToImprove: [],
        assessmentNotes: '',
        mode
      }

      // Extract corrected text
      const rewrittenMatch = aiResponse.match(/\*\*Your message rewritten:\*\*\s*\n(.+?)(?=\n\n|\*\*)/)
      if (rewrittenMatch) {
        assessment.correctedText = rewrittenMatch[1].trim()
      }

      // Extract corrections
      const correctionsMatch = aiResponse.match(/\*\*Corrections Made:\*\*\s*\n([\s\S]+?)(?=\*\*Your message rewritten:|$)/)
      if (correctionsMatch) {
        const correctionsText = correctionsMatch[1]
        const correctionLines = correctionsText.split('\n').filter(line => line.trim())
        
        correctionLines.forEach(line => {
          // Parse correction format: "- [Type]: explanation"
          const match = line.match(/^[-•]\s*(.+?):\s*(.+)$/)
          if (match) {
            const [, error, explanation] = match
            
            // Determine correction type
            let type: Correction['type'] = 'grammar'
            if (error.toLowerCase().includes('spell')) type = 'spelling'
            else if (error.toLowerCase().includes('punctuat')) type = 'punctuation'
            else if (error.toLowerCase().includes('vocab') || error.toLowerCase().includes('word')) type = 'vocabulary'
            else if (error.toLowerCase().includes('structure') || error.toLowerCase().includes('sentence')) type = 'structure'
            
            assessment.corrections.push({
              type,
              original: error,
              corrected: '',
              explanation: explanation.trim()
            })
          }
        })
      }

      // Extract areas to improve
      const areasMatch = aiResponse.match(/\*\*Key areas to practice:\*\*\s*\n([\s\S]+?)(?=\n\n|$)/)
      if (areasMatch) {
        const areasText = areasMatch[1]
        const areaLines = areasText.split('\n').filter(line => line.trim())
        
        assessment.areasToImprove = areaLines.map(line => 
          line.replace(/^[-•]\s*/, '').trim()
        ).filter(area => area.length > 0)
      }

      // Extract overall assessment from the conversational part
      const conversationalPart = aiResponse.split('📝 Language Assessment:')[0]
      if (conversationalPart) {
        assessment.assessmentNotes = conversationalPart.trim()
      }

      return assessment
    } catch (error) {
      console.error('Error parsing assessment:', error)
      return null
    }
  }

  /**
   * Format assessment for display
   */
  static formatAssessment(assessment: Assessment): string {
    const sections = []

    sections.push(`**Original:** ${assessment.originalText}`)
    sections.push(`**Corrected:** ${assessment.correctedText}`)

    if (assessment.corrections.length > 0) {
      sections.push('\n**Corrections:**')
      assessment.corrections.forEach(correction => {
        sections.push(`- ${correction.type}: ${correction.explanation}`)
      })
    }

    if (assessment.areasToImprove.length > 0) {
      sections.push('\n**Areas to work on:**')
      assessment.areasToImprove.forEach((area, index) => {
        sections.push(`${index + 1}. ${area}`)
      })
    }

    return sections.join('\n')
  }

  /**
   * Generate session summary
   */
  static generateSessionSummary(sessionLog: SessionLog): string {
    const totalAssessments = sessionLog.assessments.length
    const totalCorrections = sessionLog.assessments.reduce(
      (sum, assessment) => sum + assessment.corrections.length, 
      0
    )

    // Count correction types
    const correctionTypes: Record<string, number> = {}
    sessionLog.assessments.forEach(assessment => {
      assessment.corrections.forEach(correction => {
        correctionTypes[correction.type] = (correctionTypes[correction.type] || 0) + 1
      })
    })

    // Find most common areas to improve
    const areaFrequency: Record<string, number> = {}
    sessionLog.assessments.forEach(assessment => {
      assessment.areasToImprove.forEach(area => {
        areaFrequency[area] = (areaFrequency[area] || 0) + 1
      })
    })

    const sortedAreas = Object.entries(areaFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([area]) => area)

    return `
## Session Summary

**Date:** ${sessionLog.startTime.toLocaleDateString()}
**Duration:** ${Math.round((sessionLog.userTalkTime + sessionLog.aiTalkTime) / 60)} minutes
**Mode:** ${sessionLog.mode}

### Speaking Time
- Student: ${Math.round(sessionLog.userTalkTime / 60)} minutes
- AI: ${Math.round(sessionLog.aiTalkTime / 60)} minutes

### Language Assessment
- Total messages analyzed: ${totalAssessments}
- Total corrections made: ${totalCorrections}

### Correction Breakdown
${Object.entries(correctionTypes)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

### Top Areas to Focus On
${sortedAreas.map((area, index) => `${index + 1}. ${area}`).join('\n')}
`
  }
}
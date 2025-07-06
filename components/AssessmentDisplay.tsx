'use client'

import { useState } from 'react'

interface AssessmentDisplayProps {
  assessment: {
    correctedText: string
    corrections: Array<{
      type: string
      original: string
      corrected: string
      explanation: string
    }>
    areasToImprove: string[]
  }
}

export default function AssessmentDisplay({ assessment }: AssessmentDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!assessment || assessment.corrections.length === 0) {
    return null
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex justify-between items-start">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          📝 Language Feedback
        </h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      </div>

      {/* Always show corrected version */}
      {assessment.correctedText && (
        <div className="mb-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Better way to say it:</p>
          <p className="text-sm text-gray-800 dark:text-gray-200 italic">
            "{assessment.correctedText}"
          </p>
        </div>
      )}

      {/* Show details when expanded */}
      {isExpanded && (
        <>
          {/* Corrections */}
          {assessment.corrections.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Corrections explained:
              </p>
              <ul className="space-y-2">
                {assessment.corrections.map((correction, index) => (
                  <li key={index} className="text-sm">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 mr-2">
                      {correction.type}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {correction.explanation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas to improve */}
          {assessment.areasToImprove.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Focus areas:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {assessment.areasToImprove.map((area, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
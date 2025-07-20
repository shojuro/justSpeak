'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to our logging service
    import('@/lib/logger').then(({ logger }) => {
      logger.error('Next.js global error handler caught an error', error, {
        digest: error.digest,
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    })
  }, [error])

  return (
    <div className="min-h-screen bg-jet flex items-center justify-center p-4">
      <div className="bg-warm-coral-light rounded-2xl p-8 max-w-lg w-full text-center">
        <h2 className="text-3xl font-bold text-jet mb-4">
          Something went wrong!
        </h2>
        <p className="text-jet/80 mb-6">
          An unexpected error occurred. We apologize for the inconvenience.
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-warm-coral text-white rounded-full hover:bg-warm-coral-dark transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 bg-jet/10 text-jet rounded-full hover:bg-jet/20 transition-colors"
          >
            Go Home
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-jet/60 text-sm">
              Error Details (Development Only)
            </summary>
            <div className="mt-2 p-4 bg-jet/10 rounded">
              <p className="text-xs text-jet/80 break-words">
                <strong>Message:</strong> {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-jet/60 mt-2">
                  <strong>Error ID:</strong> {error.digest}
                </p>
              )}
              {error.stack && (
                <pre className="text-xs text-jet/60 mt-2 overflow-auto">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
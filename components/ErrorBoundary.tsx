'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Import logger dynamically to avoid server-side issues
    import('@/lib/logger').then(({ logger }) => {
      logger.error('React ErrorBoundary caught an error', error, {
        componentStack: errorInfo.componentStack,
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      })
    })
    
    // Call the optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-jet flex items-center justify-center p-4">
          <div className="bg-warm-coral-light rounded-2xl p-8 max-w-lg w-full text-center">
            <h2 className="text-2xl font-bold text-jet mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-jet/80 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-warm-coral text-white rounded-full hover:bg-warm-coral-dark transition-colors"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-jet/60 text-sm">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 p-4 bg-jet/10 rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
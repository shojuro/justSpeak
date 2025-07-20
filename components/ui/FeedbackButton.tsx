'use client'

import { useState, useEffect, forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface FeedbackButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  success?: boolean
  error?: boolean
  ripple?: boolean
}

export const FeedbackButton = forwardRef<HTMLButtonElement, FeedbackButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading, 
    success,
    error,
    ripple = true,
    disabled,
    children,
    onClick,
    ...props 
  }, ref) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; size: number }>>([])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled && !loading) {
        const button = e.currentTarget
        const rect = button.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height)
        const x = e.clientX - rect.left - size / 2
        const y = e.clientY - rect.top - size / 2

        const newRipple = { x, y, size }
        setRipples(prev => [...prev, newRipple])

        // Remove ripple after animation
        setTimeout(() => {
          setRipples(prev => prev.slice(1))
        }, 600)
      }

      onClick?.(e)
    }

    const variantStyles = {
      primary: 'bg-warm-coral text-white hover:bg-warm-coral-dark',
      secondary: 'bg-warm-coral-light text-jet hover:bg-warm-coral',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      ghost: 'bg-transparent text-warm-coral hover:bg-warm-coral/10',
    }

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    }

    const stateStyles = success
      ? 'bg-green-600 hover:bg-green-600'
      : error
      ? 'bg-red-600 hover:bg-red-600'
      : ''

    return (
      <button
        ref={ref}
        onClick={handleClick}
        disabled={disabled || loading}
        className={cn(
          'relative overflow-hidden font-medium rounded-full',
          'transition-all duration-200 transform',
          'focus:outline-none focus:ring-2 focus:ring-warm-coral focus:ring-offset-2 focus:ring-offset-deep-charcoal',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-95',
          variantStyles[variant],
          sizeStyles[size],
          stateStyles,
          className
        )}
        aria-busy={loading}
        {...props}
      >
        {/* Ripple effect */}
        {ripples.map((ripple, index) => (
          <span
            key={index}
            className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}

        {/* Button content */}
        <span className={cn(
          'relative z-10 flex items-center justify-center gap-2',
          loading && 'invisible'
        )}>
          {children}
        </span>

        {/* Loading spinner */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="animate-spin h-5 w-5" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </span>
        )}

        {/* Success checkmark */}
        {success && !loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="w-5 h-5 animate-scale-check" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
        )}

        {/* Error X */}
        {error && !loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="w-5 h-5 animate-scale-check" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </span>
        )}
      </button>
    )
  }
)

FeedbackButton.displayName = 'FeedbackButton'

// Progress button for long-running operations
interface ProgressButtonProps extends Omit<FeedbackButtonProps, 'loading'> {
  progress?: number
  onComplete?: () => void
}

export function ProgressButton({ 
  progress = 0, 
  onComplete,
  children,
  ...props 
}: ProgressButtonProps) {
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (progress >= 100 && !isComplete) {
      setIsComplete(true)
      onComplete?.()
    }
  }, [progress, isComplete, onComplete])

  return (
    <FeedbackButton {...props} success={isComplete}>
      <span className="relative z-10">
        {isComplete ? 'Complete!' : children}
      </span>
      {progress > 0 && progress < 100 && (
        <span 
          className="absolute left-0 top-0 h-full bg-white/20 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      )}
    </FeedbackButton>
  )
}
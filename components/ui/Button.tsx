'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  ariaLabel?: string
  ariaPressed?: boolean
  ariaExpanded?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, loading = false, disabled, children, ariaLabel, ariaPressed, ariaExpanded, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-coral disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'bg-warm-coral text-white hover:bg-warm-coral-dark focus:ring-warm-coral',
      secondary: 'bg-warm-coral-light text-jet hover:bg-warm-coral hover:text-white focus:ring-warm-coral-light',
      ghost: 'bg-transparent text-warm-coral hover:bg-warm-coral/10 focus:ring-warm-coral/50',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        aria-label={ariaLabel || (loading ? 'Loading' : undefined)}
        aria-pressed={ariaPressed}
        aria-expanded={ariaExpanded}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
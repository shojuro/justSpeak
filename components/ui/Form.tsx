'use client'

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { getFieldProps } from '@/lib/form-validation'

interface FormFieldProps {
  label: string
  name: string
  error?: string
  touched?: boolean
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function FormField({ 
  label, 
  name, 
  error, 
  touched, 
  required, 
  className,
  children 
}: FormFieldProps) {
  const hasError = touched && error

  return (
    <div className={cn('space-y-2', className)}>
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-warm-coral"
      >
        {label}
        {required && <span className="text-warm-coral-dark ml-1" aria-label="required">*</span>}
      </label>
      {children}
      {hasError && (
        <p 
          id={`${name}-error`} 
          className="text-sm text-red-500 mt-1" 
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  touched?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, touched, name = '', ...props }, ref) => {
    const fieldProps = getFieldProps(name, error, touched)

    return (
      <input
        ref={ref}
        id={name}
        name={name}
        className={cn(
          'w-full px-3 py-2 bg-jet/50 border rounded-lg text-white',
          'focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-transparent',
          'transition-colors duration-200',
          touched && error 
            ? 'border-red-500' 
            : 'border-warm-coral/30 hover:border-warm-coral/50',
          props.disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...fieldProps}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  touched?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, touched, name = '', ...props }, ref) => {
    const fieldProps = getFieldProps(name, error, touched)

    return (
      <textarea
        ref={ref}
        id={name}
        name={name}
        className={cn(
          'w-full px-3 py-2 bg-jet/50 border rounded-lg text-white',
          'focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-transparent',
          'transition-colors duration-200',
          'resize-y min-h-[100px]',
          touched && error 
            ? 'border-red-500' 
            : 'border-warm-coral/30 hover:border-warm-coral/50',
          props.disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...fieldProps}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  touched?: boolean
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, touched, name = '', options, placeholder, ...props }, ref) => {
    const fieldProps = getFieldProps(name, error, touched)

    return (
      <select
        ref={ref}
        id={name}
        name={name}
        className={cn(
          'w-full px-3 py-2 bg-jet/50 border rounded-lg text-white',
          'focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-transparent',
          'transition-colors duration-200',
          touched && error 
            ? 'border-red-500' 
            : 'border-warm-coral/30 hover:border-warm-coral/50',
          props.disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...fieldProps}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }
)

Select.displayName = 'Select'

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  touched?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, touched, name = '', ...props }, ref) => {
    const fieldProps = getFieldProps(name, error, touched)

    return (
      <div className="flex items-start space-x-3">
        <input
          ref={ref}
          type="checkbox"
          id={name}
          name={name}
          className={cn(
            'mt-1 w-4 h-4 text-warm-coral bg-jet/50 border rounded',
            'focus:ring-2 focus:ring-warm-coral focus:ring-offset-2 focus:ring-offset-deep-charcoal',
            touched && error 
              ? 'border-red-500' 
              : 'border-warm-coral/30',
            props.disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...fieldProps}
          {...props}
        />
        <label 
          htmlFor={name} 
          className="text-sm text-white cursor-pointer select-none"
        >
          {label}
        </label>
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

// Form submit button with loading state
interface SubmitButtonProps {
  children: React.ReactNode
  isLoading?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export function SubmitButton({ 
  children, 
  isLoading, 
  disabled, 
  className,
  onClick 
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn(
        'px-6 py-2 bg-warm-coral text-white rounded-full font-medium',
        'hover:bg-warm-coral-dark focus:outline-none focus:ring-2 focus:ring-warm-coral focus:ring-offset-2 focus:ring-offset-deep-charcoal',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'flex items-center justify-center gap-2',
        className
      )}
      aria-busy={isLoading}
    >
      {isLoading && (
        <svg 
          className="animate-spin h-4 w-4" 
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
      )}
      {children}
    </button>
  )
}
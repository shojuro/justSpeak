'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useFormValidation, validators } from '@/lib/form-validation'
import { FormField, Input, SubmitButton } from '@/components/ui/Form'
import { auth } from '@/lib/auth'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)

  const { values, errors, touched, handleChange, handleBlur, validate } = useFormValidation(
    { password: '', confirmPassword: '' },
    {
      password: [
        validators.required(), 
        validators.minLength(8),
        validators.pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain uppercase, lowercase, and number'
        )
      ],
      confirmPassword: [
        validators.required(),
        validators.custom(
          (value, allValues) => value === allValues.password,
          'Passwords do not match'
        )
      ]
    }
  )

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { session } = await auth.getSession()
      if (!session) {
        setIsValidToken(false)
      }
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setIsLoading(true)
    try {
      const { error } = await auth.updatePassword(values.password)
      
      if (error) throw error
      
      // Success - redirect to login
      router.push('/auth/login?reset=success')
    } catch (error: any) {
      console.error('Password reset error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-charcoal px-4">
        <div className="max-w-md w-full">
          <div className="bg-jet rounded-lg shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error/20 mb-4">
              <svg className="h-6 w-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-warm-coral mb-2">Invalid or Expired Link</h2>
            <p className="text-warm-coral-light mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            
            <a
              href="/auth/forgot-password"
              className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-full shadow-sm text-base font-medium text-white bg-warm-coral hover:bg-warm-coral-dark transition-colors"
            >
              Request New Link
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-charcoal px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-warm-coral">Reset Your Password</h1>
          <p className="mt-2 text-warm-coral-light">
            Enter your new password below
          </p>
        </div>

        <div className="bg-jet rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              label="New Password"
              name="password"
              error={errors.password}
              touched={touched.password}
              required
            >
              <Input
                type="password"
                name="password"
                value={values.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                error={errors.password}
                touched={touched.password}
                placeholder="••••••••"
                autoComplete="new-password"
                autoFocus
              />
            </FormField>

            <FormField
              label="Confirm New Password"
              name="confirmPassword"
              error={errors.confirmPassword}
              touched={touched.confirmPassword}
              required
            >
              <Input
                type="password"
                name="confirmPassword"
                value={values.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                error={errors.confirmPassword}
                touched={touched.confirmPassword}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </FormField>

            <div className="bg-warm-coral/10 border border-warm-coral/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-warm-coral mb-2">Password Requirements:</h3>
              <ul className="text-sm text-warm-coral-light space-y-1">
                <li className={values.password.length >= 8 ? 'text-success' : ''}>
                  • At least 8 characters
                </li>
                <li className={/[A-Z]/.test(values.password) ? 'text-success' : ''}>
                  • One uppercase letter
                </li>
                <li className={/[a-z]/.test(values.password) ? 'text-success' : ''}>
                  • One lowercase letter
                </li>
                <li className={/\d/.test(values.password) ? 'text-success' : ''}>
                  • One number
                </li>
              </ul>
            </div>

            <SubmitButton isLoading={isLoading} className="w-full">
              Reset Password
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useFormValidation, validators } from '@/lib/form-validation'
import { FormField, Input, SubmitButton } from '@/components/ui/Form'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const schema = {
    email: [validators.required(), validators.email()]
  }

  const { values, errors, touched, handleChange, handleBlur, validate } = useFormValidation(
    { email: '' },
    schema
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setIsLoading(true)
    try {
      await resetPassword(values.email)
      setIsSuccess(true)
    } catch (error) {
      // Error toast shown by AuthContext
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-charcoal px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-jet rounded-lg shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-warm-coral/20 mb-4">
              <svg className="h-6 w-6 text-warm-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-warm-coral mb-2">Check your email</h2>
            <p className="text-warm-coral-light mb-6">
              We've sent a password reset link to <strong>{values.email}</strong>
            </p>
            
            <p className="text-sm text-warm-coral-light mb-4">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            
            <Link
              href="/auth/login"
              className="inline-flex items-center text-warm-coral hover:text-warm-coral-dark transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-charcoal px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-warm-coral">Forgot Password?</h1>
          <p className="mt-2 text-warm-coral-light">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        <div className="bg-jet rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              label="Email Address"
              name="email"
              error={errors.email}
              touched={touched.email}
              required
            >
              <Input
                type="email"
                name="email"
                value={values.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                error={errors.email}
                touched={touched.email}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
              />
            </FormField>

            <SubmitButton isLoading={isLoading} className="w-full">
              Send Reset Instructions
            </SubmitButton>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm text-warm-coral hover:text-warm-coral-dark transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
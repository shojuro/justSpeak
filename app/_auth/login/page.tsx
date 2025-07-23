'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useFormValidation, validators } from '@/lib/form-validation'
import { FormField, Input, SubmitButton } from '@/components/ui/Form'
import { FeedbackButton } from '@/components/ui/FeedbackButton'

export default function LoginPage() {
  const { signIn, signInWithProvider } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const schema = {
    email: [validators.required(), validators.email()],
    password: [validators.required(), validators.minLength(6)]
  }

  const { values, errors, touched, handleChange, handleBlur, validate } = useFormValidation(
    { email: '', password: '' },
    schema
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setIsLoading(true)
    try {
      await signIn(values.email, values.password)
      // Redirect handled by AuthContext
    } catch (error) {
      // Error toast shown by AuthContext
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'github' | 'facebook') => {
    try {
      await signInWithProvider(provider)
    } catch (error) {
      // Error handled by AuthContext
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-charcoal px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-warm-coral">Welcome Back</h1>
          <p className="mt-2 text-warm-coral-light">Sign in to continue your learning journey</p>
        </div>

        <div className="bg-jet rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              label="Email"
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
              />
            </FormField>

            <FormField
              label="Password"
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
                autoComplete="current-password"
              />
            </FormField>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-warm-coral focus:ring-warm-coral border-warm-coral-light rounded"
                />
                <span className="ml-2 text-sm text-warm-coral-light">Remember me</span>
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-sm text-warm-coral hover:text-warm-coral-light transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <SubmitButton isLoading={isLoading} className="w-full">
              Sign In
            </SubmitButton>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-coral/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-jet text-warm-coral-light">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <FeedbackButton
                variant="secondary"
                onClick={() => handleSocialLogin('google')}
                className="w-full justify-center"
                aria-label="Sign in with Google"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </FeedbackButton>

              <FeedbackButton
                variant="secondary"
                onClick={() => handleSocialLogin('github')}
                className="w-full justify-center"
                aria-label="Sign in with GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </FeedbackButton>

              <FeedbackButton
                variant="secondary"
                onClick={() => handleSocialLogin('facebook')}
                className="w-full justify-center"
                aria-label="Sign in with Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </FeedbackButton>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-warm-coral-light">
            Don't have an account?{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-warm-coral hover:text-warm-coral-dark transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
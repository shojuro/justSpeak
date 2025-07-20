'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { useToast } from '@/components/ui/Toast'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    // Check if we have verification token in URL
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    
    if (token && email) {
      verifyEmail(email, token)
    } else {
      // Get user email from session
      getUserEmail()
    }
  }, [searchParams])

  const getUserEmail = async () => {
    const { user } = await auth.getCurrentUser()
    if (user?.email) {
      setUserEmail(user.email)
    }
  }

  const verifyEmail = async (email: string, token: string) => {
    setIsVerifying(true)
    try {
      const { error } = await auth.verifyEmail(email, token)
      
      if (error) throw error
      
      setVerificationStatus('success')
      showToast('Email verified successfully!', 'success')
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      setVerificationStatus('error')
      showToast(error.message || 'Failed to verify email', 'error')
    } finally {
      setIsVerifying(false)
    }
  }

  const resendVerificationEmail = async () => {
    if (!userEmail) return
    
    setIsVerifying(true)
    try {
      // In a real app, you'd have an API endpoint to resend verification email
      showToast('Verification email sent! Check your inbox.', 'info')
    } catch (error) {
      showToast('Failed to send verification email', 'error')
    } finally {
      setIsVerifying(false)
    }
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-charcoal px-4">
        <div className="max-w-md w-full">
          <div className="bg-jet rounded-lg shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success/20 mb-4">
              <svg className="h-8 w-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-warm-coral mb-2">Email Verified!</h2>
            <p className="text-warm-coral-light mb-6">
              Your email has been successfully verified. Redirecting to dashboard...
            </p>
            
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-warm-coral mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-charcoal px-4">
        <div className="max-w-md w-full">
          <div className="bg-jet rounded-lg shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-error/20 mb-4">
              <svg className="h-8 w-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-warm-coral mb-2">Verification Failed</h2>
            <p className="text-warm-coral-light mb-6">
              The verification link is invalid or has expired.
            </p>
            
            <button
              onClick={resendVerificationEmail}
              disabled={isVerifying}
              className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-full shadow-sm text-base font-medium text-white bg-warm-coral hover:bg-warm-coral-dark disabled:opacity-50 transition-colors"
            >
              {isVerifying ? 'Sending...' : 'Resend Verification Email'}
            </button>
            
            <Link
              href="/auth/login"
              className="mt-4 inline-block text-sm text-warm-coral hover:text-warm-coral-dark transition-colors"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-charcoal px-4">
      <div className="max-w-md w-full">
        <div className="bg-jet rounded-lg shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-warm-coral/20 mb-4">
            <svg className="h-8 w-8 text-warm-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-warm-coral mb-2">Verify Your Email</h2>
          
          {userEmail ? (
            <>
              <p className="text-warm-coral-light mb-6">
                We've sent a verification email to <strong>{userEmail}</strong>
              </p>
              <p className="text-sm text-warm-coral-light mb-6">
                Click the link in the email to verify your account. If you don't see it, check your spam folder.
              </p>
            </>
          ) : (
            <p className="text-warm-coral-light mb-6">
              Check your email for a verification link to complete your registration.
            </p>
          )}
          
          <button
            onClick={resendVerificationEmail}
            disabled={isVerifying || !userEmail}
            className="inline-flex items-center justify-center w-full px-4 py-2 border border-warm-coral rounded-full shadow-sm text-base font-medium text-warm-coral hover:bg-warm-coral hover:text-white disabled:opacity-50 transition-colors mb-4"
          >
            {isVerifying ? 'Sending...' : 'Resend Verification Email'}
          </button>
          
          <Link
            href="/auth/login"
            className="text-sm text-warm-coral hover:text-warm-coral-dark transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
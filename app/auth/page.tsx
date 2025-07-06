import Auth from '@/components/Auth'
import Link from 'next/link'

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-deep-charcoal to-deep-charcoal-light flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold">
              <span className="text-warm-coral">Talk</span>
              <span className="text-white font-light">Time</span>
            </h1>
          </Link>
          <p className="mt-2 text-white/60">Sign in to track your progress</p>
        </div>

        <Auth />
      </div>
    </div>
  )
}
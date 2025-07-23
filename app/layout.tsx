import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import AuthProvider from '@/components/AuthProvider'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TalkTime - Practice English Conversation',
  description: 'A judgment-free conversation partner that helps you practice speaking English',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TalkTime',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'TalkTime - Practice English Conversation',
    description: 'A judgment-free conversation partner that helps you practice speaking English',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'TalkTime - Practice English Conversation',
    description: 'A judgment-free conversation partner that helps you practice speaking English',
  },
}

export const viewport = {
  themeColor: '#2C2C2E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 'no',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full mobile-viewport`}>
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <div className="h-full safe-top safe-bottom safe-left safe-right">
                {children}
              </div>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
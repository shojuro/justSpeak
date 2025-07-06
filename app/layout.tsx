import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import AuthProvider from '@/components/AuthProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TalkTime - Practice English Conversation',
  description: 'A judgment-free conversation partner that helps you practice speaking English',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#2C2C2E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
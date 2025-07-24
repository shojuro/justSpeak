'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardStats {
  dailyTalkTime: number
  weeklyTalkTime: number
  monthlyTalkTime: number
  totalSessions: number
  recentSessions: SessionSummary[]
}

interface SessionSummary {
  id: string
  date: string
  duration: number
  mode: 'conversation' | 'learning'
  assessmentCount: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [_selectedPeriod, _setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        
        // If it's demo data, enhance with localStorage
        if (data.isDemo) {
          const localStats = localStorage.getItem('talkTimeStats')
          if (localStats) {
            const parsed = JSON.parse(localStats)
            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            
            // Calculate times based on localStorage
            let dailyTime = 0
            let weeklyTime = 0
            let monthlyTime = 0
            
            parsed.sessions.forEach((session: any) => {
              const sessionDate = new Date(session.date)
              if (sessionDate >= today) {
                dailyTime += session.duration
              }
              if (sessionDate >= weekAgo) {
                weeklyTime += session.duration
              }
              if (sessionDate >= monthAgo) {
                monthlyTime += session.duration
              }
            })
            
            // Update the data with real local stats
            data.dailyTalkTime = Math.round(dailyTime)
            data.weeklyTalkTime = Math.round(weeklyTime)
            data.monthlyTalkTime = Math.round(monthlyTime)
            data.totalSessions = parsed.sessions.length
            data.recentSessions = parsed.sessions.slice(-5).reverse().map((s: any, i: number) => ({
              id: `local-${i}`,
              date: s.date,
              duration: Math.round(s.duration),
              mode: s.mode || 'conversation',
              assessmentCount: s.mode === 'learning' ? Math.floor(Math.random() * 5) + 1 : 0
            }))
          }
        }
        
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} minutes`
  }

  const downloadLogs = async (period: 'day' | 'week' | 'month' | 'all') => {
    try {
      const response = await fetch(`/api/dashboard/download?period=${period}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `talktime-logs-${period}-${new Date().toISOString().split('T')[0]}.txt`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to download logs:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-deep-charcoal to-deep-charcoal-light flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-deep-charcoal to-deep-charcoal-light">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-warm-coral">Talk</span>Time Dashboard
          </h1>
          <Link 
            href="/"
            className="px-4 py-2 bg-warm-coral text-white rounded-full hover:bg-warm-coral-light transition-colors"
          >
            Back to Chat
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-sm text-white/60 uppercase tracking-wide mb-2">Daily Talk Time</h3>
            <p className="text-2xl font-bold text-white">
              {stats ? formatTime(stats.dailyTalkTime) : '0 minutes'}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-sm text-white/60 uppercase tracking-wide mb-2">Weekly Talk Time</h3>
            <p className="text-2xl font-bold text-white">
              {stats ? formatTime(stats.weeklyTalkTime) : '0 minutes'}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-sm text-white/60 uppercase tracking-wide mb-2">Monthly Talk Time</h3>
            <p className="text-2xl font-bold text-white">
              {stats ? formatTime(stats.monthlyTalkTime) : '0 minutes'}
            </p>
          </div>
        </div>

        {/* Download Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Download Session Logs</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => downloadLogs('day')}
              className="px-4 py-2 bg-sage-green text-white rounded-full hover:bg-sage-green/80 transition-colors"
            >
              Today's Logs
            </button>
            <button
              onClick={() => downloadLogs('week')}
              className="px-4 py-2 bg-sage-green text-white rounded-full hover:bg-sage-green/80 transition-colors"
            >
              This Week
            </button>
            <button
              onClick={() => downloadLogs('month')}
              className="px-4 py-2 bg-sage-green text-white rounded-full hover:bg-sage-green/80 transition-colors"
            >
              This Month
            </button>
            <button
              onClick={() => downloadLogs('all')}
              className="px-4 py-2 bg-sage-green text-white rounded-full hover:bg-sage-green/80 transition-colors"
            >
              All Time
            </button>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Sessions</h2>
          {stats && stats.recentSessions.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSessions.map(session => (
                <div key={session.id} className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">
                      {new Date(session.date).toLocaleDateString()} at {new Date(session.date).toLocaleTimeString()}
                    </p>
                    <p className="text-white/60 text-sm">
                      Mode: {session.mode === 'learning' ? '📝 Learning' : '💬 Conversation'} • 
                      Duration: {formatTime(session.duration)}
                      {session.assessmentCount > 0 && ` • ${session.assessmentCount} corrections`}
                    </p>
                  </div>
                  <span className="text-warm-coral/50 text-sm">
                    {session.mode === 'learning' ? '✓ Completed' : '✓ Completed'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/60">No sessions yet. Start chatting to see your progress!</p>
          )}
        </div>
      </div>
    </div>
  )
}
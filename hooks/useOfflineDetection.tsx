'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'

export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  )
  const { showToast } = useToast()

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      showToast('Connection restored', 'success')
    }

    const handleOffline = () => {
      setIsOnline(false)
      showToast('You are offline. Some features may be limited.', 'warning', 0)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [showToast])

  return isOnline
}

// Hook for queueing actions when offline
export function useOfflineQueue() {
  const [queue, setQueue] = useState<Array<{
    id: string
    action: () => Promise<any>
    timestamp: Date
  }>>([])
  const isOnline = useOfflineDetection()

  const addToQueue = (action: () => Promise<any>) => {
    const id = Date.now().toString()
    setQueue(prev => [...prev, {
      id,
      action,
      timestamp: new Date()
    }])
    return id
  }

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id))
  }

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      const processQueue = async () => {
        for (const item of queue) {
          try {
            await item.action()
            removeFromQueue(item.id)
          } catch (error) {
            console.error('Failed to process queued action:', error)
          }
        }
      }
      processQueue()
    }
  }, [isOnline, queue])

  return {
    addToQueue,
    removeFromQueue,
    queueLength: queue.length,
    isOnline
  }
}

// Service worker registration and management
export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js')
      setRegistration(reg)

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setIsUpdateAvailable(true)
              showToast('A new version is available!', 'info')
            }
          })
        }
      })

      // Check for updates periodically
      setInterval(() => {
        reg.update()
      }, 60 * 60 * 1000) // Every hour
    } catch (error) {
      console.error('Service worker registration failed:', error)
    }
  }

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  return {
    registration,
    isUpdateAvailable,
    updateServiceWorker
  }
}
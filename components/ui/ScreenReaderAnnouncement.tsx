'use client'

import { useEffect, useRef } from 'react'

interface ScreenReaderAnnouncementProps {
  message: string
  politeness?: 'polite' | 'assertive'
  clearAfter?: number
}

export default function ScreenReaderAnnouncement({
  message,
  politeness = 'polite',
  clearAfter = 0,
}: ScreenReaderAnnouncementProps) {
  const announcementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (announcementRef.current && message) {
      // Force screen reader to announce by clearing and setting content
      announcementRef.current.textContent = ''
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = message
        }
      }, 100)

      // Clear after specified time if requested
      if (clearAfter > 0) {
        setTimeout(() => {
          if (announcementRef.current) {
            announcementRef.current.textContent = ''
          }
        }, clearAfter)
      }
    }
  }, [message, clearAfter])

  return (
    <div
      ref={announcementRef}
      className="sr-only"
      role="status"
      aria-live={politeness}
      aria-atomic="true"
    />
  )
}

// Hook for managing announcements
export function useAnnouncement() {
  const announcementsRef = useRef<string[]>([])

  const announce = (message: string, options?: { delay?: number; priority?: boolean }) => {
    if (options?.priority) {
      announcementsRef.current.unshift(message)
    } else {
      announcementsRef.current.push(message)
    }

    // Process announcements with delay if specified
    setTimeout(() => {
      const nextMessage = announcementsRef.current.shift()
      if (nextMessage) {
        // Dispatch custom event that ScreenReaderAnnouncement component listens to
        window.dispatchEvent(
          new CustomEvent('screen-reader-announce', {
            detail: { message: nextMessage },
          })
        )
      }
    }, options?.delay || 0)
  }

  return { announce }
}
import { useEffect, useRef, RefObject } from 'react'

interface UseKeyboardNavigationOptions {
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onTab?: (event: KeyboardEvent) => void
  enabled?: boolean
}

export function useKeyboardNavigation(
  ref: RefObject<HTMLElement>,
  options: UseKeyboardNavigationOptions
) {
  const { onEscape, onEnter, onArrowUp, onArrowDown, onTab, enabled = true } = options

  useEffect(() => {
    if (!enabled || !ref.current) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault()
            onEscape()
          }
          break
        case 'Enter':
          if (onEnter) {
            event.preventDefault()
            onEnter()
          }
          break
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault()
            onArrowUp()
          }
          break
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault()
            onArrowDown()
          }
          break
        case 'Tab':
          if (onTab) {
            onTab(event)
          }
          break
      }
    }

    const element = ref.current
    element.addEventListener('keydown', handleKeyDown)

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }, [ref, onEscape, onEnter, onArrowUp, onArrowDown, onTab, enabled])
}

// Focus trap hook for modals and overlays
export function useFocusTrap(ref: RefObject<HTMLElement>, enabled = true) {
  const focusableElementsRef = useRef<HTMLElement[]>([])

  useEffect(() => {
    if (!enabled || !ref.current) return

    const container = ref.current
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    // Get all focusable elements
    const updateFocusableElements = () => {
      focusableElementsRef.current = Array.from(
        container.querySelectorAll(focusableSelectors)
      ) as HTMLElement[]
    }

    updateFocusableElements()

    // Focus first element
    if (focusableElementsRef.current.length > 0) {
      focusableElementsRef.current[0].focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = focusableElementsRef.current
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      // Shift + Tab
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    // Update focusable elements on DOM changes
    const observer = new MutationObserver(updateFocusableElements)
    observer.observe(container, { childList: true, subtree: true })

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      observer.disconnect()
    }
  }, [ref, enabled])
}

// Focus management utilities
export const focusUtils = {
  // Move focus to next focusable element
  focusNext: (container: HTMLElement) => {
    const focusable = Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[]

    const currentIndex = focusable.findIndex(el => el === document.activeElement)
    if (currentIndex < focusable.length - 1) {
      focusable[currentIndex + 1].focus()
    }
  },

  // Move focus to previous focusable element
  focusPrevious: (container: HTMLElement) => {
    const focusable = Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[]

    const currentIndex = focusable.findIndex(el => el === document.activeElement)
    if (currentIndex > 0) {
      focusable[currentIndex - 1].focus()
    }
  },

  // Restore focus to element after modal/overlay closes
  restoreFocus: (element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus()
    }
  },
}
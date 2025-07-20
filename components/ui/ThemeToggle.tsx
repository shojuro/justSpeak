'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const themes = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ] as const

  const currentTheme = themes.find(t => t.value === theme) || themes[2]

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-full bg-warm-coral/10 hover:bg-warm-coral/20',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-warm-coral focus:ring-offset-2 focus:ring-offset-deep-charcoal'
        )}
        aria-label="Change theme"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="text-xl" aria-hidden="true">{currentTheme.icon}</span>
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-40 rounded-lg',
            'bg-jet border border-warm-coral/20 shadow-xl',
            'animate-fade-in'
          )}
          role="menu"
          onKeyDown={handleKeyDown}
        >
          <div className="p-1">
            {themes.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => {
                  setTheme(themeOption.value)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded',
                  'text-left text-sm transition-colors duration-200',
                  'hover:bg-warm-coral/10',
                  'focus:outline-none focus:bg-warm-coral/10',
                  theme === themeOption.value && 'bg-warm-coral/20 text-warm-coral'
                )}
                role="menuitem"
                aria-current={theme === themeOption.value ? 'true' : undefined}
              >
                <span className="text-lg" aria-hidden="true">
                  {themeOption.icon}
                </span>
                <span>{themeOption.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Inline theme toggle for settings pages
export function InlineThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center justify-between p-4 bg-jet/50 rounded-lg">
      <div>
        <h3 className="text-lg font-medium text-warm-coral">Theme</h3>
        <p className="text-sm text-warm-coral-light mt-1">
          Choose your preferred color scheme
        </p>
      </div>
      
      <div className="flex gap-2">
        {[
          { value: 'light', icon: '☀️', label: 'Light' },
          { value: 'dark', icon: '🌙', label: 'Dark' },
          { value: 'system', icon: '💻', label: 'System' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setTheme(option.value as any)}
            className={cn(
              'p-3 rounded-lg transition-all duration-200',
              'hover:bg-warm-coral/10',
              'focus:outline-none focus:ring-2 focus:ring-warm-coral focus:ring-offset-2 focus:ring-offset-deep-charcoal',
              theme === option.value
                ? 'bg-warm-coral text-white'
                : 'bg-jet text-warm-coral-light'
            )}
            aria-label={`Set theme to ${option.label}`}
            aria-pressed={theme === option.value}
          >
            <span className="text-xl" aria-hidden="true">
              {option.icon}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
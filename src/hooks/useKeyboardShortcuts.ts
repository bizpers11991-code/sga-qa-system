import * as React from 'react'

type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      for (const shortcut of shortcuts) {
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
        const altMatches = shortcut.alt ? e.altKey : !e.altKey
        const shiftMatches = shortcut.shift ? e.shiftKey : !e.shiftKey

        if (keyMatches && ctrlMatches && altMatches && shiftMatches) {
          e.preventDefault()
          shortcut.action()
          return
        }

        // Handle Cmd on Mac separately
        if (shortcut.meta && e.metaKey && keyMatches && !e.ctrlKey) {
          const altMatch = shortcut.alt ? e.altKey : !e.altKey
          const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
          if (altMatch && shiftMatch) {
            e.preventDefault()
            shortcut.action()
            return
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Common keyboard shortcuts for the app
export function useAppKeyboardShortcuts() {
  const navigate = (path: string) => {
    window.location.href = path
  }

  useKeyboardShortcuts([
    // Navigation shortcuts
    { key: 'h', description: 'Go to Home', action: () => navigate('/') },
    { key: 'j', description: 'Go to Jobs', action: () => navigate('/jobs') },
    { key: 'p', description: 'Go to Projects', action: () => navigate('/projects') },
    { key: 's', description: 'Go to Scheduler', action: () => navigate('/scheduler') },
    { key: 'r', description: 'Go to Reports', action: () => navigate('/reports') },
    { key: 'i', description: 'Go to Incidents', action: () => navigate('/incidents') },
    { key: 'a', description: 'Go to Analytics', action: () => navigate('/analytics') },

    // Quick actions
    { key: 'n', shift: true, description: 'New Job', action: () => navigate('/jobs/new') },

    // Misc
    { key: '?', shift: true, description: 'Show keyboard shortcuts', action: () => {
      // Could open a modal showing all shortcuts
      console.log('Keyboard shortcuts help')
    }},
  ])
}

// Hook to show keyboard shortcuts help
export function useKeyboardShortcutsHelp() {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + ? to toggle help
      if (e.shiftKey && e.key === '?') {
        e.preventDefault()
        setIsVisible(v => !v)
      }
      // Escape to close
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  return { isVisible, show: () => setIsVisible(true), hide: () => setIsVisible(false) }
}

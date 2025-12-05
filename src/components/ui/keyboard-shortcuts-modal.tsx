import * as React from "react"
import { cn } from "@/lib/utils"
import { X, Command } from "lucide-react"

interface ShortcutCategory {
  name: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const shortcuts: ShortcutCategory[] = [
  {
    name: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['H'], description: 'Go to Home/Dashboard' },
      { keys: ['J'], description: 'Go to Jobs' },
      { keys: ['P'], description: 'Go to Projects' },
      { keys: ['S'], description: 'Go to Scheduler' },
      { keys: ['R'], description: 'Go to Reports' },
      { keys: ['I'], description: 'Go to Incidents' },
      { keys: ['A'], description: 'Go to Analytics' },
    ],
  },
  {
    name: 'Quick Actions',
    shortcuts: [
      { keys: ['⇧', 'N'], description: 'Create new job' },
      { keys: ['⇧', 'I'], description: 'Report incident' },
      { keys: ['⇧', 'S'], description: 'Save current form' },
    ],
  },
  {
    name: 'General',
    shortcuts: [
      { keys: ['⇧', '?'], description: 'Show this help' },
      { keys: ['Esc'], description: 'Close dialogs/modals' },
      { keys: ['⌘', 'Z'], description: 'Undo' },
      { keys: ['⌘', '⇧', 'Z'], description: 'Redo' },
    ],
  },
]

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  React.useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Detect OS for key symbols
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const formatKey = (key: string) => {
    if (!isMac) {
      if (key === '⌘') return 'Ctrl'
      if (key === '⇧') return 'Shift'
      if (key === '⌥') return 'Alt'
    }
    return key
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl animate-in zoom-in-95 fade-in">
        <div className="mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sga-100 dark:bg-sga-900 flex items-center justify-center">
                <Command className="w-5 h-5 text-sga-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Navigate faster with keyboard shortcuts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-6 md:grid-cols-2">
              {shortcuts.map((category) => (
                <div key={category.name}>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    {category.name}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIdx) => (
                            <React.Fragment key={keyIdx}>
                              <kbd className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600">
                                {formatKey(key)}
                              </kbd>
                              {keyIdx < shortcut.keys.length - 1 && (
                                <span className="text-gray-400 text-xs">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">⇧ ?</kbd> anytime to show this help
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook to manage keyboard shortcuts help
export function useKeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + ? to toggle
      if (e.shiftKey && e.key === '?') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  }
}

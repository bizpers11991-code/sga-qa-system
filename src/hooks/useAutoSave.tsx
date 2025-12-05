import * as React from 'react'

interface AutoSaveOptions {
  key: string;
  data: any;
  delay?: number; // Debounce delay in ms
  onSave?: (data: any) => void;
  onRestore?: (data: any) => void;
  enabled?: boolean;
}

interface AutoSaveState {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export function useAutoSave({
  key,
  data,
  delay = 2000,
  onSave,
  onRestore,
  enabled = true,
}: AutoSaveOptions) {
  const [state, setState] = React.useState<AutoSaveState>({
    lastSaved: null,
    isSaving: false,
    hasUnsavedChanges: false,
  })

  const dataRef = React.useRef(data)
  const timeoutRef = React.useRef<NodeJS.Timeout>()
  const initialLoadRef = React.useRef(true)

  // Restore saved data on mount
  React.useEffect(() => {
    if (!enabled || !initialLoadRef.current) return
    initialLoadRef.current = false

    try {
      const saved = localStorage.getItem(`autosave_${key}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        onRestore?.(parsed.data)
        setState(prev => ({
          ...prev,
          lastSaved: new Date(parsed.timestamp),
        }))
      }
    } catch (e) {
      console.error('Failed to restore autosave:', e)
    }
  }, [key, enabled, onRestore])

  // Auto-save with debounce
  React.useEffect(() => {
    if (!enabled) return

    // Skip if data hasn't changed
    if (JSON.stringify(data) === JSON.stringify(dataRef.current)) {
      return
    }

    dataRef.current = data
    setState(prev => ({ ...prev, hasUnsavedChanges: true }))

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isSaving: true }))

      try {
        const saveData = {
          data,
          timestamp: new Date().toISOString(),
        }
        localStorage.setItem(`autosave_${key}`, JSON.stringify(saveData))
        onSave?.(data)

        setState({
          lastSaved: new Date(),
          isSaving: false,
          hasUnsavedChanges: false,
        })
      } catch (e) {
        console.error('Failed to autosave:', e)
        setState(prev => ({ ...prev, isSaving: false }))
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, key, delay, enabled, onSave])

  // Clear saved data
  const clearSaved = React.useCallback(() => {
    localStorage.removeItem(`autosave_${key}`)
    setState({
      lastSaved: null,
      isSaving: false,
      hasUnsavedChanges: false,
    })
  }, [key])

  // Force save now
  const saveNow = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    try {
      const saveData = {
        data: dataRef.current,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem(`autosave_${key}`, JSON.stringify(saveData))
      onSave?.(dataRef.current)

      setState({
        lastSaved: new Date(),
        isSaving: false,
        hasUnsavedChanges: false,
      })
    } catch (e) {
      console.error('Failed to save:', e)
    }
  }, [key, onSave])

  return {
    ...state,
    clearSaved,
    saveNow,
  }
}

// Auto-save status indicator component
interface AutoSaveIndicatorProps {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  className?: string;
}

export function AutoSaveIndicator({
  lastSaved,
  isSaving,
  hasUnsavedChanges,
  className,
}: AutoSaveIndicatorProps) {
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {isSaving ? (
        <>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-yellow-600 dark:text-yellow-400">Saving...</span>
        </>
      ) : hasUnsavedChanges ? (
        <>
          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          <span className="text-yellow-600 dark:text-yellow-400">Unsaved changes</span>
        </>
      ) : lastSaved ? (
        <>
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-gray-500 dark:text-gray-400">
            Saved {formatTime(lastSaved)}
          </span>
        </>
      ) : null}
    </div>
  )
}

export default useAutoSave

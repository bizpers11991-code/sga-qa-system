import * as React from "react"
import { cn } from "@/lib/utils"
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from "lucide-react"

interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom';
}

export function OfflineIndicator({
  className,
  showWhenOnline = false,
  position = 'bottom',
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [showIndicator, setShowIndicator] = React.useState(false)
  const [pendingCount, setPendingCount] = React.useState(0)

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Show "back online" message briefly
      setShowIndicator(true)
      setTimeout(() => setShowIndicator(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check for pending items in IndexedDB
    const checkPending = async () => {
      try {
        const request = indexedDB.open('sga-qa-offline', 1)
        request.onsuccess = () => {
          const db = request.result
          if (db.objectStoreNames.contains('submission-queue')) {
            const tx = db.transaction('submission-queue', 'readonly')
            const store = tx.objectStore('submission-queue')
            const countRequest = store.count()
            countRequest.onsuccess = () => {
              setPendingCount(countRequest.result)
            }
          }
        }
      } catch (e) {
        // IndexedDB not available
      }
    }

    checkPending()
    const interval = setInterval(checkPending, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  // Don't show when online unless explicitly requested
  if (isOnline && !showIndicator && !showWhenOnline && pendingCount === 0) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-[90] transition-all duration-300",
        position === 'top' ? 'top-20' : 'bottom-20',
        showIndicator || !isOnline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border text-sm font-medium",
          isOnline
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-red-50 border-red-200 text-red-700"
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Back online</span>
            {pendingCount > 0 && (
              <>
                <span className="text-emerald-500">•</span>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="text-xs">Syncing {pendingCount} items...</span>
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You're offline</span>
            {pendingCount > 0 && (
              <span className="text-xs opacity-75">
                ({pendingCount} pending)
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Connection quality indicator for header
export function ConnectionStatus({ className }: { className?: string }) {
  const [isOnline, setIsOnline] = React.useState(true)
  const [connectionType, setConnectionType] = React.useState<string>('unknown')

  React.useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine)

      // Check connection type if available
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown')
      }
    }

    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500'
    if (connectionType === '4g') return 'bg-emerald-500'
    if (connectionType === '3g') return 'bg-yellow-500'
    if (connectionType === '2g' || connectionType === 'slow-2g') return 'bg-orange-500'
    return 'bg-emerald-500'
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {!isOnline ? 'Offline' : connectionType === 'unknown' ? 'Online' : connectionType.toUpperCase()}
      </span>
    </div>
  )
}

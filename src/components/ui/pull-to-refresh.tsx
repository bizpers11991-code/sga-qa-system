import * as React from "react"
import { cn } from "@/lib/utils"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
  className,
}: PullToRefreshProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = React.useState(0)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isPulling, setIsPulling] = React.useState(false)
  const startY = React.useRef(0)
  const currentY = React.useRef(0)

  const canPull = React.useCallback(() => {
    if (disabled || isRefreshing) return false
    const container = containerRef.current
    if (!container) return false
    // Only allow pull when scrolled to top
    return container.scrollTop <= 0
  }, [disabled, isRefreshing])

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (!canPull()) return
    startY.current = e.touches[0].clientY
    currentY.current = e.touches[0].clientY
    setIsPulling(true)
  }, [canPull])

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!isPulling || !canPull()) return

    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current

    if (diff > 0) {
      // Resistance effect - pull becomes harder as you pull more
      const resistance = 0.5
      const adjustedDiff = Math.min(diff * resistance, threshold * 1.5)
      setPullDistance(adjustedDiff)

      // Prevent scroll when pulling
      if (adjustedDiff > 10) {
        e.preventDefault()
      }
    }
  }, [isPulling, canPull, threshold])

  const handleTouchEnd = React.useCallback(async () => {
    if (!isPulling) return
    setIsPulling(false)

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(threshold) // Lock at threshold during refresh

      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh])

  const progress = Math.min(pullDistance / threshold, 1)
  const rotation = progress * 360
  const scale = 0.5 + progress * 0.5

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: isPulling && pullDistance > 10 ? 'none' : 'auto' }}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-50 transition-all duration-200 ease-out",
          pullDistance > 0 || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: Math.max(pullDistance - 40, -40),
        }}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center",
            isRefreshing && "animate-pulse"
          )}
          style={{
            transform: `scale(${scale})`,
          }}
        >
          {isRefreshing ? (
            <svg
              className="w-5 h-5 text-sga-600 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className={cn(
                "w-5 h-5 transition-colors",
                progress >= 1 ? "text-sga-600" : "text-gray-400"
              )}
              style={{ transform: `rotate(${rotation}deg)` }}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
        </div>
        {/* Pull hint text */}
        {pullDistance > 20 && !isRefreshing && (
          <div className="text-xs text-gray-500 text-center mt-1 whitespace-nowrap">
            {progress >= 1 ? "Release to refresh" : "Pull to refresh"}
          </div>
        )}
      </div>

      {/* Content with pull transform */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}

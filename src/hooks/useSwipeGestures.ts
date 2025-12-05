import * as React from 'react'

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number; // Minimum distance to trigger swipe
  velocity?: number;  // Minimum velocity to trigger swipe
  preventDefaultOnSwipe?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  isSwiping: boolean;
}

export function useSwipeGestures(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const {
    threshold = 50,
    velocity = 0.3,
    preventDefaultOnSwipe = false,
  } = options

  const stateRef = React.useRef<SwipeState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwiping: false,
  })

  const handleTouchStart = React.useCallback((e: React.TouchEvent | TouchEvent) => {
    const touch = e.touches[0]
    stateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isSwiping: true,
    }
  }, [])

  const handleTouchMove = React.useCallback((e: React.TouchEvent | TouchEvent) => {
    if (!stateRef.current.isSwiping) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - stateRef.current.startX
    const deltaY = touch.clientY - stateRef.current.startY

    // If horizontal swipe is dominant, prevent vertical scroll
    if (preventDefaultOnSwipe && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault()
    }
  }, [preventDefaultOnSwipe])

  const handleTouchEnd = React.useCallback((e: React.TouchEvent | TouchEvent) => {
    if (!stateRef.current.isSwiping) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - stateRef.current.startX
    const deltaY = touch.clientY - stateRef.current.startY
    const deltaTime = Date.now() - stateRef.current.startTime

    // Calculate velocity
    const velocityX = Math.abs(deltaX) / deltaTime
    const velocityY = Math.abs(deltaY) / deltaTime

    // Determine if it's a valid swipe
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)
    const distance = isHorizontalSwipe ? Math.abs(deltaX) : Math.abs(deltaY)
    const swipeVelocity = isHorizontalSwipe ? velocityX : velocityY

    if (distance > threshold || swipeVelocity > velocity) {
      if (isHorizontalSwipe) {
        if (deltaX > 0) {
          handlers.onSwipeRight?.()
        } else {
          handlers.onSwipeLeft?.()
        }
      } else {
        if (deltaY > 0) {
          handlers.onSwipeDown?.()
        } else {
          handlers.onSwipeUp?.()
        }
      }
    }

    stateRef.current.isSwiping = false
  }, [handlers, threshold, velocity])

  // Return both ref-style and event-style handlers
  const bind = React.useMemo(() => ({
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }), [handleTouchStart, handleTouchMove, handleTouchEnd])

  return bind
}

// Hook for navigation swipe (swipe right to go back)
export function useNavigationSwipe() {
  const handleSwipeRight = React.useCallback(() => {
    if (window.history.length > 1) {
      window.history.back()
    }
  }, [])

  return useSwipeGestures({
    onSwipeRight: handleSwipeRight,
  }, {
    threshold: 100, // Require larger swipe for navigation
  })
}

export default useSwipeGestures

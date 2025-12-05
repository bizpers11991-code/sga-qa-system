import * as React from "react"

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
  shape: 'square' | 'circle' | 'triangle';
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

const SGA_COLORS = [
  '#d97706', // SGA Orange
  '#f59e0b', // Amber
  '#fbbf24', // Yellow
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
]

export function Confetti({
  isActive,
  duration = 3000,
  particleCount = 100,
  colors = SGA_COLORS,
  onComplete,
}: ConfettiProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const animationRef = React.useRef<number>()
  const piecesRef = React.useRef<ConfettiPiece[]>([])
  const startTimeRef = React.useRef<number>(0)

  React.useEffect(() => {
    if (!isActive || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Create confetti pieces
    piecesRef.current = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 8,
      velocityX: (Math.random() - 0.5) * 4,
      velocityY: 3 + Math.random() * 4,
      rotationSpeed: (Math.random() - 0.5) * 10,
      shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as ConfettiPiece['shape'],
    }))

    startTimeRef.current = performance.now()

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTimeRef.current
      const progress = elapsed / duration

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Fade out near the end
      const opacity = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1

      piecesRef.current.forEach((piece) => {
        // Update position
        piece.x += piece.velocityX
        piece.y += piece.velocityY
        piece.rotation += piece.rotationSpeed

        // Add gravity
        piece.velocityY += 0.1

        // Add wobble
        piece.velocityX += (Math.random() - 0.5) * 0.2

        // Draw piece
        ctx.save()
        ctx.translate(piece.x, piece.y)
        ctx.rotate((piece.rotation * Math.PI) / 180)
        ctx.globalAlpha = opacity
        ctx.fillStyle = piece.color

        switch (piece.shape) {
          case 'square':
            ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size)
            break
          case 'circle':
            ctx.beginPath()
            ctx.arc(0, 0, piece.size / 2, 0, Math.PI * 2)
            ctx.fill()
            break
          case 'triangle':
            ctx.beginPath()
            ctx.moveTo(0, -piece.size / 2)
            ctx.lineTo(piece.size / 2, piece.size / 2)
            ctx.lineTo(-piece.size / 2, piece.size / 2)
            ctx.closePath()
            ctx.fill()
            break
        }

        ctx.restore()
      })

      if (elapsed < duration) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        onComplete?.()
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, duration, particleCount, colors, onComplete])

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[200] pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}

// Success celebration component
interface CelebrationProps {
  trigger: boolean;
  message?: string;
  onComplete?: () => void;
}

export function Celebration({ trigger, message = "Success!", onComplete }: CelebrationProps) {
  const [showConfetti, setShowConfetti] = React.useState(false)
  const [showMessage, setShowMessage] = React.useState(false)
  const prevTrigger = React.useRef(trigger)

  React.useEffect(() => {
    // Only trigger on false -> true transition
    if (trigger && !prevTrigger.current) {
      setShowConfetti(true)
      setShowMessage(true)

      // Hide message after 2 seconds
      const messageTimeout = setTimeout(() => {
        setShowMessage(false)
      }, 2000)

      return () => clearTimeout(messageTimeout)
    }
    prevTrigger.current = trigger
  }, [trigger])

  return (
    <>
      <Confetti
        isActive={showConfetti}
        duration={3000}
        onComplete={() => {
          setShowConfetti(false)
          onComplete?.()
        }}
      />

      {/* Success message toast */}
      {showMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[201] animate-bounce-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-emerald-100 px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-900">{message}</span>
          </div>
        </div>
      )}
    </>
  )
}

// Simple hook for triggering celebrations
export function useCelebration() {
  const [trigger, setTrigger] = React.useState(false)

  const celebrate = React.useCallback(() => {
    setTrigger(true)
    // Reset trigger after a short delay
    setTimeout(() => setTrigger(false), 100)
  }, [])

  return { trigger, celebrate }
}

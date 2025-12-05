import * as React from "react"
import { cn } from "@/lib/utils"
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react"

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

const defaultSteps: TourStep[] = [
  {
    target: '[data-tour="dashboard"]',
    title: 'Welcome to SGA QA System',
    content: 'This is your dashboard where you can see an overview of all jobs, projects, and key metrics.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="sidebar"]',
    title: 'Navigation',
    content: 'Use the sidebar to navigate between different sections of the app.',
    placement: 'right',
  },
  {
    target: '[data-tour="quick-actions"]',
    title: 'Quick Actions',
    content: 'Create new jobs, report incidents, or access frequently used features here.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    title: 'Stay Updated',
    content: 'Notifications about job updates, approvals, and team activities appear here.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="command-palette"]',
    title: 'Pro Tip: Command Palette',
    content: 'Press Cmd+K (or Ctrl+K) anytime to quickly navigate or search for anything!',
    placement: 'bottom',
  },
]

export function OnboardingTour({
  steps = defaultSteps,
  isOpen,
  onComplete,
  onSkip,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0 })
  const [highlightBox, setHighlightBox] = React.useState({ top: 0, left: 0, width: 0, height: 0 })

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  React.useEffect(() => {
    if (!isOpen || !step) return

    const updatePosition = () => {
      const target = document.querySelector(step.target)
      if (!target) {
        // If target not found, show tooltip in center
        setTooltipPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 150,
        })
        setHighlightBox({ top: 0, left: 0, width: 0, height: 0 })
        return
      }

      const rect = target.getBoundingClientRect()
      const padding = 8

      // Set highlight box
      setHighlightBox({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      })

      // Calculate tooltip position based on placement
      const tooltipWidth = 320
      const tooltipHeight = 150
      const gap = 12

      let top = 0
      let left = 0

      switch (step.placement) {
        case 'top':
          top = rect.top - tooltipHeight - gap
          left = rect.left + rect.width / 2 - tooltipWidth / 2
          break
        case 'bottom':
          top = rect.bottom + gap
          left = rect.left + rect.width / 2 - tooltipWidth / 2
          break
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2
          left = rect.left - tooltipWidth - gap
          break
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2
          left = rect.right + gap
          break
        default:
          top = rect.bottom + gap
          left = rect.left + rect.width / 2 - tooltipWidth / 2
      }

      // Keep tooltip in viewport
      top = Math.max(gap, Math.min(top, window.innerHeight - tooltipHeight - gap))
      left = Math.max(gap, Math.min(left, window.innerWidth - tooltipWidth - gap))

      setTooltipPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [isOpen, step, currentStep])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop with cutout */}
      <div className="absolute inset-0 bg-black/50">
        {/* Highlight cutout */}
        {highlightBox.width > 0 && (
          <div
            className="absolute bg-transparent border-2 border-sga-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
            style={{
              top: highlightBox.top,
              left: highlightBox.left,
              width: highlightBox.width,
              height: highlightBox.height,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="absolute w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </span>
          <button
            onClick={onSkip}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {step?.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {step?.content}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              currentStep === 0
                ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  idx === currentStep
                    ? "bg-sga-600"
                    : idx < currentStep
                    ? "bg-sga-300"
                    : "bg-gray-300 dark:bg-gray-600"
                )}
              />
            ))}
          </div>

          <button
            onClick={() => {
              if (isLastStep) {
                onComplete()
              } else {
                setCurrentStep(currentStep + 1)
              }
            }}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium",
              isLastStep
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-sga-600 text-white hover:bg-sga-700"
            )}
          >
            {isLastStep ? (
              <>
                <Check className="w-4 h-4" />
                Done
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook to manage tour state
export function useOnboardingTour(tourId: string = 'main') {
  const [isOpen, setIsOpen] = React.useState(false)
  const storageKey = `onboarding_completed_${tourId}`

  React.useEffect(() => {
    // Check if tour has been completed
    const completed = localStorage.getItem(storageKey)
    if (!completed) {
      // Show tour after a short delay for better UX
      const timeout = setTimeout(() => setIsOpen(true), 1000)
      return () => clearTimeout(timeout)
    }
  }, [storageKey])

  const complete = React.useCallback(() => {
    localStorage.setItem(storageKey, 'true')
    setIsOpen(false)
  }, [storageKey])

  const skip = React.useCallback(() => {
    localStorage.setItem(storageKey, 'skipped')
    setIsOpen(false)
  }, [storageKey])

  const reset = React.useCallback(() => {
    localStorage.removeItem(storageKey)
    setIsOpen(true)
  }, [storageKey])

  return { isOpen, complete, skip, reset, show: () => setIsOpen(true) }
}

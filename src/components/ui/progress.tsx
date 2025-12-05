import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva(
  "h-full transition-all duration-500 ease-out rounded-full",
  {
    variants: {
      variant: {
        default: "bg-sga-600",
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        error: "bg-red-500",
        gradient: "bg-gradient-to-r from-sga-500 to-sga-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
  animated?: boolean;
  striped?: boolean;
}

function Progress({
  className,
  value = 0,
  max = 100,
  variant,
  showLabel = false,
  size = 'default',
  animated = false,
  striped = false,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: 'h-1.5',
    default: 'h-2.5',
    lg: 'h-4',
  }

  return (
    <div className={cn("relative w-full", className)} {...props}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-gray-200",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            progressVariants({ variant }),
            animated && "animate-pulse",
            striped && "bg-[length:1rem_1rem] bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)]"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+0.5rem)] text-xs font-medium text-gray-600">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}

// Circular progress indicator
interface CircularProgressProps {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

function CircularProgress({
  value = 0,
  max = 100,
  size = 48,
  strokeWidth = 4,
  showLabel = false,
  variant = 'default',
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const colorMap = {
    default: 'stroke-sga-600',
    success: 'stroke-emerald-500',
    warning: 'stroke-amber-500',
    error: 'stroke-red-500',
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn("transition-all duration-500 ease-out", colorMap[variant])}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-semibold text-gray-700">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}

export { Progress, CircularProgress, progressVariants }

import * as React from "react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'white';
}

function Spinner({ className, size = 'md', variant = 'default', ...props }: SpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3 border',
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-2',
    xl: 'h-12 w-12 border-3',
  }

  const variantClasses = {
    default: 'border-gray-300 border-t-gray-600',
    primary: 'border-sga-200 border-t-sga-600',
    white: 'border-white/30 border-t-white',
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

// Full page loading overlay
interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  blur?: boolean;
}

function LoadingOverlay({ isVisible, message, blur = true }: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80",
        blur && "backdrop-blur-sm"
      )}
    >
      <div className="relative">
        {/* Outer ring */}
        <div className="h-16 w-16 rounded-full border-4 border-sga-100 animate-pulse" />
        {/* Spinning ring */}
        <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-sga-600 animate-spin" />
      </div>
      {message && (
        <p className="mt-4 text-sm font-medium text-gray-600 animate-pulse">{message}</p>
      )}
    </div>
  )
}

// Inline loading indicator with dots
function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <span className="h-2 w-2 rounded-full bg-sga-600 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="h-2 w-2 rounded-full bg-sga-600 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="h-2 w-2 rounded-full bg-sga-600 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

// Button loading state helper
interface ButtonSpinnerProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
}

function ButtonSpinner({ show, children, className }: ButtonSpinnerProps) {
  if (show) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Spinner size="sm" variant="white" />
        <span className="opacity-75">{children}</span>
      </div>
    )
  }
  return <>{children}</>
}

export { Spinner, LoadingOverlay, LoadingDots, ButtonSpinner }

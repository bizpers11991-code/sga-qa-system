import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-sga-600 text-white hover:bg-sga-700",
        secondary: "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200",
        destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline: "border-gray-300 text-gray-700 hover:bg-gray-50",
        success: "border-transparent bg-emerald-500 text-white hover:bg-emerald-600",
        warning: "border-transparent bg-amber-500 text-white hover:bg-amber-600",
        info: "border-transparent bg-blue-500 text-white hover:bg-blue-600",
        // Status variants with subtle backgrounds
        pending: "border-amber-200 bg-amber-50 text-amber-700",
        active: "border-emerald-200 bg-emerald-50 text-emerald-700",
        inactive: "border-gray-200 bg-gray-50 text-gray-600",
        error: "border-red-200 bg-red-50 text-red-700",
        // Division-specific variants
        transport: "border-transparent bg-blue-500 text-white",
        asphalt: "border-transparent bg-sga-600 text-white",
        profiling: "border-transparent bg-purple-500 text-white",
        common: "border-transparent bg-gray-500 text-white",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean;
  dot?: boolean;
}

function Badge({ className, variant, size, pulse, dot, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({ variant, size }),
        pulse && "animate-pulse",
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full mr-1.5",
          variant === 'success' || variant === 'active' ? 'bg-emerald-300' :
          variant === 'warning' || variant === 'pending' ? 'bg-amber-300' :
          variant === 'destructive' || variant === 'error' ? 'bg-red-300' :
          'bg-current opacity-50'
        )} />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }

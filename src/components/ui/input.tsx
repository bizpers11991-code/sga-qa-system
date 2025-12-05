import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full text-sm transition-all duration-200 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sga-500/20 focus:border-sga-500 hover:border-gray-400",
        filled: "h-11 rounded-lg border-0 bg-gray-100 px-4 py-2.5 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sga-500/20 focus:bg-gray-50",
        underline: "h-11 border-0 border-b-2 border-gray-300 bg-transparent px-1 py-2 placeholder:text-gray-400 focus:outline-none focus:border-sga-500 rounded-none",
        ghost: "h-11 border-0 bg-transparent px-3 py-2 placeholder:text-gray-400 focus:outline-none focus:bg-gray-50 rounded-lg",
      },
      inputSize: {
        sm: "h-9 text-xs px-3",
        default: "h-11",
        lg: "h-12 text-base px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, icon, iconPosition = 'left', error, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          {iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant, inputSize }),
              iconPosition === 'left' && "pl-10",
              iconPosition === 'right' && "pr-10",
              error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
              className
            )}
            ref={ref}
            {...props}
          />
          {iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant, inputSize }),
          error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }

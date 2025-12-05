import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold ring-offset-white transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sga-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-sga-600 to-sga-700 text-white hover:from-sga-500 hover:to-sga-600 hover:shadow-lg hover:shadow-sga-500/25 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md",
        destructive: "bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 hover:shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5 active:translate-y-0",
        outline: "border-2 border-sga-600 bg-white text-sga-700 hover:bg-sga-50 hover:border-sga-500 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        secondary: "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900 hover:from-gray-50 hover:to-gray-100 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        ghost: "hover:bg-sga-50 hover:text-sga-700 transition-colors",
        link: "text-sga-700 underline-offset-4 hover:underline hover:text-sga-600",
        success: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  ripple?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, ripple = true, children, onClick, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<{ x: number; y: number; id: number }[]>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !isLoading) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();

        setRipples(prev => [...prev, { x, y, id }]);

        // Remove ripple after animation
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== id));
        }, 600);
      }

      onClick?.(e);
    };

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {/* Ripple effects */}
        {ripples.map(({ x, y, id }) => (
          <span
            key={id}
            className="absolute rounded-full bg-white/30 animate-ping pointer-events-none"
            style={{
              left: x,
              top: y,
              width: 20,
              height: 20,
              transform: 'translate(-50%, -50%)',
              animation: 'ripple 0.6s linear forwards',
            }}
          />
        ))}

        {/* Loading spinner */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
            <svg
              className="animate-spin h-5 w-5"
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
          </span>
        )}

        {/* Content */}
        <span className={cn("flex items-center gap-2", isLoading && "invisible")}>
          {children}
        </span>
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

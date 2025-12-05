import * as React from "react"
import { useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = React.useState(false)
  const [displayChildren, setDisplayChildren] = React.useState(children)
  const previousPath = React.useRef(location.pathname)

  React.useEffect(() => {
    if (location.pathname !== previousPath.current) {
      setIsTransitioning(true)

      // Short delay to allow exit animation
      const timeout = setTimeout(() => {
        setDisplayChildren(children)
        setIsTransitioning(false)
        previousPath.current = location.pathname
      }, 150)

      return () => clearTimeout(timeout)
    } else {
      setDisplayChildren(children)
    }
  }, [location.pathname, children])

  return (
    <div
      className={cn(
        "transition-all duration-200 ease-out",
        isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
        className
      )}
    >
      {displayChildren}
    </div>
  )
}

// Staggered list animation wrapper
interface StaggeredListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export function StaggeredList({ children, className, staggerDelay = 50 }: StaggeredListProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="animate-fade-in-up"
          style={{
            animationDelay: `${index * staggerDelay}ms`,
            animationFillMode: 'both',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

// Fade in on scroll wrapper
interface FadeInOnScrollProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}

export function FadeInOnScroll({ children, className, threshold = 0.1 }: FadeInOnScrollProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      {children}
    </div>
  )
}

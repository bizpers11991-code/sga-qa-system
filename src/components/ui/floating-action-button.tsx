import * as React from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Plus, X, FileText, AlertTriangle, Clipboard, Calendar } from "lucide-react"

interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions?: FABAction[];
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export function FloatingActionButton({
  actions,
  className,
  position = 'bottom-right',
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const navigate = useNavigate()

  // Default actions if none provided
  const defaultActions: FABAction[] = [
    {
      id: 'new-job',
      label: 'New Job',
      icon: <FileText className="w-5 h-5" />,
      onClick: () => navigate('/jobs/new'),
      color: 'bg-sga-600 hover:bg-sga-700',
    },
    {
      id: 'new-incident',
      label: 'Report Incident',
      icon: <AlertTriangle className="w-5 h-5" />,
      onClick: () => navigate('/incidents/new'),
      color: 'bg-red-500 hover:bg-red-600',
    },
    {
      id: 'new-scope',
      label: 'New Scope Report',
      icon: <Clipboard className="w-5 h-5" />,
      onClick: () => navigate('/scope-reports/new'),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'scheduler',
      label: 'Scheduler',
      icon: <Calendar className="w-5 h-5" />,
      onClick: () => navigate('/scheduler'),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ]

  const fabActions = actions || defaultActions

  const positionClasses = {
    'bottom-right': 'right-4 bottom-20',
    'bottom-left': 'left-4 bottom-20',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-20',
  }

  return (
    <div className={cn("fixed z-50", positionClasses[position], className)}>
      {/* Action buttons */}
      <div
        className={cn(
          "absolute bottom-16 right-0 flex flex-col-reverse items-end gap-3 transition-all duration-300",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {fabActions.map((action, index) => (
          <div
            key={action.id}
            className="flex items-center gap-3 animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Label */}
            <span className="bg-gray-900 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
              {action.label}
            </span>
            {/* Button */}
            <button
              onClick={() => {
                action.onClick()
                setIsOpen(false)
              }}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110",
                action.color || 'bg-gray-700 hover:bg-gray-800'
              )}
            >
              {action.icon}
            </button>
          </div>
        ))}
      </div>

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300",
          isOpen
            ? "bg-gray-700 hover:bg-gray-800 rotate-45"
            : "bg-sga-600 hover:bg-sga-700 hover:scale-110"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

// Simple single-action FAB
interface SimpleFABProps {
  icon?: React.ReactNode;
  onClick: () => void;
  label?: string;
  className?: string;
}

export function SimpleFAB({ icon, onClick, label, className }: SimpleFABProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed right-4 bottom-20 w-14 h-14 rounded-full flex items-center justify-center",
        "bg-sga-600 hover:bg-sga-700 text-white shadow-xl",
        "transition-all duration-200 hover:scale-110 active:scale-95",
        "z-50",
        className
      )}
      aria-label={label}
    >
      {icon || <Plus className="w-6 h-6" />}
    </button>
  )
}

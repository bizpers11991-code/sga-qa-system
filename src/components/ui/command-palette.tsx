import * as React from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Search,
  Home,
  FileText,
  Calendar,
  Users,
  Settings,
  ClipboardList,
  AlertTriangle,
  Truck,
  BarChart3,
  X,
  ArrowRight,
  Command,
} from "lucide-react"

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
  category: 'navigation' | 'action' | 'recent';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = React.useState('')
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Define available commands
  const commands: CommandItem[] = React.useMemo(() => [
    // Navigation
    { id: 'home', title: 'Go to Dashboard', icon: <Home className="w-4 h-4" />, action: () => navigate('/'), category: 'navigation', keywords: ['home', 'main'] },
    { id: 'jobs', title: 'View Jobs', icon: <FileText className="w-4 h-4" />, action: () => navigate('/jobs'), category: 'navigation', keywords: ['work', 'tasks'] },
    { id: 'projects', title: 'View Projects', icon: <ClipboardList className="w-4 h-4" />, action: () => navigate('/projects'), category: 'navigation', keywords: ['project'] },
    { id: 'scheduler', title: 'Open Scheduler', icon: <Calendar className="w-4 h-4" />, action: () => navigate('/scheduler'), category: 'navigation', keywords: ['schedule', 'calendar', 'plan'] },
    { id: 'reports', title: 'View QA Reports', icon: <FileText className="w-4 h-4" />, action: () => navigate('/reports'), category: 'navigation', keywords: ['qa', 'quality'] },
    { id: 'incidents', title: 'View Incidents', icon: <AlertTriangle className="w-4 h-4" />, action: () => navigate('/incidents'), category: 'navigation', keywords: ['safety', 'hazard', 'near miss'] },
    { id: 'resources', title: 'Manage Resources', icon: <Truck className="w-4 h-4" />, action: () => navigate('/resources'), category: 'navigation', keywords: ['equipment', 'fleet', 'crew'] },
    { id: 'analytics', title: 'View Analytics', icon: <BarChart3 className="w-4 h-4" />, action: () => navigate('/analytics'), category: 'navigation', keywords: ['stats', 'metrics', 'data'] },
    { id: 'tenders', title: 'View Tenders', icon: <FileText className="w-4 h-4" />, action: () => navigate('/tenders'), category: 'navigation', keywords: ['bid', 'quote'] },
    { id: 'admin', title: 'Admin Panel', icon: <Settings className="w-4 h-4" />, action: () => navigate('/admin'), category: 'navigation', keywords: ['settings', 'config'] },
    // Actions
    { id: 'new-job', title: 'Create New Job', description: 'Start a new job sheet', icon: <FileText className="w-4 h-4" />, action: () => navigate('/jobs/new'), category: 'action', keywords: ['add', 'create'] },
    { id: 'new-incident', title: 'Report Incident', description: 'Log a safety incident', icon: <AlertTriangle className="w-4 h-4" />, action: () => navigate('/incidents/new'), category: 'action', keywords: ['safety', 'report'] },
  ], [navigate])

  // Filter commands based on query
  const filteredCommands = React.useMemo(() => {
    if (!query.trim()) return commands

    const lowerQuery = query.toLowerCase()
    return commands.filter(cmd => {
      const matchesTitle = cmd.title.toLowerCase().includes(lowerQuery)
      const matchesKeywords = cmd.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
      const matchesDescription = cmd.description?.toLowerCase().includes(lowerQuery)
      return matchesTitle || matchesKeywords || matchesDescription
    })
  }, [commands, query])

  // Group commands by category
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = []
      groups[cmd.category].push(cmd)
    })
    return groups
  }, [filteredCommands])

  // Handle keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault()
        filteredCommands[selectedIndex].action()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, filteredCommands, selectedIndex])

  // Reset state when opening
  React.useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Reset selection when query changes
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl animate-in zoom-in-95 slide-in-from-top-4 duration-200">
        <div className="mx-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands..."
              className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p className="text-sm">No results found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              <>
                {groupedCommands.action && groupedCommands.action.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </div>
                    {groupedCommands.action.map((cmd, idx) => {
                      const globalIdx = filteredCommands.indexOf(cmd)
                      return (
                        <CommandItemComponent
                          key={cmd.id}
                          item={cmd}
                          isSelected={globalIdx === selectedIndex}
                          onClick={() => {
                            cmd.action()
                            onClose()
                          }}
                        />
                      )
                    })}
                  </div>
                )}

                {groupedCommands.navigation && groupedCommands.navigation.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Navigation
                    </div>
                    {groupedCommands.navigation.map((cmd) => {
                      const globalIdx = filteredCommands.indexOf(cmd)
                      return (
                        <CommandItemComponent
                          key={cmd.id}
                          item={cmd}
                          isSelected={globalIdx === selectedIndex}
                          onClick={() => {
                            cmd.action()
                            onClose()
                          }}
                        />
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-gray-100 px-1.5 py-0.5">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-gray-100 px-1.5 py-0.5">↵</kbd>
                <span>Select</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Command className="h-3 w-3" />
              <span>K to open</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CommandItemComponent({
  item,
  isSelected,
  onClick,
}: {
  item: CommandItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        isSelected ? "bg-sga-50 text-sga-700" : "text-gray-700 hover:bg-gray-50"
      )}
    >
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg",
        isSelected ? "bg-sga-100 text-sga-600" : "bg-gray-100 text-gray-500"
      )}>
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.title}</div>
        {item.description && (
          <div className="text-xs text-gray-500 truncate">{item.description}</div>
        )}
      </div>
      {isSelected && <ArrowRight className="h-4 w-4 text-sga-500" />}
    </button>
  )
}

// Hook to manage command palette state
export function useCommandPalette() {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  }
}

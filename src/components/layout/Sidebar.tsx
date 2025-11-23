import React from 'react';
import { NavLink } from 'react-router-dom';
import { NavItem } from '../../config/navigation';
import { useDarkMode } from '../../hooks/useDarkMode';

interface SidebarProps {
  navigationItems: NavItem[];
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ navigationItems, currentPath, isOpen, onClose }) => {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo section */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Menu</h1>
        </div>

        {/* Navigation */}
        <nav className="p-4 overflow-y-auto h-[calc(100%-8rem)]">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-150
                    min-h-touch
                    ${
                      isActive
                        ? 'bg-sga-700 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-sga-50 dark:hover:bg-gray-800 hover:text-sga-700 dark:hover:text-sga-400'
                    }`
                  }
                >
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Dark Mode Toggle */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150 min-h-touch text-gray-700 dark:text-gray-300 hover:bg-sga-50 dark:hover:bg-gray-800 hover:text-sga-700 dark:hover:text-sga-400"
            aria-label="Toggle dark mode"
          >
            <span className="text-xl">{isDark ? '☀️' : '🌙'}</span>
            <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

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
          fixed lg:relative top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30
          transform transition-transform duration-300 ease-in-out lg:transition-none
          lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
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
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">{isDark ? '🌙' : '☀️'}</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {isDark ? 'Dark' : 'Light'} Mode
              </span>
            </div>
            {/* Toggle Switch */}
            <button
              onClick={toggleDarkMode}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sga-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              style={{
                backgroundColor: isDark ? '#f59e0b' : '#d1d5db'
              }}
              aria-label="Toggle dark mode"
              role="switch"
              aria-checked={isDark}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDark ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

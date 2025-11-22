import React from 'react';
import { NavLink } from 'react-router-dom';
import { NavItem } from '../../config/navigation';

interface SidebarProps {
  navigationItems: NavItem[];
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ navigationItems, currentPath, isOpen, onClose }) => {
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
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo section */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Menu</h1>
        </div>

        {/* Navigation */}
        <nav className="p-4 overflow-y-auto h-[calc(100%-4rem)]">
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
                        : 'text-gray-700 hover:bg-sga-50 hover:text-sga-700'
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
      </aside>
    </>
  );
};

export default Sidebar;

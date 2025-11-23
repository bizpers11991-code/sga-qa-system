import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import useAuth from '../../hooks/useAuth';
import { getNavigationForRole } from '../../config/navigation';
import { Role } from '../../types';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const currentPath = location.pathname;

  // Get user's name from MSAL account
  const userName = user?.name || 'User';

  // For now, we'll use a default role. Later this should come from your backend/database
  // based on the user's email or ID
  const userRole: Role = 'asphalt_foreman'; // TODO: Get from backend

  // Get navigation items filtered by user role
  const navigationItems = getNavigationForRole(userRole);

  // Close sidebar when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        navigationItems={navigationItems}
        currentPath={currentPath}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar */}
        <TopBar
          userName={userName}
          onMenuClick={handleMenuClick}
          onLogout={handleLogout}
          notificationCount={0}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;

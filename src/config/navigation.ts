import { Role } from '../types';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  roles?: Role[] | 'all';
  badge?: string;
}

export const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: 'home',
    roles: 'all',
  },
  {
    id: 'jobs',
    label: 'Jobs',
    path: '/jobs',
    icon: 'briefcase',
    roles: 'all',
  },
  {
    id: 'scheduler',
    label: 'Scheduler',
    path: '/scheduler',
    icon: 'calendar',
    roles: 'all',
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: 'document',
    roles: 'all',
  },
  {
    id: 'incidents',
    label: 'Incidents',
    path: '/incidents',
    icon: 'alert',
    roles: 'all',
  },
  {
    id: 'ncr',
    label: 'NCRs',
    path: '/ncr',
    icon: 'clipboard',
    roles: ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'scheduler_admin', 'management_admin', 'hseq_manager'],
  },
  {
    id: 'templates',
    label: 'Templates',
    path: '/templates',
    icon: 'template',
    roles: ['asphalt_engineer', 'profiling_engineer', 'scheduler_admin', 'management_admin', 'hseq_manager'],
  },
  {
    id: 'resources',
    label: 'Resources',
    path: '/resources',
    icon: 'folder',
    roles: 'all',
  },
  {
    id: 'admin',
    label: 'Admin',
    path: '/admin',
    icon: 'settings',
    roles: ['management_admin', 'scheduler_admin'],
  },
];

/**
 * Filter navigation items based on user role
 */
export function getNavigationForRole(userRole: Role): NavItem[] {
  return navigationItems.filter((item) => {
    if (item.roles === 'all') return true;
    if (Array.isArray(item.roles)) {
      return item.roles.includes(userRole);
    }
    return false;
  });
}

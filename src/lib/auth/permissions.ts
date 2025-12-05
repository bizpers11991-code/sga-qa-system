/**
 * @file src/lib/auth/permissions.ts
 * @description Role-based permission checking
 * Defines what actions each role can perform
 */

import type { Role } from '@/types';
import type { AuthUser, PermissionAction, ResourceContext, PermissionResult } from './types';

/**
 * Permission matrix defining which roles can perform which actions
 * true = allowed, false = denied, 'own' = only if user owns the resource
 */
const PERMISSION_MATRIX: Record<Role, Record<PermissionAction, boolean | 'own'>> = {
  // Foremen - Basic job management
  asphalt_foreman: {
    // Jobs
    create_job: true,
    view_job: true,
    edit_own_job: 'own',
    edit_any_job: false,
    delete_job: false,
    assign_job: false,

    // Projects
    create_project: false,
    view_project: true,
    edit_own_project: false,
    edit_any_project: false,
    delete_project: false,
    assign_project: false,

    // Tenders
    create_tender: false,
    view_tender: false,
    edit_tender: false,
    delete_tender: false,
    approve_tender: false,

    // Scope Reports
    create_scope_report: true,
    view_scope_report: true,
    edit_scope_report: 'own',
    approve_scope_report: false,

    // Division Requests
    create_division_request: false,
    view_division_request: true,
    respond_division_request: false,
    delete_division_request: false,

    // QA Packs
    submit_qa_pack: true,
    view_qa_pack: true,
    review_qa_pack: false,
    approve_qa_pack: false,

    // Incidents
    create_incident: true,
    view_incident: true,
    investigate_incident: false,
    close_incident: false,

    // Admin
    manage_users: false,
    view_users: true,
    manage_system: false,
    view_reports: true,
    manage_resources: false,
  },

  // Profiling foreman
  profiling_foreman: {
    create_job: true,
    view_job: true,
    edit_own_job: 'own',
    edit_any_job: false,
    delete_job: false,
    assign_job: false,

    create_project: false,
    view_project: true,
    edit_own_project: false,
    edit_any_project: false,
    delete_project: false,
    assign_project: false,

    create_tender: false,
    view_tender: false,
    edit_tender: false,
    delete_tender: false,
    approve_tender: false,

    create_scope_report: true,
    view_scope_report: true,
    edit_scope_report: 'own',
    approve_scope_report: false,

    create_division_request: false,
    view_division_request: true,
    respond_division_request: false,
    delete_division_request: false,

    submit_qa_pack: true,
    view_qa_pack: true,
    review_qa_pack: false,
    approve_qa_pack: false,

    create_incident: true,
    view_incident: true,
    investigate_incident: false,
    close_incident: false,

    manage_users: false,
    view_users: true,
    manage_system: false,
    view_reports: true,
    manage_resources: false,
  },

  // Spray foreman
  spray_foreman: {
    create_job: true,
    view_job: true,
    edit_own_job: 'own',
    edit_any_job: false,
    delete_job: false,
    assign_job: false,

    create_project: false,
    view_project: true,
    edit_own_project: false,
    edit_any_project: false,
    delete_project: false,
    assign_project: false,

    create_tender: false,
    view_tender: false,
    edit_tender: false,
    delete_tender: false,
    approve_tender: false,

    create_scope_report: true,
    view_scope_report: true,
    edit_scope_report: 'own',
    approve_scope_report: false,

    create_division_request: false,
    view_division_request: true,
    respond_division_request: false,
    delete_division_request: false,

    submit_qa_pack: true,
    view_qa_pack: true,
    review_qa_pack: false,
    approve_qa_pack: false,

    create_incident: true,
    view_incident: true,
    investigate_incident: false,
    close_incident: false,

    manage_users: false,
    view_users: true,
    manage_system: false,
    view_reports: true,
    manage_resources: false,
  },

  // HSEQ Manager
  hseq_manager: {
    create_job: false,
    view_job: true,
    edit_own_job: false,
    edit_any_job: false,
    delete_job: false,
    assign_job: false,

    create_project: false,
    view_project: true,
    edit_own_project: false,
    edit_any_project: false,
    delete_project: false,
    assign_project: false,

    create_tender: false,
    view_tender: true,
    edit_tender: false,
    delete_tender: false,
    approve_tender: false,

    create_scope_report: false,
    view_scope_report: true,
    edit_scope_report: false,
    approve_scope_report: false,

    create_division_request: false,
    view_division_request: true,
    respond_division_request: false,
    delete_division_request: false,

    submit_qa_pack: false,
    view_qa_pack: true,
    review_qa_pack: true,
    approve_qa_pack: true,

    create_incident: true,
    view_incident: true,
    investigate_incident: true,
    close_incident: true,

    manage_users: false,
    view_users: true,
    manage_system: false,
    view_reports: true,
    manage_resources: false,
  },

  // Division Engineers - Can manage their division's work
  asphalt_engineer: {
    create_job: true,
    view_job: true,
    edit_own_job: 'own',
    edit_any_job: true, // Within division
    delete_job: false,
    assign_job: true, // Within division

    create_project: true,
    view_project: true,
    edit_own_project: 'own',
    edit_any_project: true, // Within division
    delete_project: false,
    assign_project: true,

    create_tender: false,
    view_tender: true,
    edit_tender: false,
    delete_tender: false,
    approve_tender: false,

    create_scope_report: true,
    view_scope_report: true,
    edit_scope_report: 'own',
    approve_scope_report: true, // Within division

    create_division_request: true,
    view_division_request: true,
    respond_division_request: true,
    delete_division_request: 'own',

    submit_qa_pack: true,
    view_qa_pack: true,
    review_qa_pack: true,
    approve_qa_pack: false,

    create_incident: true,
    view_incident: true,
    investigate_incident: true,
    close_incident: false,

    manage_users: false,
    view_users: true,
    manage_system: false,
    view_reports: true,
    manage_resources: true, // Within division
  },

  profiling_engineer: {
    // Same as asphalt_engineer
    create_job: true,
    view_job: true,
    edit_own_job: 'own',
    edit_any_job: true,
    delete_job: false,
    assign_job: true,

    create_project: true,
    view_project: true,
    edit_own_project: 'own',
    edit_any_project: true,
    delete_project: false,
    assign_project: true,

    create_tender: false,
    view_tender: true,
    edit_tender: false,
    delete_tender: false,
    approve_tender: false,

    create_scope_report: true,
    view_scope_report: true,
    edit_scope_report: 'own',
    approve_scope_report: true,

    create_division_request: true,
    view_division_request: true,
    respond_division_request: true,
    delete_division_request: 'own',

    submit_qa_pack: true,
    view_qa_pack: true,
    review_qa_pack: true,
    approve_qa_pack: false,

    create_incident: true,
    view_incident: true,
    investigate_incident: true,
    close_incident: false,

    manage_users: false,
    view_users: true,
    manage_system: false,
    view_reports: true,
    manage_resources: true,
  },

  spray_admin: {
    // Same as other division engineers
    create_job: true,
    view_job: true,
    edit_own_job: 'own',
    edit_any_job: true,
    delete_job: false,
    assign_job: true,

    create_project: true,
    view_project: true,
    edit_own_project: 'own',
    edit_any_project: true,
    delete_project: false,
    assign_project: true,

    create_tender: false,
    view_tender: true,
    edit_tender: false,
    delete_tender: false,
    approve_tender: false,

    create_scope_report: true,
    view_scope_report: true,
    edit_scope_report: 'own',
    approve_scope_report: true,

    create_division_request: true,
    view_division_request: true,
    respond_division_request: true,
    delete_division_request: 'own',

    submit_qa_pack: true,
    view_qa_pack: true,
    review_qa_pack: true,
    approve_qa_pack: false,

    create_incident: true,
    view_incident: true,
    investigate_incident: true,
    close_incident: false,

    manage_users: false,
    view_users: true,
    manage_system: false,
    view_reports: true,
    manage_resources: true,
  },

  // Tender Admin - Manages tenders and projects
  tender_admin: {
    create_job: true,
    view_job: true,
    edit_own_job: true,
    edit_any_job: true,
    delete_job: false,
    assign_job: true,

    create_project: true,
    view_project: true,
    edit_own_project: true,
    edit_any_project: true,
    delete_project: false,
    assign_project: true,

    create_tender: true,
    view_tender: true,
    edit_tender: true,
    delete_tender: false,
    approve_tender: true,

    create_scope_report: true,
    view_scope_report: true,
    edit_scope_report: true,
    approve_scope_report: true,

    create_division_request: true,
    view_division_request: true,
    respond_division_request: true,
    delete_division_request: true,

    submit_qa_pack: true,
    view_qa_pack: true,
    review_qa_pack: true,
    approve_qa_pack: true,

    create_incident: true,
    view_incident: true,
    investigate_incident: true,
    close_incident: true,

    manage_users: false,
    view_users: true,
    manage_system: false,
    view_reports: true,
    manage_resources: true,
  },

  // Scheduler Admin - Manages scheduling and resources
  scheduler_admin: {
    create_job: true,
    view_job: true,
    edit_own_job: true,
    edit_any_job: true,
    delete_job: true,
    assign_job: true,

    create_project: true,
    view_project: true,
    edit_own_project: true,
    edit_any_project: true,
    delete_project: false,
    assign_project: true,

    create_tender: false,
    view_tender: true,
    edit_tender: false,
    delete_tender: false,
    approve_tender: false,

    create_scope_report: false,
    view_scope_report: true,
    edit_scope_report: false,
    approve_scope_report: false,

    create_division_request: false,
    view_division_request: true,
    respond_division_request: false,
    delete_division_request: false,

    submit_qa_pack: false,
    view_qa_pack: true,
    review_qa_pack: false,
    approve_qa_pack: false,

    create_incident: true,
    view_incident: true,
    investigate_incident: false,
    close_incident: false,

    manage_users: true,
    view_users: true,
    manage_system: true,
    view_reports: true,
    manage_resources: true,
  },

  // Management Admin - Full access
  management_admin: {
    create_job: true,
    view_job: true,
    edit_own_job: true,
    edit_any_job: true,
    delete_job: true,
    assign_job: true,

    create_project: true,
    view_project: true,
    edit_own_project: true,
    edit_any_project: true,
    delete_project: true,
    assign_project: true,

    create_tender: true,
    view_tender: true,
    edit_tender: true,
    delete_tender: true,
    approve_tender: true,

    create_scope_report: true,
    view_scope_report: true,
    edit_scope_report: true,
    approve_scope_report: true,

    create_division_request: true,
    view_division_request: true,
    respond_division_request: true,
    delete_division_request: true,

    submit_qa_pack: true,
    view_qa_pack: true,
    review_qa_pack: true,
    approve_qa_pack: true,

    create_incident: true,
    view_incident: true,
    investigate_incident: true,
    close_incident: true,

    manage_users: true,
    view_users: true,
    manage_system: true,
    view_reports: true,
    manage_resources: true,
  },
};

/**
 * Check if user has permission to perform an action
 *
 * @param user - Authenticated user
 * @param action - Permission action to check
 * @param context - Optional resource context for ownership checks
 * @returns PermissionResult indicating if permission is granted
 *
 * @example
 * ```typescript
 * const result = checkPermission(user, 'edit_job', { ownerId: job.assignedForemanId });
 * if (!result.allowed) {
 *   return NextResponse.json({ error: result.reason }, { status: 403 });
 * }
 * ```
 */
export function checkPermission(
  user: AuthUser,
  action: PermissionAction,
  context?: ResourceContext
): PermissionResult {
  const rolePermissions = PERMISSION_MATRIX[user.role];

  if (!rolePermissions) {
    return {
      allowed: false,
      reason: `Unknown role: ${user.role}`,
    };
  }

  const permission = rolePermissions[action];

  // If permission is false, deny
  if (permission === false) {
    return {
      allowed: false,
      reason: `Role ${user.role} does not have permission to ${action}`,
    };
  }

  // If permission is true, allow
  if (permission === true) {
    return { allowed: true };
  }

  // If permission is 'own', check ownership
  if (permission === 'own') {
    if (!context?.ownerId) {
      return {
        allowed: false,
        reason: 'Ownership context required for this action',
      };
    }

    if (context.ownerId !== user.id) {
      return {
        allowed: false,
        reason: 'You can only perform this action on your own resources',
      };
    }

    return { allowed: true };
  }

  // Fallback deny
  return {
    allowed: false,
    reason: 'Permission denied',
  };
}

/**
 * Check if user has permission, throw error if not
 *
 * @param user - Authenticated user
 * @param action - Permission action to check
 * @param context - Optional resource context
 * @throws Error if permission denied
 *
 * @example
 * ```typescript
 * requirePermission(user, 'delete_job');
 * // Throws if user doesn't have permission
 * await deleteJob(jobId);
 * ```
 */
export function requirePermission(
  user: AuthUser,
  action: PermissionAction,
  context?: ResourceContext
): void {
  const result = checkPermission(user, action, context);

  if (!result.allowed) {
    throw new Error(result.reason || 'Permission denied');
  }
}

/**
 * Check if user has any of the specified permissions
 *
 * @param user - Authenticated user
 * @param actions - Array of actions to check
 * @param context - Optional resource context
 * @returns true if user has any of the permissions
 *
 * @example
 * ```typescript
 * if (hasAnyPermission(user, ['edit_any_job', 'delete_job'])) {
 *   // Show admin controls
 * }
 * ```
 */
export function hasAnyPermission(
  user: AuthUser,
  actions: PermissionAction[],
  context?: ResourceContext
): boolean {
  return actions.some(action => checkPermission(user, action, context).allowed);
}

/**
 * Check if user has all of the specified permissions
 *
 * @param user - Authenticated user
 * @param actions - Array of actions to check
 * @param context - Optional resource context
 * @returns true if user has all permissions
 *
 * @example
 * ```typescript
 * if (hasAllPermissions(user, ['view_qa_pack', 'approve_qa_pack'])) {
 *   // Show approval interface
 * }
 * ```
 */
export function hasAllPermissions(
  user: AuthUser,
  actions: PermissionAction[],
  context?: ResourceContext
): boolean {
  return actions.every(action => checkPermission(user, action, context).allowed);
}

/**
 * Filter list of items based on user permissions
 * Useful for showing only items user can act on
 *
 * @param user - Authenticated user
 * @param items - Array of items to filter
 * @param action - Permission action to check
 * @param getContext - Function to extract resource context from item
 * @returns Filtered array of items
 *
 * @example
 * ```typescript
 * const editableJobs = filterByPermission(
 *   user,
 *   allJobs,
 *   'edit_job',
 *   (job) => ({ ownerId: job.assignedForemanId })
 * );
 * ```
 */
export function filterByPermission<T>(
  user: AuthUser,
  items: T[],
  action: PermissionAction,
  getContext: (item: T) => ResourceContext
): T[] {
  return items.filter(item => {
    const context = getContext(item);
    return checkPermission(user, action, context).allowed;
  });
}

/**
 * Get all permissions for a user role
 *
 * @param role - User role
 * @returns Array of allowed permission actions
 *
 * @example
 * ```typescript
 * const permissions = getRolePermissions('foreman');
 * // ['create_job', 'view_job', 'create_incident', ...]
 * ```
 */
export function getRolePermissions(role: Role): PermissionAction[] {
  const rolePermissions = PERMISSION_MATRIX[role];
  if (!rolePermissions) return [];

  return Object.entries(rolePermissions)
    .filter(([_, allowed]) => allowed === true || allowed === 'own')
    .map(([action]) => action as PermissionAction);
}

/**
 * Check if user can manage resources in a specific division
 *
 * @param user - Authenticated user
 * @param division - Division to check ('Asphalt' | 'Profiling' | 'Spray')
 * @returns boolean indicating if user can manage division
 *
 * @example
 * ```typescript
 * if (canManageDivision(user, 'Asphalt')) {
 *   // Show division management controls
 * }
 * ```
 */
export function canManageDivision(
  user: AuthUser,
  division: 'Asphalt' | 'Profiling' | 'Spray'
): boolean {
  // Management and scheduler admins can manage all divisions
  if (user.role === 'management_admin' || user.role === 'scheduler_admin') {
    return true;
  }

  // Division engineers can only manage their own division
  const divisionRoleMap = {
    'Asphalt': 'asphalt_engineer',
    'Profiling': 'profiling_engineer',
    'Spray': 'spray_admin',
  };

  return user.role === divisionRoleMap[division];
}

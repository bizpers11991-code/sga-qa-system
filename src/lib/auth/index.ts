/**
 * @file src/lib/auth/index.ts
 * @description Authentication and authorization module exports
 */

// Middleware utilities
export {
  decodeToken,
  validateClaims,
  extractRole,
  claimsToAuthUser,
} from './middleware';

// Permissions
export {
  checkPermission,
  requirePermission,
  hasAnyPermission,
  hasAllPermissions,
  filterByPermission,
  getRolePermissions,
  canManageDivision,
} from './permissions';

// Types
export type {
  TokenClaims,
  AuthUser,
  PermissionAction,
  ResourceContext,
  PermissionResult,
} from './types';

export {
  AuthErrorCode,
  AuthError,
} from './types';

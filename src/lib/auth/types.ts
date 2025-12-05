/**
 * Authentication and Authorization Types
 *
 * Type definitions for user authentication, authorization, and permissions
 * in the SGA QA System.
 */

import type { Role } from '@/types';

/**
 * MSAL Token Claims
 *
 * Claims extracted from Microsoft Azure AD token after successful authentication.
 */
export interface TokenClaims {
  /** Object ID - Unique user identifier in Azure AD */
  oid: string;

  /** Display name of the user */
  name: string;

  /** User's email address (preferred username) */
  preferred_username: string;

  /** User roles assigned in Azure AD */
  roles?: string[];

  /** Token expiry timestamp (Unix epoch) */
  exp: number;

  /** Token issued at timestamp (Unix epoch) */
  iat?: number;

  /** Issuer of the token */
  iss?: string;

  /** Audience the token is intended for */
  aud?: string;

  /** Tenant ID */
  tid?: string;
}

/**
 * Authenticated User
 *
 * Represents an authenticated user with their role and permissions.
 */
export interface AuthUser {
  /** Unique user identifier (from Azure AD oid) */
  id: string;

  /** User's display name */
  name: string;

  /** User's email address */
  email: string;

  /** User's role in the system */
  role: Role;

  /** Token expiry timestamp */
  expiresAt: number;

  /** Raw token claims for advanced usage */
  claims: TokenClaims;
}

/**
 * Permission Action
 *
 * Actions that can be performed in the system.
 */
export type PermissionAction =
  // Job Management
  | 'create_job'
  | 'view_job'
  | 'edit_own_job'
  | 'edit_any_job'
  | 'delete_job'
  | 'assign_job'

  // Project Management
  | 'create_project'
  | 'view_project'
  | 'edit_own_project'
  | 'edit_any_project'
  | 'delete_project'
  | 'assign_project'

  // Tender Management
  | 'create_tender'
  | 'view_tender'
  | 'edit_tender'
  | 'delete_tender'
  | 'approve_tender'

  // Scope Reports
  | 'create_scope_report'
  | 'view_scope_report'
  | 'edit_scope_report'
  | 'approve_scope_report'

  // Division Requests
  | 'create_division_request'
  | 'view_division_request'
  | 'respond_division_request'
  | 'delete_division_request'

  // QA Pack Management
  | 'submit_qa_pack'
  | 'view_qa_pack'
  | 'review_qa_pack'
  | 'approve_qa_pack'

  // Incident Management
  | 'create_incident'
  | 'view_incident'
  | 'investigate_incident'
  | 'close_incident'

  // User Management
  | 'manage_users'
  | 'view_users'

  // System Administration
  | 'manage_system'
  | 'view_reports'
  | 'manage_resources';

/**
 * Resource Context
 *
 * Context information for resource-level permission checks.
 * Used to determine if a user can perform an action on a specific resource.
 */
export interface ResourceContext {
  /** ID of the resource owner (e.g., assignedForemanId, projectOwnerId) */
  ownerId?: string;

  /** Division the resource belongs to */
  division?: 'Asphalt' | 'Profiling' | 'Spray';

  /** Current status of the resource */
  status?: string;

  /** IDs of users assigned to the resource */
  assignedUserIds?: string[];

  /** Additional custom context */
  [key: string]: unknown;
}

/**
 * Permission Check Result
 *
 * Result of a permission check operation.
 */
export interface PermissionResult {
  /** Whether the permission is granted */
  allowed: boolean;

  /** Reason for denial (if not allowed) */
  reason?: string;
}

/**
 * Authentication Error Codes
 */
export enum AuthErrorCode {
  NO_TOKEN = 'NO_TOKEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  MISSING_CLAIMS = 'MISSING_CLAIMS',
  INVALID_ROLE = 'INVALID_ROLE',
  FORBIDDEN = 'FORBIDDEN',
}

/**
 * Authentication Error
 *
 * Custom error class for authentication failures.
 */
export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

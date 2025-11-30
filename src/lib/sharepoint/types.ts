/**
 * @file src/lib/sharepoint/types.ts
 * @description TypeScript type definitions for SharePoint integration
 * Provides type-safe interfaces for SharePoint responses, requests, and errors
 */

/**
 * SharePoint list item base structure
 * All SharePoint items extend this interface
 */
export interface SharePointListItem {
  Id: number;
  Title: string;
  Created: string;
  Modified: string;
  AuthorId?: number;
  EditorId?: number;
}

/**
 * SharePoint document library item structure
 */
export interface SharePointDocumentItem extends SharePointListItem {
  FileLeafRef: string; // File name
  FileRef: string; // Full path
  FileDirRef: string; // Folder path
  File_x0020_Size?: number;
  File_x0020_Type?: string;
  ServerRelativeUrl: string;
}

/**
 * SharePoint batch operation result
 */
export interface BatchResult<T = any> {
  success: boolean;
  results: T[];
  errors: BatchError[];
}

/**
 * Individual batch operation error
 */
export interface BatchError {
  index: number;
  error: string;
  statusCode?: number;
}

/**
 * SharePoint query options for list operations
 */
export interface SharePointQueryOptions {
  /** OData filter query (e.g., "Status eq 'Pending'") */
  filter?: string;

  /** Fields to select (e.g., ['Title', 'JobType', 'Location']) */
  select?: string[];

  /** Field to order by (e.g., 'ScheduledDate') */
  orderBy?: string;

  /** Sort direction */
  orderByDescending?: boolean;

  /** Maximum number of items to return */
  top?: number;

  /** Number of items to skip (for pagination) */
  skip?: number;

  /** Expand related fields */
  expand?: string[];
}

/**
 * SharePoint error response structure
 */
export interface SharePointError extends Error {
  statusCode: number;
  code?: string;
  isRetryable: boolean;
  retryAfter?: number; // For throttling (503) errors
}

/**
 * SharePoint file upload options
 */
export interface FileUploadOptions {
  /** Folder path within the library */
  folderPath?: string;

  /** Whether to overwrite existing file */
  overwrite?: boolean;

  /** Metadata to set on the file */
  metadata?: Record<string, any>;

  /** Content type for the file */
  contentType?: string;
}

/**
 * SharePoint file download result
 */
export interface FileDownloadResult {
  fileName: string;
  contentType: string;
  size: number;
  content: Buffer;
  metadata?: Record<string, any>;
}

/**
 * SharePoint folder creation options
 */
export interface FolderOptions {
  /** Parent folder path */
  parentPath?: string;

  /** Metadata for the folder */
  metadata?: Record<string, any>;
}

/**
 * SharePoint connection configuration
 */
export interface SharePointConfig {
  siteUrl: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

/**
 * MSAL token cache entry
 */
export interface TokenCacheEntry {
  accessToken: string;
  expiresOn: number; // Timestamp
}

/**
 * SharePoint API retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Custom error class for SharePoint operations
 */
export class SharePointApiError extends Error implements SharePointError {
  statusCode: number;
  code?: string;
  isRetryable: boolean;
  retryAfter?: number;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    isRetryable: boolean = false,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'SharePointApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.isRetryable = isRetryable;
    this.retryAfter = retryAfter;

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SharePointApiError);
    }
  }
}

/**
 * Type guard to check if error is a SharePoint error
 */
export function isSharePointError(error: unknown): error is SharePointError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    'isRetryable' in error
  );
}

/**
 * Pagination metadata for list queries
 */
export interface PaginationResult<T> {
  items: T[];
  hasMore: boolean;
  nextSkip?: number;
  total?: number;
}

/**
 * Generic type for creating SharePoint items
 */
export type CreateItemData<T> = Omit<T, 'Id' | 'Created' | 'Modified' | 'AuthorId' | 'EditorId'>;

/**
 * Generic type for updating SharePoint items
 */
export type UpdateItemData<T> = Partial<CreateItemData<T>>;

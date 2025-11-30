/**
 * @file src/lib/sharepoint/index.ts
 * @description SharePoint integration module exports
 * Central export point for all SharePoint services
 */

// Auth
export {
  getAccessToken,
  clearTokenCache,
  validateAuthConfig,
  getTokenExpiration,
  getSharePointConfig,
} from './auth.js';

// Connection
export {
  SharePointClient,
  getSharePointClient,
  createSharePointClient,
} from './connection.js';

// List Operations
export {
  SharePointListService,
  createListService,
  JobsListService,
  ProjectsListService,
  TendersListService,
  ScopeReportsListService,
  DivisionRequestsListService,
  QAPacksListService,
  IncidentsListService,
} from './lists.js';

// Document Operations
export {
  SharePointDocumentService,
  createDocumentService,
  DocumentsService,
  QADocumentsService,
  PhotosService,
  ScopeReportDocumentsService,
} from './documents.js';

// Types
export type {
  SharePointListItem,
  SharePointDocumentItem,
  SharePointQueryOptions,
  SharePointConfig,
  SharePointError,
  FileUploadOptions,
  FileDownloadResult,
  FolderOptions,
  PaginationResult,
  BatchResult,
  BatchError,
  CreateItemData,
  UpdateItemData,
  TokenCacheEntry,
  RetryConfig,
} from './types.js';

export {
  SharePointApiError,
  isSharePointError,
} from './types.js';

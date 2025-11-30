/**
 * @file src/lib/sharepoint/documents.ts
 * @description SharePoint document library operations
 * Handles file uploads, downloads, and document metadata management
 */

import { getSharePointClient } from './connection.js';
import {
  SharePointApiError,
  type SharePointDocumentItem,
  type FileUploadOptions,
  type FileDownloadResult,
  type FolderOptions,
  type SharePointQueryOptions,
} from './types.js';

/**
 * SharePoint Document Library Service
 * Provides operations for document libraries (file upload, download, management)
 */
export class SharePointDocumentService {
  private client = getSharePointClient();
  private libraryName: string;

  constructor(libraryName: string) {
    this.libraryName = libraryName;
  }

  /**
   * Get base endpoint for this library
   */
  private getLibraryEndpoint(): string {
    return `/_api/web/lists/getbytitle('${this.libraryName}')`;
  }

  /**
   * Get folder endpoint
   */
  private getFolderEndpoint(folderPath?: string): string {
    const basePath = `/${this.libraryName}`;
    const fullPath = folderPath ? `${basePath}/${folderPath}` : basePath;
    return `/_api/web/GetFolderByServerRelativeUrl('${fullPath}')`;
  }

  /**
   * Get file endpoint
   */
  private getFileEndpoint(fileName: string, folderPath?: string): string {
    const folder = folderPath ? `/${folderPath}` : '';
    const fullPath = `/${this.libraryName}${folder}/${fileName}`;
    return `/_api/web/GetFileByServerRelativeUrl('${fullPath}')`;
  }

  /**
   * Upload a file to the document library
   *
   * @param file - File buffer or Blob
   * @param fileName - Name for the file
   * @param options - Upload options (folder, overwrite, metadata)
   * @returns Promise<SharePointDocumentItem> Uploaded file metadata
   *
   * @example
   * ```typescript
   * const docsService = new SharePointDocumentService('Documents');
   * const result = await docsService.uploadFile(
   *   fileBuffer,
   *   'scope-report.pdf',
   *   {
   *     folderPath: 'ScopeReports/Project123',
   *     overwrite: true,
   *     metadata: {
   *       ProjectID: 'P-123',
   *       DocumentType: 'Scope Report'
   *     }
   *   }
   * );
   * ```
   */
  async uploadFile(
    file: Buffer | Blob,
    fileName: string,
    options?: FileUploadOptions
  ): Promise<SharePointDocumentItem> {
    try {
      // Ensure folder exists if specified
      if (options?.folderPath) {
        await this.ensureFolderPath(options.folderPath);
      }

      // Build upload endpoint
      const folder = options?.folderPath || '';
      const overwrite = options?.overwrite ?? true;
      const endpoint = `${this.getFolderEndpoint(folder)}/Files/add(url='${fileName}',overwrite=${overwrite})`;

      // Upload file
      const uploadResult = await this.client.upload(endpoint, file, fileName);

      // Set metadata if provided
      if (options?.metadata) {
        const itemId = uploadResult.ListItemAllFields?.Id;
        if (itemId) {
          await this.updateFileMetadata(fileName, options.metadata, folder);
        }
      }

      return uploadResult as SharePointDocumentItem;
    } catch (error) {
      throw this.handleError(error, `Failed to upload file: ${fileName}`);
    }
  }

  /**
   * Upload multiple files in batch
   *
   * @param files - Array of { buffer, fileName, folderPath? }
   * @param options - Common upload options
   * @returns Promise<Array<{ success: boolean, file: string, result?: any, error?: string }>>
   *
   * @example
   * ```typescript
   * const results = await docsService.uploadMultipleFiles([
   *   { buffer: file1, fileName: 'photo1.jpg', folderPath: 'Photos/Site1' },
   *   { buffer: file2, fileName: 'photo2.jpg', folderPath: 'Photos/Site1' }
   * ]);
   * ```
   */
  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer | Blob; fileName: string; folderPath?: string }>,
    options?: Omit<FileUploadOptions, 'folderPath'>
  ): Promise<Array<{ success: boolean; file: string; result?: any; error?: string }>> {
    const results = [];

    for (const { buffer, fileName, folderPath } of files) {
      try {
        const result = await this.uploadFile(buffer, fileName, {
          ...options,
          folderPath,
        });
        results.push({ success: true, file: fileName, result });
      } catch (error) {
        results.push({
          success: false,
          file: fileName,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }

    return results;
  }

  /**
   * Download a file from the document library
   *
   * @param fileName - Name of the file
   * @param folderPath - Optional folder path
   * @returns Promise<FileDownloadResult> File content and metadata
   *
   * @example
   * ```typescript
   * const file = await docsService.downloadFile('scope-report.pdf', 'ScopeReports/Project123');
   * // Save to disk or send to client
   * fs.writeFileSync('downloaded.pdf', file.content);
   * ```
   */
  async downloadFile(
    fileName: string,
    folderPath?: string
  ): Promise<FileDownloadResult> {
    try {
      const endpoint = `${this.getFileEndpoint(fileName, folderPath)}/$value`;
      const response = await this.client.download(endpoint);

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const contentLength = response.headers.get('content-length');
      const buffer = Buffer.from(await response.arrayBuffer());

      return {
        fileName,
        contentType,
        size: contentLength ? parseInt(contentLength, 10) : buffer.length,
        content: buffer,
      };
    } catch (error) {
      throw this.handleError(error, `Failed to download file: ${fileName}`);
    }
  }

  /**
   * Get file metadata without downloading content
   *
   * @param fileName - Name of the file
   * @param folderPath - Optional folder path
   * @returns Promise<SharePointDocumentItem> File metadata
   *
   * @example
   * ```typescript
   * const metadata = await docsService.getFileMetadata('report.pdf', 'Reports');
   * console.log('File size:', metadata.File_x0020_Size);
   * ```
   */
  async getFileMetadata(
    fileName: string,
    folderPath?: string
  ): Promise<SharePointDocumentItem> {
    try {
      const endpoint = `${this.getFileEndpoint(fileName, folderPath)}/ListItemAllFields`;
      return await this.client.get<SharePointDocumentItem>(endpoint);
    } catch (error) {
      throw this.handleError(error, `Failed to get file metadata: ${fileName}`);
    }
  }

  /**
   * Update file metadata (without changing file content)
   *
   * @param fileName - Name of the file
   * @param metadata - Metadata fields to update
   * @param folderPath - Optional folder path
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await docsService.updateFileMetadata('report.pdf', {
   *   Status: 'Approved',
   *   ApprovedBy: 'John Smith',
   *   ApprovalDate: new Date().toISOString()
   * }, 'Reports');
   * ```
   */
  async updateFileMetadata(
    fileName: string,
    metadata: Record<string, any>,
    folderPath?: string
  ): Promise<void> {
    try {
      // Get file's list item ID
      const fileMetadata = await this.getFileMetadata(fileName, folderPath);
      const itemId = fileMetadata.Id;

      // Update via list API
      const listEndpoint = `${this.getLibraryEndpoint()}/items(${itemId})`;
      const updateData = {
        __metadata: { type: `SP.Data.${this.libraryName}Item` },
        ...metadata,
      };

      await this.client.patch(listEndpoint, updateData);
    } catch (error) {
      throw this.handleError(error, `Failed to update file metadata: ${fileName}`);
    }
  }

  /**
   * Delete a file
   *
   * @param fileName - Name of the file
   * @param folderPath - Optional folder path
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await docsService.deleteFile('old-report.pdf', 'Reports/Archive');
   * ```
   */
  async deleteFile(fileName: string, folderPath?: string): Promise<void> {
    try {
      const endpoint = this.getFileEndpoint(fileName, folderPath);
      await this.client.delete(endpoint);
    } catch (error) {
      throw this.handleError(error, `Failed to delete file: ${fileName}`);
    }
  }

  /**
   * Check if file exists
   *
   * @param fileName - Name of the file
   * @param folderPath - Optional folder path
   * @returns Promise<boolean> True if file exists
   *
   * @example
   * ```typescript
   * const exists = await docsService.fileExists('report.pdf', 'Reports');
   * if (!exists) {
   *   await docsService.uploadFile(buffer, 'report.pdf', { folderPath: 'Reports' });
   * }
   * ```
   */
  async fileExists(fileName: string, folderPath?: string): Promise<boolean> {
    try {
      await this.getFileMetadata(fileName, folderPath);
      return true;
    } catch (error) {
      if (error instanceof SharePointApiError && error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * List files in a folder
   *
   * @param folderPath - Optional folder path (root if not specified)
   * @param options - Query options (filter, orderBy, etc.)
   * @returns Promise<SharePointDocumentItem[]> Array of files
   *
   * @example
   * ```typescript
   * const files = await docsService.listFiles('ScopeReports/Project123', {
   *   filter: "File_x0020_Type eq 'pdf'",
   *   orderBy: 'Modified',
   *   orderByDescending: true
   * });
   * ```
   */
  async listFiles(
    folderPath?: string,
    options?: SharePointQueryOptions
  ): Promise<SharePointDocumentItem[]> {
    try {
      let endpoint = `${this.getFolderEndpoint(folderPath)}/Files`;

      // Build query string
      const params: string[] = [];

      if (options?.select) {
        params.push(`$select=${options.select.join(',')}`);
      } else {
        // Default fields
        params.push('$select=Name,ServerRelativeUrl,Length,TimeLastModified,TimeCreated');
      }

      // Expand ListItemAllFields to get metadata
      params.push('$expand=ListItemAllFields');

      if (options?.filter) {
        params.push(`$filter=${encodeURIComponent(options.filter)}`);
      }

      if (options?.orderBy) {
        const direction = options.orderByDescending ? ' desc' : '';
        params.push(`$orderby=${options.orderBy}${direction}`);
      }

      if (options?.top) {
        params.push(`$top=${options.top}`);
      }

      endpoint += params.length > 0 ? `?${params.join('&')}` : '';

      const response = await this.client.get<{ results: any[] }>(endpoint);
      return response.results || [];
    } catch (error) {
      throw this.handleError(error, `Failed to list files in folder: ${folderPath || 'root'}`);
    }
  }

  /**
   * Create a folder
   *
   * @param folderName - Name of the folder to create
   * @param options - Folder options (parent path, metadata)
   * @returns Promise<any> Created folder metadata
   *
   * @example
   * ```typescript
   * await docsService.createFolder('Project123', {
   *   parentPath: 'ScopeReports',
   *   metadata: { ProjectID: 'P-123' }
   * });
   * ```
   */
  async createFolder(folderName: string, options?: FolderOptions): Promise<any> {
    try {
      const parentPath = options?.parentPath || '';
      const endpoint = `${this.getFolderEndpoint(parentPath)}/Folders`;

      const folderData = {
        __metadata: { type: 'SP.Folder' },
        ServerRelativeUrl: `/${this.libraryName}/${parentPath}/${folderName}`.replace('//', '/'),
      };

      return await this.client.post(endpoint, folderData);
    } catch (error) {
      throw this.handleError(error, `Failed to create folder: ${folderName}`);
    }
  }

  /**
   * Ensure folder path exists (creates if needed)
   *
   * @param folderPath - Full folder path (e.g., 'ScopeReports/Project123/Photos')
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await docsService.ensureFolderPath('Reports/2024/January');
   * // All intermediate folders created if they don't exist
   * ```
   */
  async ensureFolderPath(folderPath: string): Promise<void> {
    const folders = folderPath.split('/').filter(f => f);
    let currentPath = '';

    for (const folder of folders) {
      const parentPath = currentPath || undefined;
      currentPath = currentPath ? `${currentPath}/${folder}` : folder;

      try {
        const exists = await this.folderExists(currentPath);
        if (!exists) {
          await this.createFolder(folder, { parentPath });
        }
      } catch (error) {
        // Ignore if folder already exists (race condition)
        if (!(error instanceof SharePointApiError && error.statusCode === 409)) {
          throw error;
        }
      }
    }
  }

  /**
   * Check if folder exists
   *
   * @param folderPath - Folder path to check
   * @returns Promise<boolean> True if folder exists
   *
   * @example
   * ```typescript
   * const exists = await docsService.folderExists('ScopeReports/Project123');
   * ```
   */
  async folderExists(folderPath: string): Promise<boolean> {
    try {
      const endpoint = this.getFolderEndpoint(folderPath);
      await this.client.get(endpoint);
      return true;
    } catch (error) {
      if (error instanceof SharePointApiError && error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete a folder and all its contents
   *
   * @param folderPath - Folder path to delete
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await docsService.deleteFolder('TempUploads/Session123');
   * ```
   */
  async deleteFolder(folderPath: string): Promise<void> {
    try {
      const endpoint = this.getFolderEndpoint(folderPath);
      await this.client.delete(endpoint);
    } catch (error) {
      throw this.handleError(error, `Failed to delete folder: ${folderPath}`);
    }
  }

  /**
   * Get file URL for direct access
   *
   * @param fileName - Name of the file
   * @param folderPath - Optional folder path
   * @returns string Full URL to the file
   *
   * @example
   * ```typescript
   * const url = docsService.getFileUrl('report.pdf', 'Reports/2024');
   * // https://tenant.sharepoint.com/sites/site/Documents/Reports/2024/report.pdf
   * ```
   */
  getFileUrl(fileName: string, folderPath?: string): string {
    const siteUrl = process.env.SHAREPOINT_SITE_URL || '';
    const folder = folderPath ? `/${folderPath}` : '';
    return `${siteUrl}/${this.libraryName}${folder}/${fileName}`;
  }

  /**
   * Handle and wrap errors with context
   */
  private handleError(error: unknown, context: string): SharePointApiError {
    if (error instanceof SharePointApiError) {
      error.message = `${context}: ${error.message}`;
      return error;
    }

    return new SharePointApiError(
      `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'OPERATION_FAILED',
      false
    );
  }
}

/**
 * Factory function to create a document service instance
 *
 * @param libraryName - SharePoint document library name
 * @returns SharePointDocumentService instance
 *
 * @example
 * ```typescript
 * const docsService = createDocumentService('Documents');
 * await docsService.uploadFile(buffer, 'file.pdf');
 * ```
 */
export function createDocumentService(libraryName: string): SharePointDocumentService {
  return new SharePointDocumentService(libraryName);
}

/**
 * Convenience services for common document libraries
 */
export const DocumentsService = createDocumentService('Documents');
export const QADocumentsService = createDocumentService('QADocuments');
export const PhotosService = createDocumentService('Photos');
export const ScopeReportDocumentsService = createDocumentService('ScopeReportDocuments');

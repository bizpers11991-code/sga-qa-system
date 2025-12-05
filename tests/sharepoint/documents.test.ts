/**
 * @file tests/sharepoint/documents.test.ts
 * @description Unit tests for SharePoint document library operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SharePointDocumentService,
  createDocumentService,
  DocumentsService,
} from '@/lib/sharepoint/documents';
import { SharePointClient } from '@/lib/sharepoint/connection';
import { SharePointApiError } from '@/lib/sharepoint/types';

// Mock the SharePoint client
vi.mock('@/lib/sharepoint/connection', () => ({
  getSharePointClient: vi.fn(() => mockClient),
  SharePointClient: vi.fn(),
}));

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  upload: vi.fn(),
  download: vi.fn(),
} as any;

describe('SharePointDocumentService', () => {
  let docService: SharePointDocumentService;

  beforeEach(() => {
    vi.clearAllMocks();
    docService = new SharePointDocumentService('Documents');

    // Set up environment
    process.env.SHAREPOINT_SITE_URL = 'https://test.sharepoint.com/sites/testsite';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with library name', () => {
      const service = new SharePointDocumentService('Photos');
      expect(service).toBeDefined();
    });

    it('should create service with factory function', () => {
      const service = createDocumentService('QADocuments');
      expect(service).toBeInstanceOf(SharePointDocumentService);
    });

    it('should have pre-configured services', () => {
      expect(DocumentsService).toBeDefined();
      expect(DocumentsService).toBeInstanceOf(SharePointDocumentService);
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const fileBuffer = Buffer.from('test file content');
      const fileName = 'test-document.pdf';

      const mockUploadResult = {
        Id: 1,
        FileLeafRef: fileName,
        FileRef: `/Documents/${fileName}`,
        FileDirRef: '/Documents',
        ServerRelativeUrl: `/sites/testsite/Documents/${fileName}`,
        ListItemAllFields: { Id: 1 },
      };

      mockClient.upload.mockResolvedValue(mockUploadResult);

      const result = await docService.uploadFile(fileBuffer, fileName);

      expect(mockClient.upload).toHaveBeenCalledWith(
        expect.stringContaining('/Files/add'),
        fileBuffer,
        fileName
      );
      expect(result.FileLeafRef).toBe(fileName);
    });

    it('should upload to specific folder', async () => {
      const fileBuffer = Buffer.from('test content');
      const fileName = 'report.pdf';
      const folderPath = 'Reports/2024';

      mockClient.get.mockResolvedValue({}); // Folder exists check
      mockClient.upload.mockResolvedValue({
        FileLeafRef: fileName,
        ListItemAllFields: { Id: 1 },
      });

      await docService.uploadFile(fileBuffer, fileName, { folderPath });

      expect(mockClient.upload).toHaveBeenCalledWith(
        expect.stringContaining(`GetFolderByServerRelativeUrl('/${folderPath}')`),
        fileBuffer,
        fileName
      );
    });

    it('should create folder if it does not exist', async () => {
      const fileBuffer = Buffer.from('test content');
      const fileName = 'document.pdf';
      const folderPath = 'NewFolder/SubFolder';

      // Mock folder existence checks
      mockClient.get
        .mockRejectedValueOnce(
          new SharePointApiError('Not found', 404, 'NOT_FOUND', false)
        )
        .mockResolvedValueOnce({}); // Folder created

      mockClient.post.mockResolvedValue({ ServerRelativeUrl: '/Documents/NewFolder' });
      mockClient.upload.mockResolvedValue({
        FileLeafRef: fileName,
        ListItemAllFields: { Id: 1 },
      });

      await docService.uploadFile(fileBuffer, fileName, { folderPath });

      expect(mockClient.post).toHaveBeenCalled();
    });

    it('should set overwrite flag', async () => {
      const fileBuffer = Buffer.from('test content');
      const fileName = 'document.pdf';

      mockClient.upload.mockResolvedValue({
        FileLeafRef: fileName,
        ListItemAllFields: { Id: 1 },
      });

      await docService.uploadFile(fileBuffer, fileName, { overwrite: false });

      expect(mockClient.upload).toHaveBeenCalledWith(
        expect.stringContaining('overwrite=false'),
        fileBuffer,
        fileName
      );
    });

    it('should set metadata after upload', async () => {
      const fileBuffer = Buffer.from('test content');
      const fileName = 'document.pdf';
      const metadata = {
        ProjectID: 'P-123',
        DocumentType: 'Scope Report',
        Status: 'Draft',
      };

      mockClient.upload.mockResolvedValue({
        FileLeafRef: fileName,
        ListItemAllFields: { Id: 1 },
      });

      mockClient.get.mockResolvedValue({ Id: 1 }); // Get file metadata
      mockClient.patch.mockResolvedValue(undefined);

      await docService.uploadFile(fileBuffer, fileName, { metadata });

      expect(mockClient.patch).toHaveBeenCalledWith(
        expect.stringContaining('/items(1)'),
        expect.objectContaining(metadata)
      );
    });

    it('should handle upload errors', async () => {
      const fileBuffer = Buffer.from('test content');
      const fileName = 'document.pdf';

      mockClient.upload.mockRejectedValue(
        new SharePointApiError('Upload failed', 500, 'UPLOAD_ERROR', true)
      );

      await expect(
        docService.uploadFile(fileBuffer, fileName)
      ).rejects.toThrow('Failed to upload file: document.pdf');
    });
  });

  describe('uploadMultipleFiles', () => {
    it('should upload multiple files successfully', async () => {
      const files = [
        { buffer: Buffer.from('file 1'), fileName: 'doc1.pdf', folderPath: 'Folder1' },
        { buffer: Buffer.from('file 2'), fileName: 'doc2.pdf', folderPath: 'Folder1' },
        { buffer: Buffer.from('file 3'), fileName: 'doc3.pdf', folderPath: 'Folder2' },
      ];

      mockClient.get.mockResolvedValue({}); // Folders exist
      mockClient.upload.mockResolvedValue({ ListItemAllFields: { Id: 1 } });

      const results = await docService.uploadMultipleFiles(files);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockClient.upload).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in batch upload', async () => {
      const files = [
        { buffer: Buffer.from('file 1'), fileName: 'doc1.pdf' },
        { buffer: Buffer.from('file 2'), fileName: 'doc2.pdf' },
        { buffer: Buffer.from('file 3'), fileName: 'doc3.pdf' },
      ];

      mockClient.upload
        .mockResolvedValueOnce({ ListItemAllFields: { Id: 1 } })
        .mockRejectedValueOnce(
          new SharePointApiError('Upload failed', 500, 'UPLOAD_ERROR', false)
        )
        .mockResolvedValueOnce({ ListItemAllFields: { Id: 3 } });

      const results = await docService.uploadMultipleFiles(files);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeDefined();
      expect(results[2].success).toBe(true);
    });
  });

  describe('downloadFile', () => {
    it('should download file successfully', async () => {
      const fileName = 'document.pdf';
      const fileContent = Buffer.from('PDF file content');

      const mockResponse = {
        headers: new Headers({
          'content-type': 'application/pdf',
          'content-length': String(fileContent.length),
        }),
        arrayBuffer: async () => fileContent.buffer,
      };

      mockClient.download.mockResolvedValue(mockResponse);

      const result = await docService.downloadFile(fileName);

      expect(mockClient.download).toHaveBeenCalledWith(
        expect.stringContaining(`GetFileByServerRelativeUrl('/${fileName}')/$value`)
      );
      expect(result.fileName).toBe(fileName);
      expect(result.contentType).toBe('application/pdf');
      expect(result.size).toBe(fileContent.length);
    });

    it('should download from specific folder', async () => {
      const fileName = 'report.pdf';
      const folderPath = 'Reports/2024';

      const mockResponse = {
        headers: new Headers({ 'content-type': 'application/pdf' }),
        arrayBuffer: async () => Buffer.from('content').buffer,
      };

      mockClient.download.mockResolvedValue(mockResponse);

      await docService.downloadFile(fileName, folderPath);

      expect(mockClient.download).toHaveBeenCalledWith(
        expect.stringContaining(`/${folderPath}/${fileName}`)
      );
    });

    it('should handle missing content-length header', async () => {
      const fileName = 'document.pdf';
      const fileContent = Buffer.from('content');

      const mockResponse = {
        headers: new Headers({ 'content-type': 'application/pdf' }),
        arrayBuffer: async () => fileContent.buffer,
      };

      mockClient.download.mockResolvedValue(mockResponse);

      const result = await docService.downloadFile(fileName);

      expect(result.size).toBe(fileContent.length);
    });

    it('should use default content type if missing', async () => {
      const mockResponse = {
        headers: new Headers(),
        arrayBuffer: async () => Buffer.from('content').buffer,
      };

      mockClient.download.mockResolvedValue(mockResponse);

      const result = await docService.downloadFile('file.txt');

      expect(result.contentType).toBe('application/octet-stream');
    });
  });

  describe('getFileMetadata', () => {
    it('should get file metadata', async () => {
      const fileName = 'document.pdf';
      const mockMetadata = {
        Id: 1,
        Title: 'Test Document',
        FileLeafRef: fileName,
        FileRef: `/Documents/${fileName}`,
        ServerRelativeUrl: `/sites/testsite/Documents/${fileName}`,
        File_x0020_Size: 1024,
        File_x0020_Type: 'pdf',
        Created: '2024-01-01T00:00:00Z',
        Modified: '2024-01-02T00:00:00Z',
      };

      mockClient.get.mockResolvedValue(mockMetadata);

      const result = await docService.getFileMetadata(fileName);

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/ListItemAllFields')
      );
      expect(result.Id).toBe(1);
      expect(result.FileLeafRef).toBe(fileName);
    });

    it('should get metadata for file in folder', async () => {
      const fileName = 'report.pdf';
      const folderPath = 'Reports/2024';

      mockClient.get.mockResolvedValue({ Id: 1, FileLeafRef: fileName });

      await docService.getFileMetadata(fileName, folderPath);

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining(folderPath)
      );
    });
  });

  describe('updateFileMetadata', () => {
    it('should update file metadata', async () => {
      const fileName = 'document.pdf';
      const metadata = {
        Status: 'Approved',
        ApprovedBy: 'John Smith',
        ApprovalDate: '2024-01-15T10:00:00Z',
      };

      mockClient.get.mockResolvedValue({ Id: 1, FileLeafRef: fileName });
      mockClient.patch.mockResolvedValue(undefined);

      await docService.updateFileMetadata(fileName, metadata);

      expect(mockClient.get).toHaveBeenCalled();
      expect(mockClient.patch).toHaveBeenCalledWith(
        expect.stringContaining('/items(1)'),
        expect.objectContaining(metadata)
      );
    });

    it('should include __metadata in update', async () => {
      const fileName = 'document.pdf';
      const metadata = { Status: 'Approved' };

      mockClient.get.mockResolvedValue({ Id: 1 });
      mockClient.patch.mockResolvedValue(undefined);

      await docService.updateFileMetadata(fileName, metadata);

      const patchData = mockClient.patch.mock.calls[0][1];
      expect(patchData.__metadata).toBeDefined();
      expect(patchData.__metadata.type).toBe('SP.Data.DocumentsItem');
    });
  });

  describe('deleteFile', () => {
    it('should delete file', async () => {
      const fileName = 'document.pdf';

      mockClient.delete.mockResolvedValue(undefined);

      await docService.deleteFile(fileName);

      expect(mockClient.delete).toHaveBeenCalledWith(
        expect.stringContaining(`GetFileByServerRelativeUrl('/${fileName}')`)
      );
    });

    it('should delete file in folder', async () => {
      const fileName = 'report.pdf';
      const folderPath = 'Reports/Archive';

      mockClient.delete.mockResolvedValue(undefined);

      await docService.deleteFile(fileName, folderPath);

      expect(mockClient.delete).toHaveBeenCalledWith(
        expect.stringContaining(folderPath)
      );
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      mockClient.get.mockResolvedValue({ Id: 1, FileLeafRef: 'document.pdf' });

      const exists = await docService.fileExists('document.pdf');

      expect(exists).toBe(true);
    });

    it('should return false if file not found', async () => {
      mockClient.get.mockRejectedValue(
        new SharePointApiError('Not found', 404, 'NOT_FOUND', false)
      );

      const exists = await docService.fileExists('missing.pdf');

      expect(exists).toBe(false);
    });

    it('should throw on non-404 errors', async () => {
      mockClient.get.mockRejectedValue(
        new SharePointApiError('Server error', 500, 'SERVER_ERROR', false)
      );

      await expect(docService.fileExists('document.pdf')).rejects.toThrow();
    });
  });

  describe('listFiles', () => {
    it('should list files in folder', async () => {
      const mockFiles = [
        { Name: 'doc1.pdf', ServerRelativeUrl: '/Documents/doc1.pdf' },
        { Name: 'doc2.pdf', ServerRelativeUrl: '/Documents/doc2.pdf' },
        { Name: 'doc3.pdf', ServerRelativeUrl: '/Documents/doc3.pdf' },
      ];

      mockClient.get.mockResolvedValue({ results: mockFiles });

      const files = await docService.listFiles();

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/Files')
      );
      expect(files).toHaveLength(3);
    });

    it('should list files in specific folder', async () => {
      const folderPath = 'Reports/2024';

      mockClient.get.mockResolvedValue({ results: [] });

      await docService.listFiles(folderPath);

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining(folderPath)
      );
    });

    it('should apply filter option', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await docService.listFiles(undefined, {
        filter: "File_x0020_Type eq 'pdf'",
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('$filter=')
      );
    });

    it('should apply orderBy option', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await docService.listFiles(undefined, {
        orderBy: 'Modified',
        orderByDescending: true,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('$orderby=Modified desc')
      );
    });

    it('should expand ListItemAllFields', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await docService.listFiles();

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('$expand=ListItemAllFields')
      );
    });
  });

  describe('Folder Operations', () => {
    describe('createFolder', () => {
      it('should create folder at root', async () => {
        const folderName = 'NewFolder';

        mockClient.post.mockResolvedValue({
          ServerRelativeUrl: `/Documents/${folderName}`,
        });

        await docService.createFolder(folderName);

        expect(mockClient.post).toHaveBeenCalledWith(
          expect.stringContaining('/Folders'),
          expect.objectContaining({
            __metadata: { type: 'SP.Folder' },
          })
        );
      });

      it('should create folder with parent path', async () => {
        const folderName = 'SubFolder';
        const parentPath = 'ParentFolder';

        mockClient.post.mockResolvedValue({
          ServerRelativeUrl: `/Documents/${parentPath}/${folderName}`,
        });

        await docService.createFolder(folderName, { parentPath });

        expect(mockClient.post).toHaveBeenCalled();
      });
    });

    describe('ensureFolderPath', () => {
      it('should create nested folder structure', async () => {
        const folderPath = 'Reports/2024/January';

        // Mock folder existence checks (all return false)
        mockClient.get
          .mockRejectedValueOnce(
            new SharePointApiError('Not found', 404, 'NOT_FOUND', false)
          )
          .mockRejectedValueOnce(
            new SharePointApiError('Not found', 404, 'NOT_FOUND', false)
          )
          .mockRejectedValueOnce(
            new SharePointApiError('Not found', 404, 'NOT_FOUND', false)
          );

        mockClient.post.mockResolvedValue({ ServerRelativeUrl: '/Documents/folder' });

        await docService.ensureFolderPath(folderPath);

        // Should create all three folders
        expect(mockClient.post).toHaveBeenCalledTimes(3);
      });

      it('should skip existing folders', async () => {
        const folderPath = 'Reports/2024';

        // First folder exists, second does not
        mockClient.get
          .mockResolvedValueOnce({}) // Reports exists
          .mockRejectedValueOnce(
            new SharePointApiError('Not found', 404, 'NOT_FOUND', false)
          ); // 2024 does not

        mockClient.post.mockResolvedValue({});

        await docService.ensureFolderPath(folderPath);

        // Should only create the second folder
        expect(mockClient.post).toHaveBeenCalledTimes(1);
      });

      it('should handle concurrent folder creation', async () => {
        const folderPath = 'NewFolder';

        // Folder doesn't exist, but creation returns 409 (already exists)
        mockClient.get.mockRejectedValueOnce(
          new SharePointApiError('Not found', 404, 'NOT_FOUND', false)
        );

        mockClient.post.mockRejectedValueOnce(
          new SharePointApiError('Conflict', 409, 'CONFLICT', false)
        );

        // Should not throw error
        await expect(docService.ensureFolderPath(folderPath)).resolves.not.toThrow();
      });
    });

    describe('folderExists', () => {
      it('should return true if folder exists', async () => {
        mockClient.get.mockResolvedValue({ ServerRelativeUrl: '/Documents/Reports' });

        const exists = await docService.folderExists('Reports');

        expect(exists).toBe(true);
      });

      it('should return false if folder not found', async () => {
        mockClient.get.mockRejectedValue(
          new SharePointApiError('Not found', 404, 'NOT_FOUND', false)
        );

        const exists = await docService.folderExists('MissingFolder');

        expect(exists).toBe(false);
      });
    });

    describe('deleteFolder', () => {
      it('should delete folder', async () => {
        const folderPath = 'TempFolder';

        mockClient.delete.mockResolvedValue(undefined);

        await docService.deleteFolder(folderPath);

        expect(mockClient.delete).toHaveBeenCalledWith(
          expect.stringContaining(`GetFolderByServerRelativeUrl('/${folderPath}')`)
        );
      });
    });
  });

  describe('getFileUrl', () => {
    it('should generate file URL', () => {
      const fileName = 'document.pdf';

      const url = docService.getFileUrl(fileName);

      expect(url).toBe(
        'https://test.sharepoint.com/sites/testsite/Documents/document.pdf'
      );
    });

    it('should generate file URL with folder path', () => {
      const fileName = 'report.pdf';
      const folderPath = 'Reports/2024';

      const url = docService.getFileUrl(fileName, folderPath);

      expect(url).toBe(
        'https://test.sharepoint.com/sites/testsite/Documents/Reports/2024/report.pdf'
      );
    });
  });

  describe('Error Handling', () => {
    it('should wrap errors with context', async () => {
      mockClient.upload.mockRejectedValue(new Error('Network error'));

      try {
        await docService.uploadFile(Buffer.from('test'), 'file.pdf');
      } catch (error) {
        expect(error).toBeInstanceOf(SharePointApiError);
        expect((error as SharePointApiError).message).toContain('Failed to upload file');
      }
    });

    it('should preserve SharePoint errors', async () => {
      mockClient.download.mockRejectedValue(
        new SharePointApiError('Access denied', 403, 'ACCESS_DENIED', false)
      );

      try {
        await docService.downloadFile('secure.pdf');
      } catch (error) {
        expect(error).toBeInstanceOf(SharePointApiError);
        expect((error as SharePointApiError).statusCode).toBe(403);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with special characters', async () => {
      const fileName = 'file name with spaces & special.pdf';

      mockClient.upload.mockResolvedValue({
        FileLeafRef: fileName,
        ListItemAllFields: { Id: 1 },
      });

      await docService.uploadFile(Buffer.from('test'), fileName);

      expect(mockClient.upload).toHaveBeenCalled();
    });

    it('should handle empty file upload', async () => {
      const emptyBuffer = Buffer.from('');

      mockClient.upload.mockResolvedValue({
        FileLeafRef: 'empty.txt',
        ListItemAllFields: { Id: 1 },
      });

      await docService.uploadFile(emptyBuffer, 'empty.txt');

      expect(mockClient.upload).toHaveBeenCalled();
    });

    it('should handle large file uploads', async () => {
      const largeBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB

      mockClient.upload.mockResolvedValue({
        FileLeafRef: 'large-file.zip',
        ListItemAllFields: { Id: 1 },
      });

      await docService.uploadFile(largeBuffer, 'large-file.zip');

      expect(mockClient.upload).toHaveBeenCalled();
    });
  });
});

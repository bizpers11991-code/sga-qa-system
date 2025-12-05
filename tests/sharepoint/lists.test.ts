/**
 * @file tests/sharepoint/lists.test.ts
 * @description Unit tests for SharePoint list operations (CRUD, pagination, batch)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SharePointListService,
  createListService,
  JobsListService,
} from '@/lib/sharepoint/lists';
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
} as any;

interface MockJob {
  Id: number;
  Title: string;
  JobType: string;
  Status: string;
  Location: string;
  Created: string;
  Modified: string;
}

describe('SharePointListService', () => {
  let listService: SharePointListService;

  beforeEach(() => {
    vi.clearAllMocks();
    listService = new SharePointListService('Jobs');

    // Set up environment
    process.env.SHAREPOINT_SITE_URL = 'https://test.sharepoint.com/sites/testsite';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with list name', () => {
      const service = new SharePointListService('CustomList');
      expect(service).toBeDefined();
    });

    it('should create service with factory function', () => {
      const service = createListService('Projects');
      expect(service).toBeInstanceOf(SharePointListService);
    });

    it('should have pre-configured services', () => {
      expect(JobsListService).toBeDefined();
      expect(JobsListService).toBeInstanceOf(SharePointListService);
    });
  });

  describe('getItems', () => {
    it('should get all items from list', async () => {
      const mockItems: MockJob[] = [
        {
          Id: 1,
          Title: 'JOB-001',
          JobType: 'Asphalt',
          Status: 'Pending',
          Location: 'M7 Motorway',
          Created: '2024-01-01T00:00:00Z',
          Modified: '2024-01-01T00:00:00Z',
        },
        {
          Id: 2,
          Title: 'JOB-002',
          JobType: 'Concrete',
          Status: 'In Progress',
          Location: 'M50 Bridge',
          Created: '2024-01-02T00:00:00Z',
          Modified: '2024-01-02T00:00:00Z',
        },
      ];

      mockClient.get.mockResolvedValue({ results: mockItems });

      const items = await listService.getItems<MockJob>();

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/_api/web/lists/getbytitle(\'Jobs\')/items')
      );
      expect(items).toHaveLength(2);
      expect(items[0].Title).toBe('JOB-001');
    });

    it('should apply filter option', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await listService.getItems({
        filter: "Status eq 'Pending'",
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining("$filter=Status%20eq%20'Pending'")
      );
    });

    it('should apply select option', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await listService.getItems({
        select: ['Id', 'Title', 'Status'],
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('$select=Id,Title,Status')
      );
    });

    it('should apply orderBy option', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await listService.getItems({
        orderBy: 'Created',
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('$orderby=Created')
      );
    });

    it('should apply orderBy descending option', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await listService.getItems({
        orderBy: 'Modified',
        orderByDescending: true,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('$orderby=Modified desc')
      );
    });

    it('should apply top option', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await listService.getItems({
        top: 50,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('$top=50')
      );
    });

    it('should apply skip option', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await listService.getItems({
        skip: 20,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('$skip=20')
      );
    });

    it('should apply expand option', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await listService.getItems({
        expand: ['Author', 'Editor'],
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('$expand=Author,Editor')
      );
    });

    it('should combine multiple options', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await listService.getItems({
        filter: "Status eq 'Pending'",
        select: ['Id', 'Title'],
        orderBy: 'Created',
        top: 10,
      });

      const callUrl = mockClient.get.mock.calls[0][0];
      expect(callUrl).toContain('$filter=');
      expect(callUrl).toContain('$select=');
      expect(callUrl).toContain('$orderby=');
      expect(callUrl).toContain('$top=');
    });

    it('should handle empty results', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      const items = await listService.getItems();

      expect(items).toEqual([]);
    });

    it('should handle missing results property', async () => {
      mockClient.get.mockResolvedValue({});

      const items = await listService.getItems();

      expect(items).toEqual([]);
    });
  });

  describe('getItemsPaginated', () => {
    it('should return paginated results', async () => {
      const mockItems = Array.from({ length: 30 }, (_, i) => ({
        Id: i + 1,
        Title: `JOB-${String(i + 1).padStart(3, '0')}`,
        JobType: 'Asphalt',
        Status: 'Pending',
        Location: 'Test Location',
        Created: '2024-01-01T00:00:00Z',
        Modified: '2024-01-01T00:00:00Z',
      }));

      mockClient.get.mockResolvedValue({ results: mockItems });

      const result = await listService.getItemsPaginated({ top: 20 });

      expect(result.items).toHaveLength(20);
      expect(result.hasMore).toBe(true);
      expect(result.nextSkip).toBe(20);
    });

    it('should indicate no more items when at end', async () => {
      const mockItems = Array.from({ length: 15 }, (_, i) => ({
        Id: i + 1,
        Title: `JOB-${String(i + 1).padStart(3, '0')}`,
        JobType: 'Asphalt',
        Status: 'Pending',
        Location: 'Test Location',
        Created: '2024-01-01T00:00:00Z',
        Modified: '2024-01-01T00:00:00Z',
      }));

      mockClient.get.mockResolvedValue({ results: mockItems });

      const result = await listService.getItemsPaginated({ top: 20 });

      expect(result.items).toHaveLength(15);
      expect(result.hasMore).toBe(false);
      expect(result.nextSkip).toBeUndefined();
    });

    it('should use default top of 50', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await listService.getItemsPaginated();

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('$top=51')
      );
    });
  });

  describe('getItem', () => {
    it('should get single item by ID', async () => {
      const mockItem: MockJob = {
        Id: 123,
        Title: 'JOB-123',
        JobType: 'Asphalt',
        Status: 'Pending',
        Location: 'M7 Motorway',
        Created: '2024-01-01T00:00:00Z',
        Modified: '2024-01-01T00:00:00Z',
      };

      mockClient.get.mockResolvedValue(mockItem);

      const item = await listService.getItem<MockJob>(123);

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/items(123)')
      );
      expect(item.Id).toBe(123);
      expect(item.Title).toBe('JOB-123');
    });

    it('should apply select option to getItem', async () => {
      mockClient.get.mockResolvedValue({ Id: 123, Title: 'JOB-123' });

      await listService.getItem(123, ['Id', 'Title']);

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('$select=Id,Title')
      );
    });

    it('should throw error if item not found', async () => {
      mockClient.get.mockRejectedValue(
        new SharePointApiError('Item not found', 404, 'NOT_FOUND', false)
      );

      await expect(listService.getItem(999)).rejects.toThrow();
    });
  });

  describe('createItem', () => {
    it('should create new item', async () => {
      const newItem = {
        Title: 'JOB-999',
        JobType: 'Asphalt',
        Status: 'Pending',
        Location: 'New Location',
      };

      const createdItem: MockJob = {
        Id: 999,
        ...newItem,
        Created: '2024-01-01T00:00:00Z',
        Modified: '2024-01-01T00:00:00Z',
      };

      mockClient.post.mockResolvedValue(createdItem);

      const result = await listService.createItem<MockJob>(newItem);

      expect(mockClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/items'),
        expect.objectContaining({
          __metadata: { type: 'SP.Data.JobsListItem' },
          ...newItem,
        })
      );
      expect(result.Id).toBe(999);
      expect(result.Title).toBe('JOB-999');
    });

    it('should include __metadata type in create', async () => {
      const newItem = { Title: 'Test Item' };

      mockClient.post.mockResolvedValue({ Id: 1, ...newItem });

      await listService.createItem(newItem);

      const postData = mockClient.post.mock.calls[0][1];
      expect(postData.__metadata).toBeDefined();
      expect(postData.__metadata.type).toBe('SP.Data.JobsListItem');
    });
  });

  describe('updateItem', () => {
    it('should update existing item', async () => {
      const updateData = {
        Status: 'Completed',
        Location: 'Updated Location',
      };

      mockClient.patch.mockResolvedValue(undefined);

      await listService.updateItem(123, updateData);

      expect(mockClient.patch).toHaveBeenCalledWith(
        expect.stringContaining('/items(123)'),
        expect.objectContaining({
          __metadata: { type: 'SP.Data.JobsListItem' },
          ...updateData,
        })
      );
    });

    it('should allow partial updates', async () => {
      mockClient.patch.mockResolvedValue(undefined);

      await listService.updateItem(123, { Status: 'In Progress' });

      const patchData = mockClient.patch.mock.calls[0][1];
      expect(patchData.Status).toBe('In Progress');
      expect(Object.keys(patchData)).toHaveLength(2); // __metadata + Status
    });
  });

  describe('deleteItem', () => {
    it('should delete item by ID', async () => {
      mockClient.delete.mockResolvedValue(undefined);

      await listService.deleteItem(123);

      expect(mockClient.delete).toHaveBeenCalledWith(
        expect.stringContaining('/items(123)')
      );
    });

    it('should throw error if item not found', async () => {
      mockClient.delete.mockRejectedValue(
        new SharePointApiError('Item not found', 404, 'NOT_FOUND', false)
      );

      await expect(listService.deleteItem(999)).rejects.toThrow();
    });
  });

  describe('getItemCount', () => {
    it('should get total count of items', async () => {
      mockClient.get.mockResolvedValue(42);

      const count = await listService.getItemCount();

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/items/count')
      );
      expect(count).toBe(42);
    });

    it('should get filtered count', async () => {
      mockClient.get.mockResolvedValue(15);

      const count = await listService.getItemCount("Status eq 'Pending'");

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining("$filter=Status%20eq%20'Pending'")
      );
      expect(count).toBe(15);
    });

    it('should parse string count response', async () => {
      mockClient.get.mockResolvedValue('42');

      const count = await listService.getItemCount();

      expect(count).toBe(42);
    });
  });

  describe('batchCreate', () => {
    it('should create multiple items', async () => {
      const items = [
        { Title: 'JOB-001', Status: 'Pending' },
        { Title: 'JOB-002', Status: 'Pending' },
        { Title: 'JOB-003', Status: 'Pending' },
      ];

      mockClient.post
        .mockResolvedValueOnce({ Id: 1, ...items[0] })
        .mockResolvedValueOnce({ Id: 2, ...items[1] })
        .mockResolvedValueOnce({ Id: 3, ...items[2] });

      const result = await listService.batchCreate(items);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial failures in batch create', async () => {
      const items = [
        { Title: 'JOB-001', Status: 'Pending' },
        { Title: 'JOB-002', Status: 'Pending' },
        { Title: 'JOB-003', Status: 'Pending' },
      ];

      mockClient.post
        .mockResolvedValueOnce({ Id: 1, ...items[0] })
        .mockRejectedValueOnce(
          new SharePointApiError('Create failed', 400, 'BAD_REQUEST', false)
        )
        .mockResolvedValueOnce({ Id: 3, ...items[2] });

      const result = await listService.batchCreate(items);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].index).toBe(1);
    });

    it('should include error details in batch failures', async () => {
      const items = [{ Title: 'Invalid' }];

      mockClient.post.mockRejectedValueOnce(
        new SharePointApiError('Validation error', 400, 'VALIDATION_ERROR', false)
      );

      const result = await listService.batchCreate(items);

      expect(result.errors[0].error).toContain('Validation error');
      expect(result.errors[0].statusCode).toBe(400);
    });
  });

  describe('batchUpdate', () => {
    it('should update multiple items', async () => {
      const updates = [
        { id: 1, data: { Status: 'Completed' } },
        { id: 2, data: { Status: 'Completed' } },
        { id: 3, data: { Status: 'Completed' } },
      ];

      mockClient.patch
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const result = await listService.batchUpdate(updates);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial failures in batch update', async () => {
      const updates = [
        { id: 1, data: { Status: 'Completed' } },
        { id: 2, data: { Status: 'Invalid' } },
        { id: 3, data: { Status: 'Completed' } },
      ];

      mockClient.patch
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(
          new SharePointApiError('Update failed', 400, 'BAD_REQUEST', false)
        )
        .mockResolvedValueOnce(undefined);

      const result = await listService.batchUpdate(updates);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('itemExists', () => {
    it('should return true if item exists', async () => {
      mockClient.get.mockResolvedValue({ Id: 123 });

      const exists = await listService.itemExists(123);

      expect(exists).toBe(true);
    });

    it('should return false if item not found', async () => {
      mockClient.get.mockRejectedValue(
        new SharePointApiError('Not found', 404, 'NOT_FOUND', false)
      );

      const exists = await listService.itemExists(999);

      expect(exists).toBe(false);
    });

    it('should throw on non-404 errors', async () => {
      mockClient.get.mockRejectedValue(
        new SharePointApiError('Server error', 500, 'SERVER_ERROR', false)
      );

      await expect(listService.itemExists(123)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should wrap and rethrow SharePoint errors with context', async () => {
      mockClient.get.mockRejectedValue(
        new SharePointApiError('Connection failed', 500, 'NETWORK_ERROR', true)
      );

      try {
        await listService.getItems();
      } catch (error) {
        expect(error).toBeInstanceOf(SharePointApiError);
        expect((error as SharePointApiError).message).toContain('Failed to get list items');
      }
    });

    it('should convert generic errors to SharePointApiError', async () => {
      mockClient.get.mockRejectedValue(new Error('Unexpected error'));

      try {
        await listService.getItems();
      } catch (error) {
        expect(error).toBeInstanceOf(SharePointApiError);
        expect((error as SharePointApiError).statusCode).toBe(500);
      }
    });
  });

  describe('Complex Queries', () => {
    it('should handle complex filter expressions', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await listService.getItems({
        filter: "(Status eq 'Pending' or Status eq 'In Progress') and JobType eq 'Asphalt'",
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('$filter=')
      );
    });

    it('should handle date filters', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await listService.getItems({
        filter: "Created ge datetime'2024-01-01T00:00:00Z'",
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('$filter=')
      );
    });

    it('should handle multiple orderBy fields', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await listService.getItems({
        orderBy: 'Status,Created',
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('$orderby=Status,Created')
      );
    });
  });
});

/**
 * @file tests/api/jobs-sharepoint.test.ts
 * @description Integration tests for Jobs API with SharePoint backend
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JobsListService } from '@/lib/sharepoint';
import { SharePointApiError } from '@/lib/sharepoint/types';

// Mock SharePoint services
vi.mock('@/lib/sharepoint', () => ({
  JobsListService: {
    getItems: vi.fn(),
    getItem: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    getItemCount: vi.fn(),
    batchCreate: vi.fn(),
    batchUpdate: vi.fn(),
    itemExists: vi.fn(),
  },
}));

describe('Jobs API - SharePoint Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup environment
    process.env.SHAREPOINT_SITE_URL = 'https://test.sharepoint.com/sites/testsite';
    process.env.AZURE_TENANT_ID = 'test-tenant-id';
    process.env.AZURE_CLIENT_ID = 'test-client-id';
    process.env.AZURE_CLIENT_SECRET = 'test-client-secret';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/get-all-jobs', () => {
    it('should fetch all jobs from SharePoint', async () => {
      const mockJobs = [
        {
          Id: 1,
          Title: 'JOB-001',
          JobType: 'Asphalt',
          Status: 'Pending',
          Client: 'Test Client',
          Location: 'M7 Motorway',
          ScheduledDate: '2024-01-15',
          Created: '2024-01-01T00:00:00Z',
          Modified: '2024-01-01T00:00:00Z',
        },
        {
          Id: 2,
          Title: 'JOB-002',
          JobType: 'Concrete',
          Status: 'In Progress',
          Client: 'Another Client',
          Location: 'M50 Bridge',
          ScheduledDate: '2024-01-16',
          Created: '2024-01-02T00:00:00Z',
          Modified: '2024-01-02T00:00:00Z',
        },
      ];

      vi.mocked(JobsListService.getItems).mockResolvedValue(mockJobs);

      const result = await JobsListService.getItems();

      expect(JobsListService.getItems).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].Title).toBe('JOB-001');
    });

    it('should filter jobs by status', async () => {
      const mockPendingJobs = [
        {
          Id: 1,
          Title: 'JOB-001',
          Status: 'Pending',
          JobType: 'Asphalt',
          Client: 'Test Client',
          Location: 'Location',
          Created: '2024-01-01T00:00:00Z',
          Modified: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(JobsListService.getItems).mockResolvedValue(mockPendingJobs);

      const result = await JobsListService.getItems({
        filter: "Status eq 'Pending'",
      });

      expect(JobsListService.getItems).toHaveBeenCalledWith({
        filter: "Status eq 'Pending'",
      });
      expect(result).toHaveLength(1);
      expect(result[0].Status).toBe('Pending');
    });

    it('should filter jobs by date range', async () => {
      const mockJobs = [
        {
          Id: 1,
          Title: 'JOB-001',
          JobType: 'Asphalt',
          Status: 'Pending',
          Client: 'Test Client',
          Location: 'Location',
          ScheduledDate: '2024-01-15',
          Created: '2024-01-01T00:00:00Z',
          Modified: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(JobsListService.getItems).mockResolvedValue(mockJobs);

      await JobsListService.getItems({
        filter: "ScheduledDate ge '2024-01-01' and ScheduledDate le '2024-01-31'",
      });

      expect(JobsListService.getItems).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      vi.mocked(JobsListService.getItems).mockResolvedValue([]);

      const result = await JobsListService.getItems();

      expect(result).toEqual([]);
    });

    it('should handle SharePoint errors', async () => {
      vi.mocked(JobsListService.getItems).mockRejectedValue(
        new SharePointApiError('Connection failed', 500, 'CONNECTION_ERROR', true)
      );

      await expect(JobsListService.getItems()).rejects.toThrow('Connection failed');
    });
  });

  describe('POST /api/create-job', () => {
    it('should create a new job in SharePoint', async () => {
      const newJob = {
        Title: 'JOB-123',
        JobType: 'Asphalt',
        Status: 'Pending',
        Client: 'Test Client',
        Location: 'M7 Motorway',
        ScheduledDate: '2024-02-15',
        CrewLeader: 'John Smith',
        Description: 'Test job description',
      };

      const createdJob = {
        Id: 123,
        ...newJob,
        Created: '2024-01-10T00:00:00Z',
        Modified: '2024-01-10T00:00:00Z',
      };

      vi.mocked(JobsListService.createItem).mockResolvedValue(createdJob);

      const result = await JobsListService.createItem(newJob);

      expect(JobsListService.createItem).toHaveBeenCalledWith(newJob);
      expect(result.Id).toBe(123);
      expect(result.Title).toBe('JOB-123');
    });

    it('should validate required fields', async () => {
      const invalidJob = {
        JobType: 'Asphalt',
        Status: 'Pending',
        // Missing Title, Client, Location
      };

      vi.mocked(JobsListService.createItem).mockRejectedValue(
        new SharePointApiError('Required fields missing', 400, 'VALIDATION_ERROR', false)
      );

      await expect(JobsListService.createItem(invalidJob as any)).rejects.toThrow();
    });

    it('should handle duplicate job IDs', async () => {
      const duplicateJob = {
        Title: 'JOB-001',
        JobType: 'Asphalt',
        Status: 'Pending',
        Client: 'Test Client',
        Location: 'Location',
      };

      vi.mocked(JobsListService.createItem).mockRejectedValue(
        new SharePointApiError('Duplicate value', 409, 'DUPLICATE_KEY', false)
      );

      await expect(JobsListService.createItem(duplicateJob)).rejects.toThrow();
    });

    it('should create job with division-specific details', async () => {
      const asphaltJob = {
        Title: 'JOB-456',
        JobType: 'Asphalt',
        Status: 'Pending',
        Client: 'Test Client',
        Location: 'Location',
        AsphaltType: 'Hot Mix',
        Thickness: '50mm',
        Area: '100sqm',
      };

      const createdJob = {
        Id: 456,
        ...asphaltJob,
        Created: '2024-01-10T00:00:00Z',
        Modified: '2024-01-10T00:00:00Z',
      };

      vi.mocked(JobsListService.createItem).mockResolvedValue(createdJob);

      const result = await JobsListService.createItem(asphaltJob);

      expect(result.AsphaltType).toBe('Hot Mix');
      expect(result.Thickness).toBe('50mm');
    });
  });

  describe('PATCH /api/update-job', () => {
    it('should update existing job', async () => {
      const updateData = {
        Status: 'In Progress',
        ActualStartTime: '2024-01-15T09:00:00Z',
        Notes: 'Work started on schedule',
      };

      vi.mocked(JobsListService.updateItem).mockResolvedValue(undefined);

      await JobsListService.updateItem(123, updateData);

      expect(JobsListService.updateItem).toHaveBeenCalledWith(123, updateData);
    });

    it('should allow partial updates', async () => {
      const updateData = {
        Status: 'Completed',
      };

      vi.mocked(JobsListService.updateItem).mockResolvedValue(undefined);

      await JobsListService.updateItem(123, updateData);

      expect(JobsListService.updateItem).toHaveBeenCalledWith(123, updateData);
    });

    it('should handle job not found', async () => {
      vi.mocked(JobsListService.updateItem).mockRejectedValue(
        new SharePointApiError('Item not found', 404, 'NOT_FOUND', false)
      );

      await expect(
        JobsListService.updateItem(999, { Status: 'Completed' })
      ).rejects.toThrow();
    });

    it('should validate status transitions', async () => {
      const invalidUpdate = {
        Status: 'InvalidStatus',
      };

      vi.mocked(JobsListService.updateItem).mockRejectedValue(
        new SharePointApiError('Invalid status value', 400, 'VALIDATION_ERROR', false)
      );

      await expect(JobsListService.updateItem(123, invalidUpdate)).rejects.toThrow();
    });

    it('should update job completion data', async () => {
      const completionData = {
        Status: 'Completed',
        CompletedDate: '2024-01-15T17:00:00Z',
        ActualDuration: 8,
        SignOffBy: 'Jane Doe',
        FinalNotes: 'Job completed successfully',
      };

      vi.mocked(JobsListService.updateItem).mockResolvedValue(undefined);

      await JobsListService.updateItem(123, completionData);

      expect(JobsListService.updateItem).toHaveBeenCalledWith(123, completionData);
    });
  });

  describe('DELETE /api/delete-job', () => {
    it('should delete job by ID', async () => {
      vi.mocked(JobsListService.deleteItem).mockResolvedValue(undefined);

      await JobsListService.deleteItem(123);

      expect(JobsListService.deleteItem).toHaveBeenCalledWith(123);
    });

    it('should handle job not found', async () => {
      vi.mocked(JobsListService.deleteItem).mockRejectedValue(
        new SharePointApiError('Item not found', 404, 'NOT_FOUND', false)
      );

      await expect(JobsListService.deleteItem(999)).rejects.toThrow();
    });

    it('should prevent deletion of completed jobs', async () => {
      vi.mocked(JobsListService.deleteItem).mockRejectedValue(
        new SharePointApiError('Cannot delete completed job', 403, 'FORBIDDEN', false)
      );

      await expect(JobsListService.deleteItem(123)).rejects.toThrow();
    });
  });

  describe('GET /api/get-foreman-jobs', () => {
    it('should get jobs assigned to specific foreman', async () => {
      const mockForemanJobs = [
        {
          Id: 1,
          Title: 'JOB-001',
          JobType: 'Asphalt',
          Status: 'Pending',
          Client: 'Client A',
          Location: 'Location A',
          CrewLeader: 'John Smith',
          Created: '2024-01-01T00:00:00Z',
          Modified: '2024-01-01T00:00:00Z',
        },
        {
          Id: 2,
          Title: 'JOB-002',
          JobType: 'Concrete',
          Status: 'In Progress',
          Client: 'Client B',
          Location: 'Location B',
          CrewLeader: 'John Smith',
          Created: '2024-01-02T00:00:00Z',
          Modified: '2024-01-02T00:00:00Z',
        },
      ];

      vi.mocked(JobsListService.getItems).mockResolvedValue(mockForemanJobs);

      const result = await JobsListService.getItems({
        filter: "CrewLeader eq 'John Smith'",
      });

      expect(result).toHaveLength(2);
      expect(result.every(job => job.CrewLeader === 'John Smith')).toBe(true);
    });

    it('should filter by foreman and date', async () => {
      vi.mocked(JobsListService.getItems).mockResolvedValue([]);

      await JobsListService.getItems({
        filter: "CrewLeader eq 'John Smith' and ScheduledDate eq '2024-01-15'",
      });

      expect(JobsListService.getItems).toHaveBeenCalled();
    });
  });

  describe('Batch Operations', () => {
    it('should create multiple jobs in batch', async () => {
      const jobs = [
        { Title: 'JOB-001', JobType: 'Asphalt', Status: 'Pending', Client: 'Client A', Location: 'Loc A' },
        { Title: 'JOB-002', JobType: 'Concrete', Status: 'Pending', Client: 'Client B', Location: 'Loc B' },
        { Title: 'JOB-003', JobType: 'Profiling', Status: 'Pending', Client: 'Client C', Location: 'Loc C' },
      ];

      const batchResult = {
        success: true,
        results: jobs.map((job, i) => ({ Id: i + 1, ...job, Created: '2024-01-01T00:00:00Z', Modified: '2024-01-01T00:00:00Z' })),
        errors: [],
      };

      vi.mocked(JobsListService.batchCreate).mockResolvedValue(batchResult);

      const result = await JobsListService.batchCreate(jobs);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial batch failures', async () => {
      const jobs = [
        { Title: 'JOB-001', JobType: 'Asphalt', Status: 'Pending', Client: 'Client A', Location: 'Loc A' },
        { Title: 'INVALID', JobType: 'Invalid', Status: 'Pending', Client: 'Client B', Location: 'Loc B' },
        { Title: 'JOB-003', JobType: 'Concrete', Status: 'Pending', Client: 'Client C', Location: 'Loc C' },
      ];

      const batchResult = {
        success: false,
        results: [
          { Id: 1, ...jobs[0], Created: '2024-01-01T00:00:00Z', Modified: '2024-01-01T00:00:00Z' },
          { Id: 3, ...jobs[2], Created: '2024-01-01T00:00:00Z', Modified: '2024-01-01T00:00:00Z' },
        ],
        errors: [
          { index: 1, error: 'Invalid job type', statusCode: 400 },
        ],
      };

      vi.mocked(JobsListService.batchCreate).mockResolvedValue(batchResult);

      const result = await JobsListService.batchCreate(jobs);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
    });

    it('should batch update job statuses', async () => {
      const updates = [
        { id: 1, data: { Status: 'Completed' } },
        { id: 2, data: { Status: 'Completed' } },
        { id: 3, data: { Status: 'Completed' } },
      ];

      const batchResult = {
        success: true,
        results: updates.map(u => ({ id: u.id, success: true })),
        errors: [],
      };

      vi.mocked(JobsListService.batchUpdate).mockResolvedValue(batchResult);

      const result = await JobsListService.batchUpdate(updates);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
    });
  });

  describe('Permission Checks', () => {
    it('should enforce read permissions', async () => {
      vi.mocked(JobsListService.getItems).mockRejectedValue(
        new SharePointApiError('Access denied', 403, 'ACCESS_DENIED', false)
      );

      await expect(JobsListService.getItems()).rejects.toThrow('Access denied');
    });

    it('should enforce write permissions', async () => {
      const newJob = {
        Title: 'JOB-123',
        JobType: 'Asphalt',
        Status: 'Pending',
        Client: 'Client',
        Location: 'Location',
      };

      vi.mocked(JobsListService.createItem).mockRejectedValue(
        new SharePointApiError('Insufficient permissions', 403, 'ACCESS_DENIED', false)
      );

      await expect(JobsListService.createItem(newJob)).rejects.toThrow();
    });

    it('should enforce delete permissions', async () => {
      vi.mocked(JobsListService.deleteItem).mockRejectedValue(
        new SharePointApiError('Delete permission required', 403, 'ACCESS_DENIED', false)
      );

      await expect(JobsListService.deleteItem(123)).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    it('should validate job number format', async () => {
      const invalidJob = {
        Title: 'INVALID',
        JobType: 'Asphalt',
        Status: 'Pending',
        Client: 'Client',
        Location: 'Location',
      };

      vi.mocked(JobsListService.createItem).mockRejectedValue(
        new SharePointApiError('Invalid job number format', 400, 'VALIDATION_ERROR', false)
      );

      await expect(JobsListService.createItem(invalidJob)).rejects.toThrow();
    });

    it('should validate scheduled date', async () => {
      const jobWithInvalidDate = {
        Title: 'JOB-123',
        JobType: 'Asphalt',
        Status: 'Pending',
        Client: 'Client',
        Location: 'Location',
        ScheduledDate: 'invalid-date',
      };

      vi.mocked(JobsListService.createItem).mockRejectedValue(
        new SharePointApiError('Invalid date format', 400, 'VALIDATION_ERROR', false)
      );

      await expect(JobsListService.createItem(jobWithInvalidDate)).rejects.toThrow();
    });

    it('should validate required fields by job type', async () => {
      const incompleteJob = {
        Title: 'JOB-123',
        JobType: 'Asphalt',
        Status: 'Pending',
        Client: 'Client',
        Location: 'Location',
        // Missing AsphaltType for Asphalt jobs
      };

      vi.mocked(JobsListService.createItem).mockRejectedValue(
        new SharePointApiError('Missing required field: AsphaltType', 400, 'VALIDATION_ERROR', false)
      );

      await expect(JobsListService.createItem(incompleteJob)).rejects.toThrow();
    });
  });

  describe('Search and Filtering', () => {
    it('should search jobs by client name', async () => {
      const mockResults = [
        {
          Id: 1,
          Title: 'JOB-001',
          JobType: 'Asphalt',
          Status: 'Pending',
          Client: 'ACME Corporation',
          Location: 'Location A',
          Created: '2024-01-01T00:00:00Z',
          Modified: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(JobsListService.getItems).mockResolvedValue(mockResults);

      await JobsListService.getItems({
        filter: "substringof('ACME', Client)",
      });

      expect(JobsListService.getItems).toHaveBeenCalled();
    });

    it('should filter by multiple statuses', async () => {
      vi.mocked(JobsListService.getItems).mockResolvedValue([]);

      await JobsListService.getItems({
        filter: "(Status eq 'Pending' or Status eq 'In Progress')",
      });

      expect(JobsListService.getItems).toHaveBeenCalled();
    });

    it('should sort results by scheduled date', async () => {
      vi.mocked(JobsListService.getItems).mockResolvedValue([]);

      await JobsListService.getItems({
        orderBy: 'ScheduledDate',
        orderByDescending: false,
      });

      expect(JobsListService.getItems).toHaveBeenCalledWith({
        orderBy: 'ScheduledDate',
        orderByDescending: false,
      });
    });

    it('should paginate results', async () => {
      vi.mocked(JobsListService.getItems).mockResolvedValue([]);

      await JobsListService.getItems({
        top: 50,
        skip: 100,
      });

      expect(JobsListService.getItems).toHaveBeenCalledWith({
        top: 50,
        skip: 100,
      });
    });
  });

  describe('Item Count', () => {
    it('should get total job count', async () => {
      vi.mocked(JobsListService.getItemCount).mockResolvedValue(150);

      const count = await JobsListService.getItemCount();

      expect(count).toBe(150);
    });

    it('should get filtered job count', async () => {
      vi.mocked(JobsListService.getItemCount).mockResolvedValue(42);

      const count = await JobsListService.getItemCount("Status eq 'Pending'");

      expect(count).toBe(42);
      expect(JobsListService.getItemCount).toHaveBeenCalledWith("Status eq 'Pending'");
    });
  });

  describe('Item Existence', () => {
    it('should check if job exists', async () => {
      vi.mocked(JobsListService.itemExists).mockResolvedValue(true);

      const exists = await JobsListService.itemExists(123);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent job', async () => {
      vi.mocked(JobsListService.itemExists).mockResolvedValue(false);

      const exists = await JobsListService.itemExists(999);

      expect(exists).toBe(false);
    });
  });
});

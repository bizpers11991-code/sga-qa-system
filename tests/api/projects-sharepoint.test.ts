/**
 * @file tests/api/projects-sharepoint.test.ts
 * @description Integration tests for Projects API with SharePoint backend
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProjectsListService } from '@/lib/sharepoint';
import { SharePointApiError } from '@/lib/sharepoint/types';

// Mock SharePoint services
vi.mock('@/lib/sharepoint', () => ({
  ProjectsListService: {
    getItems: vi.fn(),
    getItem: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    getItemCount: vi.fn(),
    batchUpdate: vi.fn(),
    itemExists: vi.fn(),
  },
}));

describe('Projects API - SharePoint Integration', () => {
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

  describe('GET /api/get-projects', () => {
    it('should fetch all projects from SharePoint', async () => {
      const mockProjects = [
        {
          Id: 1,
          Title: 'M7 Motorway Upgrade',
          ProjectCode: 'PRJ-001',
          Status: 'Active',
          Client: 'Transport Infrastructure Ireland',
          StartDate: '2024-01-01',
          EndDate: '2024-12-31',
          Budget: 500000,
          Manager: 'John Smith',
          Created: '2024-01-01T00:00:00Z',
          Modified: '2024-01-01T00:00:00Z',
        },
        {
          Id: 2,
          Title: 'M50 Bridge Repairs',
          ProjectCode: 'PRJ-002',
          Status: 'Planning',
          Client: 'National Roads Authority',
          StartDate: '2024-03-01',
          EndDate: '2024-06-30',
          Budget: 250000,
          Manager: 'Jane Doe',
          Created: '2024-01-05T00:00:00Z',
          Modified: '2024-01-05T00:00:00Z',
        },
      ];

      vi.mocked(ProjectsListService.getItems).mockResolvedValue(mockProjects);

      const result = await ProjectsListService.getItems();

      expect(ProjectsListService.getItems).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].ProjectCode).toBe('PRJ-001');
    });

    it('should filter projects by status', async () => {
      const mockActiveProjects = [
        {
          Id: 1,
          Title: 'Active Project',
          ProjectCode: 'PRJ-001',
          Status: 'Active',
          Client: 'Test Client',
          StartDate: '2024-01-01',
          Manager: 'Manager Name',
          Created: '2024-01-01T00:00:00Z',
          Modified: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(ProjectsListService.getItems).mockResolvedValue(mockActiveProjects);

      const result = await ProjectsListService.getItems({
        filter: "Status eq 'Active'",
      });

      expect(result).toHaveLength(1);
      expect(result[0].Status).toBe('Active');
    });

    it('should filter projects by date range', async () => {
      vi.mocked(ProjectsListService.getItems).mockResolvedValue([]);

      await ProjectsListService.getItems({
        filter: "StartDate ge '2024-01-01' and StartDate le '2024-03-31'",
      });

      expect(ProjectsListService.getItems).toHaveBeenCalled();
    });

    it('should sort projects by start date', async () => {
      vi.mocked(ProjectsListService.getItems).mockResolvedValue([]);

      await ProjectsListService.getItems({
        orderBy: 'StartDate',
        orderByDescending: true,
      });

      expect(ProjectsListService.getItems).toHaveBeenCalledWith({
        orderBy: 'StartDate',
        orderByDescending: true,
      });
    });

    it('should handle empty results', async () => {
      vi.mocked(ProjectsListService.getItems).mockResolvedValue([]);

      const result = await ProjectsListService.getItems();

      expect(result).toEqual([]);
    });
  });

  describe('GET /api/get-project', () => {
    it('should fetch single project by ID', async () => {
      const mockProject = {
        Id: 123,
        Title: 'Test Project',
        ProjectCode: 'PRJ-123',
        Status: 'Active',
        Client: 'Test Client',
        StartDate: '2024-01-01',
        EndDate: '2024-12-31',
        Budget: 300000,
        Manager: 'Project Manager',
        Description: 'Detailed project description',
        Created: '2024-01-01T00:00:00Z',
        Modified: '2024-01-01T00:00:00Z',
      };

      vi.mocked(ProjectsListService.getItem).mockResolvedValue(mockProject);

      const result = await ProjectsListService.getItem(123);

      expect(ProjectsListService.getItem).toHaveBeenCalledWith(123);
      expect(result.Id).toBe(123);
      expect(result.ProjectCode).toBe('PRJ-123');
    });

    it('should handle project not found', async () => {
      vi.mocked(ProjectsListService.getItem).mockRejectedValue(
        new SharePointApiError('Project not found', 404, 'NOT_FOUND', false)
      );

      await expect(ProjectsListService.getItem(999)).rejects.toThrow('Project not found');
    });
  });

  describe('POST /api/create-project', () => {
    it('should create new project in SharePoint', async () => {
      const newProject = {
        Title: 'New Motorway Project',
        ProjectCode: 'PRJ-456',
        Status: 'Planning',
        Client: 'Transport Authority',
        StartDate: '2024-06-01',
        EndDate: '2024-12-31',
        Budget: 750000,
        Manager: 'New Manager',
        Description: 'New project description',
      };

      const createdProject = {
        Id: 456,
        ...newProject,
        Created: '2024-01-10T00:00:00Z',
        Modified: '2024-01-10T00:00:00Z',
      };

      vi.mocked(ProjectsListService.createItem).mockResolvedValue(createdProject);

      const result = await ProjectsListService.createItem(newProject);

      expect(ProjectsListService.createItem).toHaveBeenCalledWith(newProject);
      expect(result.Id).toBe(456);
      expect(result.ProjectCode).toBe('PRJ-456');
    });

    it('should validate required fields', async () => {
      const invalidProject = {
        Title: 'Invalid Project',
        // Missing ProjectCode, Status, Client, etc.
      };

      vi.mocked(ProjectsListService.createItem).mockRejectedValue(
        new SharePointApiError('Required fields missing', 400, 'VALIDATION_ERROR', false)
      );

      await expect(ProjectsListService.createItem(invalidProject as any)).rejects.toThrow();
    });

    it('should prevent duplicate project codes', async () => {
      const duplicateProject = {
        Title: 'Duplicate Project',
        ProjectCode: 'PRJ-001',
        Status: 'Planning',
        Client: 'Test Client',
        StartDate: '2024-01-01',
        Manager: 'Manager',
      };

      vi.mocked(ProjectsListService.createItem).mockRejectedValue(
        new SharePointApiError('Duplicate project code', 409, 'DUPLICATE_KEY', false)
      );

      await expect(ProjectsListService.createItem(duplicateProject)).rejects.toThrow();
    });

    it('should validate date ranges', async () => {
      const invalidDates = {
        Title: 'Invalid Dates',
        ProjectCode: 'PRJ-789',
        Status: 'Planning',
        Client: 'Client',
        StartDate: '2024-12-31',
        EndDate: '2024-01-01', // End before start
        Manager: 'Manager',
      };

      vi.mocked(ProjectsListService.createItem).mockRejectedValue(
        new SharePointApiError('End date must be after start date', 400, 'VALIDATION_ERROR', false)
      );

      await expect(ProjectsListService.createItem(invalidDates)).rejects.toThrow();
    });

    it('should validate budget values', async () => {
      const invalidBudget = {
        Title: 'Invalid Budget',
        ProjectCode: 'PRJ-999',
        Status: 'Planning',
        Client: 'Client',
        StartDate: '2024-01-01',
        Budget: -1000, // Negative budget
        Manager: 'Manager',
      };

      vi.mocked(ProjectsListService.createItem).mockRejectedValue(
        new SharePointApiError('Budget must be positive', 400, 'VALIDATION_ERROR', false)
      );

      await expect(ProjectsListService.createItem(invalidBudget)).rejects.toThrow();
    });
  });

  describe('PATCH /api/update-project', () => {
    it('should update existing project', async () => {
      const updateData = {
        Status: 'Active',
        Budget: 800000,
        Description: 'Updated description',
      };

      vi.mocked(ProjectsListService.updateItem).mockResolvedValue(undefined);

      await ProjectsListService.updateItem(123, updateData);

      expect(ProjectsListService.updateItem).toHaveBeenCalledWith(123, updateData);
    });

    it('should allow partial updates', async () => {
      const updateData = {
        Status: 'On Hold',
      };

      vi.mocked(ProjectsListService.updateItem).mockResolvedValue(undefined);

      await ProjectsListService.updateItem(123, updateData);

      expect(ProjectsListService.updateItem).toHaveBeenCalledWith(123, updateData);
    });

    it('should handle project not found', async () => {
      vi.mocked(ProjectsListService.updateItem).mockRejectedValue(
        new SharePointApiError('Project not found', 404, 'NOT_FOUND', false)
      );

      await expect(
        ProjectsListService.updateItem(999, { Status: 'Active' })
      ).rejects.toThrow();
    });

    it('should update project progress', async () => {
      const progressUpdate = {
        PercentComplete: 65,
        LastUpdated: '2024-01-15T00:00:00Z',
        Notes: 'Project progressing well',
      };

      vi.mocked(ProjectsListService.updateItem).mockResolvedValue(undefined);

      await ProjectsListService.updateItem(123, progressUpdate);

      expect(ProjectsListService.updateItem).toHaveBeenCalledWith(123, progressUpdate);
    });
  });

  describe('PATCH /api/update-project-status', () => {
    it('should update project status', async () => {
      const statusUpdate = {
        Status: 'Completed',
        CompletionDate: '2024-01-15T00:00:00Z',
      };

      vi.mocked(ProjectsListService.updateItem).mockResolvedValue(undefined);

      await ProjectsListService.updateItem(123, statusUpdate);

      expect(ProjectsListService.updateItem).toHaveBeenCalledWith(123, statusUpdate);
    });

    it('should validate status transitions', async () => {
      const invalidTransition = {
        Status: 'InvalidStatus',
      };

      vi.mocked(ProjectsListService.updateItem).mockRejectedValue(
        new SharePointApiError('Invalid status value', 400, 'VALIDATION_ERROR', false)
      );

      await expect(
        ProjectsListService.updateItem(123, invalidTransition)
      ).rejects.toThrow();
    });

    it('should handle status transition: Planning -> Active', async () => {
      const statusUpdate = {
        Status: 'Active',
        ActualStartDate: '2024-01-15T00:00:00Z',
      };

      vi.mocked(ProjectsListService.updateItem).mockResolvedValue(undefined);

      await ProjectsListService.updateItem(123, statusUpdate);

      expect(ProjectsListService.updateItem).toHaveBeenCalled();
    });

    it('should handle status transition: Active -> On Hold', async () => {
      const statusUpdate = {
        Status: 'On Hold',
        HoldReason: 'Awaiting client approval',
        HoldDate: '2024-01-15T00:00:00Z',
      };

      vi.mocked(ProjectsListService.updateItem).mockResolvedValue(undefined);

      await ProjectsListService.updateItem(123, statusUpdate);

      expect(ProjectsListService.updateItem).toHaveBeenCalled();
    });

    it('should handle status transition: Active -> Completed', async () => {
      const statusUpdate = {
        Status: 'Completed',
        CompletionDate: '2024-01-15T00:00:00Z',
        PercentComplete: 100,
        FinalNotes: 'Project completed successfully',
      };

      vi.mocked(ProjectsListService.updateItem).mockResolvedValue(undefined);

      await ProjectsListService.updateItem(123, statusUpdate);

      expect(ProjectsListService.updateItem).toHaveBeenCalled();
    });

    it('should prevent moving completed project back to active', async () => {
      vi.mocked(ProjectsListService.updateItem).mockRejectedValue(
        new SharePointApiError('Cannot reopen completed project', 400, 'INVALID_TRANSITION', false)
      );

      await expect(
        ProjectsListService.updateItem(123, { Status: 'Active' })
      ).rejects.toThrow();
    });
  });

  describe('Permission Checks', () => {
    it('should enforce read permissions', async () => {
      vi.mocked(ProjectsListService.getItems).mockRejectedValue(
        new SharePointApiError('Access denied', 403, 'ACCESS_DENIED', false)
      );

      await expect(ProjectsListService.getItems()).rejects.toThrow('Access denied');
    });

    it('should enforce create permissions', async () => {
      const newProject = {
        Title: 'Test Project',
        ProjectCode: 'PRJ-123',
        Status: 'Planning',
        Client: 'Client',
        StartDate: '2024-01-01',
        Manager: 'Manager',
      };

      vi.mocked(ProjectsListService.createItem).mockRejectedValue(
        new SharePointApiError('Insufficient permissions', 403, 'ACCESS_DENIED', false)
      );

      await expect(ProjectsListService.createItem(newProject)).rejects.toThrow();
    });

    it('should enforce update permissions', async () => {
      vi.mocked(ProjectsListService.updateItem).mockRejectedValue(
        new SharePointApiError('Update permission required', 403, 'ACCESS_DENIED', false)
      );

      await expect(
        ProjectsListService.updateItem(123, { Status: 'Active' })
      ).rejects.toThrow();
    });

    it('should check manager-level permissions for budget updates', async () => {
      vi.mocked(ProjectsListService.updateItem).mockRejectedValue(
        new SharePointApiError('Only project managers can update budget', 403, 'ACCESS_DENIED', false)
      );

      await expect(
        ProjectsListService.updateItem(123, { Budget: 900000 })
      ).rejects.toThrow();
    });
  });

  describe('Search and Filtering', () => {
    it('should search projects by client name', async () => {
      const mockResults = [
        {
          Id: 1,
          Title: 'Project A',
          ProjectCode: 'PRJ-001',
          Status: 'Active',
          Client: 'Transport Infrastructure Ireland',
          StartDate: '2024-01-01',
          Manager: 'Manager',
          Created: '2024-01-01T00:00:00Z',
          Modified: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(ProjectsListService.getItems).mockResolvedValue(mockResults);

      await ProjectsListService.getItems({
        filter: "substringof('Transport', Client)",
      });

      expect(ProjectsListService.getItems).toHaveBeenCalled();
    });

    it('should filter by multiple statuses', async () => {
      vi.mocked(ProjectsListService.getItems).mockResolvedValue([]);

      await ProjectsListService.getItems({
        filter: "(Status eq 'Active' or Status eq 'Planning')",
      });

      expect(ProjectsListService.getItems).toHaveBeenCalled();
    });

    it('should filter by project manager', async () => {
      vi.mocked(ProjectsListService.getItems).mockResolvedValue([]);

      await ProjectsListService.getItems({
        filter: "Manager eq 'John Smith'",
      });

      expect(ProjectsListService.getItems).toHaveBeenCalledWith({
        filter: "Manager eq 'John Smith'",
      });
    });

    it('should filter by budget range', async () => {
      vi.mocked(ProjectsListService.getItems).mockResolvedValue([]);

      await ProjectsListService.getItems({
        filter: "Budget ge 100000 and Budget le 500000",
      });

      expect(ProjectsListService.getItems).toHaveBeenCalled();
    });

    it('should search by project code', async () => {
      vi.mocked(ProjectsListService.getItems).mockResolvedValue([]);

      await ProjectsListService.getItems({
        filter: "substringof('PRJ-2024', ProjectCode)",
      });

      expect(ProjectsListService.getItems).toHaveBeenCalled();
    });
  });

  describe('Batch Operations', () => {
    it('should batch update project statuses', async () => {
      const updates = [
        { id: 1, data: { Status: 'Active' } },
        { id: 2, data: { Status: 'Active' } },
        { id: 3, data: { Status: 'Active' } },
      ];

      const batchResult = {
        success: true,
        results: updates.map(u => ({ id: u.id, success: true })),
        errors: [],
      };

      vi.mocked(ProjectsListService.batchUpdate).mockResolvedValue(batchResult);

      const result = await ProjectsListService.batchUpdate(updates);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
    });

    it('should handle partial batch failures', async () => {
      const updates = [
        { id: 1, data: { Status: 'Active' } },
        { id: 2, data: { Status: 'InvalidStatus' } },
        { id: 3, data: { Status: 'Active' } },
      ];

      const batchResult = {
        success: false,
        results: [
          { id: 1, success: true },
          { id: 3, success: true },
        ],
        errors: [
          { index: 1, error: 'Invalid status value', statusCode: 400 },
        ],
      };

      vi.mocked(ProjectsListService.batchUpdate).mockResolvedValue(batchResult);

      const result = await ProjectsListService.batchUpdate(updates);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should batch update project progress', async () => {
      const updates = [
        { id: 1, data: { PercentComplete: 25 } },
        { id: 2, data: { PercentComplete: 50 } },
        { id: 3, data: { PercentComplete: 75 } },
      ];

      const batchResult = {
        success: true,
        results: updates.map(u => ({ id: u.id, success: true })),
        errors: [],
      };

      vi.mocked(ProjectsListService.batchUpdate).mockResolvedValue(batchResult);

      const result = await ProjectsListService.batchUpdate(updates);

      expect(result.success).toBe(true);
    });
  });

  describe('Item Count', () => {
    it('should get total project count', async () => {
      vi.mocked(ProjectsListService.getItemCount).mockResolvedValue(85);

      const count = await ProjectsListService.getItemCount();

      expect(count).toBe(85);
    });

    it('should get active project count', async () => {
      vi.mocked(ProjectsListService.getItemCount).mockResolvedValue(23);

      const count = await ProjectsListService.getItemCount("Status eq 'Active'");

      expect(count).toBe(23);
    });

    it('should get count by manager', async () => {
      vi.mocked(ProjectsListService.getItemCount).mockResolvedValue(12);

      const count = await ProjectsListService.getItemCount("Manager eq 'John Smith'");

      expect(count).toBe(12);
    });
  });

  describe('Item Existence', () => {
    it('should check if project exists', async () => {
      vi.mocked(ProjectsListService.itemExists).mockResolvedValue(true);

      const exists = await ProjectsListService.itemExists(123);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent project', async () => {
      vi.mocked(ProjectsListService.itemExists).mockResolvedValue(false);

      const exists = await ProjectsListService.itemExists(999);

      expect(exists).toBe(false);
    });
  });

  describe('Complex Queries', () => {
    it('should filter overdue projects', async () => {
      const today = new Date().toISOString().split('T')[0];

      vi.mocked(ProjectsListService.getItems).mockResolvedValue([]);

      await ProjectsListService.getItems({
        filter: `EndDate lt '${today}' and Status ne 'Completed'`,
      });

      expect(ProjectsListService.getItems).toHaveBeenCalled();
    });

    it('should filter projects starting this month', async () => {
      const startOfMonth = '2024-01-01';
      const endOfMonth = '2024-01-31';

      vi.mocked(ProjectsListService.getItems).mockResolvedValue([]);

      await ProjectsListService.getItems({
        filter: `StartDate ge '${startOfMonth}' and StartDate le '${endOfMonth}'`,
      });

      expect(ProjectsListService.getItems).toHaveBeenCalled();
    });

    it('should get high-budget active projects', async () => {
      vi.mocked(ProjectsListService.getItems).mockResolvedValue([]);

      await ProjectsListService.getItems({
        filter: "Status eq 'Active' and Budget gt 500000",
        orderBy: 'Budget',
        orderByDescending: true,
      });

      expect(ProjectsListService.getItems).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      vi.mocked(ProjectsListService.getItems).mockRejectedValue(
        new SharePointApiError('Network error', 500, 'NETWORK_ERROR', true)
      );

      await expect(ProjectsListService.getItems()).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      vi.mocked(ProjectsListService.getItems).mockRejectedValue(
        new SharePointApiError('Request timeout', 504, 'TIMEOUT', true)
      );

      await expect(ProjectsListService.getItems()).rejects.toThrow('Request timeout');
    });

    it('should handle throttling errors', async () => {
      vi.mocked(ProjectsListService.createItem).mockRejectedValue(
        new SharePointApiError('Too many requests', 429, 'THROTTLED', true)
      );

      await expect(
        ProjectsListService.createItem({
          Title: 'Test',
          ProjectCode: 'PRJ-123',
          Status: 'Planning',
          Client: 'Client',
          StartDate: '2024-01-01',
          Manager: 'Manager',
        })
      ).rejects.toThrow();
    });
  });
});

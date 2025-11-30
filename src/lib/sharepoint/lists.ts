/**
 * @file src/lib/sharepoint/lists.ts
 * @description SharePoint list operations (CRUD)
 * Provides type-safe methods for creating, reading, updating, and deleting list items
 */

import { getSharePointClient } from './connection.js';
import {
  SharePointApiError,
  type SharePointListItem,
  type SharePointQueryOptions,
  type PaginationResult,
  type BatchResult,
  type BatchError,
  type CreateItemData,
  type UpdateItemData,
} from './types.js';

/**
 * Build OData query string from options
 */
function buildQueryString(options?: SharePointQueryOptions): string {
  if (!options) return '';

  const params: string[] = [];

  if (options.select) {
    params.push(`$select=${options.select.join(',')}`);
  }

  if (options.filter) {
    params.push(`$filter=${encodeURIComponent(options.filter)}`);
  }

  if (options.orderBy) {
    const direction = options.orderByDescending ? ' desc' : '';
    params.push(`$orderby=${options.orderBy}${direction}`);
  }

  if (options.top) {
    params.push(`$top=${options.top}`);
  }

  if (options.skip) {
    params.push(`$skip=${options.skip}`);
  }

  if (options.expand) {
    params.push(`$expand=${options.expand.join(',')}`);
  }

  return params.length > 0 ? `?${params.join('&')}` : '';
}

/**
 * SharePoint List Service
 * Provides CRUD operations for SharePoint lists
 */
export class SharePointListService {
  private client = getSharePointClient();
  private listName: string;

  constructor(listName: string) {
    this.listName = listName;
  }

  /**
   * Get base endpoint for this list
   */
  private getListEndpoint(): string {
    return `/_api/web/lists/getbytitle('${this.listName}')`;
  }

  /**
   * Get items endpoint
   */
  private getItemsEndpoint(): string {
    return `${this.getListEndpoint()}/items`;
  }

  /**
   * Get item endpoint by ID
   */
  private getItemEndpoint(itemId: number): string {
    return `${this.getListEndpoint()}/items(${itemId})`;
  }

  /**
   * Get all items from the list
   *
   * @param options - Query options (filter, select, orderBy, etc.)
   * @returns Promise<T[]> Array of list items
   *
   * @example
   * ```typescript
   * const jobsService = new SharePointListService('Jobs');
   * const jobs = await jobsService.getItems<Job>({
   *   filter: "Status eq 'Pending'",
   *   orderBy: 'ScheduledDate',
   *   top: 50
   * });
   * ```
   */
  async getItems<T extends SharePointListItem>(
    options?: SharePointQueryOptions
  ): Promise<T[]> {
    try {
      const endpoint = this.getItemsEndpoint() + buildQueryString(options);
      const response = await this.client.get<{ results: T[] }>(endpoint);
      return response.results || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get list items');
    }
  }

  /**
   * Get items with pagination support
   *
   * @param options - Query options with skip/top for pagination
   * @returns Promise<PaginationResult<T>> Paginated results
   *
   * @example
   * ```typescript
   * const result = await jobsService.getItemsPaginated<Job>({ top: 20, skip: 0 });
   * console.log(`Showing ${result.items.length} items, hasMore: ${result.hasMore}`);
   * ```
   */
  async getItemsPaginated<T extends SharePointListItem>(
    options?: SharePointQueryOptions
  ): Promise<PaginationResult<T>> {
    const top = options?.top || 50;
    const skip = options?.skip || 0;

    const items = await this.getItems<T>({
      ...options,
      top: top + 1, // Fetch one extra to determine if there are more
    });

    const hasMore = items.length > top;
    const resultItems = hasMore ? items.slice(0, top) : items;

    return {
      items: resultItems,
      hasMore,
      nextSkip: hasMore ? skip + top : undefined,
    };
  }

  /**
   * Get a single item by ID
   *
   * @param itemId - SharePoint item ID
   * @param select - Optional fields to select
   * @returns Promise<T> List item
   *
   * @example
   * ```typescript
   * const job = await jobsService.getItem<Job>(123, ['Title', 'JobType', 'Status']);
   * ```
   */
  async getItem<T extends SharePointListItem>(
    itemId: number,
    select?: string[]
  ): Promise<T> {
    try {
      const queryString = select ? `?$select=${select.join(',')}` : '';
      const endpoint = this.getItemEndpoint(itemId) + queryString;
      return await this.client.get<T>(endpoint);
    } catch (error) {
      throw this.handleError(error, `Failed to get item with ID ${itemId}`);
    }
  }

  /**
   * Create a new list item
   *
   * @param data - Item data (without Id, Created, Modified fields)
   * @returns Promise<T> Created item with ID and metadata
   *
   * @example
   * ```typescript
   * const newJob = await jobsService.createItem<Job>({
   *   Title: 'JOB-12345',
   *   JobType: 'Asphalt',
   *   Status: 'Pending',
   *   Location: 'M7 Motorway'
   * });
   * console.log('Created job with ID:', newJob.Id);
   * ```
   */
  async createItem<T extends SharePointListItem>(
    data: CreateItemData<T>
  ): Promise<T> {
    try {
      // Add required __metadata for SharePoint
      const itemData = {
        __metadata: { type: this.getListItemType() },
        ...data,
      };

      const endpoint = this.getItemsEndpoint();
      return await this.client.post<T>(endpoint, itemData);
    } catch (error) {
      throw this.handleError(error, 'Failed to create list item');
    }
  }

  /**
   * Update an existing list item
   *
   * @param itemId - SharePoint item ID
   * @param data - Partial item data to update
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await jobsService.updateItem(123, {
   *   Status: 'In Progress',
   *   AssignedCrew: 'Crew A'
   * });
   * ```
   */
  async updateItem<T extends SharePointListItem>(
    itemId: number,
    data: UpdateItemData<T>
  ): Promise<void> {
    try {
      const itemData = {
        __metadata: { type: this.getListItemType() },
        ...data,
      };

      const endpoint = this.getItemEndpoint(itemId);
      await this.client.patch(endpoint, itemData);
    } catch (error) {
      throw this.handleError(error, `Failed to update item with ID ${itemId}`);
    }
  }

  /**
   * Delete a list item
   *
   * @param itemId - SharePoint item ID
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await jobsService.deleteItem(123);
   * ```
   */
  async deleteItem(itemId: number): Promise<void> {
    try {
      const endpoint = this.getItemEndpoint(itemId);
      await this.client.delete(endpoint);
    } catch (error) {
      throw this.handleError(error, `Failed to delete item with ID ${itemId}`);
    }
  }

  /**
   * Get item count (total or filtered)
   *
   * @param filter - Optional OData filter
   * @returns Promise<number> Total count
   *
   * @example
   * ```typescript
   * const pendingCount = await jobsService.getItemCount("Status eq 'Pending'");
   * ```
   */
  async getItemCount(filter?: string): Promise<number> {
    try {
      const queryString = filter ? `?$filter=${encodeURIComponent(filter)}` : '';
      const endpoint = `${this.getItemsEndpoint()}/count${queryString}`;
      const response = await this.client.get<any>(endpoint);
      return typeof response === 'number' ? response : parseInt(response, 10);
    } catch (error) {
      throw this.handleError(error, 'Failed to get item count');
    }
  }

  /**
   * Batch create multiple items
   * More efficient than individual creates
   *
   * @param items - Array of items to create
   * @returns Promise<BatchResult<T>> Results with successes and errors
   *
   * @example
   * ```typescript
   * const result = await jobsService.batchCreate([
   *   { Title: 'JOB-001', Status: 'Pending' },
   *   { Title: 'JOB-002', Status: 'Pending' }
   * ]);
   * console.log(`Created ${result.results.length}, ${result.errors.length} errors`);
   * ```
   */
  async batchCreate<T extends SharePointListItem>(
    items: CreateItemData<T>[]
  ): Promise<BatchResult<T>> {
    const results: T[] = [];
    const errors: BatchError[] = [];

    // SharePoint REST API batch operations are complex, so we'll do sequential for now
    // In production, consider using Graph API batching for better performance
    for (let i = 0; i < items.length; i++) {
      try {
        const created = await this.createItem<T>(items[i]);
        results.push(created);
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          statusCode: error instanceof SharePointApiError ? error.statusCode : undefined,
        });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
    };
  }

  /**
   * Batch update multiple items
   *
   * @param updates - Array of { id, data } objects
   * @returns Promise<BatchResult> Results with successes and errors
   *
   * @example
   * ```typescript
   * await jobsService.batchUpdate([
   *   { id: 123, data: { Status: 'Completed' } },
   *   { id: 124, data: { Status: 'Completed' } }
   * ]);
   * ```
   */
  async batchUpdate<T extends SharePointListItem>(
    updates: Array<{ id: number; data: UpdateItemData<T> }>
  ): Promise<BatchResult> {
    const results: any[] = [];
    const errors: BatchError[] = [];

    for (let i = 0; i < updates.length; i++) {
      try {
        await this.updateItem(updates[i].id, updates[i].data);
        results.push({ id: updates[i].id, success: true });
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          statusCode: error instanceof SharePointApiError ? error.statusCode : undefined,
        });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
    };
  }

  /**
   * Check if item exists
   *
   * @param itemId - SharePoint item ID
   * @returns Promise<boolean> True if item exists
   *
   * @example
   * ```typescript
   * const exists = await jobsService.itemExists(123);
   * ```
   */
  async itemExists(itemId: number): Promise<boolean> {
    try {
      await this.getItem(itemId, ['Id']);
      return true;
    } catch (error) {
      if (error instanceof SharePointApiError && error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get list item type for metadata
   * SharePoint requires this for creates/updates
   */
  private getListItemType(): string {
    return `SP.Data.${this.listName}ListItem`;
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
 * Factory function to create a list service instance
 *
 * @param listName - SharePoint list name
 * @returns SharePointListService instance
 *
 * @example
 * ```typescript
 * const jobsService = createListService('Jobs');
 * const jobs = await jobsService.getItems<Job>();
 * ```
 */
export function createListService(listName: string): SharePointListService {
  return new SharePointListService(listName);
}

/**
 * Convenience services for common lists
 */
export const JobsListService = createListService('Jobs');
export const ProjectsListService = createListService('Projects');
export const TendersListService = createListService('Tenders');
export const ScopeReportsListService = createListService('ScopeReports');
export const DivisionRequestsListService = createListService('DivisionRequests');
export const QAPacksListService = createListService('QAPacks');
export const IncidentsListService = createListService('Incidents');

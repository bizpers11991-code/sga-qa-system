/**
 * @file src/lib/sharepoint/connection.ts
 * @description Microsoft Graph API client for SharePoint operations
 * Uses Graph API instead of SharePoint REST API for better Azure AD compatibility
 */

import { getAccessToken } from './auth.js';
import {
  SharePointApiError,
  type RetryConfig,
  isSharePointError,
} from './types.js';

/**
 * Microsoft Graph API base URL
 */
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Cache for site ID and list IDs to minimize API calls
 */
interface GraphCache {
  siteId: string | null;
  listIds: Map<string, string>;
  lastRefresh: number;
}

const cache: GraphCache = {
  siteId: null,
  listIds: new Map(),
  lastRefresh: 0,
};

// Cache TTL: 1 hour
const CACHE_TTL = 60 * 60 * 1000;

/**
 * SharePoint client using Microsoft Graph API
 */
export class SharePointClient {
  private siteUrl: string;
  private retryConfig: RetryConfig;

  constructor(siteUrl?: string, retryConfig?: Partial<RetryConfig>) {
    this.siteUrl = siteUrl || process.env.SHAREPOINT_SITE_URL || '';
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    if (!this.siteUrl) {
      throw new SharePointApiError(
        'SharePoint site URL not configured',
        500,
        'CONFIGURATION_ERROR',
        false
      );
    }
  }

  /**
   * Get site ID from SharePoint URL (cached)
   */
  private async getSiteId(): Promise<string> {
    // Return cached value if valid
    if (cache.siteId && Date.now() - cache.lastRefresh < CACHE_TTL) {
      return cache.siteId;
    }

    const token = await getAccessToken();
    const url = new URL(this.siteUrl);
    const graphUrl = `${GRAPH_API_BASE}/sites/${url.hostname}:${url.pathname}`;

    const response = await fetch(graphUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw await this.parseError(response);
    }

    const data = await response.json();
    cache.siteId = data.id;
    cache.lastRefresh = Date.now();
    return data.id;
  }

  /**
   * Get list ID by display name (cached)
   */
  private async getListId(listName: string): Promise<string> {
    // Return cached value if available
    const cachedId = cache.listIds.get(listName);
    if (cachedId && Date.now() - cache.lastRefresh < CACHE_TTL) {
      return cachedId;
    }

    const token = await getAccessToken();
    const siteId = await this.getSiteId();
    const graphUrl = `${GRAPH_API_BASE}/sites/${siteId}/lists?$filter=displayName eq '${listName}'`;

    const response = await fetch(graphUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw await this.parseError(response);
    }

    const data = await response.json();
    if (!data.value || data.value.length === 0) {
      throw new SharePointApiError(
        `List not found: ${listName}`,
        404,
        'LIST_NOT_FOUND',
        false
      );
    }

    const listId = data.value[0].id;
    cache.listIds.set(listName, listId);
    return listId;
  }

  /**
   * Transform OData query parameters from SharePoint REST format to Graph API format
   * Graph API requires 'fields/ColumnName' format for list item properties
   */
  private transformODataParams(queryString: string): string {
    if (!queryString) return queryString;

    // Known SharePoint system fields that exist on listItem directly (not in fields/)
    const systemFields = ['id', 'createdDateTime', 'lastModifiedDateTime', 'webUrl', 'createdBy', 'lastModifiedBy'];

    // Transform $orderby parameters
    queryString = queryString.replace(/\$orderby=([^&]+)/gi, (match, orderByValue) => {
      const parts = orderByValue.split(',').map((part: string) => {
        const trimmed = part.trim();
        const [fieldName, direction] = trimmed.split(/\s+/);

        // If it's a system field or already prefixed, leave it alone
        if (systemFields.includes(fieldName.toLowerCase()) || fieldName.startsWith('fields/')) {
          return trimmed;
        }

        // Prefix custom fields with 'fields/'
        return direction ? `fields/${fieldName} ${direction}` : `fields/${fieldName}`;
      });
      return `$orderby=${parts.join(',')}`;
    });

    // Transform $filter parameters
    queryString = queryString.replace(/\$filter=([^&]+)/gi, (match, filterValue) => {
      // Decode the filter first
      let decoded = decodeURIComponent(filterValue);

      // Find field references (word before 'eq', 'ne', 'gt', 'lt', 'ge', 'le', 'contains', etc.)
      // But skip fields that are already prefixed or are system fields
      decoded = decoded.replace(/\b([A-Za-z][A-Za-z0-9_]*)\s+(eq|ne|gt|lt|ge|le)\s+/gi, (m, field, op) => {
        if (systemFields.includes(field.toLowerCase()) || field.startsWith('fields/')) {
          return m;
        }
        return `fields/${field} ${op} `;
      });

      return `$filter=${encodeURIComponent(decoded)}`;
    });

    // Transform $select parameters
    queryString = queryString.replace(/\$select=([^&]+)/gi, (match, selectValue) => {
      const fields = selectValue.split(',').map((field: string) => {
        const trimmed = field.trim();
        if (systemFields.includes(trimmed.toLowerCase()) || trimmed.startsWith('fields/')) {
          return trimmed;
        }
        return `fields/${trimmed}`;
      });
      return `$select=${fields.join(',')}`;
    });

    return queryString;
  }

  /**
   * Parse endpoint from SharePoint REST API format to Graph API
   * Converts: /_api/web/lists/getbytitle('Jobs')/items
   * To: /sites/{siteId}/lists/{listId}/items
   */
  private async buildGraphUrl(endpoint: string): Promise<string> {
    const siteId = await this.getSiteId();

    // Parse SharePoint REST API endpoint format
    const listMatch = endpoint.match(/\/lists\/getbytitle\('([^']+)'\)(.*)/i);
    if (listMatch) {
      const listName = listMatch[1];
      let remainder = listMatch[2] || '';
      const listId = await this.getListId(listName);

      // Convert /items(123) to /items/123
      let graphRemainder = remainder.replace(/\/items\((\d+)\)/, '/items/$1');

      // Transform OData parameters for Graph API compatibility
      if (graphRemainder.includes('?')) {
        const [path, query] = graphRemainder.split('?');
        graphRemainder = path + '?' + this.transformODataParams(query);
      }

      // For item operations, we need to expand fields
      if (graphRemainder.includes('/items') && !graphRemainder.includes('$expand')) {
        const separator = graphRemainder.includes('?') ? '&' : '?';
        if (!graphRemainder.includes('/items/')) {
          // List items query - add $expand=fields
          graphRemainder += `${separator}$expand=fields`;
        }
      }

      return `${GRAPH_API_BASE}/sites/${siteId}/lists/${listId}${graphRemainder}`;
    }

    // Handle direct list access
    const directListMatch = endpoint.match(/\/lists\/([^/]+)(.*)/i);
    if (directListMatch) {
      const listName = directListMatch[1];
      const remainder = directListMatch[2] || '';
      const listId = await this.getListId(listName);
      return `${GRAPH_API_BASE}/sites/${siteId}/lists/${listId}${remainder}`;
    }

    // Default: just append to site endpoint
    return `${GRAPH_API_BASE}/sites/${siteId}${endpoint}`;
  }

  /**
   * Sleep for specified milliseconds
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, retryAfter?: number): number {
    if (retryAfter) {
      return Math.min(retryAfter * 1000, this.retryConfig.maxDelay);
    }

    const delay = this.retryConfig.initialDelay * Math.pow(
      this.retryConfig.backoffMultiplier,
      attempt
    );

    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Parse error response
   */
  private async parseError(response: Response): Promise<SharePointApiError> {
    let errorMessage = `Graph API error: ${response.status} ${response.statusText}`;
    let errorCode = `HTTP_${response.status}`;
    let retryAfter: number | undefined;

    try {
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        const errorData = await response.json();

        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
          errorCode = errorData.error.code || errorCode;
        }
      }
    } catch (e) {
      // If error parsing fails, use default message
    }

    const retryAfterHeader = response.headers.get('retry-after');
    if (retryAfterHeader) {
      retryAfter = parseInt(retryAfterHeader, 10);
    }

    const isRetryable = response.status === 429 ||
                        response.status === 503 ||
                        response.status === 504;

    return new SharePointApiError(
      errorMessage,
      response.status,
      errorCode,
      isRetryable,
      retryAfter
    );
  }

  /**
   * Convert Graph API response to SharePoint REST API format for compatibility
   */
  private convertResponse(data: any, isItemQuery: boolean = false): any {
    // Graph API returns items in 'value' array, SharePoint REST uses 'results'
    if (data.value && Array.isArray(data.value)) {
      if (isItemQuery) {
        // Convert items with fields to flat format
        return {
          results: data.value.map((item: any) => ({
            Id: parseInt(item.id, 10),
            ...item.fields,
            // Preserve metadata
            __metadata: { id: item.id, etag: item['@odata.etag'] },
          })),
        };
      }
      return { results: data.value };
    }

    // Single item with fields
    if (data.fields) {
      return {
        Id: parseInt(data.id, 10),
        ...data.fields,
        __metadata: { id: data.id, etag: data['@odata.etag'] },
      };
    }

    return data;
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 0
  ): Promise<T> {
    try {
      const token = await getAccessToken();
      const url = await this.buildGraphUrl(endpoint);
      const isItemQuery = endpoint.includes('/items');

      const headers = new Headers(options.headers);
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('Accept', 'application/json');

      if (options.method !== 'GET' && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');

        if (response.status === 204) {
          return {} as T;
        }

        if (contentType?.includes('application/json')) {
          const data = await response.json();
          return this.convertResponse(data, isItemQuery) as T;
        }

        return response as any;
      }

      const error = await this.parseError(response);

      if (error.isRetryable && attempt < this.retryConfig.maxRetries) {
        const delay = this.calculateRetryDelay(attempt, error.retryAfter);
        console.warn(
          `[Graph API] Request failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries}), ` +
          `retrying in ${delay}ms:`,
          error.message
        );
        await this.sleep(delay);
        return this.executeRequest<T>(endpoint, options, attempt + 1);
      }

      throw error;

    } catch (error) {
      if (isSharePointError(error)) {
        throw error;
      }

      throw new SharePointApiError(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'REQUEST_FAILED',
        false
      );
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, headers?: HeadersInit): Promise<T> {
    return this.executeRequest<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  /**
   * POST request (create item)
   */
  async post<T = any>(endpoint: string, data?: any, headers?: HeadersInit): Promise<T> {
    // Convert data format for Graph API
    let graphData = data;
    if (data && endpoint.includes('/items')) {
      // Remove __metadata if present (SharePoint REST format)
      const { __metadata, ...fields } = data;
      graphData = { fields };
    }

    return this.executeRequest<T>(endpoint, {
      method: 'POST',
      headers,
      body: graphData ? JSON.stringify(graphData) : undefined,
    });
  }

  /**
   * PATCH request (update item)
   */
  async patch<T = any>(endpoint: string, data: any, headers?: HeadersInit): Promise<T> {
    // Convert data format for Graph API
    const { __metadata, ...fields } = data;
    const graphData = { fields };

    return this.executeRequest<T>(endpoint, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(graphData),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint: string, headers?: HeadersInit): Promise<void> {
    await this.executeRequest(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  /**
   * Upload file to document library
   */
  async upload(endpoint: string, file: Buffer | Blob, fileName: string): Promise<any> {
    const token = await getAccessToken();
    const siteId = await this.getSiteId();

    // Extract library name from endpoint
    const libMatch = endpoint.match(/\/([^/]+)\/files\/add/i);
    const libraryName = libMatch ? libMatch[1] : 'Shared Documents';
    const listId = await this.getListId(libraryName);

    const url = `${GRAPH_API_BASE}/sites/${siteId}/lists/${listId}/drive/root:/${fileName}:/content`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: file as any,
    });

    if (!response.ok) {
      throw await this.parseError(response);
    }

    return response.json();
  }

  /**
   * Download file from document library
   */
  async download(endpoint: string): Promise<Response> {
    const token = await getAccessToken();
    const url = await this.buildGraphUrl(endpoint);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw await this.parseError(response);
    }

    return response;
  }

  /**
   * Get form digest value - Not needed for Graph API, returns empty string for compatibility
   */
  async getFormDigest(): Promise<string> {
    return '';
  }
}

/**
 * Singleton SharePoint client instance
 */
let sharedClient: SharePointClient | null = null;

/**
 * Get shared SharePoint client instance
 */
export function getSharePointClient(): SharePointClient {
  if (!sharedClient) {
    sharedClient = new SharePointClient();
  }
  return sharedClient;
}

/**
 * Create a new SharePoint client with custom configuration
 */
export function createSharePointClient(
  siteUrl?: string,
  retryConfig?: Partial<RetryConfig>
): SharePointClient {
  return new SharePointClient(siteUrl, retryConfig);
}

/**
 * Clear the cache (useful for testing)
 */
export function clearGraphCache(): void {
  cache.siteId = null;
  cache.listIds.clear();
  cache.lastRefresh = 0;
}

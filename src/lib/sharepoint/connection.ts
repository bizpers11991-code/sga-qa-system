/**
 * @file src/lib/sharepoint/connection.ts
 * @description SharePoint REST API client with retry logic and error handling
 * Provides low-level HTTP methods for SharePoint operations
 */

import { getAccessToken } from './auth.js';
import {
  SharePointApiError,
  type RetryConfig,
  isSharePointError,
} from './types.js';

/**
 * Default retry configuration
 * SharePoint has rate limits, so we use exponential backoff
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * SharePoint REST API client
 * Handles authentication, requests, retries, and error handling
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
   * Build full URL for SharePoint REST API endpoint
   */
  private buildUrl(endpoint: string): string {
    // Remove trailing slash from site URL
    const baseUrl = this.siteUrl.replace(/\/$/, '');
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${path}`;
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
      // Respect server's retry-after header
      return Math.min(retryAfter * 1000, this.retryConfig.maxDelay);
    }

    const delay = this.retryConfig.initialDelay * Math.pow(
      this.retryConfig.backoffMultiplier,
      attempt
    );

    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Parse SharePoint error response
   */
  private async parseError(response: Response): Promise<SharePointApiError> {
    let errorMessage = `SharePoint API error: ${response.status} ${response.statusText}`;
    let errorCode = `HTTP_${response.status}`;
    let retryAfter: number | undefined;

    try {
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        const errorData = await response.json();

        if (errorData.error) {
          errorMessage = errorData.error.message?.value || errorData.error.message || errorMessage;
          errorCode = errorData.error.code || errorCode;
        } else if (errorData['odata.error']) {
          errorMessage = errorData['odata.error'].message?.value || errorMessage;
          errorCode = errorData['odata.error'].code || errorCode;
        }
      }
    } catch (e) {
      // If error parsing fails, use default message
    }

    // Check for Retry-After header (throttling)
    const retryAfterHeader = response.headers.get('retry-after');
    if (retryAfterHeader) {
      retryAfter = parseInt(retryAfterHeader, 10);
    }

    // Determine if error is retryable
    const isRetryable = response.status === 429 || // Too Many Requests
                        response.status === 503 || // Service Unavailable
                        response.status === 504;   // Gateway Timeout

    return new SharePointApiError(
      errorMessage,
      response.status,
      errorCode,
      isRetryable,
      retryAfter
    );
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
      // Get access token
      const token = await getAccessToken();

      // Build request URL
      const url = this.buildUrl(endpoint);

      // Prepare headers
      const headers = new Headers(options.headers);
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('Accept', 'application/json;odata=verbose');

      if (options.method !== 'GET' && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json;odata=verbose');
      }

      // Make request
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle success
      if (response.ok) {
        const contentType = response.headers.get('content-type');

        // Return empty object for 204 No Content
        if (response.status === 204) {
          return {} as T;
        }

        // Parse JSON response
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          // SharePoint wraps responses in d property
          return data.d || data;
        }

        // Return raw response for non-JSON
        return response as any;
      }

      // Handle error
      const error = await this.parseError(response);

      // Retry if error is retryable and we haven't exceeded max retries
      if (error.isRetryable && attempt < this.retryConfig.maxRetries) {
        const delay = this.calculateRetryDelay(attempt, error.retryAfter);
        console.warn(
          `[SharePoint] Request failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries}), ` +
          `retrying in ${delay}ms:`,
          error.message
        );
        await this.sleep(delay);
        return this.executeRequest<T>(endpoint, options, attempt + 1);
      }

      throw error;

    } catch (error) {
      // If it's already a SharePointApiError, rethrow it
      if (isSharePointError(error)) {
        throw error;
      }

      // Wrap other errors
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
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, headers?: HeadersInit): Promise<T> {
    return this.executeRequest<T>(endpoint, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request (used for updates in SharePoint)
   */
  async patch<T = any>(endpoint: string, data: any, headers?: HeadersInit): Promise<T> {
    const mergeHeaders = new Headers(headers);
    mergeHeaders.set('IF-MATCH', '*'); // Update regardless of etag
    mergeHeaders.set('X-HTTP-Method', 'MERGE'); // SharePoint uses MERGE for updates

    return this.executeRequest<T>(endpoint, {
      method: 'POST', // SharePoint uses POST with X-HTTP-Method header
      headers: mergeHeaders,
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint: string, headers?: HeadersInit): Promise<void> {
    const deleteHeaders = new Headers(headers);
    deleteHeaders.set('IF-MATCH', '*');

    await this.executeRequest(endpoint, {
      method: 'DELETE',
      headers: deleteHeaders,
    });
  }

  /**
   * Upload file (multipart)
   */
  async upload(endpoint: string, file: Buffer | Blob, fileName: string): Promise<any> {
    const token = await getAccessToken();
    const url = this.buildUrl(endpoint);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json;odata=verbose',
      },
      body: file as any, // Browser Blob or Node Buffer
    });

    if (!response.ok) {
      throw await this.parseError(response);
    }

    const data = await response.json();
    return data.d || data;
  }

  /**
   * Download file
   */
  async download(endpoint: string): Promise<Response> {
    const token = await getAccessToken();
    const url = this.buildUrl(endpoint);

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
   * Get form digest value (required for POST/PATCH/DELETE operations in some scenarios)
   */
  async getFormDigest(): Promise<string> {
    const endpoint = '/_api/contextinfo';
    const result = await this.post<any>(endpoint);
    return result.GetContextWebInformation?.FormDigestValue || '';
  }
}

/**
 * Singleton SharePoint client instance
 */
let sharedClient: SharePointClient | null = null;

/**
 * Get shared SharePoint client instance
 * Reuses the same client across API calls for better performance
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

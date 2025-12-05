/**
 * @file tests/sharepoint/connection.test.ts
 * @description Unit tests for SharePoint connection, authentication, and retry logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SharePointClient, createSharePointClient, getSharePointClient } from '@/lib/sharepoint/connection';
import { getAccessToken, clearTokenCache } from '@/lib/sharepoint/auth';
import { SharePointApiError } from '@/lib/sharepoint/types';

// Mock the auth module
vi.mock('@/lib/sharepoint/auth', () => ({
  getAccessToken: vi.fn(),
  clearTokenCache: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SharePointClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTokenCache();

    // Set up environment variables
    process.env.SHAREPOINT_SITE_URL = 'https://test.sharepoint.com/sites/testsite';

    // Default mock token
    vi.mocked(getAccessToken).mockResolvedValue('mock-access-token');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with site URL from environment', () => {
      const client = new SharePointClient();
      expect(client).toBeDefined();
    });

    it('should initialize with custom site URL', () => {
      const customUrl = 'https://custom.sharepoint.com/sites/custom';
      const client = new SharePointClient(customUrl);
      expect(client).toBeDefined();
    });

    it('should throw error if site URL is not configured', () => {
      delete process.env.SHAREPOINT_SITE_URL;

      expect(() => new SharePointClient()).toThrow(SharePointApiError);
      expect(() => new SharePointClient()).toThrow('SharePoint site URL not configured');
    });

    it('should initialize with custom retry config', () => {
      const customRetryConfig = {
        maxRetries: 5,
        initialDelay: 2000,
      };

      const client = new SharePointClient(undefined, customRetryConfig);
      expect(client).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should acquire access token before making requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ d: { results: [] } }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient();
      await client.get('/_api/web/lists');

      expect(getAccessToken).toHaveBeenCalledTimes(1);
    });

    it('should include Bearer token in Authorization header', async () => {
      const mockToken = 'test-bearer-token';
      vi.mocked(getAccessToken).mockResolvedValue(mockToken);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ d: {} }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient();
      await client.get('/_api/web/lists');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Headers;
      expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ d: { results: [] } }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });
    });

    it('should make GET request', async () => {
      const client = new SharePointClient();
      const result = await client.get('/_api/web/lists');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.sharepoint.com/sites/testsite/_api/web/lists',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should make POST request', async () => {
      const client = new SharePointClient();
      const data = { Title: 'Test Item' };

      await client.post('/_api/web/lists', data);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      );
    });

    it('should make PATCH request with proper headers', async () => {
      const client = new SharePointClient();
      const data = { Title: 'Updated Item' };

      await client.patch('/_api/web/lists/items(1)', data);

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Headers;

      expect(headers.get('IF-MATCH')).toBe('*');
      expect(headers.get('X-HTTP-Method')).toBe('MERGE');
    });

    it('should make DELETE request with IF-MATCH header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
        headers: new Headers(),
      });

      const client = new SharePointClient();
      await client.delete('/_api/web/lists/items(1)');

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Headers;

      expect(headers.get('IF-MATCH')).toBe('*');
      expect(callArgs[1].method).toBe('DELETE');
    });

    it('should set proper Accept header for all requests', async () => {
      const client = new SharePointClient();
      await client.get('/_api/web/lists');

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Headers;

      expect(headers.get('Accept')).toBe('application/json;odata=verbose');
    });

    it('should set Content-Type header for POST requests', async () => {
      const client = new SharePointClient();
      await client.post('/_api/web/lists', { Title: 'Test' });

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Headers;

      expect(headers.get('Content-Type')).toBe('application/json;odata=verbose');
    });
  });

  describe('Response Handling', () => {
    it('should unwrap SharePoint response with d property', async () => {
      const mockData = { Id: 1, Title: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ d: mockData }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient();
      const result = await client.get('/_api/web/lists/items(1)');

      expect(result).toEqual(mockData);
    });

    it('should handle 204 No Content responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const client = new SharePointClient();
      const result = await client.delete('/_api/web/lists/items(1)');

      expect(result).toEqual({});
    });

    it('should handle responses without d wrapper', async () => {
      const mockData = { value: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient();
      const result = await client.get('/_api/web/lists');

      expect(result).toEqual(mockData);
    });
  });

  describe('Error Handling', () => {
    it('should throw SharePointApiError for HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: {
            code: 'NOT_FOUND',
            message: { value: 'Item not found' },
          },
        }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient();

      await expect(client.get('/_api/web/lists/items(999)')).rejects.toThrow(SharePointApiError);
    });

    it('should parse error message from odata.error format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          'odata.error': {
            code: 'INVALID_REQUEST',
            message: { value: 'Invalid field name' },
          },
        }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient();

      await expect(client.get('/_api/web/lists')).rejects.toThrow('Invalid field name');
    });

    it('should mark 429 errors as retryable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient();

      try {
        await client.get('/_api/web/lists');
      } catch (error) {
        expect(error).toBeInstanceOf(SharePointApiError);
        expect((error as SharePointApiError).isRetryable).toBe(true);
      }
    });

    it('should mark 503 errors as retryable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ error: { message: 'Service temporarily unavailable' } }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient();

      try {
        await client.get('/_api/web/lists');
      } catch (error) {
        expect(error).toBeInstanceOf(SharePointApiError);
        expect((error as SharePointApiError).isRetryable).toBe(true);
      }
    });

    it('should extract retry-after header from throttling errors', async () => {
      const headers = new Headers({
        'content-type': 'application/json',
        'retry-after': '5',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: { message: 'Throttled' } }),
        headers,
      });

      const client = new SharePointClient();

      try {
        await client.get('/_api/web/lists');
      } catch (error) {
        expect((error as SharePointApiError).retryAfter).toBe(5);
      }
    });
  });

  describe('Retry Logic', () => {
    it('should retry on 429 throttling errors', async () => {
      // First call fails with 429
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: { message: 'Throttled' } }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ d: { results: [] } }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient();
      const result = await client.get('/_api/web/lists');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it('should respect retry-after header', async () => {
      const headers = new Headers({
        'content-type': 'application/json',
        'retry-after': '1',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Throttled' } }),
        headers,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ d: {} }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient(undefined, { initialDelay: 100 });
      const startTime = Date.now();
      await client.get('/_api/web/lists');
      const elapsed = Date.now() - startTime;

      // Should wait at least the retry-after time (1 second = 1000ms)
      expect(elapsed).toBeGreaterThanOrEqual(900); // Allow some tolerance
    });

    it('should use exponential backoff for retries', async () => {
      // All calls fail with 503
      for (let i = 0; i < 4; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: async () => ({ error: { message: 'Service down' } }),
          headers: new Headers({ 'content-type': 'application/json' }),
        });
      }

      const client = new SharePointClient(undefined, {
        maxRetries: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
      });

      try {
        await client.get('/_api/web/lists');
      } catch (error) {
        // Should have tried initial + 3 retries
        expect(mockFetch).toHaveBeenCalledTimes(4);
      }
    });

    it('should not retry on non-retryable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: { message: 'Not found' } }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient();

      await expect(client.get('/_api/web/lists')).rejects.toThrow();

      // Should only try once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should respect maxRetries configuration', async () => {
      // Mock 5 failures
      for (let i = 0; i < 5; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: { message: 'Service down' } }),
          headers: new Headers({ 'content-type': 'application/json' }),
        });
      }

      const client = new SharePointClient(undefined, {
        maxRetries: 2,
        initialDelay: 10,
      });

      try {
        await client.get('/_api/web/lists');
      } catch (error) {
        // Should try initial + 2 retries = 3 total
        expect(mockFetch).toHaveBeenCalledTimes(3);
      }
    });

    it('should cap retry delay at maxDelay', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: { message: 'Service down' } }),
        headers: new Headers({
          'content-type': 'application/json',
          'retry-after': '999', // Very long retry-after
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ d: {} }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient(undefined, {
        maxDelay: 100, // Cap at 100ms
      });

      const startTime = Date.now();
      await client.get('/_api/web/lists');
      const elapsed = Date.now() - startTime;

      // Should be capped at maxDelay, not wait 999 seconds
      expect(elapsed).toBeLessThan(500);
    });
  });

  describe('URL Building', () => {
    it('should handle trailing slash in site URL', () => {
      process.env.SHAREPOINT_SITE_URL = 'https://test.sharepoint.com/sites/testsite/';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ d: {} }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient();
      client.get('/_api/web/lists');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.sharepoint.com/sites/testsite/_api/web/lists',
        expect.any(Object)
      );
    });

    it('should handle endpoints without leading slash', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ d: {} }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient();
      await client.get('_api/web/lists');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.sharepoint.com/sites/testsite/_api/web/lists',
        expect.any(Object)
      );
    });
  });

  describe('Factory Functions', () => {
    it('should create client with createSharePointClient', () => {
      const client = createSharePointClient();
      expect(client).toBeInstanceOf(SharePointClient);
    });

    it('should return singleton with getSharePointClient', () => {
      const client1 = getSharePointClient();
      const client2 = getSharePointClient();

      expect(client1).toBe(client2);
    });
  });

  describe('File Upload/Download', () => {
    it('should upload file with proper content', async () => {
      const mockFile = Buffer.from('test content');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ d: { Name: 'test.txt' } }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient();
      await client.upload('/_api/web/folders', mockFile, 'test.txt');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: mockFile,
        })
      );
    });

    it('should download file and return response', async () => {
      const mockResponse = new Response('file content', {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      });

      mockFetch.mockResolvedValueOnce(mockResponse);

      const client = new SharePointClient();
      const result = await client.download('/_api/web/files/test.pdf');

      expect(result).toBeInstanceOf(Response);
    });
  });

  describe('Form Digest', () => {
    it('should get form digest value', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          d: {
            GetContextWebInformation: {
              FormDigestValue: 'mock-digest-value',
            },
          },
        }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = new SharePointClient();
      const digest = await client.getFormDigest();

      expect(digest).toBe('mock-digest-value');
    });
  });
});

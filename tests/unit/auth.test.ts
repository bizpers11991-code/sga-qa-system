import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withAuth } from '../../api/_lib/auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SecureForeman } from '../../types';

// Mock Redis
vi.mock('../../api/_lib/redis', () => ({
  getRedisInstance: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

describe('Authentication Module', () => {
  let mockRequest: Partial<VercelRequest>;
  let mockResponse: Partial<VercelResponse>;
  let mockHandler: any;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      body: {},
    };

    const jsonFn = vi.fn();
    mockResponse = {
      status: vi.fn().mockReturnValue({ json: jsonFn }),
      json: jsonFn,
    };

    mockHandler = vi.fn();
    vi.clearAllMocks();
  });

  describe('withAuth middleware', () => {
    it('should reject requests without authorization header', async () => {
      const wrappedHandler = withAuth(mockHandler, ['asphalt_foreman']);

      await wrappedHandler(mockRequest as VercelRequest, mockResponse as VercelResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid authorization header format', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat token123' };
      const wrappedHandler = withAuth(mockHandler, ['asphalt_foreman']);

      await wrappedHandler(mockRequest as VercelRequest, mockResponse as VercelResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle missing AUTH0_DOMAIN environment variable', async () => {
      const originalDomain = process.env.AUTH0_DOMAIN;
      delete process.env.AUTH0_DOMAIN;

      mockRequest.headers = { authorization: 'Bearer valid-token' };
      const wrappedHandler = withAuth(mockHandler, ['asphalt_foreman']);

      await wrappedHandler(mockRequest as VercelRequest, mockResponse as VercelResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);

      process.env.AUTH0_DOMAIN = originalDomain;
    });

    it('should use cached user profile when available', async () => {
      const { getRedisInstance } = await import('../../api/_lib/redis');
      const mockRedis = getRedisInstance();

      const cachedUser: SecureForeman = {
        id: 'auth0|123',
        name: 'Test Foreman',
        username: 'test@example.com',
        role: 'asphalt_foreman',
      };

      (mockRedis.get as any).mockResolvedValueOnce(JSON.stringify(cachedUser));

      mockRequest.headers = { authorization: 'Bearer cached-token' };
      const wrappedHandler = withAuth(mockHandler, ['asphalt_foreman']);

      await wrappedHandler(mockRequest as VercelRequest, mockResponse as VercelResponse);

      expect(mockRedis.get).toHaveBeenCalledWith('user-profile:cached-token');
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should reject user with insufficient permissions from cache', async () => {
      const { getRedisInstance } = await import('../../api/_lib/redis');
      const mockRedis = getRedisInstance();

      const cachedUser: SecureForeman = {
        id: 'auth0|123',
        name: 'Test Foreman',
        username: 'test@example.com',
        role: 'asphalt_foreman',
      };

      (mockRedis.get as any).mockResolvedValueOnce(JSON.stringify(cachedUser));

      mockRequest.headers = { authorization: 'Bearer cached-token' };
      const wrappedHandler = withAuth(mockHandler, ['management_admin']);

      await wrappedHandler(mockRequest as VercelRequest, mockResponse as VercelResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should fetch from Auth0 when not in cache', async () => {
      const { getRedisInstance } = await import('../../api/_lib/redis');
      const mockRedis = getRedisInstance();

      (mockRedis.get as any).mockResolvedValueOnce(null);

      const mockUserProfile = {
        sub: 'auth0|456',
        name: 'New Foreman',
        email: 'new@example.com',
        'https://sga.com/roles': ['asphalt_foreman'],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserProfile,
      } as any);

      mockRequest.headers = { authorization: 'Bearer new-token' };
      const wrappedHandler = withAuth(mockHandler, ['asphalt_foreman']);

      await wrappedHandler(mockRequest as VercelRequest, mockResponse as VercelResponse);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.auth0.com/userinfo',
        expect.objectContaining({
          headers: { Authorization: 'Bearer new-token' },
        })
      );
      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should reject invalid access token from Auth0', async () => {
      const { getRedisInstance } = await import('../../api/_lib/redis');
      const mockRedis = getRedisInstance();

      (mockRedis.get as any).mockResolvedValueOnce(null);

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as any);

      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      const wrappedHandler = withAuth(mockHandler, ['asphalt_foreman']);

      await wrappedHandler(mockRequest as VercelRequest, mockResponse as VercelResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject user without valid role', async () => {
      const { getRedisInstance } = await import('../../api/_lib/redis');
      const mockRedis = getRedisInstance();

      (mockRedis.get as any).mockResolvedValueOnce(null);

      const mockUserProfile = {
        sub: 'auth0|789',
        name: 'No Role User',
        email: 'norole@example.com',
        'https://sga.com/roles': [], // Empty roles
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserProfile,
      } as any);

      mockRequest.headers = { authorization: 'Bearer norole-token' };
      const wrappedHandler = withAuth(mockHandler, ['asphalt_foreman']);

      await wrappedHandler(mockRequest as VercelRequest, mockResponse as VercelResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should allow user with matching role', async () => {
      const { getRedisInstance } = await import('../../api/_lib/redis');
      const mockRedis = getRedisInstance();

      (mockRedis.get as any).mockResolvedValueOnce(null);

      const mockUserProfile = {
        sub: 'auth0|999',
        name: 'Admin User',
        email: 'admin@example.com',
        'https://sga.com/roles': ['management_admin'],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserProfile,
      } as any);

      mockRequest.headers = { authorization: 'Bearer admin-token' };
      const wrappedHandler = withAuth(mockHandler, ['management_admin']);

      await wrappedHandler(mockRequest as VercelRequest, mockResponse as VercelResponse);

      expect(mockHandler).toHaveBeenCalled();
      const authenticatedRequest = mockHandler.mock.calls[0][0];
      expect(authenticatedRequest.user).toEqual({
        id: 'auth0|999',
        name: 'Admin User',
        username: 'admin@example.com',
        role: 'management_admin',
      });
    });

    it('should handle authentication errors gracefully', async () => {
      const { getRedisInstance } = await import('../../api/_lib/redis');
      const mockRedis = getRedisInstance();

      (mockRedis.get as any).mockRejectedValueOnce(new Error('Redis connection failed'));

      mockRequest.headers = { authorization: 'Bearer error-token' };
      const wrappedHandler = withAuth(mockHandler, ['asphalt_foreman']);

      await wrappedHandler(mockRequest as VercelRequest, mockResponse as VercelResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should allow access when no specific roles required', async () => {
      const { getRedisInstance } = await import('../../api/_lib/redis');
      const mockRedis = getRedisInstance();

      const cachedUser: SecureForeman = {
        id: 'auth0|111',
        name: 'Any User',
        username: 'any@example.com',
        role: 'spray_foreman',
      };

      (mockRedis.get as any).mockResolvedValueOnce(JSON.stringify(cachedUser));

      mockRequest.headers = { authorization: 'Bearer any-token' };
      const wrappedHandler = withAuth(mockHandler, []); // No required roles

      await wrappedHandler(mockRequest as VercelRequest, mockResponse as VercelResponse);

      expect(mockHandler).toHaveBeenCalled();
    });
  });
});

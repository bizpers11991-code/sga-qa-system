import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Redis before importing the module
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    incr: jest.fn(),
    pexpire: jest.fn(),
    pttl: jest.fn()
  }));
});

import { checkRateLimit } from './rateLimiter';

describe('Rate Limiting Tests', () => {
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      incr: jest.fn(),
      pexpire: jest.fn(),
      pttl: jest.fn()
    };
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should allow requests under limit', async () => {
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.pexpire.mockResolvedValue(1);

    const context = { res: {}, log: { error: jest.fn() } };
    const req = {};

    const result = await checkRateLimit(context as any, req as any, 'user@test.com', {
      maxRequests: 10,
      windowMs: 3600000
    });

    expect(result.allowed).toBe(true);
    expect(mockRedis.incr).toHaveBeenCalledWith('ratelimit:user@test.com');
    expect(mockRedis.pexpire).toHaveBeenCalledWith('ratelimit:user@test.com', 3600000);
  });

  it('should block requests over limit', async () => {
    mockRedis.incr.mockResolvedValue(11); // Over limit
    mockRedis.pttl.mockResolvedValue(300000); // 5 minutes remaining

    const context = { log: { error: jest.fn() } };
    const req = {};

    const result = await checkRateLimit(context as any, req as any, 'user@test.com', {
      maxRequests: 10
    });

    expect(result.allowed).toBe(false);
    expect(result.response!.status).toBe(429);
    expect(result.response!.body).toContain('Too Many Requests');
  });

  it('should handle Redis errors gracefully', async () => {
    mockRedis.incr.mockRejectedValue(new Error('Redis connection failed'));

    const context = { res: {}, log: { error: jest.fn() } };
    const req = {};

    const result = await checkRateLimit(context as any, req as any, 'user@test.com');

    // Should fail open (allow request) when Redis is down
    expect(result.allowed).toBe(true);
    expect(context.log.error).toHaveBeenCalled();
  });
});
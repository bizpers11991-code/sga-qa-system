import { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyPrefix: string;  // Redis key prefix
}

interface RateLimitResult {
  allowed: boolean;
  response?: HttpResponseInit;
  remaining?: number;
  resetTime?: Date;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 10,
  keyPrefix: 'ratelimit'
};

export async function checkRateLimit(
  context: InvocationContext,
  _req: HttpRequest,
  userIdentifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const finalConfig = { ...defaultConfig, ...config };
  const key = `${finalConfig.keyPrefix}:${userIdentifier}`;

  try {
    // Increment counter
    const current = await redis.incr(key);

    // Set expiry on first request
    if (current === 1) {
      await redis.pexpire(key, finalConfig.windowMs);
    }

    // Check limit
    if (current > finalConfig.maxRequests) {
      const ttl = await redis.pttl(key);

      return {
        allowed: false,
        response: {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(ttl / 1000).toString(),
            'X-RateLimit-Limit': finalConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + ttl).toISOString()
          },
          body: JSON.stringify({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Maximum ${finalConfig.maxRequests} requests per hour.`,
            retryAfter: Math.ceil(ttl / 1000)
          })
        }
      };
    }

    // Success - return with rate limit headers
    return { allowed: true };

  } catch (error) {
    context.error('Rate limit check failed:', error);
    // Fail open (allow request) if Redis is down
    return { allowed: true };
  }
}

// api/_lib/ratelimit.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SecureForeman } from '../../src/types.js';

/**
 * Rate Limiter Configuration (In-Memory Fallback)
 *
 * This module provides tiered rate limiting to protect the API from abuse.
 * Uses in-memory storage when Redis is not configured.
 *
 * Note: In-memory rate limiting resets on function cold starts.
 * For production with high traffic, configure Upstash Redis.
 */

// In-memory rate limit storage
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations
const RATE_LIMITS = {
  anonymous: { limit: 10, windowMs: 60000 }, // 10 req/min
  authenticated: { limit: 100, windowMs: 60000 }, // 100 req/min
  expensive: { limit: 5, windowMs: 60000 }, // 5 req/min
  burst: { limit: 20, windowMs: 10000 }, // 20 req/10sec
};

/**
 * Check rate limit using in-memory storage
 */
const checkRateLimit = (
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; reset: number } => {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Create new entry
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { success: true, remaining: limit - 1, reset: resetTime };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, reset: entry.resetTime };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count, reset: entry.resetTime };
};

/**
 * Clean up expired entries periodically
 */
const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

// Run cleanup every minute
setInterval(cleanupExpiredEntries, 60000);

/**
 * Extract client identifier from request
 * Uses authenticated user ID if available, otherwise falls back to IP
 */
export const getClientIdentifier = (req: VercelRequest, user?: SecureForeman): string => {
  if (user?.id) {
    return `user:${user.id}`;
  }

  // Fall back to IP-based identification
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket?.remoteAddress || 'unknown';

  return `ip:${ip}`;
};

/**
 * Check if request is from a cron job (should bypass rate limiting)
 */
export const isCronRequest = (req: VercelRequest): boolean => {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }

  return req.headers['x-vercel-cron-secret'] === cronSecret;
};

/**
 * Apply rate limiting to a request
 * Returns true if request should be allowed, false if rate limited
 */
export const applyRateLimit = async (
  req: VercelRequest,
  res: VercelResponse,
  user?: SecureForeman,
  isExpensiveOperation: boolean = false
): Promise<boolean> => {
  // Cron jobs bypass rate limiting
  if (isCronRequest(req)) {
    return true;
  }

  const identifier = getClientIdentifier(req, user);

  // Select appropriate rate limit config
  let config = RATE_LIMITS.authenticated;
  let prefix = 'auth';

  if (isExpensiveOperation) {
    config = RATE_LIMITS.expensive;
    prefix = 'exp';
  } else if (!user) {
    config = RATE_LIMITS.anonymous;
    prefix = 'anon';
  }

  const key = `${prefix}:${identifier}`;
  const { success, remaining, reset } = checkRateLimit(key, config.limit, config.windowMs);

  // Add rate limit headers to response
  res.setHeader('X-RateLimit-Limit', config.limit.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', reset.toString());

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());

    res.status(429).json({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      details: {
        limit: config.limit,
        retryAfter,
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      },
    });

    return false;
  }

  return true;
};

/**
 * Middleware wrapper for rate limiting
 */
export type RateLimitedHandler = (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse>;

export const withRateLimit = (
  handler: RateLimitedHandler,
  isExpensiveOperation: boolean = false
) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    const user = (req as any).user as SecureForeman | undefined;

    const allowed = await applyRateLimit(req, res, user, isExpensiveOperation);

    if (!allowed) {
      return;
    }

    return handler(req, res);
  };
};

/**
 * Apply burst protection to detect DDoS attempts
 */
export const applyBurstProtection = async (
  req: VercelRequest,
  res: VercelResponse,
  user?: SecureForeman
): Promise<boolean> => {
  if (isCronRequest(req)) {
    return true;
  }

  const identifier = getClientIdentifier(req, user);
  const key = `burst:${identifier}`;
  const { success } = checkRateLimit(key, RATE_LIMITS.burst.limit, RATE_LIMITS.burst.windowMs);

  if (!success) {
    res.status(429).json({
      error: 'Too many requests',
      code: 'BURST_LIMIT_EXCEEDED',
      details: {
        message: 'Request rate too high. Please slow down.',
      },
    });

    return false;
  }

  return true;
};

/**
 * Combined rate limiting middleware (includes burst protection)
 */
export const withFullRateLimit = (
  handler: RateLimitedHandler,
  isExpensiveOperation: boolean = false
) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    const user = (req as any).user as SecureForeman | undefined;

    // First check burst protection
    const burstAllowed = await applyBurstProtection(req, res, user);
    if (!burstAllowed) {
      return;
    }

    // Then apply standard rate limiting
    const allowed = await applyRateLimit(req, res, user, isExpensiveOperation);
    if (!allowed) {
      return;
    }

    return handler(req, res);
  };
};

// Legacy exports for backwards compatibility (no-op if Redis not configured)
export const getAnonymousRateLimiter = () => null;
export const getAuthenticatedRateLimiter = () => null;
export const getExpensiveOperationRateLimiter = () => null;
export const getBurstProtectionLimiter = () => null;

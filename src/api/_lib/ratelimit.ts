// api/_lib/ratelimit.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Ratelimit } from '@upstash/ratelimit';
import { getRedisInstance } from './redis.js';
import { SecureForeman } from '../../types.js';

/**
 * Rate Limiter Configuration
 *
 * This module provides tiered rate limiting to protect the API from abuse:
 * - Anonymous/IP-based: 10 requests per minute (for unauthenticated endpoints)
 * - Authenticated users: 100 requests per minute
 * - Expensive operations (AI, PDF generation): 5 requests per minute
 * - Cron jobs: Unlimited (bypassed via CRON_SECRET header)
 */

// Different rate limiters for different tiers
let anonymousRateLimiter: Ratelimit | null = null;
let authenticatedRateLimiter: Ratelimit | null = null;
let expensiveOperationRateLimiter: Ratelimit | null = null;

/**
 * Get or create the anonymous rate limiter (IP-based)
 * 10 requests per minute per IP
 */
export const getAnonymousRateLimiter = (): Ratelimit => {
  if (anonymousRateLimiter) {
    return anonymousRateLimiter;
  }

  const redis = getRedisInstance();
  anonymousRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:anonymous',
  });

  return anonymousRateLimiter;
};

/**
 * Get or create the authenticated user rate limiter
 * 100 requests per minute per user
 */
export const getAuthenticatedRateLimiter = (): Ratelimit => {
  if (authenticatedRateLimiter) {
    return authenticatedRateLimiter;
  }

  const redis = getRedisInstance();
  authenticatedRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:authenticated',
  });

  return authenticatedRateLimiter;
};

/**
 * Get or create the expensive operation rate limiter
 * 5 requests per minute per user (for AI-powered and PDF generation endpoints)
 */
export const getExpensiveOperationRateLimiter = (): Ratelimit => {
  if (expensiveOperationRateLimiter) {
    return expensiveOperationRateLimiter;
  }

  const redis = getRedisInstance();
  expensiveOperationRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:expensive',
  });

  return expensiveOperationRateLimiter;
};

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
 *
 * @param req The Vercel request object
 * @param res The Vercel response object (to send 429 if rate limited)
 * @param user Optional authenticated user
 * @param isExpensiveOperation Whether this is an expensive operation (AI/PDF)
 * @returns true if allowed, false if rate limited
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

  // Select appropriate rate limiter
  let rateLimiter: Ratelimit;
  if (isExpensiveOperation) {
    rateLimiter = getExpensiveOperationRateLimiter();
  } else if (user) {
    rateLimiter = getAuthenticatedRateLimiter();
  } else {
    rateLimiter = getAnonymousRateLimiter();
  }

  try {
    const { success, limit, reset, remaining } = await rateLimiter.limit(identifier);

    // Add rate limit headers to response
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', reset.toString());

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());

      res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        details: {
          limit,
          retryAfter,
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        },
      });

      return false;
    }

    return true;
  } catch (error) {
    // If rate limiting fails, log the error but allow the request
    // This ensures rate limiting failures don't break the API
    console.error('Rate limiting error:', error);
    return true;
  }
};

/**
 * Middleware wrapper for rate limiting
 * Use this to wrap handlers that need rate limiting
 */
export type RateLimitedHandler = (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse>;

export const withRateLimit = (
  handler: RateLimitedHandler,
  isExpensiveOperation: boolean = false
) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Check if user is attached (from auth middleware)
    const user = (req as any).user as SecureForeman | undefined;

    const allowed = await applyRateLimit(req, res, user, isExpensiveOperation);

    if (!allowed) {
      // Response already sent by applyRateLimit
      return;
    }

    return handler(req, res);
  };
};

/**
 * DDoS Protection: Burst detection
 * Detects if a client is making requests at an abnormally high rate
 * Uses a stricter window (10 seconds) to catch burst attacks
 */
let burstProtectionLimiter: Ratelimit | null = null;

export const getBurstProtectionLimiter = (): Ratelimit => {
  if (burstProtectionLimiter) {
    return burstProtectionLimiter;
  }

  const redis = getRedisInstance();
  burstProtectionLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '10 s'), // Max 20 requests per 10 seconds
    analytics: true,
    prefix: 'ratelimit:burst',
  });

  return burstProtectionLimiter;
};

/**
 * Apply burst protection to detect DDoS attempts
 */
export const applyBurstProtection = async (
  req: VercelRequest,
  res: VercelResponse,
  user?: SecureForeman
): Promise<boolean> => {
  // Cron jobs bypass burst protection
  if (isCronRequest(req)) {
    return true;
  }

  const identifier = getClientIdentifier(req, user);
  const limiter = getBurstProtectionLimiter();

  try {
    const { success } = await limiter.limit(identifier);

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
  } catch (error) {
    console.error('Burst protection error:', error);
    return true;
  }
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

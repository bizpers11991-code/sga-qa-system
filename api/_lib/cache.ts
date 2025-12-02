/**
 * Caching Service for SGA QA System
 *
 * Provides a unified caching layer that supports:
 * - Vercel KV (production)
 * - In-memory cache (development/fallback)
 *
 * Cache TTLs are configured based on data volatility:
 * - Static data (foremen, ITP templates): 1 hour
 * - Semi-static (projects, resources): 5 minutes
 * - Dynamic (jobs, incidents): 1 minute
 */

// In-memory cache for development and fallback
interface CacheEntry<T> {
  data: T;
  expires: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

// Cache configuration
export const CacheTTL = {
  // Static data - rarely changes
  FOREMEN: 60 * 60,           // 1 hour
  ITP_TEMPLATES: 60 * 60,     // 1 hour

  // Semi-static - changes occasionally
  PROJECTS: 5 * 60,           // 5 minutes
  RESOURCES: 5 * 60,          // 5 minutes
  TENDERS: 5 * 60,            // 5 minutes

  // Dynamic - changes frequently
  JOBS: 60,                   // 1 minute
  JOBS_LIST: 60,              // 1 minute
  INCIDENTS: 60,              // 1 minute
  NCRS: 60,                   // 1 minute
  QA_PACKS: 60,               // 1 minute
  NOTIFICATIONS: 30,          // 30 seconds
  DAILY_REPORTS: 2 * 60,      // 2 minutes

  // Dashboard aggregates
  DASHBOARD_STATS: 60,        // 1 minute
  DASHBOARD_CHARTS: 2 * 60,   // 2 minutes

  // Default
  DEFAULT: 60,                // 1 minute
} as const;

// Cache key prefixes for organization
export const CacheKeys = {
  // List caches
  JOBS_ALL: 'jobs:all',
  JOBS_BY_STATUS: (status: string) => `jobs:status:${status}`,
  JOBS_BY_FOREMAN: (foremanId: string) => `jobs:foreman:${foremanId}`,
  JOBS_BY_PROJECT: (projectId: string) => `jobs:project:${projectId}`,

  PROJECTS_ALL: 'projects:all',
  PROJECTS_BY_STATUS: (status: string) => `projects:status:${status}`,

  FOREMEN_ALL: 'foremen:all',
  RESOURCES_ALL: 'resources:all',
  TENDERS_ALL: 'tenders:all',

  ITP_TEMPLATES_ALL: 'itp:templates:all',
  ITP_TEMPLATES_BY_DIVISION: (division: string) => `itp:templates:division:${division}`,

  INCIDENTS_ALL: 'incidents:all',
  NCRS_ALL: 'ncrs:all',
  QA_PACKS_ALL: 'qapacks:all',

  NOTIFICATIONS_BY_USER: (userId: string) => `notifications:user:${userId}`,

  // Single item caches
  JOB: (id: string) => `job:${id}`,
  PROJECT: (id: string) => `project:${id}`,
  FOREMAN: (id: string) => `foreman:${id}`,

  // Dashboard caches
  DASHBOARD_STATS: 'dashboard:stats',
  DASHBOARD_JOBS_BY_STATUS: 'dashboard:jobs:by-status',
  DASHBOARD_JOBS_BY_DIVISION: 'dashboard:jobs:by-division',
  DASHBOARD_INCIDENTS_TREND: 'dashboard:incidents:trend',
  DASHBOARD_COMPLETION_RATE: 'dashboard:completion-rate',
} as const;

/**
 * Check if Vercel KV is available
 */
function isVercelKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (isVercelKVAvailable()) {
      // Use Vercel KV
      const { kv } = await import('@vercel/kv');
      const value = await kv.get<T>(key);
      return value;
    } else {
      // Use in-memory cache
      const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
      if (entry && entry.expires > Date.now()) {
        return entry.data;
      }
      // Clean up expired entry
      if (entry) {
        memoryCache.delete(key);
      }
      return null;
    }
  } catch (error) {
    console.warn(`[Cache] Get failed for ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number = CacheTTL.DEFAULT): Promise<void> {
  try {
    if (isVercelKVAvailable()) {
      // Use Vercel KV
      const { kv } = await import('@vercel/kv');
      await kv.set(key, value, { ex: ttlSeconds });
    } else {
      // Use in-memory cache
      memoryCache.set(key, {
        data: value,
        expires: Date.now() + (ttlSeconds * 1000),
      });
    }
  } catch (error) {
    console.warn(`[Cache] Set failed for ${key}:`, error);
  }
}

/**
 * Delete value from cache
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    if (isVercelKVAvailable()) {
      const { kv } = await import('@vercel/kv');
      await kv.del(key);
    } else {
      memoryCache.delete(key);
    }
  } catch (error) {
    console.warn(`[Cache] Delete failed for ${key}:`, error);
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    if (isVercelKVAvailable()) {
      const { kv } = await import('@vercel/kv');
      // Vercel KV supports SCAN with pattern
      const keys = await kv.keys(pattern);
      if (keys.length > 0) {
        await kv.del(...keys);
      }
    } else {
      // In-memory: find and delete matching keys
      const regex = new RegExp(pattern.replace('*', '.*'));
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
        }
      }
    }
  } catch (error) {
    console.warn(`[Cache] Delete pattern failed for ${pattern}:`, error);
  }
}

/**
 * Invalidate all caches for a specific entity type
 */
export async function invalidateEntity(entityType: 'jobs' | 'projects' | 'foremen' | 'resources' | 'incidents' | 'ncrs' | 'qapacks'): Promise<void> {
  const patterns: Record<string, string[]> = {
    jobs: ['jobs:*', 'job:*', 'dashboard:jobs:*', 'dashboard:stats'],
    projects: ['projects:*', 'project:*', 'dashboard:stats'],
    foremen: ['foremen:*', 'foreman:*'],
    resources: ['resources:*'],
    incidents: ['incidents:*', 'dashboard:incidents:*', 'dashboard:stats'],
    ncrs: ['ncrs:*', 'dashboard:stats'],
    qapacks: ['qapacks:*', 'dashboard:stats'],
  };

  const toInvalidate = patterns[entityType] || [];
  await Promise.all(toInvalidate.map(pattern => cacheDeletePattern(pattern)));
}

/**
 * Cache wrapper - get from cache or fetch and cache
 */
export async function cacheOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CacheTTL.DEFAULT
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache the result
  await cacheSet(key, data, ttlSeconds);

  return data;
}

/**
 * Get cache statistics (for monitoring)
 */
export async function getCacheStats(): Promise<{
  type: 'vercel-kv' | 'in-memory';
  size?: number;
  keys?: string[];
}> {
  if (isVercelKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      const keys = await kv.keys('*');
      return {
        type: 'vercel-kv',
        size: keys.length,
        keys: keys.slice(0, 50), // Limit for display
      };
    } catch {
      return { type: 'vercel-kv' };
    }
  } else {
    // Clean expired entries first
    const now = Date.now();
    for (const [key, entry] of memoryCache.entries()) {
      if ((entry as CacheEntry<unknown>).expires <= now) {
        memoryCache.delete(key);
      }
    }

    return {
      type: 'in-memory',
      size: memoryCache.size,
      keys: Array.from(memoryCache.keys()).slice(0, 50),
    };
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  if (isVercelKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      const keys = await kv.keys('*');
      if (keys.length > 0) {
        await kv.del(...keys);
      }
    } catch (error) {
      console.warn('[Cache] Clear all failed:', error);
    }
  } else {
    memoryCache.clear();
  }
}

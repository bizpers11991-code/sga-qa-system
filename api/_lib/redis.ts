import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;

/**
 * Returns a singleton instance of the Upstash Redis client.
 * In a serverless environment, functions can be spun up and down for each request ('cold starts').
 * Creating a new database connection on every invocation is inefficient and can exhaust connection limits.
 * This singleton pattern ensures that for a 'warm' function (one that is reused for a subsequent request),
 * the existing database connection is reused, improving performance and resource management.
 */
export const getRedisInstance = (): Redis => {
    if (redisInstance) {
        return redisInstance;
    }

    // Vercel provides different environment variables for Upstash Redis depending on the integration type.
    // This logic supports both a direct Upstash integration (UPSTASH_*) and Vercel KV (KV_*).
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;


    if (!url || !token) {
        // This prefix allows API handlers to catch this specific error type.
        throw new Error('DATABASE_CONFIGURATION_ERROR: Upstash Redis or Vercel KV environment variables are not set.');
    }

    redisInstance = new Redis({
      url,
      token,
    });
    
    return redisInstance;
};
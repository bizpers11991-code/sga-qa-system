/**
 * Dashboard Statistics API Endpoint
 *
 * Returns aggregated statistics for the dashboard with caching support.
 * Cache TTL: 1 minute for real-time feel, reduced API calls.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CachedDashboardData } from './_lib/cachedData.js';
import { getCacheStats } from './_lib/cache.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { include } = req.query;
    const includes = typeof include === 'string' ? include.split(',') : [];

    // Always get basic stats
    const stats = await CachedDashboardData.getStats();

    const response: any = {
      ...stats,
    };

    // Optional: Include trend data if requested
    if (includes.includes('jobsTrend')) {
      const days = parseInt(req.query.trendDays as string) || 30;
      response.jobsCompletionTrend = await CachedDashboardData.getJobsCompletionTrend(days);
    }

    if (includes.includes('incidentsTrend')) {
      const months = parseInt(req.query.trendMonths as string) || 6;
      response.incidentsTrend = await CachedDashboardData.getIncidentsTrend(months);
    }

    // Optional: Include cache stats for debugging
    if (includes.includes('cacheStats')) {
      response.cacheStats = await getCacheStats();
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('[Dashboard Stats] Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

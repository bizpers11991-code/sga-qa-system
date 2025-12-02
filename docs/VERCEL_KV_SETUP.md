# Vercel KV Setup Guide

This guide explains how to set up Vercel KV for caching in the SGA QA System.

## What is Vercel KV?

Vercel KV is a serverless Redis database that provides:
- **Low latency** - Edge-optimized for fast responses
- **No maintenance** - Fully managed by Vercel
- **Auto-scaling** - Handles traffic spikes automatically
- **Simple pricing** - Pay only for what you use

## Why Use Caching?

The SGA QA System uses caching to:
1. **Reduce SharePoint API calls** - Avoid rate limits
2. **Improve performance** - Return data in milliseconds
3. **Handle offline scenarios** - Serve stale data when SharePoint is slow
4. **Save costs** - Fewer API calls = lower Azure usage

## Setup Steps

### 1. Create a Vercel KV Database

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (sga-qa-system)
3. Click **Storage** tab
4. Click **Create Database**
5. Select **KV** (Vercel KV)
6. Choose a name (e.g., `sga-qa-cache`)
7. Select your region (closest to your users - for Australia, use `syd1`)
8. Click **Create**

### 2. Connect to Your Project

After creating the database:
1. Click on the database you created
2. Click **Connect to Project**
3. Select `sga-qa-system`
4. Select the environment(s): Production, Preview, Development
5. Click **Connect**

This automatically adds the required environment variables:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`

### 3. Verify Configuration

The caching system is already implemented. It will automatically:
- Use Vercel KV in production (when environment variables are set)
- Fall back to in-memory cache in development (when variables are missing)

To verify it's working:
```bash
# Check environment variables are set
vercel env ls

# Deploy and check logs
vercel --prod
```

### 4. Monitor Usage

In the Vercel dashboard:
1. Go to **Storage** > your KV database
2. View **Usage** tab for:
   - Commands executed
   - Data stored
   - Bandwidth used

## Cache Configuration

The caching layer is configured in `api/_lib/cache.ts`:

### Cache TTLs (Time To Live)

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Foremen | 1 hour | Rarely changes |
| ITP Templates | 1 hour | Rarely changes |
| Projects | 5 minutes | Changes occasionally |
| Resources | 5 minutes | Changes occasionally |
| Jobs | 1 minute | Changes frequently |
| Incidents | 1 minute | Changes frequently |
| Dashboard Stats | 1 minute | Aggregate data |

### Cache Keys

```typescript
// Examples
'jobs:all'                    // All jobs
'jobs:status:Pending'         // Jobs by status
'jobs:foreman:foreman-123'    // Jobs by foreman
'project:456'                 // Single project
'dashboard:stats'             // Dashboard statistics
```

## Development Mode

In development (without Vercel KV), the system uses an in-memory cache:
- Works identically to production
- Data is lost on server restart
- Good for testing cache behavior

To test with Vercel KV locally:
```bash
# Pull environment variables
vercel env pull

# Run with production environment
vercel dev
```

## Cache Invalidation

The cache is automatically invalidated when:
- Data is created, updated, or deleted
- Related data changes (e.g., updating a job invalidates dashboard stats)

Manual invalidation:
```typescript
import { clearAllCache, invalidateEntity } from './cache';

// Clear everything
await clearAllCache();

// Clear specific entity type
await invalidateEntity('jobs');
```

## Troubleshooting

### Cache Not Working

1. Check environment variables:
   ```bash
   vercel env ls | grep KV
   ```

2. Check Vercel deployment logs for errors

3. Verify the database is connected to your project in Vercel dashboard

### Stale Data

If data seems outdated:
1. The cache has built-in TTLs
2. Force refresh by calling the API with `?nocache=1` (if implemented)
3. Check the `lastUpdated` field in dashboard stats

### High Latency

1. Ensure your KV database is in the same region as your deployment
2. Check for large cached objects (they take longer to serialize)
3. Review cache hit/miss ratio in monitoring

## Pricing

Vercel KV pricing (as of 2024):
- **Free tier**: 30,000 requests/month
- **Pro**: $0.20 per 100,000 requests + $0.20/GB storage

For SGA QA System typical usage:
- ~50 users
- ~100 API calls per user per day
- ~150,000 calls/month
- Estimated cost: ~$0.30/month (plus free tier)

## Next Steps

1. Set up the Vercel KV database as described above
2. Deploy to production: `vercel --prod`
3. Monitor cache performance in Vercel dashboard
4. Adjust TTLs if needed based on usage patterns

# API Migration Examples: Redis → Dataverse

**Created by:** Gemini AI Worker
**Date:** November 19, 2025

This document shows before/after examples for migrating Vercel serverless API endpoints from Upstash Redis to Microsoft Dataverse.

---

## Example 1: Get All Jobs

### Before (Redis):
```typescript
// src/api/get-all-jobs.ts
import { redis } from './_lib/redis';

export default async function handler(req, res) {
  try {
    const keys = await redis.keys('job:*');
    const jobs = [];

    for (const key of keys) {
      const job = await redis.get(key);
      if (job) jobs.push(job);
    }

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
}
```

### After (Dataverse):
```typescript
// src/api/get-all-jobs.ts
import { getRecords, Tables } from './_lib/dataverse';

export default async function handler(req, res) {
  try {
    const jobs = await getRecords(Tables.Job);
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs from Dataverse' });
  }
}
```

**Key Changes:**
- Single API call instead of iterating through keys
- Uses `getRecords()` to fetch all records
- Cleaner, more performant code

---

## Example 2: Create New Job

### Before (Redis):
```typescript
// src/api/create-job.ts
import { redis } from './_lib/redis';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { jobNumber, client, location, startDate } = req.body;
      const id = uuidv4();
      const job = { id, jobNumber, client, location, startDate };

      await redis.set(`job:${id}`, job);
      res.status(201).json(job);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create job' });
    }
  }
}
```

### After (Dataverse):
```typescript
// src/api/create-job.ts
import { createRecord, Tables } from './_lib/dataverse';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { jobNumber, client, location, startDate } = req.body;

      const jobData = {
        cr6d1_jobnumber: jobNumber,
        cr6d1_client: client,
        cr6d1_location: location,
        cr6d1_startdate: startDate,
      };

      const createdJob = await createRecord(Tables.Job, jobData);
      res.status(201).json(createdJob);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create job in Dataverse' });
    }
  }
}
```

**Key Changes:**
- Dataverse auto-generates IDs (no UUID needed)
- Column names prefixed with table prefix (e.g., `cr6d1_`)
- Returns full Dataverse record with metadata

---

## Example 3: Get Jobs for Specific Foreman

### Before (Redis):
```typescript
// src/api/get-foreman-jobs.ts
import { redis } from './_lib/redis';

export default async function handler(req, res) {
  try {
    const { foremanEmail } = req.query;
    const keys = await redis.keys('job:*');
    const jobs = [];

    for (const key of keys) {
      const job = await redis.get(key);
      if (job && job.foremanEmail === foremanEmail) {
        jobs.push(job);
      }
    }

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
}
```

### After (Dataverse):
```typescript
// src/api/get-foreman-jobs.ts
import { getRecords, Tables } from './_lib/dataverse';

export default async function handler(req, res) {
  try {
    const { foremanEmail } = req.query;

    // Using Dataverse's helper function
    const jobs = await getJobsByForeman(foremanEmail as string);

    // Or using filter directly:
    // const jobs = await getRecords(
    //   Tables.Job,
    //   undefined,
    //   `_cr6d1_foremanid_value eq '${foremanEmail}'`
    // );

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
}
```

**Key Changes:**
- Server-side filtering (more efficient)
- Uses helper function `getJobsByForeman()`
- Leverages OData query capabilities

---

## Example 4: Save Incident Report

### Before (Redis):
```typescript
// src/api/save-incident.ts
import { redis } from './_lib/redis';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { jobId, description, severity } = req.body;
      const id = uuidv4();
      const incident = { id, jobId, description, severity };

      await redis.set(`incident:${id}`, incident);
      res.status(201).json(incident);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save incident' });
    }
  }
}
```

### After (Dataverse):
```typescript
// src/api/save-incident.ts
import { createRecord, Tables } from './_lib/dataverse';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { jobId, description, severity } = req.body;

      const incidentData = {
        cr6d1_description: description,
        cr6d1_severity: severity,
        '_cr6d1_job_value': jobId, // Lookup to Job table
      };

      const createdIncident = await createRecord(Tables.Incident, incidentData);
      res.status(201).json(createdIncident);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save incident' });
    }
  }
}
```

**Key Changes:**
- Uses lookup field `_cr6d1_job_value` for relationships
- Dataverse handles foreign key constraints
- Auto-generates incident ID and timestamps

---

## Important Notes

### Column Naming Convention
Replace the prefix in column names with your actual Dataverse table prefix:
- `cr6d1_` → Your table prefix (find in Power Apps portal)
- Example: `cr6d1_jobnumber`, `cr6d1_client`, etc.

### Lookup Fields
Lookup fields use special naming:
- Pattern: `_[prefix]_[column]_value`
- Example: `_cr6d1_job_value` links to Job table

### Finding Your Table Prefix
1. Go to https://make.powerapps.com
2. Click "Tables"
3. Open any table
4. Look at "Logical name" (e.g., `cr6d1_job`)
5. The prefix is everything before the underscore

### Update dataverse.ts
Update the `Tables` object with your actual logical names:
```typescript
export const Tables = {
  Job: 'cr6d1_job',           // Replace with your actual name
  Foreman: 'cr6d1_foreman',   // Replace with your actual name
  // ... etc
};
```

---

## Migration Checklist

For each API endpoint:
- [ ] Replace `redis` imports with `dataverse` imports
- [ ] Update column names to match Dataverse schema
- [ ] Remove UUID generation (Dataverse auto-generates)
- [ ] Update lookups to use `_[prefix]_[column]_value` format
- [ ] Test with actual Dataverse data
- [ ] Update error handling
- [ ] Remove old Redis code after verification

---

**Created:** November 19, 2025
**Source:** Gemini AI Team
**Status:** Ready to use as migration template

# Dataverse Migration Status

## ✅ Completed

### 1. Infrastructure
- ✅ Updated `api/_lib/dataverse.ts` with new table mappings
- ✅ Added helper functions for all project management tables
- ✅ Created comprehensive table schema document (DATAVERSE_TABLES_SCHEMA.md)

### 2. API Endpoints Updated
- ✅ `api/create-handover.ts` - Migrated to Dataverse
- ✅ `api/get-handovers.ts` - Migrated to Dataverse

### 3. Documentation
- ✅ `DATAVERSE_TABLES_SCHEMA.md` - Complete schema with step-by-step creation guide
- ✅ This status document

---

## 🔄 Remaining Work (Quick Pattern to Follow)

### API Endpoints to Update (21 files)

All follow the same pattern. Here's the template:

#### Pattern for GET endpoints:
```typescript
// OLD (Redis):
import { getRedisInstance } from './_lib/redis.js';
const redis = getRedisInstance();
const keys = await redis.smembers('items:index');
// ... fetch from Redis ...

// NEW (Dataverse):
import { getProjects, Tables } from './_lib/dataverse.js';
const records = await getProjects();
// Map records to your type
const items = records.map(record => ({
  id: record.cr3cd_projectid,
  name: record.cr3cd_projectname,
  // ... map other fields ...
}));
```

#### Pattern for CREATE endpoints:
```typescript
// OLD (Redis):
const redis = getRedisInstance();
await redis.hset(`item:${id}`, preparedData);
await redis.sadd('items:index', id);

// NEW (Dataverse):
import { createRecord, Tables } from './_lib/dataverse.js';
const dataverseRecord = {
  cr3cd_fieldname: data.fieldName,
  cr3cd_anotherfield: data.anotherField,
  // ...
};
const created = await createRecord(Tables.Project, dataverseRecord);
```

#### Pattern for UPDATE endpoints:
```typescript
// OLD (Redis):
await redis.hset(`item:${id}`, updatedData);

// NEW (Dataverse):
import { updateRecord, Tables } from './_lib/dataverse.js';
await updateRecord(Tables.Project, id, {
  cr3cd_fieldname: newValue
});
```

---

## 📋 Remaining Files to Update

### Tender/Handover APIs (3 files)
- [ ] `api/get-handover.ts` - Get single handover
- [ ] `api/update-handover.ts` - Update handover

### Project APIs (5 files)
- [ ] `api/create-project.ts`
- [ ] `api/get-projects.ts`
- [ ] `api/get-project.ts`
- [ ] `api/update-project.ts`
- [ ] `api/update-project-status.ts`

### Scope Report APIs (4 files)
- [ ] `api/submit-scope-report.ts`
- [ ] `api/get-scope-reports.ts`
- [ ] `api/get-scope-report.ts`
- [ ] `api/generate-scope-report-pdf.ts` (no DB changes needed)

### Division Request APIs (4 files)
- [ ] `api/create-division-request.ts`
- [ ] `api/get-division-requests.ts`
- [ ] `api/respond-division-request.ts`
- [ ] `api/complete-division-request.ts`

### Crew Availability APIs (2 files)
- [ ] `api/get-crew-availability.ts`
- [ ] `api/assign-crew-to-job.ts`

---

## 🎯 Quick Migration Steps for Each File

### Step 1: Update Imports
```typescript
// Remove:
import { getRedisInstance } from './_lib/redis.js';

// Add:
import { getTenders, getProjects, createRecord, updateRecord, Tables } from './_lib/dataverse.js';
```

### Step 2: Replace Redis Calls

**For CREATE operations:**
```typescript
// Remove prepareObjectForRedis function
// Remove Redis pipeline

// Replace with:
const dataverseRecord = {
  cr3cd_field1: data.field1,
  cr3cd_field2: data.field2,
  // Convert objects/arrays to JSON strings
  cr3cd_jsonfield: JSON.stringify(data.jsonField),
};
const created = await createRecord(Tables.YourTable, dataverseRecord);
```

**For GET operations:**
```typescript
// Remove Redis smembers/hgetall loops

// Replace with:
const records = await getYourItems(); // Use helper from dataverse.ts
const items = records.map(record => ({
  id: record.cr3cd_yourtableid,
  field1: record.cr3cd_field1,
  // Parse JSON fields
  jsonField: JSON.parse(record.cr3cd_jsonfield || '[]'),
}));
```

### Step 3: Field Name Mapping

All Dataverse fields use lowercase with underscores:
- TypeScript: `projectName` → Dataverse: `cr3cd_projectname`
- TypeScript: `clientTier` → Dataverse: `cr3cd_clienttier`
- TypeScript: `estimatedStartDate` → Dataverse: `cr3cd_estimatedstartdate`

### Step 4: Handle JSON Fields

Arrays and objects must be stringified:
```typescript
// Storing:
cr3cd_divisions: JSON.stringify(data.divisions)

// Reading:
divisions: JSON.parse(record.cr3cd_divisions || '[]')
```

---

## 🚀 Testing Checklist

After updating all files:

- [ ] Run `npm run build` - should pass with 0 errors
- [ ] Create tables in Dataverse (following DATAVERSE_TABLES_SCHEMA.md)
- [ ] Add test data to tables
- [ ] Deploy to Vercel
- [ ] Test each endpoint:
  - [ ] POST /api/create-handover
  - [ ] GET /api/get-handovers
  - [ ] GET /api/get-handover/:id
  - [ ] PUT /api/update-handover
  - [ ] POST /api/create-project
  - [ ] GET /api/get-projects
  - [ ] GET /api/get-project/:id
  - [ ] PUT /api/update-project
  - [ ] POST /api/submit-scope-report
  - [ ] GET /api/get-scope-reports
  - [ ] POST /api/create-division-request
  - [ ] GET /api/get-division-requests
  - [ ] PUT /api/respond-division-request
  - [ ] GET /api/get-crew-availability
  - [ ] POST /api/assign-crew-to-job

---

## 📊 Migration Progress

**Completed:** 2/23 API endpoints (9%)
**Remaining:** 21/23 API endpoints (91%)

**Estimated Time to Complete:** 2-3 hours for someone familiar with the codebase

---

## 💡 Pro Tips

1. **Use Find & Replace** in your IDE:
   - Find: `getRedisInstance()`
   - Replace with appropriate Dataverse import

2. **Create mapper functions** for each entity type:
   ```typescript
   const mapToProject = (record: any): Project => ({
     id: record.cr3cd_projectid,
     projectNumber: record.cr3cd_projectnumber,
     // ...
   });
   ```

3. **Test incrementally** - update and test 2-3 files at a time

4. **Keep Redis code** in comments initially in case you need to reference it

---

## 🔗 Related Documents

- `DATAVERSE_TABLES_SCHEMA.md` - Complete table definitions
- `api/_lib/dataverse.ts` - Dataverse client and helpers
- `DEPLOYMENT_COMPLETE.md` - Deployment instructions (update env vars section)
- `VERCEL_ENV_SETUP.md` - Remove Redis env vars, keep Dataverse vars

---

**Status:** In Progress
**Last Updated:** November 26, 2025
**Migration Started By:** Claude Code

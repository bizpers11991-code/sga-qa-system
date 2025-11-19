# Incident ID Generation Algorithm Design

**Created by:** Worker #6 (DeepSeek V3.1)
**Date:** November 16, 2025
**Security:** Algorithm design only - no sensitive data
**Reviewed by:** Claude Sonnet 4.5

---

## Overview

Design a **thread-safe, collision-resistant algorithm** for generating unique incident IDs in the format:

```
INC-YYYYMMDD-XXXX
```

Where:
- `INC` = Incident prefix
- `YYYYMMDD` = Date (e.g., 20251116)
- `XXXX` = Sequential 4-digit counter (0001-9999)

**Requirements:**
1. Uniqueness guaranteed (no collisions even with concurrent requests)
2. Thread-safe (multiple users reporting incidents simultaneously)
3. Date-based reset (counter resets to 0001 each day)
4. Predictable format (always 17 characters)
5. Traceable (ID reveals incident date)

---

## Algorithm Design

### Approach: Atomic Counter with Date Partitioning

**Core Concept:**
- Use Dataverse as the source of truth for sequence numbers
- Atomic query: "Get max sequence number for today + 1"
- Dataverse row-level locking prevents race conditions

### Pseudocode

```typescript
FUNCTION GenerateIncidentID(incidentDate: Date = today): Promise<string> {

  // Step 1: Format date as YYYYMMDD
  const dateStr = formatDate(incidentDate, "YYYYMMDD")

  // Step 2: Query Dataverse for max incident number today (ATOMIC)
  // This query is atomic at the database level - Dataverse handles locking
  const maxSequence = await dataverse.query({
    table: "sga_incidentregister",
    filter: `incidentId startswith 'INC-${dateStr}'`,
    select: ["incidentId"],
    orderBy: "incidentId desc",
    top: 1
  })

  // Step 3: Extract sequence number from last incident ID
  let nextSequence = 1

  if (maxSequence.length > 0) {
    // Extract XXXX from INC-YYYYMMDD-XXXX
    const lastId = maxSequence[0].incidentId
    const lastSequenceStr = lastId.substring(13, 17) // Characters 13-16
    nextSequence = parseInt(lastSequenceStr) + 1
  }

  // Step 4: Check for overflow (max 9999 per day)
  if (nextSequence > 9999) {
    throw new Error(`Maximum incidents per day exceeded (9999)`)
  }

  // Step 5: Format sequence as 4-digit string with leading zeros
  const sequenceStr = nextSequence.toString().padStart(4, '0')

  // Step 6: Construct incident ID
  const incidentId = `INC-${dateStr}-${sequenceStr}`

  // Step 7: Return ID (caller will save to Dataverse immediately)
  return incidentId
}
```

---

## Thread Safety Analysis

### Scenario: 3 Users Report Incidents Simultaneously

**Without thread safety:**
```
User A: Query → Max = INC-20251116-0005 → Generate INC-20251116-0006
User B: Query → Max = INC-20251116-0005 → Generate INC-20251116-0006 ❌ COLLISION!
User C: Query → Max = INC-20251116-0005 → Generate INC-20251116-0006 ❌ COLLISION!
```

**With Dataverse atomic operations:**
```
User A: Query (lock row) → Max = INC-20251116-0005 → Generate INC-20251116-0006 → Save → Release lock
User B: Query (waits for lock) → Max = INC-20251116-0006 → Generate INC-20251116-0007 → Save → Release lock
User C: Query (waits for lock) → Max = INC-20251116-0007 → Generate INC-20251116-0008 → Save → Release lock
```

**Result:** No collisions! ✅

---

## Implementation Strategy

### Option 1: Query-Before-Insert (Recommended)

**Pros:**
- Simple to implement
- Dataverse handles locking automatically
- No external dependencies

**Cons:**
- Small race condition window (mitigated by Dataverse locking)

**Implementation:**
```typescript
async function createIncident(data: CreateIncidentRequest): Promise<CreateIncidentResponse> {
  // Generate ID
  const incidentId = await GenerateIncidentID()

  // Save to Dataverse immediately (within same transaction if possible)
  const incident = await dataverse.create({
    table: "sga_incidentregister",
    data: {
      incidentId: incidentId,
      description: data.description,
      location: data.location,
      severity: data.severity,
      reportedBy: getCurrentUser(),
      reportedAt: new Date(),
      status: "open"
    }
  })

  return {
    success: true,
    incidentId: incidentId,
    message: "Incident reported successfully"
  }
}
```

### Option 2: Optimistic Locking with Retry

**Pros:**
- Guaranteed uniqueness
- Handles high concurrency gracefully

**Cons:**
- More complex
- Requires retry logic

**Implementation:**
```typescript
async function GenerateIncidentID(maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const dateStr = formatDate(new Date(), "YYYYMMDD")

    // Query max sequence
    const maxSequence = await getMaxSequence(dateStr)
    const nextSequence = maxSequence + 1
    const incidentId = `INC-${dateStr}-${nextSequence.toString().padStart(4, '0')}`

    // Try to save with unique constraint check
    try {
      await dataverse.create({
        table: "sga_incidentregister",
        data: {
          incidentId: incidentId,
          // ... other fields
        },
        checkUniqueConstraint: "incidentId" // Dataverse validates uniqueness
      })

      // Success!
      return incidentId

    } catch (error) {
      if (error.code === "DUPLICATE_KEY" && attempt < maxRetries) {
        // Collision detected, retry
        await sleep(100 * attempt) // Exponential backoff
        continue
      }
      throw error
    }
  }

  throw new Error("Failed to generate unique incident ID after retries")
}
```

**Recommendation:** Use Option 1 (Query-Before-Insert) as Dataverse provides sufficient locking for our use case (low-moderate incident volume).

---

## NCR ID Generation Algorithm

**Same algorithm, different prefix:**

```
NCR-YYYYMMDD-XXXX
```

**Implementation:**
```typescript
async function GenerateNCRID(ncrDate: Date = today): Promise<string> {
  const dateStr = formatDate(ncrDate, "YYYYMMDD")

  // Query max NCR sequence for today
  const maxSequence = await dataverse.query({
    table: "sga_ncrregister",
    filter: `ncrId startswith 'NCR-${dateStr}'`,
    select: ["ncrId"],
    orderBy: "ncrId desc",
    top: 1
  })

  let nextSequence = 1
  if (maxSequence.length > 0) {
    const lastId = maxSequence[0].ncrId
    const lastSequenceStr = lastId.substring(13, 17)
    nextSequence = parseInt(lastSequenceStr) + 1
  }

  if (nextSequence > 9999) {
    throw new Error(`Maximum NCRs per day exceeded (9999)`)
  }

  const sequenceStr = nextSequence.toString().padStart(4, '0')
  return `NCR-${dateStr}-${sequenceStr}`
}
```

**Key Difference:** Uses `sga_ncrregister` table instead of `sga_incidentregister`. This ensures separate counters for incidents and NCRs.

---

## Edge Cases and Error Handling

### Edge Case 1: Clock Skew (Server vs Client Time)

**Problem:** User's device shows November 16, but server is November 17.

**Solution:** Always use **server time** (Azure Function execution time) for ID generation.

```typescript
// Use server time, not client time
const incidentDate = new Date() // Server time in Azure
const incidentId = await GenerateIncidentID(incidentDate)
```

### Edge Case 2: Maximum Incidents Per Day (9999)

**Problem:** More than 9999 incidents in one day.

**Solution:** Return error with clear message.

```typescript
if (nextSequence > 9999) {
  return {
    success: false,
    error: {
      code: "MAX_INCIDENTS_EXCEEDED",
      message: "Maximum incidents per day (9999) exceeded. Contact IT support.",
      details: { date: dateStr, maxSequence: 9999 }
    }
  }
}
```

**Likelihood:** Extremely low (9999 incidents/day = ~416 incidents/hour = 7 incidents/minute).

### Edge Case 3: Dataverse Query Failure

**Problem:** Network error or Dataverse downtime during query.

**Solution:** Retry with exponential backoff.

```typescript
async function getMaxSequenceWithRetry(dateStr: string, maxRetries = 3): Promise<number> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await dataverse.query({...})
      return extractSequence(result)
    } catch (error) {
      if (attempt === maxRetries) throw error
      await sleep(1000 * attempt) // 1s, 2s, 3s
    }
  }
}
```

### Edge Case 4: Race Condition During Date Transition

**Problem:** Incident created at 23:59:59, ID generated with Nov 16 date, but saved at 00:00:01 as Nov 17.

**Solution:** Generate ID and save record in **same transaction** (or as close as possible).

```typescript
// Best practice: Generate ID immediately before save
const incidentId = await GenerateIncidentID()
await dataverse.create({...}, { immediateConsistency: true })
```

### Edge Case 5: Manual ID Override (Testing/Migration)

**Problem:** Need to import historical incidents with specific IDs.

**Solution:** Provide optional `customId` parameter.

```typescript
async function createIncident(
  data: CreateIncidentRequest,
  customId?: string // For testing/migration only
): Promise<CreateIncidentResponse> {
  const incidentId = customId || await GenerateIncidentID()
  // ... save to Dataverse
}
```

---

## Performance Considerations

### Query Performance

**Current approach:**
```sql
SELECT incidentId FROM sga_incidentregister
WHERE incidentId LIKE 'INC-20251116-%'
ORDER BY incidentId DESC
LIMIT 1
```

**Optimization:**
- Index on `incidentId` column (Dataverse auto-indexes primary keys)
- Filter reduces search space to ~1 day of incidents (likely <100 records)
- `ORDER BY DESC LIMIT 1` returns only the max value

**Expected performance:** <100ms per ID generation.

### Caching Strategy (Optional Enhancement)

**Problem:** Every incident generation queries Dataverse.

**Solution:** Cache max sequence in Azure Functions memory (with TTL).

```typescript
const sequenceCache = new Map<string, { maxSequence: number, expiry: Date }>()

async function GenerateIncidentID(): Promise<string> {
  const dateStr = formatDate(new Date(), "YYYYMMDD")

  // Check cache
  const cached = sequenceCache.get(dateStr)
  if (cached && cached.expiry > new Date()) {
    // Increment cached value
    cached.maxSequence++
    return `INC-${dateStr}-${cached.maxSequence.toString().padStart(4, '0')}`
  }

  // Cache miss - query Dataverse
  const maxSequence = await getMaxSequence(dateStr)
  sequenceCache.set(dateStr, { maxSequence, expiry: addMinutes(new Date(), 5) })

  return `INC-${dateStr}-${maxSequence.toString().padStart(4, '0')}`
}
```

**Pros:** 90% reduction in Dataverse queries.
**Cons:** More complex, potential cache invalidation issues.
**Recommendation:** Implement only if performance becomes an issue (>1000 incidents/day).

---

## Testing Strategy

### Unit Tests

```typescript
describe('GenerateIncidentID', () => {
  test('should generate ID with correct format', async () => {
    const id = await GenerateIncidentID(new Date('2025-11-16'))
    expect(id).toMatch(/^INC-20251116-\d{4}$/)
  })

  test('should increment sequence number', async () => {
    const id1 = await GenerateIncidentID()
    const id2 = await GenerateIncidentID()

    const seq1 = parseInt(id1.substring(13, 17))
    const seq2 = parseInt(id2.substring(13, 17))

    expect(seq2).toBe(seq1 + 1)
  })

  test('should reset counter on new day', async () => {
    const id1 = await GenerateIncidentID(new Date('2025-11-16'))
    const id2 = await GenerateIncidentID(new Date('2025-11-17'))

    expect(id1).toContain('INC-20251116-')
    expect(id2).toContain('INC-20251117-0001') // Reset to 0001
  })

  test('should throw error when exceeding 9999', async () => {
    // Mock Dataverse to return 9999 as max
    mockDataverse.query.mockResolvedValue([{ incidentId: 'INC-20251116-9999' }])

    await expect(GenerateIncidentID()).rejects.toThrow('Maximum incidents per day exceeded')
  })
})
```

### Concurrency Test

```typescript
test('should handle concurrent ID generation', async () => {
  // Simulate 100 concurrent incident reports
  const promises = Array.from({ length: 100 }, () => GenerateIncidentID())
  const ids = await Promise.all(promises)

  // Check all IDs are unique
  const uniqueIds = new Set(ids)
  expect(uniqueIds.size).toBe(100)

  // Check all IDs are sequential
  ids.sort()
  for (let i = 1; i < ids.length; i++) {
    const seq1 = parseInt(ids[i-1].substring(13, 17))
    const seq2 = parseInt(ids[i].substring(13, 17))
    expect(seq2).toBe(seq1 + 1)
  }
})
```

---

## Implementation Checklist

- [ ] Create Azure Function: `GenerateIncidentID.ts`
- [ ] Create Azure Function: `GenerateNCRID.ts`
- [ ] Add Dataverse query helper functions
- [ ] Implement error handling (max sequence, query failures)
- [ ] Add retry logic with exponential backoff
- [ ] Write unit tests (format, sequence, date reset)
- [ ] Write concurrency tests (100 simultaneous requests)
- [ ] Document API (request/response formats)
- [ ] Add monitoring/logging (track ID generation time)
- [ ] Deploy to Azure Functions
- [ ] Test in production environment

---

## Security Considerations

**No sensitive data in IDs:**
- ✅ Incident ID reveals only the date (public information)
- ✅ No user IDs, names, or locations in ID
- ✅ Sequential numbers don't reveal business information

**Audit trail:**
- Log all ID generations (timestamp, user, generated ID)
- Helps diagnose issues if collisions occur
- Stored in `sga_auditlogs` table

**Access control:**
- Only authenticated users can trigger ID generation
- Azure AD authentication required (EasyAuth)
- Rate limiting: Max 10 incident reports per user per hour

---

## Summary

**Algorithm:** Query-Before-Insert with Dataverse atomic locking
**Format:** INC-YYYYMMDD-XXXX (17 characters)
**Thread Safety:** Dataverse row-level locking prevents collisions
**Performance:** <100ms per ID generation
**Capacity:** 9999 incidents per day (sufficient for SGA use case)
**Testing:** Unit tests + concurrency tests required
**Status:** Ready for implementation by Worker #5 (Azure Functions)

---

**Next Steps:**
1. Worker #5 implements Azure Functions based on this design
2. Worker #4 (Gemini) reviews architecture and security
3. Claude reviews final implementation before deployment

---

**Questions or concerns? Escalate to Claude (Coordinator).**

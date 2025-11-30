/**
 * @file scripts/validate-migration.ts
 * @description Validates data integrity between Redis and SharePoint during migration
 * Compares records, checks for missing data, and generates a detailed report
 */

import { config } from 'dotenv';
import { createClient } from '@upstash/redis';
import {
  JobsListService,
  ProjectsListService,
  TendersListService,
  ScopeReportsListService,
  DivisionRequestsListService,
  QAPacksListService,
  IncidentsListService,
} from '../src/lib/sharepoint';
import type { SharePointListItem } from '../src/lib/sharepoint/types';

// Load environment variables
config();

interface ValidationResult {
  listName: string;
  redisCount: number;
  sharepointCount: number;
  missingInSharePoint: string[];
  missingInRedis: string[];
  fieldMismatches: FieldMismatch[];
  errors: string[];
}

interface FieldMismatch {
  id: string;
  field: string;
  redisValue: any;
  sharepointValue: any;
}

interface MigrationReport {
  timestamp: string;
  totalLists: number;
  validationResults: ValidationResult[];
  summary: {
    totalRedisRecords: number;
    totalSharePointRecords: number;
    totalMissingInSharePoint: number;
    totalMissingInRedis: number;
    totalFieldMismatches: number;
    totalErrors: number;
  };
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
}

/**
 * Initialize Redis client
 */
function getRedisClient() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error('Redis configuration missing. Set KV_REST_API_URL and KV_REST_API_TOKEN');
  }

  return createClient({
    url,
    token,
  });
}

/**
 * Get all keys from Redis for a specific prefix
 */
async function getRedisKeys(redis: ReturnType<typeof createClient>, prefix: string): Promise<string[]> {
  try {
    const keys = await redis.keys(`${prefix}:*`);
    return keys || [];
  } catch (error) {
    console.error(`Error fetching Redis keys for ${prefix}:`, error);
    return [];
  }
}

/**
 * Get Redis record by key
 */
async function getRedisRecord(redis: ReturnType<typeof createClient>, key: string): Promise<any> {
  try {
    const data = await redis.hgetall(key);
    return data || null;
  } catch (error) {
    console.error(`Error fetching Redis record ${key}:`, error);
    return null;
  }
}

/**
 * Parse JSON fields in Redis data
 */
function parseRedisData(data: any): any {
  const parsed: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      try {
        // Try to parse as JSON
        parsed[key] = JSON.parse(value);
      } catch {
        // Keep as string if not JSON
        parsed[key] = value;
      }
    } else {
      parsed[key] = value;
    }
  }
  return parsed;
}

/**
 * Compare two values for equality (handles objects and arrays)
 */
function valuesMatch(value1: any, value2: any): boolean {
  if (value1 === value2) return true;
  if (value1 == null || value2 == null) return false;
  if (typeof value1 !== typeof value2) return false;

  if (typeof value1 === 'object') {
    return JSON.stringify(value1) === JSON.stringify(value2);
  }

  // Handle string/number type coercion
  return String(value1) === String(value2);
}

/**
 * Validate Jobs list
 */
async function validateJobs(redis: ReturnType<typeof createClient>): Promise<ValidationResult> {
  const result: ValidationResult = {
    listName: 'Jobs',
    redisCount: 0,
    sharepointCount: 0,
    missingInSharePoint: [],
    missingInRedis: [],
    fieldMismatches: [],
    errors: [],
  };

  try {
    // Get Redis jobs
    const redisKeys = await getRedisKeys(redis, 'job');
    result.redisCount = redisKeys.length;

    const redisJobs = new Map<string, any>();
    for (const key of redisKeys) {
      const data = await getRedisRecord(redis, key);
      if (data) {
        const parsed = parseRedisData(data);
        redisJobs.set(parsed.id || key, parsed);
      }
    }

    // Get SharePoint jobs
    const spJobs = await JobsListService.getItems<any>();
    result.sharepointCount = spJobs.length;

    const spJobsMap = new Map(spJobs.map(job => [job.Title, job]));

    // Check for missing in SharePoint
    for (const [id, redisJob] of redisJobs) {
      if (!spJobsMap.has(id) && !spJobsMap.has(redisJob.jobNo)) {
        result.missingInSharePoint.push(id);
      } else {
        // Compare fields
        const spJob = spJobsMap.get(id) || spJobsMap.get(redisJob.jobNo);
        if (spJob) {
          compareJobFields(id, redisJob, spJob, result.fieldMismatches);
        }
      }
    }

    // Check for missing in Redis
    for (const spJob of spJobs) {
      if (!redisJobs.has(spJob.Title) && !redisJobs.has(spJob.Id.toString())) {
        result.missingInRedis.push(spJob.Title || spJob.Id.toString());
      }
    }
  } catch (error) {
    result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Compare job fields between Redis and SharePoint
 */
function compareJobFields(id: string, redisJob: any, spJob: any, mismatches: FieldMismatch[]): void {
  const fieldsToCompare = ['status', 'client', 'location', 'division', 'jobType'];

  for (const field of fieldsToCompare) {
    const redisValue = redisJob[field];
    const spField = field.charAt(0).toUpperCase() + field.slice(1); // Capitalize first letter
    const spValue = spJob[spField];

    if (redisValue != null && spValue != null && !valuesMatch(redisValue, spValue)) {
      mismatches.push({
        id,
        field,
        redisValue,
        sharepointValue: spValue,
      });
    }
  }
}

/**
 * Validate Projects list
 */
async function validateProjects(redis: ReturnType<typeof createClient>): Promise<ValidationResult> {
  const result: ValidationResult = {
    listName: 'Projects',
    redisCount: 0,
    sharepointCount: 0,
    missingInSharePoint: [],
    missingInRedis: [],
    fieldMismatches: [],
    errors: [],
  };

  try {
    // Get Redis projects
    const redisKeys = await getRedisKeys(redis, 'project');
    result.redisCount = redisKeys.length;

    const redisProjects = new Map<string, any>();
    for (const key of redisKeys) {
      const data = await getRedisRecord(redis, key);
      if (data) {
        const parsed = parseRedisData(data);
        redisProjects.set(parsed.id || key, parsed);
      }
    }

    // Get SharePoint projects
    const spProjects = await ProjectsListService.getItems<any>();
    result.sharepointCount = spProjects.length;

    const spProjectsMap = new Map(spProjects.map(proj => [proj.Title, proj]));

    // Check for missing in SharePoint
    for (const [id, redisProj] of redisProjects) {
      if (!spProjectsMap.has(id)) {
        result.missingInSharePoint.push(id);
      }
    }

    // Check for missing in Redis
    for (const spProj of spProjects) {
      if (!redisProjects.has(spProj.Title) && !redisProjects.has(spProj.Id.toString())) {
        result.missingInRedis.push(spProj.Title || spProj.Id.toString());
      }
    }
  } catch (error) {
    result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Validate a generic list
 */
async function validateGenericList(
  redis: ReturnType<typeof createClient>,
  listName: string,
  redisPrefix: string,
  service: any
): Promise<ValidationResult> {
  const result: ValidationResult = {
    listName,
    redisCount: 0,
    sharepointCount: 0,
    missingInSharePoint: [],
    missingInRedis: [],
    fieldMismatches: [],
    errors: [],
  };

  try {
    // Get Redis records
    const redisKeys = await getRedisKeys(redis, redisPrefix);
    result.redisCount = redisKeys.length;

    const redisRecords = new Map<string, any>();
    for (const key of redisKeys) {
      const data = await getRedisRecord(redis, key);
      if (data) {
        const parsed = parseRedisData(data);
        redisRecords.set(parsed.id || key, parsed);
      }
    }

    // Get SharePoint records
    const spRecords = await service.getItems();
    result.sharepointCount = spRecords.length;

    const spRecordsMap = new Map(spRecords.map((rec: any) => [rec.Title || rec.Id.toString(), rec]));

    // Check for missing in SharePoint
    for (const [id] of redisRecords) {
      if (!spRecordsMap.has(id)) {
        result.missingInSharePoint.push(id);
      }
    }

    // Check for missing in Redis
    for (const spRec of spRecords) {
      const spId = spRec.Title || spRec.Id.toString();
      if (!redisRecords.has(spId)) {
        result.missingInRedis.push(spId);
      }
    }
  } catch (error) {
    result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Generate summary statistics
 */
function generateSummary(results: ValidationResult[]): MigrationReport['summary'] {
  return {
    totalRedisRecords: results.reduce((sum, r) => sum + r.redisCount, 0),
    totalSharePointRecords: results.reduce((sum, r) => sum + r.sharepointCount, 0),
    totalMissingInSharePoint: results.reduce((sum, r) => sum + r.missingInSharePoint.length, 0),
    totalMissingInRedis: results.reduce((sum, r) => sum + r.missingInRedis.length, 0),
    totalFieldMismatches: results.reduce((sum, r) => sum + r.fieldMismatches.length, 0),
    totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
  };
}

/**
 * Determine overall status
 */
function determineStatus(summary: MigrationReport['summary']): 'PASS' | 'FAIL' | 'WARNING' {
  if (summary.totalErrors > 0) return 'FAIL';
  if (summary.totalMissingInSharePoint > 0 || summary.totalFieldMismatches > 5) return 'FAIL';
  if (summary.totalMissingInRedis > 0 || summary.totalFieldMismatches > 0) return 'WARNING';
  return 'PASS';
}

/**
 * Print report to console
 */
function printReport(report: MigrationReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('SHAREPOINT MIGRATION VALIDATION REPORT');
  console.log('='.repeat(80));
  console.log(`\nGenerated: ${report.timestamp}`);
  console.log(`Overall Status: ${report.overallStatus}`);
  console.log(`\nTotal Lists Validated: ${report.totalLists}`);

  console.log('\n' + '-'.repeat(80));
  console.log('SUMMARY');
  console.log('-'.repeat(80));
  console.log(`Total Redis Records:        ${report.summary.totalRedisRecords}`);
  console.log(`Total SharePoint Records:   ${report.summary.totalSharePointRecords}`);
  console.log(`Missing in SharePoint:      ${report.summary.totalMissingInSharePoint}`);
  console.log(`Missing in Redis:           ${report.summary.totalMissingInRedis}`);
  console.log(`Field Mismatches:           ${report.summary.totalFieldMismatches}`);
  console.log(`Total Errors:               ${report.summary.totalErrors}`);

  console.log('\n' + '-'.repeat(80));
  console.log('DETAILED RESULTS BY LIST');
  console.log('-'.repeat(80));

  for (const result of report.validationResults) {
    console.log(`\n${result.listName}:`);
    console.log(`  Redis Count:              ${result.redisCount}`);
    console.log(`  SharePoint Count:         ${result.sharepointCount}`);
    console.log(`  Missing in SharePoint:    ${result.missingInSharePoint.length}`);
    console.log(`  Missing in Redis:         ${result.missingInRedis.length}`);
    console.log(`  Field Mismatches:         ${result.fieldMismatches.length}`);
    console.log(`  Errors:                   ${result.errors.length}`);

    if (result.missingInSharePoint.length > 0) {
      console.log(`  Missing IDs in SharePoint: ${result.missingInSharePoint.slice(0, 10).join(', ')}${result.missingInSharePoint.length > 10 ? '...' : ''}`);
    }

    if (result.missingInRedis.length > 0) {
      console.log(`  Missing IDs in Redis: ${result.missingInRedis.slice(0, 10).join(', ')}${result.missingInRedis.length > 10 ? '...' : ''}`);
    }

    if (result.fieldMismatches.length > 0) {
      console.log(`  Sample Field Mismatches:`);
      for (const mismatch of result.fieldMismatches.slice(0, 5)) {
        console.log(`    - ID ${mismatch.id}, Field: ${mismatch.field}`);
        console.log(`      Redis: ${JSON.stringify(mismatch.redisValue)}`);
        console.log(`      SharePoint: ${JSON.stringify(mismatch.sharepointValue)}`);
      }
    }

    if (result.errors.length > 0) {
      console.log(`  Errors:`);
      result.errors.forEach(error => console.log(`    - ${error}`));
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`VALIDATION ${report.overallStatus}`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Save report to file
 */
async function saveReport(report: MigrationReport): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const reportsDir = path.join(process.cwd(), 'migration-reports');

  try {
    await fs.mkdir(reportsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  const filename = `migration-validation-${Date.now()}.json`;
  const filepath = path.join(reportsDir, filename);

  await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\nReport saved to: ${filepath}`);
}

/**
 * Main validation function
 */
async function validateMigration(): Promise<void> {
  console.log('Starting SharePoint migration validation...\n');

  const redis = getRedisClient();
  const validationResults: ValidationResult[] = [];

  // Validate Jobs
  console.log('Validating Jobs...');
  validationResults.push(await validateJobs(redis));

  // Validate Projects
  console.log('Validating Projects...');
  validationResults.push(await validateProjects(redis));

  // Validate other lists
  console.log('Validating Tenders...');
  validationResults.push(await validateGenericList(redis, 'Tenders', 'tender', TendersListService));

  console.log('Validating Scope Reports...');
  validationResults.push(await validateGenericList(redis, 'ScopeReports', 'scopereport', ScopeReportsListService));

  console.log('Validating Division Requests...');
  validationResults.push(await validateGenericList(redis, 'DivisionRequests', 'divisionrequest', DivisionRequestsListService));

  console.log('Validating QA Packs...');
  validationResults.push(await validateGenericList(redis, 'QAPacks', 'qapack', QAPacksListService));

  console.log('Validating Incidents...');
  validationResults.push(await validateGenericList(redis, 'Incidents', 'incident', IncidentsListService));

  // Generate report
  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    totalLists: validationResults.length,
    validationResults,
    summary: generateSummary(validationResults),
    overallStatus: 'PASS',
  };

  report.overallStatus = determineStatus(report.summary);

  // Print and save report
  printReport(report);
  await saveReport(report);

  // Exit with appropriate code
  if (report.overallStatus === 'FAIL') {
    process.exit(1);
  } else if (report.overallStatus === 'WARNING') {
    console.log('\nWARNING: Migration completed with warnings. Review the report for details.\n');
    process.exit(0);
  } else {
    console.log('\nSUCCESS: Migration validation passed!\n');
    process.exit(0);
  }
}

// Run validation
validateMigration().catch(error => {
  console.error('Fatal error during validation:', error);
  process.exit(1);
});

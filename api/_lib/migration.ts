// api/_lib/migration.ts
import { FinalQaPack, Job, DailyJobSheetData } from '../../src/types.js';

// This constant is the single source of truth for the current data structure version.
// Increment this number whenever a breaking change is made to the data structures.
export const LATEST_SCHEMA_VERSION = 2;

// --- MIGRATION FUNCTIONS ---
// Each function handles migrating from one version to the next.

/**
 * Migrates a V1 report object to a V2 report object.
 * V2's primary goal is to enforce data integrity by ensuring all properties
 * that should be arrays are initialized as empty arrays if they are missing.
 * This prevents runtime errors like "cannot read property 'map' of undefined".
 */
const fromV1toV2 = (report: any): any => {
    const r = { ...report };

    // Ensure all optional array properties exist to prevent crashes in the frontend.
    if (r.sgaDailyReport) {
        if (!r.sgaDailyReport.weatherConditions) r.sgaDailyReport.weatherConditions = [];
        if (!r.sgaDailyReport.correctorDetails) r.sgaDailyReport.correctorDetails = [];
        if (!r.sgaDailyReport.trucks) r.sgaDailyReport.trucks = [];
        if (!r.sgaDailyReport.onSiteTests) r.sgaDailyReport.onSiteTests = [];
    }
    if (r.siteRecord) {
        if (!r.siteRecord.hazardLog) r.siteRecord.hazardLog = [];
        if (!r.siteRecord.siteVisitors) r.siteRecord.siteVisitors = [];
    }
    if (r.asphaltPlacement && !r.asphaltPlacement.placements) {
        r.asphaltPlacement.placements = [];
    }
    if (r.straightEdge && !r.straightEdge.tests) {
        r.straightEdge.tests = [];
    }
    if (r.itpChecklist && !r.itpChecklist.sections) {
        r.itpChecklist.sections = [];
    }
    if (r.sprayReport && !r.sprayReport.runs) {
        r.sprayReport.runs = [];
    }

    r.schemaVersion = 2;
    return r;
};


// --- PUBLIC MIGRATION HANDLERS ---
// These are the main functions used by API endpoints to process data.

/**
 * Takes any report object, checks its version, and applies all necessary
 * migrations sequentially to bring it up to the LATEST_SCHEMA_VERSION.
 * @param report The raw report object parsed from Redis JSON.
 * @returns A report object conforming to the latest schema.
 */
export const migrateReport = (report: any): FinalQaPack => {
    let version = report.schemaVersion || 1; // Default to version 1 if schemaVersion is missing.
    let migratedReport = { ...report };

    if (version < 2) {
        migratedReport = fromV1toV2(migratedReport);
    }
    // if (version < 3) {
    //     migratedReport = fromV2toV3(migratedReport);
    // }
    // ... future migrations will be chained here.

    return migratedReport as FinalQaPack;
};

/**
 * Migrates a job object to the latest schema version.
 */
export const migrateJob = (job: any): Job => {
    let version = job.schemaVersion || 1;
    let migratedJob = { ...job };
    
    if (version < 2) {
        // Data Integrity Fix: Ensure job.location is always a string.
        // Older versions may have stored location as an object { address: string }.
        // This prevents "Objects are not valid as a React child" errors when rendering.
        if (typeof migratedJob.location === 'object' && migratedJob.location !== null) {
            migratedJob.location = migratedJob.location.address || '[Invalid Location Data]';
        }

        migratedJob.schemaVersion = 2;
    }
    
    return migratedJob as Job;
};

/**
 * Migrates a job sheet object to the latest schema version.
 */
export const migrateJobSheet = (jobSheet: any): DailyJobSheetData => {
    // No migrations for JobSheet type yet, but the structure is here for the future.
    let version = jobSheet.schemaVersion || 1;
    let migratedJobSheet = { ...jobSheet };
    
    if (version < 2) {
         migratedJobSheet.schemaVersion = 2;
    }

    return migratedJobSheet as DailyJobSheetData;
};
/**
 * @file src/lib/sharepoint/qa-forms-schema.ts
 * @description SharePoint List Schemas for QA Forms
 *
 * This file defines the SharePoint list column structures for:
 * - ITR (Inspection Test Reports) - SGA-QA-ITR-001, ITR-002
 * - ITP (Inspection Test Plans) - SGA-ITP-001 through ITP-005
 * - Updated QA Forms (FRM-003, FRM-005, FRM-007)
 *
 * Use these schemas to create lists in SharePoint or validate data.
 */

import { SharePointListItem } from './types';

// ============================================================================
// ITR (INSPECTION TEST REPORT) SCHEMA
// ============================================================================

/**
 * SharePoint list column definition for ITR Asphalt Laying
 * List Name: SGA_ITR_AsphaltLaying
 */
export interface SharePointItrItem extends SharePointListItem {
  // Header Fields
  Title: string;              // ITR Number (e.g., "ITR-JOB123-1732800000")
  JobId: string;              // Reference to Job
  ItrType: string;            // "asphalt-laying" | "profiling"
  ProjectName: string;
  Client: string;
  Description: string;
  ProjectDocNo: string;
  DateLaid: string;           // ISO date
  LotNumber: string;
  WorkArea: string;
  Chainage: string;

  // Inspection Data (JSON stringified)
  InspectionItems: string;    // JSON array of ItrInspectionItem

  // Sign-off Fields
  SgaRepName: string;
  SgaRepPosition: string;
  SgaRepSignature: string;    // Document library reference or base64
  SgaRepDate: string;
  ClientRepName: string;
  ClientRepPosition: string;
  ClientRepSignature: string; // Document library reference or base64
  ClientRepDate: string;

  // Metadata
  Comments: string;
  Status: string;             // "Draft" | "Submitted" | "Approved" | "Rejected"
  SubmittedBy: string;
  SubmittedAt: string;
  Version: number;
}

/**
 * SharePoint list schema definition for ITR List
 * Use this to create the list in SharePoint
 */
export const ITR_LIST_SCHEMA = {
  listName: 'SGA_ITR_AsphaltLaying',
  description: 'Inspection Test Reports for Asphalt Laying per SGA-QA-ITR-002',
  columns: [
    { name: 'JobId', type: 'Text', required: true, indexed: true },
    { name: 'ItrType', type: 'Choice', required: true, choices: ['asphalt-laying', 'profiling'] },
    { name: 'ProjectName', type: 'Text', required: true },
    { name: 'Client', type: 'Text', required: true },
    { name: 'Description', type: 'Note' },
    { name: 'ProjectDocNo', type: 'Text' },
    { name: 'DateLaid', type: 'DateTime', required: true },
    { name: 'LotNumber', type: 'Text', required: true, indexed: true },
    { name: 'WorkArea', type: 'Text' },
    { name: 'Chainage', type: 'Text' },
    { name: 'InspectionItems', type: 'Note' }, // JSON
    { name: 'SgaRepName', type: 'Text' },
    { name: 'SgaRepPosition', type: 'Text' },
    { name: 'SgaRepSignature', type: 'Text' },
    { name: 'SgaRepDate', type: 'DateTime' },
    { name: 'ClientRepName', type: 'Text' },
    { name: 'ClientRepPosition', type: 'Text' },
    { name: 'ClientRepSignature', type: 'Text' },
    { name: 'ClientRepDate', type: 'DateTime' },
    { name: 'Comments', type: 'Note' },
    { name: 'Status', type: 'Choice', required: true, choices: ['Draft', 'Submitted', 'Approved', 'Rejected'] },
    { name: 'SubmittedBy', type: 'Text' },
    { name: 'SubmittedAt', type: 'DateTime' },
    { name: 'Version', type: 'Number' },
  ],
};

// ============================================================================
// ITP (INSPECTION TEST PLAN) SCHEMA
// ============================================================================

/**
 * SharePoint list column definition for ITP Forms
 * List Name: SGA_ITP_Forms
 */
export interface SharePointItpItem extends SharePointListItem {
  // Header Fields
  Title: string;              // ITP Number
  JobId: string;              // Reference to Job
  ItpType: string;            // "profiling" | "wearing-course" | "line-marking" | "grooving" | "seal"
  DocumentNumber: string;     // SGA-ITP-001, etc.
  Revision: string;
  Client: string;
  Project: string;
  Specifications: string;
  LotNo: string;
  LotDescription: string;
  PreparedBy: string;
  ApprovedBy: string;
  Date: string;

  // Activity Data (JSON stringified)
  Activities: string;         // JSON array of ItpActivityItem

  // Final Inspection
  FinalInspectionComplete: boolean;
  FinalInspectionDate: string;
  FinalInspectorName: string;
  FinalInspectorSignature: string;

  // Metadata
  Status: string;             // "In Progress" | "Completed" | "Completed with NCRs"
  SubmittedBy: string;
  SubmittedAt: string;
  Version: number;
  NonConformingItems: number;
}

/**
 * SharePoint list schema definition for ITP List
 */
export const ITP_LIST_SCHEMA = {
  listName: 'SGA_ITP_Forms',
  description: 'Inspection Test Plans per SGA-ITP-001 through ITP-005',
  columns: [
    { name: 'JobId', type: 'Text', required: true, indexed: true },
    { name: 'ItpType', type: 'Choice', required: true, choices: ['profiling', 'wearing-course', 'line-marking', 'grooving', 'seal'] },
    { name: 'DocumentNumber', type: 'Text', required: true },
    { name: 'Revision', type: 'Text' },
    { name: 'Client', type: 'Text', required: true },
    { name: 'Project', type: 'Text', required: true },
    { name: 'Specifications', type: 'Text' },
    { name: 'LotNo', type: 'Text', required: true, indexed: true },
    { name: 'LotDescription', type: 'Text' },
    { name: 'PreparedBy', type: 'Text' },
    { name: 'ApprovedBy', type: 'Text' },
    { name: 'Date', type: 'DateTime' },
    { name: 'Activities', type: 'Note' }, // JSON
    { name: 'FinalInspectionComplete', type: 'Boolean' },
    { name: 'FinalInspectionDate', type: 'DateTime' },
    { name: 'FinalInspectorName', type: 'Text' },
    { name: 'FinalInspectorSignature', type: 'Text' },
    { name: 'Status', type: 'Choice', required: true, choices: ['In Progress', 'Completed', 'Completed with NCRs'] },
    { name: 'SubmittedBy', type: 'Text' },
    { name: 'SubmittedAt', type: 'DateTime' },
    { name: 'Version', type: 'Number' },
    { name: 'NonConformingItems', type: 'Number' },
  ],
};

// ============================================================================
// STRAIGHT EDGE TEST SCHEMA (Updated FRM-005)
// ============================================================================

/**
 * SharePoint list column definition for Straight Edge Tests
 * List Name: SGA_StraightEdgeTests
 */
export interface SharePointStraightEdgeItem extends SharePointListItem {
  Title: string;              // Test ID
  JobId: string;
  LotNo: string;
  Date: string;               // New field per SGA-QA-FRM-005
  Location: string;           // New field per SGA-QA-FRM-005
  MixType: string;
  TestedBy: string;
  StraightEdgeId: string;
  Tests: string;              // JSON array of test results
  Supervisor: string;
  SupervisorSignature: string; // New field per SGA-QA-FRM-005
  Status: string;
  SubmittedAt: string;
}

/**
 * SharePoint list schema for Straight Edge Tests
 */
export const STRAIGHT_EDGE_LIST_SCHEMA = {
  listName: 'SGA_StraightEdgeTests',
  description: 'Straight Edge Testing Records per SGA-QA-FRM-005',
  columns: [
    { name: 'JobId', type: 'Text', required: true, indexed: true },
    { name: 'LotNo', type: 'Text', required: true },
    { name: 'Date', type: 'DateTime', required: true },
    { name: 'Location', type: 'Text', required: true },
    { name: 'MixType', type: 'Text' },
    { name: 'TestedBy', type: 'Text', required: true },
    { name: 'StraightEdgeId', type: 'Text' },
    { name: 'Tests', type: 'Note' }, // JSON
    { name: 'Supervisor', type: 'Text' },
    { name: 'SupervisorSignature', type: 'Text' },
    { name: 'Status', type: 'Choice', choices: ['Draft', 'Submitted', 'Approved'] },
    { name: 'SubmittedAt', type: 'DateTime' },
  ],
};

// ============================================================================
// ASPHALT PLACEMENT SCHEMA (Updated FRM-003)
// ============================================================================

/**
 * SharePoint list column definition for Asphalt Placement Records
 * List Name: SGA_AsphaltPlacement
 */
export interface SharePointAsphaltPlacementItem extends SharePointListItem {
  Title: string;              // Record ID
  JobId: string;
  Date: string;
  LotNo: string;
  SheetNo: string;
  Material: string;           // New field per SGA-QA-FRM-003
  PavementSurfaceCondition: string;
  RainfallDuringShift: string;
  RainfallActions: string;
  RollingPatternId: string;
  WeatherConditions: string;  // JSON
  Placements: string;         // JSON
  Status: string;
  SubmittedAt: string;
}

/**
 * SharePoint list schema for Asphalt Placement Records
 */
export const ASPHALT_PLACEMENT_LIST_SCHEMA = {
  listName: 'SGA_AsphaltPlacement',
  description: 'Asphalt Placement Records per SGA-QA-FRM-003',
  columns: [
    { name: 'JobId', type: 'Text', required: true, indexed: true },
    { name: 'Date', type: 'DateTime', required: true },
    { name: 'LotNo', type: 'Text', required: true },
    { name: 'SheetNo', type: 'Text' },
    { name: 'Material', type: 'Text' },
    { name: 'PavementSurfaceCondition', type: 'Choice', choices: ['Dry', 'Damp', 'Wet'] },
    { name: 'RainfallDuringShift', type: 'Choice', choices: ['Yes', 'No'] },
    { name: 'RainfallActions', type: 'Note' },
    { name: 'RollingPatternId', type: 'Text' },
    { name: 'WeatherConditions', type: 'Note' }, // JSON
    { name: 'Placements', type: 'Note' }, // JSON
    { name: 'Status', type: 'Choice', choices: ['Draft', 'Submitted', 'Approved'] },
    { name: 'SubmittedAt', type: 'DateTime' },
  ],
};

// ============================================================================
// DAILY REPORT SCHEMA (Updated FRM-007)
// ============================================================================

/**
 * SharePoint list column definition for Daily Reports
 * List Name: SGA_DailyReports
 */
export interface SharePointDailyReportItem extends SharePointListItem {
  Title: string;              // Report ID
  JobId: string;
  Project: string;
  Date: string;
  CompletedBy: string;
  StartTime: string;
  FinishTime: string;
  WeatherConditions: string;  // JSON
  Works: string;              // JSON
  ActualWorks: string;        // JSON
  CorrectorUsed: string;
  CorrectorDetails: string;   // JSON
  SiteInstructions: string;
  AdditionalComments: string;
  // SGA Sign-off (New per SGA-QA-FRM-007)
  SgaSignName: string;
  SgaSignature: string;
  // Client Sign-off
  ClientSignName: string;
  ClientSignature: string;
  PlantEquipment: string;     // JSON
  Trucks: string;             // JSON
  Labour: string;             // JSON
  OnSiteTests: string;        // JSON
  OtherComments: string;
  TeethUsage: string;
  Status: string;
  SubmittedAt: string;
}

/**
 * SharePoint list schema for Daily Reports
 */
export const DAILY_REPORT_LIST_SCHEMA = {
  listName: 'SGA_DailyReports',
  description: 'Daily Foreman Reports per SGA-QA-FRM-007',
  columns: [
    { name: 'JobId', type: 'Text', required: true, indexed: true },
    { name: 'Project', type: 'Text', required: true },
    { name: 'Date', type: 'DateTime', required: true, indexed: true },
    { name: 'CompletedBy', type: 'Text', required: true },
    { name: 'StartTime', type: 'Text' },
    { name: 'FinishTime', type: 'Text' },
    { name: 'WeatherConditions', type: 'Note' },
    { name: 'Works', type: 'Note' },
    { name: 'ActualWorks', type: 'Note' },
    { name: 'CorrectorUsed', type: 'Choice', choices: ['Yes', 'No'] },
    { name: 'CorrectorDetails', type: 'Note' },
    { name: 'SiteInstructions', type: 'Note' },
    { name: 'AdditionalComments', type: 'Note' },
    { name: 'SgaSignName', type: 'Text' },
    { name: 'SgaSignature', type: 'Text' },
    { name: 'ClientSignName', type: 'Text' },
    { name: 'ClientSignature', type: 'Text' },
    { name: 'PlantEquipment', type: 'Note' },
    { name: 'Trucks', type: 'Note' },
    { name: 'Labour', type: 'Note' },
    { name: 'OnSiteTests', type: 'Note' },
    { name: 'OtherComments', type: 'Note' },
    { name: 'TeethUsage', type: 'Text' },
    { name: 'Status', type: 'Choice', choices: ['Draft', 'Submitted', 'Approved'] },
    { name: 'SubmittedAt', type: 'DateTime' },
  ],
};

// ============================================================================
// ALL SCHEMAS EXPORT
// ============================================================================

/**
 * All QA Form SharePoint list schemas
 */
export const QA_FORM_SCHEMAS = {
  itr: ITR_LIST_SCHEMA,
  itp: ITP_LIST_SCHEMA,
  straightEdge: STRAIGHT_EDGE_LIST_SCHEMA,
  asphaltPlacement: ASPHALT_PLACEMENT_LIST_SCHEMA,
  dailyReport: DAILY_REPORT_LIST_SCHEMA,
} as const;

/**
 * Script to create all QA Form lists in SharePoint
 * Run this using PnP PowerShell or CLI
 */
export const CREATE_LISTS_SCRIPT = `
# PowerShell Script to Create QA Form Lists in SharePoint
# Requires: PnP.PowerShell module

$siteUrl = $env:SHAREPOINT_SITE_URL
Connect-PnPOnline -Url $siteUrl -Interactive

# Create ITR List
$itrList = New-PnPList -Title "SGA_ITR_AsphaltLaying" -Template GenericList
Add-PnPField -List $itrList -DisplayName "JobId" -InternalName "JobId" -Type Text -Required
Add-PnPField -List $itrList -DisplayName "ItrType" -InternalName "ItrType" -Type Choice -Choices "asphalt-laying","profiling"
# ... additional fields ...

# Create ITP List
$itpList = New-PnPList -Title "SGA_ITP_Forms" -Template GenericList
Add-PnPField -List $itpList -DisplayName "JobId" -InternalName "JobId" -Type Text -Required
Add-PnPField -List $itpList -DisplayName "ItpType" -InternalName "ItpType" -Type Choice -Choices "profiling","wearing-course","line-marking","grooving","seal"
# ... additional fields ...

Write-Host "QA Form lists created successfully!"
`;

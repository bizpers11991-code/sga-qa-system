/**
 * Project Management Module Types
 *
 * This file contains all TypeScript types for the Project Management evolution
 * of the SGA QA System, including:
 * - Tender Administration
 * - Project Management
 * - Scope Reports
 * - Cross-Division Coordination
 */

/**
 * Tender Handover Form
 *
 * Created by tender_admin when company wins a job.
 * Contains all project details for handover to project owner.
 */
export interface TenderHandover {
  id: string;
  handoverNumber: string;  // e.g., HO-2025-001
  dateCreated: string;
  createdBy: string;       // tender_admin id

  // Client Details
  clientId: string;
  clientName: string;
  clientTier: 'Tier 1' | 'Tier 2' | 'Tier 3';

  // Project Details
  projectName: string;
  projectDescription: string;
  location: string;
  estimatedStartDate: string;
  estimatedEndDate: string;

  // Divisions Required
  divisionsRequired: {
    asphalt: boolean;
    profiling: boolean;
    spray: boolean;
  };

  // Assignment
  projectOwnerId: string;    // asphalt_engineer/admin (primary owner)
  scopingPersonId: string;   // Person who will do site visits

  // Technical Details (Optional)
  estimatedArea?: number;
  estimatedThickness?: number;
  asphaltPlant?: string;
  specialRequirements?: string;

  // Contract Details (Optional)
  contractValue?: number;
  contractNumber?: string;
  purchaseOrderNumber?: string;

  // Attachments
  attachments?: {
    fileId: string;
    fileName: string;
    fileType: string;
    uploadedAt: string;
  }[];

  // Status
  status: 'Draft' | 'Submitted' | 'Active' | 'Completed' | 'On Hold';
}

/**
 * Project Division
 *
 * Represents a division's involvement in a project (Asphalt, Profiling, or Spray).
 */
export interface ProjectDivision {
  division: 'Asphalt' | 'Profiling' | 'Spray';
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Completed';
  assignedEngineerId?: string;  // Division engineer/admin
  assignedCrewIds: string[];
  scheduledDates: string[];
  completedDates: string[];
  qaPackIds: string[];
}

/**
 * Project
 *
 * Core project entity that evolves from Job.
 * A project spans multiple days and divisions, containing multiple jobs.
 */
export interface Project {
  id: string;
  projectNumber: string;     // e.g., PRJ-2025-001
  handoverId: string;        // Link to TenderHandover

  // Core Details
  projectName: string;
  client: string;
  clientTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  location: string;

  // Ownership
  projectOwnerId: string;     // Primary (usually asphalt engineer)
  projectOwnerDivision: 'Asphalt' | 'Profiling' | 'Spray';
  scopingPersonId: string;

  // Timeline
  estimatedStartDate: string;
  estimatedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;

  // Divisions & Sub-Projects
  divisions: ProjectDivision[];

  // Status
  status: 'Scoping' | 'Scheduled' | 'In Progress' | 'QA Review' | 'Completed' | 'On Hold';

  // Related Jobs (Day-by-day work)
  jobIds: string[];

  // Scope Reports
  scopeReportIds: string[];

  // Calendar Events
  siteVisitEventIds?: string[];
  projectCalendarEventId?: string;

  // QA Summary
  qaPackIds?: string[];
  ncrIds?: string[];
  incidentIds?: string[];
}

/**
 * Site Photo with Location
 *
 * Enhanced from existing SitePhoto to include GPS coordinates.
 */
export interface ScopeReportPhoto {
  name: string;
  data: string; // base64 data URL
  description: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

/**
 * Site Accessibility Assessment
 */
export interface SiteAccessibility {
  accessible: boolean;
  accessNotes: string;
  restrictions: string[];
}

/**
 * Surface Condition Assessment
 */
export interface SurfaceCondition {
  currentCondition: 'Good' | 'Fair' | 'Poor' | 'Critical';
  defects: string[];
  photos: ScopeReportPhoto[];
}

/**
 * Site Measurements
 */
export interface SiteMeasurements {
  area: number;
  depth: number;
  chainages: { start: number; end: number }[];
}

/**
 * Traffic Management Requirements
 */
export interface TrafficManagement {
  required: boolean;
  tmpRequired: boolean;
  restrictions: string[];
  notes: string;
}

/**
 * Utilities Assessment
 */
export interface UtilitiesAssessment {
  identified: boolean;
  services: string[];  // Gas, Water, Telstra, etc.
  photos: ScopeReportPhoto[];
}

/**
 * Hazard Assessment
 */
export interface HazardAssessment {
  identified: boolean;
  hazardList: { hazard: string; control: string }[];
}

/**
 * Scope Report
 *
 * Site assessment report completed by scoping person.
 * Tier 1 clients: 3 visits (14-day, 7-day, 3-day)
 * Tier 2 clients: 2 visits (7-day, 3-day)
 * Tier 3 clients: 1 visit (72-hour)
 */
export interface ScopeReport {
  id: string;
  reportNumber: string;  // e.g., SCR-2025-001-01 (project-visit#)
  projectId: string;

  // Visit Details
  visitNumber: number;   // 1, 2, or 3 based on tier
  visitType: '14-Day' | '7-Day' | '3-Day' | '72-Hour';
  scheduledDate: string;
  actualDate: string;
  completedBy: string;   // Scoping person ID

  // Site Assessment
  siteAccessibility: SiteAccessibility;
  surfaceCondition: SurfaceCondition;
  measurements: SiteMeasurements;
  trafficManagement: TrafficManagement;
  utilities: UtilitiesAssessment;
  hazards: HazardAssessment;

  recommendations: string;
  estimatedDuration: number;  // Days

  // Attachments
  photos: ScopeReportPhoto[];
  documents?: { fileId: string; fileName: string }[];

  // Sign-off
  signature: string;
  signedAt: string;

  // Status
  status: 'Draft' | 'Submitted' | 'Reviewed';
}

/**
 * Division Request
 *
 * Request from one division to another for crew assignment.
 * Example: Asphalt engineer requests profiling crew for a project.
 */
export interface DivisionRequest {
  id: string;
  requestNumber: string;
  projectId: string;

  // Request Details
  requestedBy: string;      // Project owner ID
  requestedDivision: 'Profiling' | 'Spray' | 'Asphalt';
  requestedTo: string;      // Division engineer ID

  // Work Details
  workDescription: string;
  location: string;
  requestedDates: string[];

  // Status
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Completed';
  assignedCrewId?: string;
  assignedForemanId?: string;

  // Response
  responseNotes?: string;
  confirmedDates?: string[];

  // Completion
  completedAt?: string;
  qaPackId?: string;
}

/**
 * Scheduler View Filters
 *
 * Filter options for the enhanced project-aware scheduler.
 */
export interface SchedulerFilters {
  divisions: ('Asphalt' | 'Profiling' | 'Spray')[];
  crews: string[];
  engineers: string[];
  status: string[];
}

/**
 * Crew Availability
 *
 * Tracks crew assignments across projects.
 */
export interface CrewAvailability {
  crewId: string;
  crewName: string;
  division: string;
  assignments: {
    date: string;
    projectId: string;
    jobId: string;
  }[];
}

/**
 * Resource Allocation
 *
 * Daily resource allocation by division.
 */
export interface ResourceAllocation {
  date: string;
  division: string;
  availableCrews: number;
  assignedCrews: number;
  availableEquipment: string[];
  assignedEquipment: string[];
}

/**
 * Scheduler View
 *
 * Enhanced scheduler with project awareness and resource allocation.
 */
export interface SchedulerView {
  // Master Calendar (Teams-integrated)
  masterCalendar: {
    viewType: 'Week' | 'Month' | 'Timeline';
    filters: SchedulerFilters;
  };

  // Crew Availability
  crewAvailability: CrewAvailability[];

  // Resource Allocation
  resourceAllocation: ResourceAllocation[];
}

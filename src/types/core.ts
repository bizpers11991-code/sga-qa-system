/**
 * SGA QA System - Core Type Definitions
 *
 * Unified and standardized types used across the application.
 * This file consolidates common patterns and eliminates redundancy.
 */

// ============================================================================
// COMMON ENUMS AND TYPES
// ============================================================================

export type Division = 'Asphalt' | 'Profiling' | 'Spray';
export type EquipmentDivision = Division | 'Transport' | 'Common';
export type ClientTier = 'Tier 1' | 'Tier 2' | 'Tier 3';

// Job Status - Extended workflow states
export type JobStatus =
  | 'Draft'
  | 'Pending'
  | 'Scheduled'
  | 'In Progress'
  | 'QA Pending'
  | 'QA Review'
  | 'Rework Required'
  | 'On Hold'
  | 'Completed'
  | 'Cancelled';

// Legacy status for backward compatibility
export type LegacyJobStatus = 'Pending' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';

export type ProjectStatus =
  | 'Handover'
  | 'Scoping'
  | 'Scheduled'
  | 'In Progress'
  | 'QA Review'
  | 'On Hold'
  | 'Completed';

export type ReportStatus = 'Pending Review' | 'Requires Action' | 'Approved' | 'Archived';

export type IncidentStatus = 'Open' | 'Under Investigation' | 'Closed';
export type IncidentType = 'Incident' | 'Near Miss' | 'Hazard Identification';
export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type NCRStatus = 'Open' | 'Under Review' | 'Closed';
export type NCRSeverity = 'Minor' | 'Major' | 'Critical';

export type EquipmentStatus = 'Available' | 'In Use' | 'Maintenance' | 'Out of Service';

export type CertificationStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Revoked';

export type ProficiencyLevel = 'Trainee' | 'Competent' | 'Proficient' | 'Expert';

// ============================================================================
// BASE ENTITY INTERFACE
// ============================================================================

export interface BaseEntity {
  id: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// ============================================================================
// UNIFIED PHOTO/ATTACHMENT TYPE
// ============================================================================

/**
 * Unified Photo type - replaces SitePhoto, DamagePhoto, IncidentPhoto, JobSheetImage
 */
export interface Photo {
  name: string;
  data: string; // base64 data URL
  description?: string;
  timestamp?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  category?: 'site' | 'damage' | 'incident' | 'jobsheet' | 'scope' | 'other';
}

/**
 * Generic Attachment type for documents
 */
export interface Attachment {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  uploadedAt: string;
  uploadedBy?: string;
  description?: string;
  url?: string;
}

// Legacy type aliases for backward compatibility
export type SitePhoto = Photo;
export type DamagePhoto = Photo;
export type IncidentPhoto = Photo;
export type JobSheetImage = Photo;

// ============================================================================
// API RESPONSE WRAPPER TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  pageSize: number;
  pageNumber: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FilterParams {
  filters?: Record<string, any>;
  sort?: { field: string; direction: 'asc' | 'desc' }[];
  page?: { size: number; number: number };
  search?: string;
}

// ============================================================================
// CREW MEMBER - ENHANCED
// ============================================================================

export interface CrewMember extends BaseEntity {
  employeeId: string;
  fullName: string;
  email: string;
  phone?: string;
  division: EquipmentDivision;
  secondaryDivisions?: Division[];
  role: CrewRole;
  systemRole?: SystemRole;
  crewName?: string;
  isForeman: boolean;
  isActive: boolean;
  startDate?: string;
  // Competency tracking
  certifications?: CrewCertification[];
  equipmentQualifications?: string[]; // Equipment IDs they can operate
  specialSkills?: string;
  proficiencyLevel?: ProficiencyLevel;
  // Performance metrics
  utilizationRate?: number;
  qaScoreAvg?: number;
  safetyIncidentCount?: number;
  lastAssignmentDate?: string;
  notes?: string;
}

export type CrewRole = 'Foreman' | 'Operator' | 'Labourer' | 'Driver' | 'Engineer' | 'Superintendent' | 'Manager' | 'Admin';

export type SystemRole =
  | 'asphalt_foreman'
  | 'profiling_foreman'
  | 'spray_foreman'
  | 'asphalt_engineer'
  | 'profiling_engineer'
  | 'spray_admin'
  | 'scheduler_admin'
  | 'tender_admin'
  | 'management_admin'
  | 'hseq_manager';

export interface CrewCertification {
  certificationCode: string;
  certificationName: string;
  issueDate: string;
  expiryDate?: string;
  status: CertificationStatus;
  certificateNumber?: string;
  issuingAuthority?: string;
  documentUrl?: string;
}

// ============================================================================
// EQUIPMENT - ENHANCED
// ============================================================================

export interface Equipment extends BaseEntity {
  assetNumber: string; // SGA001, SGA002, etc.
  name: string;
  type: EquipmentType;
  division: EquipmentDivision;
  registrationNumber?: string;
  status: EquipmentStatus;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  // Tracking
  currentJobId?: string;
  currentCrewId?: string;
  lastServiceDate?: string;
  nextServiceDue?: string;
  // Metrics
  totalHoursUsed?: number;
  utilizationRate?: number;
  notes?: string;
}

export type EquipmentType = 'Paver' | 'Roller' | 'Truck' | 'Profiler' | 'Spray Unit' | 'Other Equipment';

// ============================================================================
// CLIENT - ENHANCED
// ============================================================================

export interface Client extends BaseEntity {
  clientId: string;
  clientName: string;
  tier: ClientTier;
  industry?: 'Government' | 'Private' | 'Mining' | 'Commercial' | 'Residential';
  primaryContact?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  billingAddress?: string;
  siteVisitFrequency?: 'Every Visit' | 'Weekly' | 'Fortnightly' | 'Monthly';
  qaRequirements?: Record<string, any>;
  contractTerms?: string;
  accountManager?: string;
  totalProjects?: number;
  activeProjects?: number;
  lifetimeValue?: number;
  isActive: boolean;
  notes?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ConfigurationItem extends BaseEntity {
  configKey: string;
  configValue: any; // Parsed JSON
  category: ConfigCategory;
  division?: Division | 'Global';
  isActive: boolean;
  effectiveDate?: string;
  expiryDate?: string;
  description?: string;
  lastModifiedBy?: string;
}

export type ConfigCategory =
  | 'MaterialSpecs'
  | 'TemperatureRequirements'
  | 'RoleMappings'
  | 'WorkflowRules'
  | 'ClientTierRules'
  | 'NotificationSettings'
  | 'FormDefaults'
  | 'ValidationRules'
  | 'System';

// ============================================================================
// NOTIFICATION RULES
// ============================================================================

export interface NotificationRule extends BaseEntity {
  ruleName: string;
  trigger: NotificationTrigger;
  conditions?: Record<string, any>;
  action: NotificationAction;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  channelWebhook?: string;
  emailRecipients?: string[];
  messageTemplate?: {
    title: string;
    body: string;
    placeholders?: string[];
  };
  delayMinutes?: number;
  escalationRuleId?: string;
  isActive: boolean;
  division?: Division | 'All';
}

export type NotificationTrigger =
  | 'JobCreated' | 'JobCompleted' | 'JobOverdue' | 'JobStatusChanged'
  | 'ProjectCreated' | 'ProjectCompleted' | 'ProjectOverdue'
  | 'QAPackSubmitted' | 'QAPackApproved' | 'QAPackRejected' | 'QAPackOverdue'
  | 'IncidentReported' | 'IncidentEscalated' | 'IncidentClosed'
  | 'NCRCreated' | 'NCRClosed'
  | 'CertificationExpiring' | 'CertificationExpired'
  | 'DivisionRequestCreated' | 'DivisionRequestAccepted' | 'DivisionRequestRejected'
  | 'ScopeReportDue' | 'ScopeReportSubmitted'
  | 'EquipmentMaintenance' | 'ResourceConflict';

export type NotificationAction = 'SendTeams' | 'SendEmail' | 'CreateTask' | 'InAppNotification' | 'Webhook';

// ============================================================================
// WORKFLOW STATE
// ============================================================================

export interface WorkflowState extends BaseEntity {
  entityType: 'Job' | 'Project' | 'QAPack' | 'Incident' | 'NCR' | 'ScopeReport';
  stateName: string;
  stateCode: string;
  displayOrder: number;
  colorCode?: string;
  iconName?: string;
  allowedTransitions: string[]; // Array of state codes
  requiredFields?: string[];
  requiredApprovals?: SystemRole[];
  autoEscalationDays?: number;
  escalationAction?: 'Notify' | 'Escalate' | 'Auto-Close' | 'None';
  isActive: boolean;
  isFinalState: boolean;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface JobAnalytics extends BaseEntity {
  jobId: string;
  jobNumber?: string;
  projectId?: string;
  division?: Division;
  client?: string;
  clientTier?: ClientTier;
  foremanId?: string;
  scheduledDate?: string;
  actualStartDate?: string;
  actualCompletionDate?: string;
  plannedDurationHours?: number;
  actualDurationHours?: number;
  durationVariance?: number;
  plannedArea?: number;
  actualArea?: number;
  plannedTonnes?: number;
  actualTonnes?: number;
  qaScore?: number;
  incidentCount?: number;
  ncrCount?: number;
  crewCount?: number;
  equipmentCount?: number;
  weatherConditions?: string;
  onTimeCompletion?: boolean;
  qaPackId?: string;
  calculatedAt?: string;
}

export interface DailyMetrics extends BaseEntity {
  metricDate: string;
  division: Division | 'All';
  jobsScheduled?: number;
  jobsCompleted?: number;
  jobsInProgress?: number;
  jobsOnHold?: number;
  jobsCancelled?: number;
  totalAreaCompleted?: number;
  totalTonnesLaid?: number;
  qaPacksSubmitted?: number;
  qaPacksPending?: number;
  qaPacksApproved?: number;
  qaPassRate?: number;
  incidentsReported?: number;
  ncrsRaised?: number;
  crewsDeployed?: number;
  equipmentUtilization?: number;
  weatherImpactedJobs?: number;
  averageJobDuration?: number;
  onTimeCompletionRate?: number;
}

export interface CrewAnalytics extends BaseEntity {
  crewMemberId: string;
  crewMemberName?: string;
  metricMonth: string;
  division?: Division;
  jobsAssigned?: number;
  jobsCompleted?: number;
  jobsOnTime?: number;
  totalHoursWorked?: number;
  utilizationRate?: number;
  averageQaScore?: number;
  safetyIncidents?: number;
  ncrsAssociated?: number;
  productivityScore?: number;
  certificationsActive?: number;
  certificationsExpired?: number;
}

// ============================================================================
// DROPDOWN OPTION
// ============================================================================

export interface DropdownOption extends BaseEntity {
  category: string;
  optionValue: string;
  optionLabel: string;
  sortOrder?: number;
  isActive: boolean;
  isDefault?: boolean;
  applicableDivisions?: Division[];
  dependsOn?: Record<string, any>;
  colorCode?: string;
  iconName?: string;
  description?: string;
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

export function isJobStatus(value: string): value is JobStatus {
  return ['Draft', 'Pending', 'Scheduled', 'In Progress', 'QA Pending', 'QA Review',
          'Rework Required', 'On Hold', 'Completed', 'Cancelled'].includes(value);
}

export function isDivision(value: string): value is Division {
  return ['Asphalt', 'Profiling', 'Spray'].includes(value);
}

export function isClientTier(value: string): value is ClientTier {
  return ['Tier 1', 'Tier 2', 'Tier 3'].includes(value);
}

export function isSystemRole(value: string): value is SystemRole {
  return [
    'asphalt_foreman', 'profiling_foreman', 'spray_foreman',
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'scheduler_admin', 'tender_admin', 'management_admin', 'hseq_manager'
  ].includes(value);
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make all properties in T optional except for keys in K
 */
export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

/**
 * Make all properties in T required except for keys in K
 */
export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Partial<Pick<T, K>>;

/**
 * Extract keys of T where the value is of type V
 */
export type KeysOfType<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];

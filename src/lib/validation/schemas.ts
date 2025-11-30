/**
 * Zod Validation Schemas
 *
 * Comprehensive input validation schemas for all SGA QA System entities.
 * These schemas ensure type safety and provide detailed error messages for invalid inputs.
 */

import { z } from 'zod';

// ============================================================================
// SHARED SCHEMAS
// ============================================================================

/**
 * Common date/time schemas
 */
const dateStringSchema = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

/**
 * Base user ID reference schema
 */
const userIdSchema = z.string().min(1, 'User ID is required').max(255);

/**
 * Common status schemas
 */
const jobStatusSchema = z.enum(['Pending', 'In Progress', 'Completed', 'On Hold'], {
  errorMap: () => ({ message: 'Invalid job status' })
});

const projectStatusSchema = z.enum(['Scoping', 'Scheduled', 'In Progress', 'QA Review', 'Completed', 'On Hold'], {
  errorMap: () => ({ message: 'Invalid project status' })
});

const divisionSchema = z.enum(['Asphalt', 'Profiling', 'Spray'], {
  errorMap: () => ({ message: 'Division must be Asphalt, Profiling, or Spray' })
});

const clientTierSchema = z.enum(['Tier 1', 'Tier 2', 'Tier 3'], {
  errorMap: () => ({ message: 'Client tier must be Tier 1, Tier 2, or Tier 3' })
});

// ============================================================================
// JOB SCHEMAS
// ============================================================================

/**
 * Base Job schema (without refinements) - Used for partial and extend
 */
const JobBaseSchema = z.object({
  jobNo: z.string()
    .min(1, 'Job number is required')
    .max(50, 'Job number must be 50 characters or less')
    .regex(/^[A-Z0-9\-_]+$/, 'Job number must contain only alphanumeric characters, hyphens, and underscores'),

  client: z.string()
    .min(1, 'Client name is required')
    .max(255, 'Client name must be 255 characters or less'),

  division: divisionSchema,

  projectName: z.string()
    .min(1, 'Project name is required')
    .max(255, 'Project name must be 255 characters or less'),

  location: z.string()
    .min(1, 'Location is required')
    .max(500, 'Location must be 500 characters or less'),

  foremanId: userIdSchema,

  jobDate: dateOnlySchema,

  dueDate: dateOnlySchema,

  area: z.number()
    .optional()
    .refine(val => val === undefined || val > 0, 'Area must be greater than 0'),

  thickness: z.number()
    .optional()
    .refine(val => val === undefined || val > 0, 'Thickness must be greater than 0'),

  workDescription: z.string()
    .min(1, 'Work description is required')
    .max(2000, 'Work description must be 2000 characters or less'),

  clientTier: clientTierSchema.optional(),

  qaSpec: z.string().optional(),

  itpTemplateId: z.string().optional(),

  requiredQaForms: z.array(z.string()).optional(),

  projectId: z.string().optional(),

  assignedCrewId: z.string().optional(),
}).strict();

/**
 * Schema for creating a new Job (with date validation)
 */
export const JobCreateSchema = JobBaseSchema.refine(
  (data) => {
    const jobDate = new Date(data.jobDate);
    const dueDate = new Date(data.dueDate);
    return dueDate >= jobDate;
  },
  {
    message: 'Due date must be on or after job date',
    path: ['dueDate']
  }
);

/**
 * Schema for updating a Job
 */
export const JobUpdateSchema = JobBaseSchema.partial();

/**
 * Schema for Job responses
 */
export const JobSchema = JobBaseSchema.extend({
  id: z.string(),
  status: jobStatusSchema,
  jobSheetData: z.any().optional(),
  asphaltDetails: z.any().optional(),
  profilingDetails: z.any().optional(),
  siteVisitEventIds: z.array(z.string()).optional(),
  jobCalendarEventId: z.string().optional(),
  schemaVersion: z.number().optional(),
});

// ============================================================================
// PROJECT SCHEMAS
// ============================================================================

/**
 * Schema for Project Division
 */
export const ProjectDivisionSchema = z.object({
  division: divisionSchema,
  status: z.enum(['Pending', 'Assigned', 'In Progress', 'Completed'], {
    errorMap: () => ({ message: 'Invalid division status' })
  }),
  assignedEngineerId: z.string().optional(),
  assignedCrewIds: z.array(z.string()).default([]),
  scheduledDates: z.array(dateOnlySchema).default([]),
  completedDates: z.array(dateOnlySchema).default([]),
  qaPackIds: z.array(z.string()).default([]),
}).strict();

/**
 * Base Project schema (without refinements)
 */
const ProjectBaseSchema = z.object({
  projectNumber: z.string()
    .min(1, 'Project number is required')
    .max(50, 'Project number must be 50 characters or less'),

  handoverId: z.string()
    .min(1, 'Handover ID is required'),

  projectName: z.string()
    .min(1, 'Project name is required')
    .max(255, 'Project name must be 255 characters or less'),

  client: z.string()
    .min(1, 'Client name is required')
    .max(255, 'Client name must be 255 characters or less'),

  clientTier: clientTierSchema,

  location: z.string()
    .min(1, 'Location is required')
    .max(500, 'Location must be 500 characters or less'),

  projectOwnerId: userIdSchema,

  projectOwnerDivision: divisionSchema,

  scopingPersonId: userIdSchema,

  estimatedStartDate: dateOnlySchema,

  estimatedEndDate: dateOnlySchema,

  actualStartDate: dateOnlySchema.optional(),

  actualEndDate: dateOnlySchema.optional(),

  divisions: z.array(ProjectDivisionSchema).optional().default([]),

  jobIds: z.array(z.string()).optional().default([]),

  scopeReportIds: z.array(z.string()).optional().default([]),

  siteVisitEventIds: z.array(z.string()).optional(),

  projectCalendarEventId: z.string().optional(),

  qaPackIds: z.array(z.string()).optional(),

  ncrIds: z.array(z.string()).optional(),

  incidentIds: z.array(z.string()).optional(),
}).strict();

/**
 * Schema for creating a new Project (with validations)
 */
export const ProjectCreateSchema = ProjectBaseSchema.refine(
  (data) => {
    const startDate = new Date(data.estimatedStartDate);
    const endDate = new Date(data.estimatedEndDate);
    return endDate >= startDate;
  },
  {
    message: 'Estimated end date must be on or after estimated start date',
    path: ['estimatedEndDate']
  }
).refine(
  (data) => {
    if (data.actualStartDate && data.actualEndDate) {
      const startDate = new Date(data.actualStartDate);
      const endDate = new Date(data.actualEndDate);
      return endDate >= startDate;
    }
    return true;
  },
  {
    message: 'Actual end date must be on or after actual start date',
    path: ['actualEndDate']
  }
);

/**
 * Schema for updating a Project
 */
export const ProjectUpdateSchema = ProjectBaseSchema.partial();

/**
 * Schema for Project responses
 */
export const ProjectSchema = ProjectBaseSchema.extend({
  id: z.string(),
  status: projectStatusSchema,
});

// ============================================================================
// TENDER HANDOVER SCHEMAS
// ============================================================================

/**
 * Schema for Tender Handover divisions required
 */
export const TenderDivisionsSchema = z.object({
  asphalt: z.boolean(),
  profiling: z.boolean(),
  spray: z.boolean(),
}).strict().refine(
  (data) => data.asphalt || data.profiling || data.spray,
  {
    message: 'At least one division must be required',
    path: ['asphalt']
  }
);

/**
 * Schema for Tender Handover attachment
 */
export const TenderAttachmentSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  uploadedAt: dateStringSchema,
}).strict();

/**
 * Schema for creating a Tender Handover
 */
const TenderHandoverBaseSchema = z.object({
  clientName: z.string()
    .min(1, 'Client name is required')
    .max(255, 'Client name must be 255 characters or less'),

  clientTier: clientTierSchema,

  clientId: z.string()
    .min(1, 'Client ID is required'),

  projectName: z.string()
    .min(1, 'Project name is required')
    .max(255, 'Project name must be 255 characters or less'),

  projectDescription: z.string()
    .min(1, 'Project description is required')
    .max(2000, 'Project description must be 2000 characters or less'),

  location: z.string()
    .min(1, 'Location is required')
    .max(500, 'Location must be 500 characters or less'),

  estimatedStartDate: dateOnlySchema,

  estimatedEndDate: dateOnlySchema,

  divisionsRequired: TenderDivisionsSchema,

  projectOwnerId: userIdSchema,

  scopingPersonId: userIdSchema,

  estimatedArea: z.number().optional(),

  estimatedThickness: z.number().optional(),

  asphaltPlant: z.string().optional(),

  specialRequirements: z.string().optional(),

  contractValue: z.number().optional(),

  contractNumber: z.string().optional(),

  purchaseOrderNumber: z.string().optional(),

  attachments: z.array(TenderAttachmentSchema).optional(),
}).strict();

export const TenderHandoverCreateSchema = TenderHandoverBaseSchema.refine(
  (data) => {
    const startDate = new Date(data.estimatedStartDate);
    const endDate = new Date(data.estimatedEndDate);
    return endDate >= startDate;
  },
  {
    message: 'Estimated end date must be on or after estimated start date',
    path: ['estimatedEndDate']
  }
);

/**
 * Schema for updating a Tender Handover
 */
export const TenderHandoverUpdateSchema = TenderHandoverBaseSchema.partial();

/**
 * Schema for Tender Handover responses
 */
export const TenderHandoverSchema = TenderHandoverBaseSchema.extend({
  id: z.string(),
  handoverNumber: z.string(),
  dateCreated: dateStringSchema,
  createdBy: userIdSchema,
  status: z.enum(['Draft', 'Submitted', 'Active', 'Completed', 'On Hold'], {
    errorMap: () => ({ message: 'Invalid tender status' })
  }),
});

// ============================================================================
// SCOPE REPORT SCHEMAS
// ============================================================================

/**
 * Schema for Site Accessibility
 */
export const SiteAccessibilitySchema = z.object({
  accessible: z.boolean(),
  accessNotes: z.string().max(1000, 'Access notes must be 1000 characters or less'),
  restrictions: z.array(z.string()).optional().default([]),
}).strict();

/**
 * Schema for Surface Condition
 */
export const SurfaceConditionSchema = z.object({
  currentCondition: z.enum(['Good', 'Fair', 'Poor', 'Critical'], {
    errorMap: () => ({ message: 'Invalid surface condition' })
  }),
  defects: z.array(z.string()).optional().default([]),
  photos: z.array(z.any()).optional().default([]),
}).strict();

/**
 * Schema for Site Measurements
 */
export const SiteMeasurementsSchema = z.object({
  area: z.number()
    .positive('Area must be a positive number'),

  depth: z.number()
    .positive('Depth must be a positive number'),

  chainages: z.array(z.object({
    start: z.number(),
    end: z.number(),
  }).refine(
    (data) => data.end >= data.start,
    { message: 'End chainage must be >= start chainage', path: ['end'] }
  )).default([]),
}).strict();

/**
 * Schema for Traffic Management
 */
export const TrafficManagementSchema = z.object({
  required: z.boolean(),
  tmpRequired: z.boolean(),
  restrictions: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
}).strict();

/**
 * Schema for Utilities Assessment
 */
export const UtilitiesAssessmentSchema = z.object({
  identified: z.boolean(),
  services: z.array(z.string()).optional().default([]),
  photos: z.array(z.any()).optional().default([]),
}).strict();

/**
 * Schema for Hazard Assessment
 */
export const HazardAssessmentSchema = z.object({
  identified: z.boolean(),
  hazardList: z.array(z.object({
    hazard: z.string().min(1, 'Hazard description is required'),
    control: z.string().min(1, 'Control measure is required'),
  })).optional().default([]),
}).strict();

/**
 * Schema for creating a Scope Report
 */
const ScopeReportBaseSchema = z.object({
  projectId: z.string()
    .min(1, 'Project ID is required'),

  visitNumber: z.number()
    .int('Visit number must be an integer')
    .positive('Visit number must be positive'),

  visitType: z.enum(['14-Day', '7-Day', '3-Day', '72-Hour'], {
    errorMap: () => ({ message: 'Invalid visit type' })
  }),

  scheduledDate: dateOnlySchema,

  actualDate: dateOnlySchema,

  completedBy: userIdSchema,

  siteAccessibility: SiteAccessibilitySchema,

  surfaceCondition: SurfaceConditionSchema,

  measurements: SiteMeasurementsSchema,

  trafficManagement: TrafficManagementSchema,

  utilities: UtilitiesAssessmentSchema,

  hazards: HazardAssessmentSchema,

  recommendations: z.string()
    .min(1, 'Recommendations are required')
    .max(2000, 'Recommendations must be 2000 characters or less'),

  estimatedDuration: z.number()
    .positive('Estimated duration must be positive'),

  photos: z.array(z.any()).optional().default([]),

  documents: z.array(z.object({
    fileId: z.string(),
    fileName: z.string(),
  })).optional(),

  signature: z.string()
    .min(1, 'Signature is required'),

  signedAt: dateStringSchema,
}).strict();

export const ScopeReportCreateSchema = ScopeReportBaseSchema.refine(
  (data) => {
    const scheduled = new Date(data.scheduledDate);
    const actual = new Date(data.actualDate);
    return actual >= scheduled;
  },
  {
    message: 'Actual date must be on or after scheduled date',
    path: ['actualDate']
  }
);

/**
 * Schema for updating a Scope Report
 */
export const ScopeReportUpdateSchema = ScopeReportBaseSchema.partial();

/**
 * Schema for Scope Report responses
 */
export const ScopeReportSchema = ScopeReportBaseSchema.extend({
  id: z.string(),
  reportNumber: z.string(),
  status: z.enum(['Draft', 'Submitted', 'Reviewed'], {
    errorMap: () => ({ message: 'Invalid scope report status' })
  }),
});

// ============================================================================
// DIVISION REQUEST SCHEMAS
// ============================================================================

/**
 * Schema for creating a Division Request
 */
export const DivisionRequestCreateSchema = z.object({
  projectId: z.string()
    .min(1, 'Project ID is required'),

  requestedBy: userIdSchema,

  requestedDivision: divisionSchema,

  requestedTo: userIdSchema,

  workDescription: z.string()
    .min(1, 'Work description is required')
    .max(2000, 'Work description must be 2000 characters or less'),

  location: z.string()
    .min(1, 'Location is required')
    .max(500, 'Location must be 500 characters or less'),

  requestedDates: z.array(dateOnlySchema)
    .min(1, 'At least one requested date is required')
    .max(60, 'Cannot request more than 60 dates'),
}).strict();

/**
 * Schema for responding to a Division Request
 */
export const DivisionRequestResponseSchema = z.object({
  id: z.string().min(1, 'Request ID is required'),

  status: z.enum(['Accepted', 'Rejected'], {
    errorMap: () => ({ message: 'Status must be Accepted or Rejected' })
  }),

  assignedCrewId: z.string().optional(),

  assignedForemanId: z.string().optional(),

  confirmedDates: z.array(dateOnlySchema).optional(),

  responseNotes: z.string().optional(),
}).strict().refine(
  (data) => {
    if (data.status === 'Accepted') {
      return data.assignedCrewId && data.confirmedDates && data.confirmedDates.length > 0;
    }
    return true;
  },
  {
    message: 'Accepted requests must have assigned crew, foreman, and confirmed dates',
    path: ['status']
  }
);

/**
 * Schema for updating a Division Request
 */
export const DivisionRequestUpdateSchema = DivisionRequestCreateSchema.partial();

/**
 * Schema for Division Request responses
 */
export const DivisionRequestSchema = DivisionRequestCreateSchema.extend({
  id: z.string(),
  requestNumber: z.string(),
  status: z.enum(['Pending', 'Accepted', 'Rejected', 'Completed'], {
    errorMap: () => ({ message: 'Invalid request status' })
  }),
  assignedCrewId: z.string().optional(),
  assignedForemanId: z.string().optional(),
  responseNotes: z.string().optional(),
  confirmedDates: z.array(dateOnlySchema).optional(),
  completedAt: dateStringSchema.optional(),
  qaPackId: z.string().optional(),
});

// ============================================================================
// GROUPED SCHEMA EXPORTS
// ============================================================================

/**
 * All job-related schemas
 */
export const JobSchemas = {
  create: JobCreateSchema,
  update: JobUpdateSchema,
  response: JobSchema,
} as const;

/**
 * All project-related schemas
 */
export const ProjectSchemas = {
  create: ProjectCreateSchema,
  update: ProjectUpdateSchema,
  response: ProjectSchema,
} as const;

/**
 * All tender-related schemas
 */
export const TenderSchemas = {
  create: TenderHandoverCreateSchema,
  update: TenderHandoverUpdateSchema,
  response: TenderHandoverSchema,
} as const;

/**
 * All scope report-related schemas
 */
export const ScopeReportSchemas = {
  create: ScopeReportCreateSchema,
  update: ScopeReportUpdateSchema,
  response: ScopeReportSchema,
} as const;

/**
 * All division request-related schemas
 */
export const DivisionRequestSchemas = {
  create: DivisionRequestCreateSchema,
  respond: DivisionRequestResponseSchema,
  update: DivisionRequestUpdateSchema,
  response: DivisionRequestSchema,
} as const;

// ============================================================================
// TYPE INFERENCE HELPERS
// ============================================================================

/**
 * Type-safe request/response types inferred from schemas
 */

// Job types
export type JobCreateRequest = z.infer<typeof JobCreateSchema>;
export type JobUpdateRequest = z.infer<typeof JobUpdateSchema>;
export type JobResponse = z.infer<typeof JobSchema>;

// Project types
export type ProjectCreateRequest = z.infer<typeof ProjectCreateSchema>;
export type ProjectUpdateRequest = z.infer<typeof ProjectUpdateSchema>;
export type ProjectResponse = z.infer<typeof ProjectSchema>;

// Tender types
export type TenderHandoverCreateRequest = z.infer<typeof TenderHandoverCreateSchema>;
export type TenderHandoverUpdateRequest = z.infer<typeof TenderHandoverUpdateSchema>;
export type TenderHandoverResponse = z.infer<typeof TenderHandoverSchema>;

// Scope Report types
export type ScopeReportCreateRequest = z.infer<typeof ScopeReportCreateSchema>;
export type ScopeReportUpdateRequest = z.infer<typeof ScopeReportUpdateSchema>;
export type ScopeReportResponse = z.infer<typeof ScopeReportSchema>;

// Division Request types
export type DivisionRequestCreateRequest = z.infer<typeof DivisionRequestCreateSchema>;
export type DivisionRequestResponseRequest = z.infer<typeof DivisionRequestResponseSchema>;
export type DivisionRequestUpdateRequest = z.infer<typeof DivisionRequestUpdateSchema>;
export type DivisionRequestResponse = z.infer<typeof DivisionRequestSchema>;

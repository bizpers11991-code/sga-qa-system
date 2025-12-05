/**
 * SGA QA System - SharePoint Setup Script V2
 *
 * Enhanced version with additional lists for:
 * - Configuration management (business rules)
 * - Unified CrewMembers with competency tracking
 * - Enhanced workflow states
 * - DropdownOptions for centralized choices
 * - NotificationRules for Teams routing
 * - Analytics schema for KPIs
 * - Audit trail improvements
 *
 * Usage: npx tsx scripts/setup-sharepoint-v2.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local'), override: true });
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: false });

const getConfig = () => ({
  SITE_URL: process.env.SHAREPOINT_SITE_URL,
  CLIENT_ID: process.env.AZURE_CLIENT_ID,
  CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
  TENANT_ID: process.env.AZURE_TENANT_ID,
});

interface ListColumn {
  name: string;
  displayName: string;
  type: 'Text' | 'Note' | 'Number' | 'DateTime' | 'Choice' | 'Boolean' | 'Currency';
  required?: boolean;
  choices?: string[];
  description?: string;
}

interface ListDefinition {
  name: string;
  description: string;
  columns: ListColumn[];
}

// ============================================================================
// NEW LISTS FOR SYSTEM ENHANCEMENT
// ============================================================================

const ENHANCED_LISTS: ListDefinition[] = [
  // -------------------------------------------------------------------------
  // 1. CONFIGURATION - Business rules and settings (no code changes needed)
  // -------------------------------------------------------------------------
  {
    name: 'Configuration',
    description: 'Centralized business rules and application configuration',
    columns: [
      { name: 'ConfigKey', displayName: 'Configuration Key', type: 'Text', required: true },
      { name: 'ConfigValue', displayName: 'Configuration Value (JSON)', type: 'Note', required: true },
      { name: 'Category', displayName: 'Category', type: 'Choice', required: true, choices: [
        'MaterialSpecs', 'TemperatureRequirements', 'RoleMappings', 'WorkflowRules',
        'ClientTierRules', 'NotificationSettings', 'FormDefaults', 'ValidationRules', 'System'
      ]},
      { name: 'Division', displayName: 'Applicable Division', type: 'Choice', choices: ['Asphalt', 'Profiling', 'Spray', 'Global'] },
      { name: 'IsActive', displayName: 'Is Active', type: 'Boolean' },
      { name: 'EffectiveDate', displayName: 'Effective Date', type: 'DateTime' },
      { name: 'ExpiryDate', displayName: 'Expiry Date', type: 'DateTime' },
      { name: 'Description', displayName: 'Description', type: 'Note' },
      { name: 'LastModifiedBy', displayName: 'Last Modified By', type: 'Text' },
    ]
  },

  // -------------------------------------------------------------------------
  // 2. CREW MEMBERS - Unified crew with competency tracking
  // -------------------------------------------------------------------------
  {
    name: 'CrewMembers',
    description: 'Unified crew directory with competency and certification tracking',
    columns: [
      { name: 'EmployeeId', displayName: 'Employee ID', type: 'Text', required: true },
      { name: 'FullName', displayName: 'Full Name', type: 'Text', required: true },
      { name: 'Email', displayName: 'Email', type: 'Text', required: true },
      { name: 'Phone', displayName: 'Phone', type: 'Text' },
      { name: 'Division', displayName: 'Primary Division', type: 'Choice', required: true, choices: ['Asphalt', 'Profiling', 'Spray', 'Transport', 'Common'] },
      { name: 'SecondaryDivisions', displayName: 'Secondary Divisions (JSON)', type: 'Note' },
      { name: 'Role', displayName: 'Role', type: 'Choice', required: true, choices: [
        'Foreman', 'Operator', 'Labourer', 'Driver', 'Engineer', 'Superintendent', 'Manager', 'Admin'
      ]},
      { name: 'SystemRole', displayName: 'System Role', type: 'Choice', choices: [
        'asphalt_foreman', 'profiling_foreman', 'spray_foreman',
        'asphalt_engineer', 'profiling_engineer', 'spray_admin',
        'scheduler_admin', 'tender_admin', 'management_admin', 'hseq_manager'
      ]},
      { name: 'CrewName', displayName: 'Crew Name', type: 'Text' },
      { name: 'IsForeman', displayName: 'Is Foreman', type: 'Boolean' },
      { name: 'IsActive', displayName: 'Is Active', type: 'Boolean' },
      { name: 'StartDate', displayName: 'Start Date', type: 'DateTime' },
      // Competency & Certifications
      { name: 'Certifications', displayName: 'Certifications (JSON)', type: 'Note', description: 'Array of {name, issueDate, expiryDate, status}' },
      { name: 'EquipmentQualifications', displayName: 'Equipment Qualifications (JSON)', type: 'Note', description: 'Array of equipment IDs they can operate' },
      { name: 'SpecialSkills', displayName: 'Special Skills', type: 'Note' },
      { name: 'ProficiencyLevel', displayName: 'Proficiency Level', type: 'Choice', choices: ['Trainee', 'Competent', 'Proficient', 'Expert'] },
      // Performance tracking
      { name: 'UtilizationRate', displayName: 'Utilization Rate (%)', type: 'Number' },
      { name: 'QAScoreAvg', displayName: 'Average QA Score', type: 'Number' },
      { name: 'SafetyIncidentCount', displayName: 'Safety Incident Count', type: 'Number' },
      { name: 'LastAssignmentDate', displayName: 'Last Assignment Date', type: 'DateTime' },
      { name: 'Notes', displayName: 'Notes', type: 'Note' },
    ]
  },

  // -------------------------------------------------------------------------
  // 3. DROPDOWN OPTIONS - Centralized choice management
  // -------------------------------------------------------------------------
  {
    name: 'DropdownOptions',
    description: 'Master list for all dropdown options across the application',
    columns: [
      { name: 'Category', displayName: 'Category', type: 'Choice', required: true, choices: [
        'JobStatus', 'ProjectStatus', 'Division', 'ClientTier', 'IncidentType', 'IncidentSeverity',
        'NCRType', 'NCRSeverity', 'ReportStatus', 'EquipmentType', 'EquipmentStatus',
        'AsphaltMixType', 'PavementType', 'WeatherCondition', 'TestType', 'CertificationType',
        'WorkflowState', 'NotificationType', 'DocumentCategory', 'HazardCategory'
      ]},
      { name: 'OptionValue', displayName: 'Option Value', type: 'Text', required: true },
      { name: 'OptionLabel', displayName: 'Display Label', type: 'Text', required: true },
      { name: 'SortOrder', displayName: 'Sort Order', type: 'Number' },
      { name: 'IsActive', displayName: 'Is Active', type: 'Boolean' },
      { name: 'IsDefault', displayName: 'Is Default', type: 'Boolean' },
      { name: 'ApplicableDivisions', displayName: 'Applicable Divisions (JSON)', type: 'Note' },
      { name: 'DependsOn', displayName: 'Depends On (JSON)', type: 'Note', description: 'Conditional visibility based on other field values' },
      { name: 'ColorCode', displayName: 'Color Code', type: 'Text' },
      { name: 'IconName', displayName: 'Icon Name', type: 'Text' },
      { name: 'Description', displayName: 'Description', type: 'Note' },
    ]
  },

  // -------------------------------------------------------------------------
  // 4. NOTIFICATION RULES - Teams and notification routing
  // -------------------------------------------------------------------------
  {
    name: 'NotificationRules',
    description: 'Configurable notification rules for Teams, email, and in-app alerts',
    columns: [
      { name: 'RuleName', displayName: 'Rule Name', type: 'Text', required: true },
      { name: 'Trigger', displayName: 'Trigger Event', type: 'Choice', required: true, choices: [
        'JobCreated', 'JobCompleted', 'JobOverdue', 'JobStatusChanged',
        'ProjectCreated', 'ProjectCompleted', 'ProjectOverdue',
        'QAPackSubmitted', 'QAPackApproved', 'QAPackRejected', 'QAPackOverdue',
        'IncidentReported', 'IncidentEscalated', 'IncidentClosed',
        'NCRCreated', 'NCRClosed',
        'CertificationExpiring', 'CertificationExpired',
        'DivisionRequestCreated', 'DivisionRequestAccepted', 'DivisionRequestRejected',
        'ScopeReportDue', 'ScopeReportSubmitted',
        'EquipmentMaintenance', 'ResourceConflict'
      ]},
      { name: 'Conditions', displayName: 'Conditions (JSON)', type: 'Note', description: 'Filter conditions like {division, clientTier, severity}' },
      { name: 'Action', displayName: 'Action', type: 'Choice', required: true, choices: ['SendTeams', 'SendEmail', 'CreateTask', 'InAppNotification', 'Webhook'] },
      { name: 'Priority', displayName: 'Priority', type: 'Choice', choices: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'ChannelWebhook', displayName: 'Teams Channel Webhook', type: 'Note' },
      { name: 'EmailRecipients', displayName: 'Email Recipients (JSON)', type: 'Note' },
      { name: 'MessageTemplate', displayName: 'Message Template (JSON)', type: 'Note', description: 'Template with placeholders' },
      { name: 'DelayMinutes', displayName: 'Delay (Minutes)', type: 'Number' },
      { name: 'EscalationRuleId', displayName: 'Escalation Rule ID', type: 'Text' },
      { name: 'IsActive', displayName: 'Is Active', type: 'Boolean' },
      { name: 'Division', displayName: 'Division', type: 'Choice', choices: ['Asphalt', 'Profiling', 'Spray', 'All'] },
    ]
  },

  // -------------------------------------------------------------------------
  // 5. JOB ANALYTICS - Pre-calculated job metrics
  // -------------------------------------------------------------------------
  {
    name: 'JobAnalytics',
    description: 'Pre-calculated job performance metrics for dashboards',
    columns: [
      { name: 'JobId', displayName: 'Job ID', type: 'Text', required: true },
      { name: 'JobNumber', displayName: 'Job Number', type: 'Text' },
      { name: 'ProjectId', displayName: 'Project ID', type: 'Text' },
      { name: 'Division', displayName: 'Division', type: 'Choice', choices: ['Asphalt', 'Profiling', 'Spray'] },
      { name: 'Client', displayName: 'Client', type: 'Text' },
      { name: 'ClientTier', displayName: 'Client Tier', type: 'Choice', choices: ['Tier 1', 'Tier 2', 'Tier 3'] },
      { name: 'ForemanId', displayName: 'Foreman ID', type: 'Text' },
      { name: 'ScheduledDate', displayName: 'Scheduled Date', type: 'DateTime' },
      { name: 'ActualStartDate', displayName: 'Actual Start Date', type: 'DateTime' },
      { name: 'ActualCompletionDate', displayName: 'Actual Completion Date', type: 'DateTime' },
      { name: 'PlannedDurationHours', displayName: 'Planned Duration (Hours)', type: 'Number' },
      { name: 'ActualDurationHours', displayName: 'Actual Duration (Hours)', type: 'Number' },
      { name: 'DurationVariance', displayName: 'Duration Variance (Hours)', type: 'Number' },
      { name: 'PlannedArea', displayName: 'Planned Area (m2)', type: 'Number' },
      { name: 'ActualArea', displayName: 'Actual Area (m2)', type: 'Number' },
      { name: 'PlannedTonnes', displayName: 'Planned Tonnes', type: 'Number' },
      { name: 'ActualTonnes', displayName: 'Actual Tonnes', type: 'Number' },
      { name: 'QAScore', displayName: 'QA Score (0-100)', type: 'Number' },
      { name: 'IncidentCount', displayName: 'Incident Count', type: 'Number' },
      { name: 'NCRCount', displayName: 'NCR Count', type: 'Number' },
      { name: 'CrewCount', displayName: 'Crew Count', type: 'Number' },
      { name: 'EquipmentCount', displayName: 'Equipment Count', type: 'Number' },
      { name: 'WeatherConditions', displayName: 'Weather Conditions', type: 'Text' },
      { name: 'OnTimeCompletion', displayName: 'On Time Completion', type: 'Boolean' },
      { name: 'QAPackId', displayName: 'QA Pack ID', type: 'Text' },
      { name: 'CalculatedAt', displayName: 'Calculated At', type: 'DateTime' },
    ]
  },

  // -------------------------------------------------------------------------
  // 6. DAILY METRICS - Aggregated daily statistics
  // -------------------------------------------------------------------------
  {
    name: 'DailyMetrics',
    description: 'Daily aggregated metrics for dashboards and reports',
    columns: [
      { name: 'MetricDate', displayName: 'Metric Date', type: 'DateTime', required: true },
      { name: 'Division', displayName: 'Division', type: 'Choice', required: true, choices: ['Asphalt', 'Profiling', 'Spray', 'All'] },
      { name: 'JobsScheduled', displayName: 'Jobs Scheduled', type: 'Number' },
      { name: 'JobsCompleted', displayName: 'Jobs Completed', type: 'Number' },
      { name: 'JobsInProgress', displayName: 'Jobs In Progress', type: 'Number' },
      { name: 'JobsOnHold', displayName: 'Jobs On Hold', type: 'Number' },
      { name: 'JobsCancelled', displayName: 'Jobs Cancelled', type: 'Number' },
      { name: 'TotalAreaCompleted', displayName: 'Total Area Completed (m2)', type: 'Number' },
      { name: 'TotalTonnesLaid', displayName: 'Total Tonnes Laid', type: 'Number' },
      { name: 'QAPacksSubmitted', displayName: 'QA Packs Submitted', type: 'Number' },
      { name: 'QAPacksPending', displayName: 'QA Packs Pending Review', type: 'Number' },
      { name: 'QAPacksApproved', displayName: 'QA Packs Approved', type: 'Number' },
      { name: 'QAPassRate', displayName: 'QA Pass Rate (%)', type: 'Number' },
      { name: 'IncidentsReported', displayName: 'Incidents Reported', type: 'Number' },
      { name: 'NCRsRaised', displayName: 'NCRs Raised', type: 'Number' },
      { name: 'CrewsDeployed', displayName: 'Crews Deployed', type: 'Number' },
      { name: 'EquipmentUtilization', displayName: 'Equipment Utilization (%)', type: 'Number' },
      { name: 'WeatherImpactedJobs', displayName: 'Weather Impacted Jobs', type: 'Number' },
      { name: 'AverageJobDuration', displayName: 'Average Job Duration (Hours)', type: 'Number' },
      { name: 'OnTimeCompletionRate', displayName: 'On Time Completion Rate (%)', type: 'Number' },
    ]
  },

  // -------------------------------------------------------------------------
  // 7. CREW ANALYTICS - Crew performance tracking
  // -------------------------------------------------------------------------
  {
    name: 'CrewAnalytics',
    description: 'Monthly crew performance metrics',
    columns: [
      { name: 'CrewMemberId', displayName: 'Crew Member ID', type: 'Text', required: true },
      { name: 'CrewMemberName', displayName: 'Crew Member Name', type: 'Text' },
      { name: 'MetricMonth', displayName: 'Metric Month', type: 'DateTime', required: true },
      { name: 'Division', displayName: 'Division', type: 'Choice', choices: ['Asphalt', 'Profiling', 'Spray'] },
      { name: 'JobsAssigned', displayName: 'Jobs Assigned', type: 'Number' },
      { name: 'JobsCompleted', displayName: 'Jobs Completed', type: 'Number' },
      { name: 'JobsOnTime', displayName: 'Jobs Completed On Time', type: 'Number' },
      { name: 'TotalHoursWorked', displayName: 'Total Hours Worked', type: 'Number' },
      { name: 'UtilizationRate', displayName: 'Utilization Rate (%)', type: 'Number' },
      { name: 'AverageQAScore', displayName: 'Average QA Score', type: 'Number' },
      { name: 'SafetyIncidents', displayName: 'Safety Incidents', type: 'Number' },
      { name: 'NCRsAssociated', displayName: 'NCRs Associated', type: 'Number' },
      { name: 'ProductivityScore', displayName: 'Productivity Score', type: 'Number' },
      { name: 'CertificationsActive', displayName: 'Active Certifications', type: 'Number' },
      { name: 'CertificationsExpired', displayName: 'Expired Certifications', type: 'Number' },
    ]
  },

  // -------------------------------------------------------------------------
  // 8. WORKFLOW STATES - Extended job workflow states
  // -------------------------------------------------------------------------
  {
    name: 'WorkflowStates',
    description: 'Extended workflow states for jobs and projects',
    columns: [
      { name: 'EntityType', displayName: 'Entity Type', type: 'Choice', required: true, choices: ['Job', 'Project', 'QAPack', 'Incident', 'NCR', 'ScopeReport'] },
      { name: 'StateName', displayName: 'State Name', type: 'Text', required: true },
      { name: 'StateCode', displayName: 'State Code', type: 'Text', required: true },
      { name: 'DisplayOrder', displayName: 'Display Order', type: 'Number' },
      { name: 'ColorCode', displayName: 'Color Code', type: 'Text' },
      { name: 'IconName', displayName: 'Icon Name', type: 'Text' },
      { name: 'AllowedTransitions', displayName: 'Allowed Transitions (JSON)', type: 'Note', description: 'Array of state codes this state can transition to' },
      { name: 'RequiredFields', displayName: 'Required Fields (JSON)', type: 'Note', description: 'Fields required to enter this state' },
      { name: 'RequiredApprovals', displayName: 'Required Approvals (JSON)', type: 'Note', description: 'Roles that must approve transition to this state' },
      { name: 'AutoEscalationDays', displayName: 'Auto Escalation Days', type: 'Number' },
      { name: 'EscalationAction', displayName: 'Escalation Action', type: 'Choice', choices: ['Notify', 'Escalate', 'Auto-Close', 'None'] },
      { name: 'IsActive', displayName: 'Is Active', type: 'Boolean' },
      { name: 'IsFinalState', displayName: 'Is Final State', type: 'Boolean' },
    ]
  },

  // -------------------------------------------------------------------------
  // 9. CERTIFICATION TYPES - Types of certifications for crew
  // -------------------------------------------------------------------------
  {
    name: 'CertificationTypes',
    description: 'Types of certifications and qualifications',
    columns: [
      { name: 'CertCode', displayName: 'Certification Code', type: 'Text', required: true },
      { name: 'CertName', displayName: 'Certification Name', type: 'Text', required: true },
      { name: 'Category', displayName: 'Category', type: 'Choice', required: true, choices: [
        'Safety', 'Equipment', 'Quality', 'Compliance', 'Regulatory', 'Skill'
      ]},
      { name: 'ApplicableDivisions', displayName: 'Applicable Divisions (JSON)', type: 'Note' },
      { name: 'ApplicableRoles', displayName: 'Applicable Roles (JSON)', type: 'Note' },
      { name: 'ValidityMonths', displayName: 'Validity Period (Months)', type: 'Number' },
      { name: 'RenewalReminderDays', displayName: 'Renewal Reminder Days', type: 'Number' },
      { name: 'IsMandatory', displayName: 'Is Mandatory', type: 'Boolean' },
      { name: 'TrainingProvider', displayName: 'Training Provider', type: 'Text' },
      { name: 'Description', displayName: 'Description', type: 'Note' },
      { name: 'IsActive', displayName: 'Is Active', type: 'Boolean' },
    ]
  },

  // -------------------------------------------------------------------------
  // 10. CREW CERTIFICATIONS - Individual certification records
  // -------------------------------------------------------------------------
  {
    name: 'CrewCertifications',
    description: 'Individual certification records for crew members',
    columns: [
      { name: 'CrewMemberId', displayName: 'Crew Member ID', type: 'Text', required: true },
      { name: 'CertificationCode', displayName: 'Certification Code', type: 'Text', required: true },
      { name: 'CertificationName', displayName: 'Certification Name', type: 'Text' },
      { name: 'IssueDate', displayName: 'Issue Date', type: 'DateTime', required: true },
      { name: 'ExpiryDate', displayName: 'Expiry Date', type: 'DateTime' },
      { name: 'Status', displayName: 'Status', type: 'Choice', required: true, choices: ['Active', 'Expiring Soon', 'Expired', 'Revoked'] },
      { name: 'CertificateNumber', displayName: 'Certificate Number', type: 'Text' },
      { name: 'IssuingAuthority', displayName: 'Issuing Authority', type: 'Text' },
      { name: 'VerifiedBy', displayName: 'Verified By', type: 'Text' },
      { name: 'VerifiedDate', displayName: 'Verified Date', type: 'DateTime' },
      { name: 'DocumentUrl', displayName: 'Document URL', type: 'Text' },
      { name: 'Notes', displayName: 'Notes', type: 'Note' },
    ]
  },

  // -------------------------------------------------------------------------
  // 11. EQUIPMENT ALLOCATIONS - Track equipment assignments
  // -------------------------------------------------------------------------
  {
    name: 'EquipmentAllocations',
    description: 'Daily equipment allocation tracking',
    columns: [
      { name: 'EquipmentId', displayName: 'Equipment ID', type: 'Text', required: true },
      { name: 'EquipmentName', displayName: 'Equipment Name', type: 'Text' },
      { name: 'AllocationDate', displayName: 'Allocation Date', type: 'DateTime', required: true },
      { name: 'JobId', displayName: 'Job ID', type: 'Text' },
      { name: 'ProjectId', displayName: 'Project ID', type: 'Text' },
      { name: 'AssignedTo', displayName: 'Assigned To (Crew ID)', type: 'Text' },
      { name: 'Division', displayName: 'Division', type: 'Choice', choices: ['Asphalt', 'Profiling', 'Spray', 'Transport'] },
      { name: 'StartTime', displayName: 'Start Time', type: 'DateTime' },
      { name: 'EndTime', displayName: 'End Time', type: 'DateTime' },
      { name: 'HoursUsed', displayName: 'Hours Used', type: 'Number' },
      { name: 'Status', displayName: 'Status', type: 'Choice', choices: ['Scheduled', 'In Use', 'Completed', 'Cancelled'] },
      { name: 'PreStartCompleted', displayName: 'Pre-Start Completed', type: 'Boolean' },
      { name: 'Notes', displayName: 'Notes', type: 'Note' },
    ]
  },

  // -------------------------------------------------------------------------
  // 12. CLIENTS - Client master list
  // -------------------------------------------------------------------------
  {
    name: 'Clients',
    description: 'Client master list with tier and contact information',
    columns: [
      { name: 'ClientId', displayName: 'Client ID', type: 'Text', required: true },
      { name: 'ClientName', displayName: 'Client Name', type: 'Text', required: true },
      { name: 'Tier', displayName: 'Client Tier', type: 'Choice', required: true, choices: ['Tier 1', 'Tier 2', 'Tier 3'] },
      { name: 'Industry', displayName: 'Industry', type: 'Choice', choices: ['Government', 'Private', 'Mining', 'Commercial', 'Residential'] },
      { name: 'PrimaryContact', displayName: 'Primary Contact Name', type: 'Text' },
      { name: 'PrimaryEmail', displayName: 'Primary Email', type: 'Text' },
      { name: 'PrimaryPhone', displayName: 'Primary Phone', type: 'Text' },
      { name: 'BillingAddress', displayName: 'Billing Address', type: 'Note' },
      { name: 'SiteVisitFrequency', displayName: 'Site Visit Frequency', type: 'Choice', choices: ['Every Visit', 'Weekly', 'Fortnightly', 'Monthly'] },
      { name: 'QARequirements', displayName: 'QA Requirements (JSON)', type: 'Note' },
      { name: 'ContractTerms', displayName: 'Contract Terms', type: 'Note' },
      { name: 'AccountManager', displayName: 'Account Manager', type: 'Text' },
      { name: 'TotalProjects', displayName: 'Total Projects', type: 'Number' },
      { name: 'ActiveProjects', displayName: 'Active Projects', type: 'Number' },
      { name: 'LifetimeValue', displayName: 'Lifetime Value', type: 'Currency' },
      { name: 'IsActive', displayName: 'Is Active', type: 'Boolean' },
      { name: 'Notes', displayName: 'Notes', type: 'Note' },
    ]
  },
];

// ============================================================================
// DEFAULT DATA TO POPULATE
// ============================================================================

const DEFAULT_CONFIGURATIONS = [
  // Asphalt Mix Types
  {
    ConfigKey: 'ASPHALT_MIX_TYPES',
    ConfigValue: JSON.stringify({
      AC10: { description: 'Asphaltic Concrete 10mm', maxAggSize: 10, binderContent: '5.2-5.8%' },
      AC14: { description: 'Asphaltic Concrete 14mm', maxAggSize: 14, binderContent: '4.8-5.4%' },
      AC20: { description: 'Asphaltic Concrete 20mm', maxAggSize: 20, binderContent: '4.5-5.0%' },
      DG10: { description: 'Dense Graded 10mm', maxAggSize: 10, binderContent: '5.0-5.5%' },
      DG14: { description: 'Dense Graded 14mm', maxAggSize: 14, binderContent: '4.6-5.2%' },
      DG20: { description: 'Dense Graded 20mm', maxAggSize: 20, binderContent: '4.3-4.9%' },
      SMA: { description: 'Stone Mastic Asphalt', maxAggSize: 14, binderContent: '6.0-6.5%' },
      OGA: { description: 'Open Graded Asphalt', maxAggSize: 14, binderContent: '4.5-5.0%' },
    }),
    Category: 'MaterialSpecs',
    Division: 'Asphalt',
    IsActive: true,
    Description: 'Standard asphalt mix types and specifications',
  },
  // Temperature Requirements
  {
    ConfigKey: 'TEMPERATURE_REQUIREMENTS',
    ConfigValue: JSON.stringify({
      standardBinder: { min: 130, max: 165, unit: 'C' },
      pmb: { min: 145, max: 175, unit: 'C' },
      warmMix: { min: 110, max: 140, unit: 'C' },
      minAirTemp: 10,
      minRoadTemp: 5,
      maxWindSpeed: 40, // km/h
    }),
    Category: 'TemperatureRequirements',
    Division: 'Asphalt',
    IsActive: true,
    Description: 'Temperature requirements for asphalt placement',
  },
  // Division Role Mappings
  {
    ConfigKey: 'DIVISION_ROLE_MAPPINGS',
    ConfigValue: JSON.stringify({
      Asphalt: { foreman: 'asphalt_foreman', engineer: 'asphalt_engineer' },
      Profiling: { foreman: 'profiling_foreman', engineer: 'profiling_engineer' },
      Spray: { foreman: 'spray_foreman', admin: 'spray_admin' },
    }),
    Category: 'RoleMappings',
    Division: 'Global',
    IsActive: true,
    Description: 'Mapping of divisions to system roles',
  },
  // Client Tier Rules
  {
    ConfigKey: 'CLIENT_TIER_RULES',
    ConfigValue: JSON.stringify({
      'Tier 1': { siteVisits: ['14-Day', '7-Day', '3-Day'], qaPackReviewRequired: true, escalationHours: 24 },
      'Tier 2': { siteVisits: ['7-Day', '3-Day'], qaPackReviewRequired: true, escalationHours: 48 },
      'Tier 3': { siteVisits: ['72-Hour'], qaPackReviewRequired: false, escalationHours: 72 },
    }),
    Category: 'ClientTierRules',
    Division: 'Global',
    IsActive: true,
    Description: 'Site visit and QA requirements by client tier',
  },
  // QA Pack Review Timeout
  {
    ConfigKey: 'QA_PACK_REVIEW_TIMEOUT_HOURS',
    ConfigValue: JSON.stringify({ default: 48, tier1: 24, tier2: 48, tier3: 72 }),
    Category: 'WorkflowRules',
    Division: 'Global',
    IsActive: true,
    Description: 'Hours before QA pack review escalation',
  },
];

const DEFAULT_WORKFLOW_STATES = [
  // Job Workflow States
  { EntityType: 'Job', StateName: 'Draft', StateCode: 'DRAFT', DisplayOrder: 1, ColorCode: '#9CA3AF', AllowedTransitions: '["PENDING","CANCELLED"]', IsFinalState: false },
  { EntityType: 'Job', StateName: 'Pending', StateCode: 'PENDING', DisplayOrder: 2, ColorCode: '#FCD34D', AllowedTransitions: '["SCHEDULED","ON_HOLD","CANCELLED"]', IsFinalState: false },
  { EntityType: 'Job', StateName: 'Scheduled', StateCode: 'SCHEDULED', DisplayOrder: 3, ColorCode: '#60A5FA', AllowedTransitions: '["IN_PROGRESS","ON_HOLD","CANCELLED"]', IsFinalState: false },
  { EntityType: 'Job', StateName: 'In Progress', StateCode: 'IN_PROGRESS', DisplayOrder: 4, ColorCode: '#34D399', AllowedTransitions: '["QA_PENDING","ON_HOLD","CANCELLED"]', IsFinalState: false },
  { EntityType: 'Job', StateName: 'QA Pending', StateCode: 'QA_PENDING', DisplayOrder: 5, ColorCode: '#A78BFA', AllowedTransitions: '["QA_REVIEW","REWORK","COMPLETED"]', IsFinalState: false },
  { EntityType: 'Job', StateName: 'QA Review', StateCode: 'QA_REVIEW', DisplayOrder: 6, ColorCode: '#F472B6', AllowedTransitions: '["COMPLETED","REWORK"]', IsFinalState: false },
  { EntityType: 'Job', StateName: 'Rework Required', StateCode: 'REWORK', DisplayOrder: 7, ColorCode: '#FB923C', AllowedTransitions: '["IN_PROGRESS","QA_PENDING"]', IsFinalState: false },
  { EntityType: 'Job', StateName: 'On Hold', StateCode: 'ON_HOLD', DisplayOrder: 8, ColorCode: '#94A3B8', AllowedTransitions: '["PENDING","SCHEDULED","IN_PROGRESS","CANCELLED"]', IsFinalState: false },
  { EntityType: 'Job', StateName: 'Completed', StateCode: 'COMPLETED', DisplayOrder: 9, ColorCode: '#10B981', AllowedTransitions: '[]', IsFinalState: true },
  { EntityType: 'Job', StateName: 'Cancelled', StateCode: 'CANCELLED', DisplayOrder: 10, ColorCode: '#EF4444', AllowedTransitions: '[]', IsFinalState: true },

  // Project Workflow States
  { EntityType: 'Project', StateName: 'Handover', StateCode: 'HANDOVER', DisplayOrder: 1, ColorCode: '#9CA3AF', AllowedTransitions: '["SCOPING"]', IsFinalState: false },
  { EntityType: 'Project', StateName: 'Scoping', StateCode: 'SCOPING', DisplayOrder: 2, ColorCode: '#FCD34D', AllowedTransitions: '["SCHEDULED","ON_HOLD"]', IsFinalState: false },
  { EntityType: 'Project', StateName: 'Scheduled', StateCode: 'SCHEDULED', DisplayOrder: 3, ColorCode: '#60A5FA', AllowedTransitions: '["IN_PROGRESS","ON_HOLD"]', IsFinalState: false },
  { EntityType: 'Project', StateName: 'In Progress', StateCode: 'IN_PROGRESS', DisplayOrder: 4, ColorCode: '#34D399', AllowedTransitions: '["QA_REVIEW","ON_HOLD"]', IsFinalState: false },
  { EntityType: 'Project', StateName: 'QA Review', StateCode: 'QA_REVIEW', DisplayOrder: 5, ColorCode: '#A78BFA', AllowedTransitions: '["COMPLETED","IN_PROGRESS"]', IsFinalState: false },
  { EntityType: 'Project', StateName: 'On Hold', StateCode: 'ON_HOLD', DisplayOrder: 6, ColorCode: '#94A3B8', AllowedTransitions: '["SCOPING","SCHEDULED","IN_PROGRESS"]', IsFinalState: false },
  { EntityType: 'Project', StateName: 'Completed', StateCode: 'COMPLETED', DisplayOrder: 7, ColorCode: '#10B981', AllowedTransitions: '[]', IsFinalState: true },
];

const DEFAULT_CERTIFICATION_TYPES = [
  { CertCode: 'WHS', CertName: 'Work Health & Safety', Category: 'Safety', ValidityMonths: 24, IsMandatory: true, RenewalReminderDays: 60 },
  { CertCode: 'TMP', CertName: 'Traffic Management', Category: 'Safety', ValidityMonths: 36, IsMandatory: true, RenewalReminderDays: 90 },
  { CertCode: 'FIRST_AID', CertName: 'First Aid Certificate', Category: 'Safety', ValidityMonths: 36, IsMandatory: false, RenewalReminderDays: 90 },
  { CertCode: 'PAVER_OP', CertName: 'Paver Operator', Category: 'Equipment', ValidityMonths: 0, IsMandatory: false, RenewalReminderDays: 0 },
  { CertCode: 'ROLLER_OP', CertName: 'Roller Operator', Category: 'Equipment', ValidityMonths: 0, IsMandatory: false, RenewalReminderDays: 0 },
  { CertCode: 'PROFILER_OP', CertName: 'Profiler Operator', Category: 'Equipment', ValidityMonths: 0, IsMandatory: false, RenewalReminderDays: 0 },
  { CertCode: 'TRUCK_HR', CertName: 'HR Truck License', Category: 'Regulatory', ValidityMonths: 60, IsMandatory: false, RenewalReminderDays: 120 },
  { CertCode: 'TRUCK_HC', CertName: 'HC Truck License', Category: 'Regulatory', ValidityMonths: 60, IsMandatory: false, RenewalReminderDays: 120 },
  { CertCode: 'FORKLIFT', CertName: 'Forklift License', Category: 'Equipment', ValidityMonths: 60, IsMandatory: false, RenewalReminderDays: 120 },
  { CertCode: 'ISO9001', CertName: 'ISO 9001 Awareness', Category: 'Quality', ValidityMonths: 36, IsMandatory: false, RenewalReminderDays: 90 },
];

// ============================================================================
// SHAREPOINT API FUNCTIONS
// ============================================================================

async function getAccessToken(): Promise<string> {
  const { TENANT_ID, CLIENT_ID, CLIENT_SECRET } = getConfig();
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getSiteId(token: string): Promise<string> {
  const { SITE_URL } = getConfig();
  const url = new URL(SITE_URL!);
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${url.pathname}`;

  const response = await fetch(graphUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get site ID: ${await response.text()}`);
  }

  const data = await response.json();
  return data.id;
}

async function listExists(token: string, siteId: string, listName: string): Promise<boolean> {
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listName}`;
  const response = await fetch(graphUrl, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.ok;
}

async function createList(token: string, siteId: string, listDef: ListDefinition): Promise<boolean> {
  if (await listExists(token, siteId, listDef.name)) {
    console.log(`  - List "${listDef.name}" already exists, skipping`);
    return false;
  }

  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`;

  const columns = listDef.columns.map(col => {
    const colDef: any = {
      name: col.name,
      displayName: col.displayName,
      description: col.description || '',
    };

    switch (col.type) {
      case 'Text':
        colDef.text = { allowMultipleLines: false, maxLength: 255 };
        break;
      case 'Note':
        colDef.text = { allowMultipleLines: true };
        break;
      case 'Number':
        colDef.number = { decimalPlaces: 'automatic' };
        break;
      case 'DateTime':
        colDef.dateTime = { format: 'dateTime' };
        break;
      case 'Boolean':
        colDef.boolean = {};
        break;
      case 'Currency':
        colDef.currency = { locale: 'en-AU' };
        break;
      case 'Choice':
        colDef.choice = {
          allowTextEntry: false,
          choices: col.choices || [],
          displayAs: 'dropDownMenu'
        };
        break;
    }

    return colDef;
  });

  const listData = {
    displayName: listDef.name,
    description: listDef.description,
    columns: columns,
    list: { template: 'genericList' },
  };

  const response = await fetch(graphUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(listData),
  });

  if (!response.ok) {
    console.error(`  ✗ Failed to create list "${listDef.name}": ${await response.text()}`);
    return false;
  }

  console.log(`  ✓ Created list: ${listDef.name}`);
  return true;
}

async function createListItem(token: string, siteId: string, listName: string, fields: Record<string, any>): Promise<boolean> {
  const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listName}/items`;

  const response = await fetch(graphUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  return response.ok;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     SGA QA SYSTEM - Enhanced SharePoint Setup V2               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const { SITE_URL, CLIENT_ID, CLIENT_SECRET, TENANT_ID } = getConfig();

  if (!SITE_URL || !CLIENT_ID || !CLIENT_SECRET || !TENANT_ID) {
    console.error('❌ Missing required environment variables!');
    process.exit(1);
  }

  console.log(`SharePoint Site: ${SITE_URL}\n`);

  try {
    // 1. Get access token
    console.log('1. Acquiring access token...');
    const token = await getAccessToken();
    console.log('   ✓ Access token acquired\n');

    // 2. Get site ID
    console.log('2. Getting SharePoint site ID...');
    const siteId = await getSiteId(token);
    console.log(`   ✓ Site ID acquired\n`);

    // 3. Create enhanced lists
    console.log('3. Creating Enhanced SharePoint Lists...');
    console.log('─'.repeat(60));

    let createdCount = 0;
    let skippedCount = 0;

    for (const listDef of ENHANCED_LISTS) {
      const created = await createList(token, siteId, listDef);
      if (created) createdCount++;
      else skippedCount++;
      await new Promise(r => setTimeout(r, 200)); // Rate limiting
    }

    // 4. Populate default data
    console.log('\n4. Populating Default Configuration Data...');
    console.log('─'.repeat(60));

    // Configuration
    let configCount = 0;
    for (const config of DEFAULT_CONFIGURATIONS) {
      const success = await createListItem(token, siteId, 'Configuration', {
        Title: config.ConfigKey,
        ...config,
      });
      if (success) {
        console.log(`   ✓ Added config: ${config.ConfigKey}`);
        configCount++;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    // Workflow States
    let workflowCount = 0;
    for (const state of DEFAULT_WORKFLOW_STATES) {
      const success = await createListItem(token, siteId, 'WorkflowStates', {
        Title: `${state.EntityType}-${state.StateCode}`,
        ...state,
        IsActive: true,
      });
      if (success) {
        workflowCount++;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    console.log(`   ✓ Added ${workflowCount} workflow states`);

    // Certification Types
    let certCount = 0;
    for (const cert of DEFAULT_CERTIFICATION_TYPES) {
      const success = await createListItem(token, siteId, 'CertificationTypes', {
        Title: cert.CertCode,
        ...cert,
        IsActive: true,
      });
      if (success) {
        certCount++;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    console.log(`   ✓ Added ${certCount} certification types`);

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ Enhanced SharePoint Setup Complete!\n');
    console.log('Summary:');
    console.log(`  • Lists created: ${createdCount}`);
    console.log(`  • Lists skipped (existing): ${skippedCount}`);
    console.log(`  • Configuration items: ${configCount}`);
    console.log(`  • Workflow states: ${workflowCount}`);
    console.log(`  • Certification types: ${certCount}`);
    console.log('\nNew Lists Created:');
    ENHANCED_LISTS.forEach(list => {
      console.log(`  • ${list.name}: ${list.description}`);
    });

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

main();

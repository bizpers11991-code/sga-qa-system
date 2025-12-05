
// types.ts

// ============================================================================
// EXPORT CONSOLIDATED CORE TYPES
// ============================================================================
export * from './types/core.js';

// ============================================================================
// LEGACY TYPE ALIASES (for backward compatibility)
// ============================================================================

export type Role =
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

export const isAdminRole = (role: Role): boolean => {
  return [
    'asphalt_engineer', 'profiling_engineer', 'scheduler_admin',
    'management_admin', 'hseq_manager', 'spray_admin', 'tender_admin'
  ].includes(role);
};

export interface Foreman {
  id: string; // auth0 id
  name: string;
  username: string; // email
  role: Role;
}

export interface SecureForeman extends Omit<Foreman, 'password'> {}

export interface JobMaterial {
    mixCode: string;
    binder: string;
    additive: string;
    density: number;
    aveDepth: number;
    area: string;
    tonnes: number;
    layerNo: number;
    pavementType: string;
    lotNumber: string;
}

export interface PlantRequirement {
    machine: string;
    startTime: string;
    supplier: string;
    notes: string;
}

export interface DailyJobSheetData {
    // Common
    jobNo: string;
    client: string;
    date: string;
    address: string;
    projectName: string;
    dayShift: boolean;
    asphaltForeman: string;
    jobMaterials?: JobMaterial[];
    jobDetails?: string[];
    equipment?: { item: string; vehicle: string; fleetNo: string; comments: string; }[];
    mapLink?: string;
    jobSheetImages?: JobSheetImage[];

    // Asphalt specific
    asphaltPlant?: string;
    startTimeInYard?: string;
    estimatedFinishTime?: string;
    projectManager?: string;
    projectSupervisor?: string;
    asphaltSupervisor?: string;
    clientSiteEngineerContact?: { name: string; phone: string; };
    clientSiteSupervisorContact?: { name: string; phone: string; };
    plantLaydownLocation?: string;
    inspectedBy?: string;
    compactionCheck?: string;
    surfaceAndCondition?: string;
    trafficControl?: string;
    sweeping?: string;
    inductions?: string;
    cartage?: { semiTrucks: string; eightWheelTrucks: string; tanddTrucks: string; sixWheelTrucks: string; lilTipper: string; };
    safety?: string;
    qaPaperwork?: string;
    testing?: string;

    // Profiling specific
    crewLeader?: string;
    crew?: string;
    depotStartTime?: string;
    leaveDepotTime?: string;
    onSiteBriefingTime?: string;
    startCutTime?: string;
    clientSiteContact?: string;
    workArea?: string;
    depth?: string;
    tons?: string;
    trucksDescription?: string;
    descriptionOfWorks?: string;
    rapDumpsite?: string;
    profilers?: PlantRequirement[];
    trucks?: PlantRequirement[];
    machineDeliveryLocation?: string;
    radioChannel?: string;
    timeMachineToBeOnSiteBy?: string;
    preDropOption?: string;
    gateEntry?: string;
    ifFloatRequiredToWait?: string;
    endOfShiftChecks?: {
        teethInspected: boolean;
        machinesRefueledWaterFull: boolean;
        machinesCleanedReloaded: boolean;
        kerbsCheckedForDamage: boolean;
        percentOfTeethWear: string;
        detailsOfKerbDamage: string;
    };
    notes?: string;
    
    schemaVersion?: number;
}

export interface JobContacts {
    projectManager?: string;
    projectSupervisor?: string;
    asphaltSupervisor?: string;
    asphaltForeman?: string;
    clientEngineer?: { name: string; phone: string };
    clientSupervisor?: { name: string; phone: string };
}

export interface JobSiteDetails {
    plantLaydownLocation?: string;
    inspectedBy?: string;
    compactionCheck?: string;
    surfaceCondition?: string;
    trafficControl?: string;
    sweeping?: string;
    inductions?: string;
}

export interface JobCartage {
    semiTrucks?: number;
    eightWheelTrucks?: number;
    tanddTrucks?: number;
    sixWheelTrucks?: number;
    lilTipper?: number;
}

export interface JobEquipment {
    machine: string;
    startTime: string;
    supplier: string;
    notes: string;
}

export interface JobTruck {
    truckId: string;
}

export interface JobMaterialRow {
    mixCode: string;
    pavementType: string;
    tonnes: number;
    area: number;
    depth: number;
    density: number;
    lotNumber: string;
}

export interface ProfilingJobDetails {
    dateRequired?: string;
    crewLeader?: string;
    crew?: string[];
    depotStartTime?: string;
    leaveDepotTime?: string;
    onSiteBriefingTime?: string;
    startCutTime?: string;
    clientSiteContact?: string;
    mapLink?: string;
    workArea?: number;
    workDepth?: number;
    tons?: number;
    trucksCount?: number;
    descriptionOfWorks?: string;
    rapDumpsite?: string;
    equipment?: JobEquipment[];
    trucks?: JobTruck[];
}

export interface AsphaltJobDetails {
    asphaltPlant?: string;
    startTimeYard?: string;
    estimatedFinishTime?: string;
    mapLink?: string;
    dayShift?: boolean;
    contacts?: JobContacts;
    siteDetails?: JobSiteDetails;
    cartage?: JobCartage;
    materials?: JobMaterialRow[];
}

export interface Job {
    id: string; // 'job-' + Date.now()
    jobNo: string;
    client: string;
    division: 'Asphalt' | 'Profiling' | 'Spray';
    projectName: string;
    location: string;
    foremanId: string;
    jobDate: string; // YYYY-MM-DD
    dueDate: string; // YYYY-MM-DD
    area?: number;
    thickness?: number;
    jobSheetData?: DailyJobSheetData;
    qaSpec?: string;
    requiredQaForms?: (keyof Omit<QaPack, 'lastUpdated'>)[];
    itpTemplateId?: string;
    profilingDetails?: ProfilingJobDetails;
    asphaltDetails?: AsphaltJobDetails;
    clientTier?: 'Tier 1' | 'Tier 2' | 'Tier 3'; // For tier-based site visit automation
    siteVisitEventIds?: string[]; // Teams calendar event IDs for site visits
    jobCalendarEventId?: string; // Teams calendar event ID for the job
    schemaVersion?: number;
}

// FORM DATA TYPES
export interface SgaCorrectorRow {
    quantity: string;
    location: string;
    mixType: string;
}

export interface CrewResource {
    id: string;
    name: string;
    division: 'Asphalt' | 'Profiling' | 'Spray' | 'Common';
    isForeman: boolean;
    role?: string;
    phone?: string;
    email?: string;
}
export interface EquipmentResource {
    id: string; // Fleet ID
    name: string; // e.g., '2m Profiler'
    type: string; // e.g., 'Profiler'
    division: 'Asphalt' | 'Profiling' | 'Spray' | 'Transport' | 'Common';
    registrationNumber?: string;
    status: 'Available' | 'In Use' | 'Maintenance';
}

export type ResourceType = 'Crew' | 'Equipment';

export interface SgaDailyReportData {
    project: string;
    date: string;
    completedBy: string;
    startTime: string;
    finishTime: string;
    weatherConditions: AsphaltWeatherCondition[];
    works: { mixType: string; spec: string; area: string; depth: string; tonnes: string; comments: string; }[];
    actualWorks: { description: string; area: string; depth: string; tonnes: string; comments: string; }[];
    correctorUsed: 'Yes' | 'No';
    correctorDetails: SgaCorrectorRow[];
    siteInstructions: string;
    additionalComments: string;
    // SGA Representative sign-off - Per SGA-QA-FRM-007
    sgaSignName: string;
    sgaSignature: string; // base64
    // Client sign-off
    clientSignName: string;
    clientSignature: string; // base64
    plantEquipment: { type: string; supplier: string; plantId: string; prestart: string; startTime: string; endTime: string; hours: string; comments: string; }[];
    trucks: { truckId: string; contractor: string; startTime: string; endTime: string; hours: string; isSixWheeler: boolean; }[];
    labour: { fullName: string; startTime: string; endTime: string; hours: string; comments: string; }[];
    onSiteTests: { testType: string; location: string; result: string; passFail: 'Pass' | 'Fail' | ''; comments: string; }[];
    otherComments: string;
    teethUsage: string;
}

export interface HazardLogRow {
    hazardDescription: string;
    controlMeasures: string;
}
export interface SiteVisitorRow {
    name: string;
    company: string;
    timeIn: string;
    timeOut: string;
}
export interface SiteRecordData {
    hazardLog: HazardLogRow[];
    siteVisitors: SiteVisitorRow[];
}

export interface ItpChecklistItem {
    id: string;
    description: string;
    compliant: 'Yes' | 'No' | 'N/A' | '';
    comments: string;
    isWitnessPoint: boolean;
    witnessName: string;
}
export interface ItpChecklistSection {
    title: string;
    items: ItpChecklistItem[];
}
export interface ItpChecklistData {
    id?: string;
    name?: string;
    documentId?: string;
    sections: ItpChecklistSection[];
}

export interface AsphaltWeatherCondition {
    time: string;
    airTemp: string;
    roadTemp: string;
    windSpeed: string;
    chillFactor: string;
    dayNight: 'Day' | 'Night';
}
export interface AsphaltPlacementRow {
    docketNumber: string;
    tonnes: string;
    progressiveTonnes: string;
    time: string;
    incomingTemp: string;
    placementTemp: string;
    tempsCompliant: 'Yes' | 'No' | '';
    startChainage: string;
    endChainage: string;
    length: string;
    runWidth: string;
    area: string;
    depth: string;
    laneRun: string;
    comments: string;
    docketTemp: string;
    dispatchTime: string;
    detailsMatchSpec: 'Yes' | 'No' | '';
    nonConformanceReason: string;
    breakdownPasses: string;
}
export interface AsphaltPlacementData {
    date: string;
    lotNo: string;
    sheetNo: string;
    material: string;  // Added per SGA-QA-FRM-003 - Mix Type/Material
    pavementSurfaceCondition: 'Dry' | 'Damp' | 'Wet' | '';
    rainfallDuringShift: 'Yes' | 'No' | '';
    rainfallActions: string;
    rollingPatternId: string;
    weatherConditions: AsphaltWeatherCondition[];
    placements: AsphaltPlacementRow[];
}

export interface StraightEdgeRow {
    runLane: string;
    chainage: string;
    transverse: string;
    join: string;
    longitudinal: string;
}
export interface StraightEdgeData {
    lotNo: string;
    date: string;           // Added per SGA-QA-FRM-005
    location: string;       // Added per SGA-QA-FRM-005
    mixType: string;
    testedBy: string;
    straightEdgeId: string;
    tests: StraightEdgeRow[];
    supervisor: string;
    supervisorSignature: string;  // Added per SGA-QA-FRM-005
}

export interface SpraySealRun {
    runNo: string;
    startChainage: string;
    endChainage: string;
    length: string;
    width: string;
    area: string;
    volumeSprayedLitres: string;
    comments: string;
}

export interface SprayReportData {
    lotNo: string;
    date: string;
    crewLeader: string;
    operator: string;
    weather: string;
    windSpeed: string;
    pavementTemp: string;
    airTemp: string;
    productType: string;
    source: string;
    sprayRateTarget: string;
    sprayRateAchieved: string;
    truckReadoutStart: string;
    truckReadoutFinish: string;
    runs: SpraySealRun[];
}

export interface PreStartChecklistItem {
    id: string;
    item: string;
    status: 'Pass' | 'Fail' | 'N/A' | '';
    comment: string;
}

export interface PreStartChecklistData {
    vehicleId: string;
    prestartCompletedBy: string;
    items: PreStartChecklistItem[];
}

export interface TrafficManagementPlanItem {
    id: string;
    item: string;
    compliant: 'Yes' | 'No' | 'N/A' | '';
    comment: string;
}

export interface TrafficManagementPlanChecklistData {
    tmpNumber: string;
    checkedBy: string;
    items: TrafficManagementPlanItem[];
}


// ITR - INSPECTION AND TEST REPORTS
// Per SGA-QA-ITR-002 Asphalt Laying

export interface ItrHoldPointSignOff {
    sga: boolean;
    dti?: boolean;
    ghd?: boolean;
    rtio?: boolean;
    client?: boolean;
}

export interface ItrInspectionItem {
    id: string;
    itemNo: number;
    description: string;
    acceptanceCriteria: string;
    status: 'Yes' | 'No' | 'N/A' | '';
    holdPointSignOff: ItrHoldPointSignOff;
    comments: string;
}

export interface ItrSignOff {
    name: string;
    position: string;
    signature: string; // base64
    date: string;
}

export interface ItrAsphaltLayingData {
    // Project Details
    projectName: string;
    client: string;
    description: string;
    projectDocNo: string;
    dateLaid: string;
    lotNumber: string;
    workArea: string;
    chainage: string;
    // Inspection Items (12 items per SGA-QA-ITR-002)
    inspectionItems: ItrInspectionItem[];
    // General Comments
    comments: string;
    // Sign Off
    sgaRepresentative: ItrSignOff;
    clientRepresentative: ItrSignOff;
}

// ITP - INSPECTION AND TEST PLANS
// Per SGA-ITP-001, SGA-ITP-002, etc.

export type TestPointType = 'V' | 'W' | 'H'; // Visual, Witness, Hold Point
export type RoleKey = 'SS' | 'PE' | 'QA'; // Site Supervisor, Project Engineer, QA

export interface ItpActivityItem {
    id: string;
    itemNo: number;
    activity: string;
    acceptanceCriteria: string;
    verifyingDocument: string;
    frequency: string;
    testPoint: TestPointType;
    roleKey: RoleKey;
    recordOfConformity: string;
    clientSignature: string; // base64
    sgaSignature: string; // base64
    comments: string;
}

export interface ItpFormData {
    // Header
    client: string;
    project: string;
    specifications: string;
    lotNo: string;
    lotDescription: string;
    preparedBy: string;
    approvedBy: string;
    documentNumber: string;
    revision: string;
    date: string;
    // Activity Items
    activities: ItpActivityItem[];
    // Final Inspection
    finalInspectionComplete: boolean;
    finalInspectionDate: string;
    finalInspectorSignature: string; // base64
    finalInspectorName: string;
}

// QA PACK
export interface QaPack {
    sgaDailyReport: SgaDailyReportData;
    siteRecord: SiteRecordData;
    itpChecklist: ItpChecklistData;
    asphaltPlacement: AsphaltPlacementData;
    straightEdge: StraightEdgeData;
    sprayReport?: SprayReportData;
    preStartChecklist?: PreStartChecklistData;
    trafficManagementPlan?: TrafficManagementPlanChecklistData;
    itrAsphaltLaying?: ItrAsphaltLayingData;  // Added ITR
    itpForm?: ItpFormData;  // Added ITP
    sitePhotos: SitePhoto[];
    damagePhotos: DamagePhoto[];
    lastUpdated: string;
}

export interface FinalQaPack extends QaPack {
    job: Job;
    jobSheet: DailyJobSheetData;
    foremanPhoto?: string; // base64
    foremanPhotoUrl?: string;
    foremanSignature: string; // base64
    timestamp: string; // ISO 8601
    version: number;
    submittedBy: string; // Foreman's name
    pdfUrl?: string;
    pdfData?: string; // temp base64
    sitePhotoUrls?: string[];
    damagePhotoUrls?: string[];
    jobSheetImageUrls?: string[];
    expertSummary?: string;
    expertSummaryStatus?: 'pending' | 'completed' | 'failed';
    schemaVersion?: number;
    ncrs?: NonConformanceReport[];
    // FIX: Added optional 'status' and 'internalNotes' properties. These were
    // being accessed in `api/update-report-status.ts` but were not defined
    // on the type, causing compilation errors.
    status?: ReportStatus;
    internalNotes?: string;
}


export interface IncidentReport {
    id: string;
    reportId: string; // e.g. INC-2024-001
    reportedBy: string;
    reporterId: string;
    dateOfIncident: string;
    timeOfIncident: string;
    type: 'Incident' | 'Near Miss' | 'Hazard Identification' | '';
    location: string;
    jobNo?: string;
    description: string;
    immediateActionTaken: string;
    involvedPersonnel?: string;
    witnesses?: string;
    photos: IncidentPhoto[];
    photoUrls?: string[];
    status: 'Open' | 'Under Investigation' | 'Closed';
    investigationFindings?: string;
    correctiveActions?: string;
    hseqSignOff: {
        isSigned: boolean;
        signedBy?: string;
        timestamp?: string;
    };
    adminSignOff: {
        isSigned: boolean;
        signedBy?: string;
        timestamp?: string;
    };
    closedBy?: string;
    closeOutDate?: string;
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error';
    timestamp: string;
    isRead: boolean;
    isResolved: boolean;
    resolvedBy?: string;
    resolvedAt?: string;
    relatedUrl?: string;
}

export interface NonConformanceReport {
    id: string;
    ncrId: string; // e.g. NCR-2024-001
    jobNo: string;
    dateIssued: string;
    issuedBy: string;
    status: 'Open' | 'Under Review' | 'Closed';
    descriptionOfNonConformance: string;
    specificationClause?: string;
    proposedCorrectiveAction?: string;
    rootCauseAnalysis?: string;
    preventativeAction?: string;
}

export interface SamplingPlan {
    id: string;
    jobNo: string;
    lotNo: string;
    specification: string;
    startChainage: number;
    endChainage: number;
    numCores: number;
    generatedBy: string;
    timestamp: string;
    results: {
        chainage: number;
        offset: 'LWP' | 'RWP' | 'Between WP';
        notes: string;
    }[];
}

export interface SpecificationDocument {
    id: string;
    title: string;
    category: 'Specification' | 'Procedure' | 'Form' | 'Other';
    fileKey: string; // Key in R2
    fileUrl: string; // Public URL
    fileType: string;
    uploadedBy: string;
    uploadedAt: string;
}

export interface WeatherData {
    temperature: number;
    weatherCode: number;
    maxTemp: number;
    minTemp: number;
}

// ============================================================================
// PROJECT MANAGEMENT MODULE TYPES
// ============================================================================

/**
 * Export all types from the Project Management module
 * Includes: Tender Administration, Project Management, Scope Reports, Division Requests
 */
export * from './types/project-management.js';
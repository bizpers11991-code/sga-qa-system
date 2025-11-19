

// types.ts

export type Role =
  | 'asphalt_foreman'
  | 'profiling_foreman'
  | 'spray_foreman'
  | 'asphalt_engineer'
  | 'profiling_engineer'
  | 'spray_admin'
  | 'scheduler_admin'
  | 'management_admin'
  | 'hseq_manager';

export const isAdminRole = (role: Role): boolean => {
  return [
    'asphalt_engineer', 'profiling_engineer', 'scheduler_admin', 
    'management_admin', 'hseq_manager', 'spray_admin'
  ].includes(role);
};

// FIX: Added ReportStatus type, as it was missing and causing an import error
// in `api/update-report-status.ts`. This type defines the possible lifecycle
// states for a submitted QA Pack.
export type ReportStatus = 'Pending Review' | 'Requires Action' | 'Approved' | 'Archived';

export interface Foreman {
  id: string; // auth0 id
  name: string;
  username: string; // email
  role: Role;
}

export interface SecureForeman extends Omit<Foreman, 'password'> {}

export interface SitePhoto {
    name: string;
    data: string; // base64 data URL
    description: string;
}

export interface DamagePhoto {
    name: string;
    data: string; // base64 data URL
    description: string;
}

export interface IncidentPhoto {
    name: string;
    data: string; // base64 data URL
}

export interface JobSheetImage {
    name: string;
    data: string; // base64 data URL
}

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
}
export interface EquipmentResource {
    id: string; // Fleet ID
    name: string; // e.g., '2m Profiler'
    type: string; // e.g., 'Profiler'
    division: 'Asphalt' | 'Profiling' | 'Spray' | 'Common';
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
    mixType: string;
    testedBy: string;
    straightEdgeId: string;
    tests: StraightEdgeRow[];
    supervisor: string;
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
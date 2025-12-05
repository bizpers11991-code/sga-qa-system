/**
 * Crew Members Data Service
 *
 * Unified crew management with competency and certification tracking.
 * Replaces the separate Foremen list with enhanced capabilities.
 */

import { getSharePointSiteId, getAccessToken, graphRequest } from './sharepointData.js';

const LIST_NAME = 'CrewMembers';
const CERTIFICATIONS_LIST = 'CrewCertifications';

export interface CrewMember {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone?: string;
  division: string;
  secondaryDivisions?: string[];
  role: string;
  systemRole?: string;
  crewName?: string;
  isForeman: boolean;
  isActive: boolean;
  startDate?: string;
  certifications?: CrewCertification[];
  equipmentQualifications?: string[];
  specialSkills?: string;
  proficiencyLevel?: string;
  utilizationRate?: number;
  qaScoreAvg?: number;
  safetyIncidentCount?: number;
  lastAssignmentDate?: string;
  notes?: string;
}

export interface CrewCertification {
  id?: string;
  crewMemberId: string;
  certificationCode: string;
  certificationName: string;
  issueDate: string;
  expiryDate?: string;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Revoked';
  certificateNumber?: string;
  issuingAuthority?: string;
  documentUrl?: string;
  notes?: string;
}

function parseJson(value: string | null | undefined, defaultValue: any = null): any {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

function mapCrewMember(item: any): CrewMember {
  const fields = item.fields;
  return {
    id: item.id,
    employeeId: fields.EmployeeId || fields.Title,
    fullName: fields.FullName || fields.Title,
    email: fields.Email || '',
    phone: fields.Phone,
    division: fields.Division || 'Common',
    secondaryDivisions: parseJson(fields.SecondaryDivisions, []),
    role: fields.Role || 'Labourer',
    systemRole: fields.SystemRole,
    crewName: fields.CrewName,
    isForeman: fields.IsForeman ?? false,
    isActive: fields.IsActive ?? true,
    startDate: fields.StartDate,
    certifications: parseJson(fields.Certifications, []),
    equipmentQualifications: parseJson(fields.EquipmentQualifications, []),
    specialSkills: fields.SpecialSkills,
    proficiencyLevel: fields.ProficiencyLevel,
    utilizationRate: fields.UtilizationRate,
    qaScoreAvg: fields.QAScoreAvg,
    safetyIncidentCount: fields.SafetyIncidentCount,
    lastAssignmentDate: fields.LastAssignmentDate,
    notes: fields.Notes,
  };
}

/**
 * Get all active crew members
 */
export async function getAll(includeInactive = false): Promise<CrewMember[]> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  let filter = '';
  if (!includeInactive) {
    filter = '&$filter=fields/IsActive eq true';
  }

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${LIST_NAME}/items?$expand=fields&$top=500${filter}`,
    'GET'
  );

  return (response.value || []).map(mapCrewMember).sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/**
 * Get crew members by division
 */
export async function getByDivision(division: string): Promise<CrewMember[]> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${LIST_NAME}/items?$expand=fields&$filter=fields/IsActive eq true and fields/Division eq '${division}'&$top=500`,
    'GET'
  );

  return (response.value || []).map(mapCrewMember).sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/**
 * Get crew member by ID
 */
export async function getById(id: string): Promise<CrewMember | null> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  try {
    const response = await graphRequest(
      token,
      `/sites/${siteId}/lists/${LIST_NAME}/items/${id}?$expand=fields`,
      'GET'
    );
    return mapCrewMember(response);
  } catch {
    return null;
  }
}

/**
 * Get foremen only
 */
export async function getForemen(division?: string): Promise<CrewMember[]> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  let filter = "fields/IsActive eq true and fields/IsForeman eq true";
  if (division) {
    filter += ` and fields/Division eq '${division}'`;
  }

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${LIST_NAME}/items?$expand=fields&$filter=${filter}&$top=500`,
    'GET'
  );

  return (response.value || []).map(mapCrewMember).sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/**
 * Get crew members qualified for specific equipment
 */
export async function getQualifiedForEquipment(equipmentId: string): Promise<CrewMember[]> {
  const allCrew = await getAll();
  return allCrew.filter(member =>
    member.equipmentQualifications?.includes(equipmentId)
  );
}

/**
 * Get crew members with expiring certifications
 */
export async function getWithExpiringCertifications(daysAhead = 30): Promise<CrewMember[]> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${CERTIFICATIONS_LIST}/items?$expand=fields&$filter=fields/ExpiryDate le '${futureDate.toISOString()}' and fields/Status ne 'Expired'&$top=500`,
    'GET'
  );

  const crewIds = new Set<string>();
  (response.value || []).forEach((item: any) => {
    crewIds.add(item.fields.CrewMemberId);
  });

  const allCrew = await getAll();
  return allCrew.filter(member => crewIds.has(member.id));
}

/**
 * Create a new crew member
 */
export async function create(data: Omit<CrewMember, 'id'>): Promise<CrewMember> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const fields = {
    Title: data.employeeId,
    EmployeeId: data.employeeId,
    FullName: data.fullName,
    Email: data.email,
    Phone: data.phone || '',
    Division: data.division,
    SecondaryDivisions: JSON.stringify(data.secondaryDivisions || []),
    Role: data.role,
    SystemRole: data.systemRole || '',
    CrewName: data.crewName || '',
    IsForeman: data.isForeman,
    IsActive: data.isActive ?? true,
    StartDate: data.startDate || new Date().toISOString(),
    Certifications: JSON.stringify(data.certifications || []),
    EquipmentQualifications: JSON.stringify(data.equipmentQualifications || []),
    SpecialSkills: data.specialSkills || '',
    ProficiencyLevel: data.proficiencyLevel || 'Trainee',
    Notes: data.notes || '',
  };

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${LIST_NAME}/items`,
    'POST',
    { fields }
  );

  return mapCrewMember(response);
}

/**
 * Update a crew member
 */
export async function update(id: string, data: Partial<CrewMember>): Promise<CrewMember | null> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const fields: Record<string, any> = {};

  if (data.fullName !== undefined) fields.FullName = data.fullName;
  if (data.email !== undefined) fields.Email = data.email;
  if (data.phone !== undefined) fields.Phone = data.phone;
  if (data.division !== undefined) fields.Division = data.division;
  if (data.secondaryDivisions !== undefined) fields.SecondaryDivisions = JSON.stringify(data.secondaryDivisions);
  if (data.role !== undefined) fields.Role = data.role;
  if (data.systemRole !== undefined) fields.SystemRole = data.systemRole;
  if (data.crewName !== undefined) fields.CrewName = data.crewName;
  if (data.isForeman !== undefined) fields.IsForeman = data.isForeman;
  if (data.isActive !== undefined) fields.IsActive = data.isActive;
  if (data.certifications !== undefined) fields.Certifications = JSON.stringify(data.certifications);
  if (data.equipmentQualifications !== undefined) fields.EquipmentQualifications = JSON.stringify(data.equipmentQualifications);
  if (data.specialSkills !== undefined) fields.SpecialSkills = data.specialSkills;
  if (data.proficiencyLevel !== undefined) fields.ProficiencyLevel = data.proficiencyLevel;
  if (data.utilizationRate !== undefined) fields.UtilizationRate = data.utilizationRate;
  if (data.qaScoreAvg !== undefined) fields.QAScoreAvg = data.qaScoreAvg;
  if (data.safetyIncidentCount !== undefined) fields.SafetyIncidentCount = data.safetyIncidentCount;
  if (data.lastAssignmentDate !== undefined) fields.LastAssignmentDate = data.lastAssignmentDate;
  if (data.notes !== undefined) fields.Notes = data.notes;

  await graphRequest(
    token,
    `/sites/${siteId}/lists/${LIST_NAME}/items/${id}/fields`,
    'PATCH',
    fields
  );

  return getById(id);
}

/**
 * Add a certification to a crew member
 */
export async function addCertification(crewMemberId: string, cert: Omit<CrewCertification, 'id' | 'crewMemberId'>): Promise<void> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  // Calculate status based on expiry
  let status: CrewCertification['status'] = 'Active';
  if (cert.expiryDate) {
    const expiry = new Date(cert.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      status = 'Expired';
    } else if (daysUntilExpiry < 30) {
      status = 'Expiring Soon';
    }
  }

  const fields = {
    Title: `${crewMemberId}-${cert.certificationCode}`,
    CrewMemberId: crewMemberId,
    CertificationCode: cert.certificationCode,
    CertificationName: cert.certificationName,
    IssueDate: cert.issueDate,
    ExpiryDate: cert.expiryDate || '',
    Status: status,
    CertificateNumber: cert.certificateNumber || '',
    IssuingAuthority: cert.issuingAuthority || '',
    DocumentUrl: cert.documentUrl || '',
    Notes: cert.notes || '',
  };

  await graphRequest(
    token,
    `/sites/${siteId}/lists/${CERTIFICATIONS_LIST}/items`,
    'POST',
    { fields }
  );
}

/**
 * Get certifications for a crew member
 */
export async function getCertifications(crewMemberId: string): Promise<CrewCertification[]> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${CERTIFICATIONS_LIST}/items?$expand=fields&$filter=fields/CrewMemberId eq '${crewMemberId}'&$top=100`,
    'GET'
  );

  return (response.value || []).map((item: any) => ({
    id: item.id,
    crewMemberId: item.fields.CrewMemberId,
    certificationCode: item.fields.CertificationCode,
    certificationName: item.fields.CertificationName,
    issueDate: item.fields.IssueDate,
    expiryDate: item.fields.ExpiryDate,
    status: item.fields.Status,
    certificateNumber: item.fields.CertificateNumber,
    issuingAuthority: item.fields.IssuingAuthority,
    documentUrl: item.fields.DocumentUrl,
    notes: item.fields.Notes,
  }));
}

/**
 * Update crew member utilization and performance metrics
 */
export async function updateMetrics(
  id: string,
  metrics: {
    utilizationRate?: number;
    qaScoreAvg?: number;
    safetyIncidentCount?: number;
    lastAssignmentDate?: string;
  }
): Promise<void> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const fields: Record<string, any> = {};
  if (metrics.utilizationRate !== undefined) fields.UtilizationRate = metrics.utilizationRate;
  if (metrics.qaScoreAvg !== undefined) fields.QAScoreAvg = metrics.qaScoreAvg;
  if (metrics.safetyIncidentCount !== undefined) fields.SafetyIncidentCount = metrics.safetyIncidentCount;
  if (metrics.lastAssignmentDate !== undefined) fields.LastAssignmentDate = metrics.lastAssignmentDate;

  await graphRequest(
    token,
    `/sites/${siteId}/lists/${LIST_NAME}/items/${id}/fields`,
    'PATCH',
    fields
  );
}

/**
 * Deactivate a crew member (soft delete)
 */
export async function deactivate(id: string): Promise<void> {
  await update(id, { isActive: false });
}

export const CrewMembersData = {
  getAll,
  getByDivision,
  getById,
  getForemen,
  getQualifiedForEquipment,
  getWithExpiringCertifications,
  create,
  update,
  addCertification,
  getCertifications,
  updateMetrics,
  deactivate,
};

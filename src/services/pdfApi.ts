const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// TypeScript Interfaces
export interface JobSheetData {
  id?: string;
  jobNumber: string;
  date: string;
  client: string;
  location: string;
  description: string;
  projectManager?: string;
  supervisor?: string;
  crew?: string[];
  equipment?: string[];
  materials?: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  safetyNotes?: string;
  qualityChecks?: Array<{
    item: string;
    passed: boolean;
    notes?: string;
  }>;
}

export interface SamplingPlanData {
  id?: string;
  planId: string;
  date: string;
  jobNumber?: string;
  materialType: string;
  sampleSize: number;
  samplingMethod: string;
  frequency?: string;
  locations?: string[];
  testingCriteria?: Array<{
    parameter: string;
    specification: string;
    method: string;
  }>;
  inspector?: string;
  notes?: string;
}

export interface IncidentReportData {
  id?: string;
  incidentId: string;
  date: string;
  time?: string;
  location: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  reporter: string;
  description: string;
  injuredPersons?: Array<{
    name: string;
    injury: string;
    treatment: string;
  }>;
  witnessess?: string[];
  immediateActions?: string;
  rootCause?: string;
  correctiveActions?: Array<{
    action: string;
    responsible: string;
    dueDate: string;
  }>;
  attachments?: string[];
}

export interface NcrData {
  id?: string;
  ncrNumber: string;
  date: string;
  jobNumber?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  nonConformance: string;
  raisedBy: string;
  assignedTo?: string;
  category?: string;
  detectedAt?: string;
  impact?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  verificationDate?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface PdfGenerationResponse {
  success: boolean;
  message?: string;
  downloadUrl?: string;
  documentId?: string;
}

/**
 * Generates a Job Sheet PDF
 * @param data - Job sheet data
 * @returns Blob of the generated PDF
 */
export async function generateJobSheetPdf(data: JobSheetData): Promise<Blob> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-jobsheet-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate job sheet PDF');
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error generating job sheet PDF:', error);
    throw error;
  }
}

/**
 * Generates a Sampling Plan PDF
 * @param data - Sampling plan data
 * @returns Blob of the generated PDF
 */
export async function generateSamplingPdf(data: SamplingPlanData): Promise<Blob> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-sampling-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate sampling plan PDF');
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error generating sampling plan PDF:', error);
    throw error;
  }
}

/**
 * Generates an Incident Report PDF
 * @param data - Incident report data
 * @returns Blob of the generated PDF
 */
export async function generateIncidentPdf(data: IncidentReportData): Promise<Blob> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-incident-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate incident report PDF');
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error generating incident report PDF:', error);
    throw error;
  }
}

/**
 * Generates a Non-Conformance Report (NCR) PDF
 * @param data - NCR data
 * @returns Blob of the generated PDF
 */
export async function generateNcrPdf(data: NcrData): Promise<Blob> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-ncr-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate NCR PDF');
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error generating NCR PDF:', error);
    throw error;
  }
}

/**
 * Helper function to download a blob as a file
 * @param blob - The blob to download
 * @param filename - The filename for the download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  generateJobSheetPdf,
  generateSamplingPdf,
  generateIncidentPdf,
  generateNcrPdf,
  downloadBlob,
};

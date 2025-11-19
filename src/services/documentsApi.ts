const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// TypeScript Interfaces
export interface Document {
  id: string;
  title: string;
  type: 'jobsheet' | 'sampling' | 'incident' | 'ncr';
  documentId: string;
  jobNumber?: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  url: string;
  thumbnailUrl?: string;
  sharePointSynced: boolean;
  sharePointUrl?: string;
  metadata?: Record<string, any>;
}

export interface DocumentFilters {
  type?: 'jobsheet' | 'sampling' | 'incident' | 'ncr';
  dateRange?: string;
  jobNumber?: string;
  searchTerm?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  documentId: string;
  expiresAt: string;
}

export interface UploadMetadata {
  title: string;
  type: 'jobsheet' | 'sampling' | 'incident' | 'ncr';
  documentId: string;
  jobNumber?: string;
  size: number;
  metadata?: Record<string, any>;
}

export interface ConfirmUploadRequest {
  documentId: string;
  finalUrl: string;
  size: number;
}

/**
 * Get documents with optional filters
 * @param filters - Optional filters to apply
 * @returns Array of documents
 */
export async function getDocuments(filters?: DocumentFilters): Promise<Document[]> {
  try {
    const queryParams = new URLSearchParams();

    if (filters?.type) {
      queryParams.append('type', filters.type);
    }
    if (filters?.dateRange) {
      queryParams.append('dateRange', filters.dateRange);
    }
    if (filters?.jobNumber) {
      queryParams.append('jobNumber', filters.jobNumber);
    }
    if (filters?.searchTerm) {
      queryParams.append('search', filters.searchTerm);
    }

    const url = `${API_BASE_URL}/api/get-documents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch documents');
    }

    const data = await response.json();
    return data.documents || [];
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}

/**
 * Upload a document with metadata
 * @param file - The file to upload
 * @param metadata - Document metadata
 * @returns The created document
 */
export async function uploadDocument(
  file: File,
  metadata: UploadMetadata
): Promise<Document> {
  try {
    // Step 1: Get upload URL
    const uploadUrlData = await getUploadUrl();

    // Step 2: Upload file to the provided URL
    const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    // Step 3: Confirm upload with metadata
    const document = await confirmUpload({
      documentId: uploadUrlData.documentId,
      finalUrl: uploadResponse.url || uploadUrlData.uploadUrl,
      size: file.size,
    });

    return document;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

/**
 * Get a presigned URL for uploading a document
 * @returns Upload URL and document ID
 */
export async function getUploadUrl(): Promise<UploadUrlResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get upload URL');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting upload URL:', error);
    throw error;
  }
}

/**
 * Confirm document upload after file upload is complete
 * @param request - Confirmation request data
 * @returns The created document
 */
export async function confirmUpload(request: ConfirmUploadRequest): Promise<Document> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/confirm-document-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to confirm upload');
    }

    const data = await response.json();
    return data.document;
  } catch (error) {
    console.error('Error confirming upload:', error);
    throw error;
  }
}

/**
 * Delete a document
 * @param id - Document ID to delete
 * @returns Success status
 */
export async function deleteDocument(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/delete-document`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete document');
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Download a document
 * @param document - The document to download
 */
export function downloadDocument(doc: Document): void {
  const link = globalThis.document.createElement('a');
  link.href = doc.url;
  link.download = `${doc.title}.pdf`;
  link.target = '_blank';
  globalThis.document.body.appendChild(link);
  link.click();
  globalThis.document.body.removeChild(link);
}

/**
 * Get document type label
 * @param type - Document type
 * @returns Formatted label
 */
export function getDocumentTypeLabel(type: Document['type']): string {
  const labels: Record<Document['type'], string> = {
    jobsheet: 'Job Sheet',
    sampling: 'Sampling Plan',
    incident: 'Incident Report',
    ncr: 'Non-Conformance Report',
  };
  return labels[type] || type;
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default {
  getDocuments,
  uploadDocument,
  getUploadUrl,
  confirmUpload,
  deleteDocument,
  downloadDocument,
  getDocumentTypeLabel,
  formatFileSize,
};

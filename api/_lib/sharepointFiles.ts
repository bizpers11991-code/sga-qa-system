/**
 * SharePoint File Storage Service
 *
 * Replaces Cloudflare R2 with SharePoint Document Library storage.
 * Uses Microsoft Graph API to upload, download, and delete files.
 *
 * Files are stored in the "SGAQAFiles" document library with the following structure:
 * - biosecurity/{date}/{filename}
 * - site-photos/{date}/{filename}
 * - damage-photos/{date}/{filename}
 * - job-sheet-images/{date}/{filename}
 * - incidents/{date}/{filename}
 * - qa-packs/{date}/{filename}
 * - job-sheets/{date}/{filename}
 * - documents/{date}/{filename}
 */

import { getAccessToken } from '../../src/lib/sharepoint/auth.js';

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';
const DOCUMENT_LIBRARY_NAME = 'SGAQAFiles';

// Cache for site and drive IDs
let cachedSiteId: string | null = null;
let cachedDriveId: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get the SharePoint site ID
 */
async function getSiteId(): Promise<string> {
  if (cachedSiteId && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedSiteId;
  }

  const siteUrl = process.env.SHAREPOINT_SITE_URL;
  if (!siteUrl) {
    throw new Error('SHAREPOINT_SITE_URL environment variable not set');
  }

  const token = await getAccessToken();
  const url = new URL(siteUrl);
  const graphUrl = `${GRAPH_API_BASE}/sites/${url.hostname}:${url.pathname}`;

  const response = await fetch(graphUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get site ID: ${response.status} - ${error}`);
  }

  const data = await response.json();
  cachedSiteId = data.id;
  cacheTimestamp = Date.now();
  return data.id;
}

/**
 * Get the drive ID for the document library
 */
async function getDriveId(): Promise<string> {
  if (cachedDriveId && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedDriveId;
  }

  const siteId = await getSiteId();
  const token = await getAccessToken();

  // First try to get the specific document library
  const listUrl = `${GRAPH_API_BASE}/sites/${siteId}/lists?$filter=displayName eq '${DOCUMENT_LIBRARY_NAME}'`;

  const listResponse = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (listResponse.ok) {
    const listData = await listResponse.json();
    if (listData.value && listData.value.length > 0) {
      // Get the drive for this list
      const driveUrl = `${GRAPH_API_BASE}/sites/${siteId}/lists/${listData.value[0].id}/drive`;
      const driveResponse = await fetch(driveUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (driveResponse.ok) {
        const driveData = await driveResponse.json();
        cachedDriveId = driveData.id;
        return driveData.id;
      }
    }
  }

  // Fall back to the default drive (Shared Documents)
  const defaultDriveUrl = `${GRAPH_API_BASE}/sites/${siteId}/drive`;
  const defaultResponse = await fetch(defaultDriveUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!defaultResponse.ok) {
    const error = await defaultResponse.text();
    throw new Error(`Failed to get drive ID: ${defaultResponse.status} - ${error}`);
  }

  const data = await defaultResponse.json();
  cachedDriveId = data.id;
  return data.id;
}

/**
 * Ensure a folder path exists in the document library
 */
async function ensureFolderPath(folderPath: string): Promise<void> {
  const siteId = await getSiteId();
  const driveId = await getDriveId();
  const token = await getAccessToken();

  // Split path into parts and create each folder if needed
  const parts = folderPath.split('/').filter(p => p);
  let currentPath = '';

  for (const part of parts) {
    const parentPath = currentPath || 'root';
    currentPath = currentPath ? `${currentPath}/${part}` : part;

    // Check if folder exists
    const checkUrl = `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root:/${currentPath}`;
    const checkResponse = await fetch(checkUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (checkResponse.status === 404) {
      // Create the folder
      const createUrl = parentPath === 'root'
        ? `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root/children`
        : `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root:/${parentPath.replace('root/', '')}:/children`;

      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: part,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'fail',
        }),
      });

      if (!createResponse.ok && createResponse.status !== 409) {
        // 409 means folder already exists (race condition), which is fine
        const error = await createResponse.text();
        console.warn(`Warning creating folder ${part}: ${createResponse.status} - ${error}`);
      }
    }
  }
}

/**
 * Upload a file to SharePoint document library
 * @param filePath - The path within the document library (e.g., "biosecurity/2024-01-01/file.jpg")
 * @param content - The file content as Buffer
 * @param contentType - The MIME type of the file
 * @returns The public web URL of the uploaded file
 */
export async function uploadFile(
  filePath: string,
  content: Buffer,
  contentType: string
): Promise<string> {
  const siteId = await getSiteId();
  const driveId = await getDriveId();
  const token = await getAccessToken();

  // Ensure the folder path exists
  const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
  if (folderPath) {
    await ensureFolderPath(folderPath);
  }

  // Upload the file
  // For files <= 4MB, use simple upload
  // For larger files, use upload session (not implemented here as most files will be small)
  const uploadUrl = `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root:/${filePath}:/content`;

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    },
    body: content,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload file: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Return the web URL for the file
  // This URL is accessible to authenticated users
  return data.webUrl || data['@microsoft.graph.downloadUrl'] || `${process.env.SHAREPOINT_SITE_URL}/${DOCUMENT_LIBRARY_NAME}/${filePath}`;
}

/**
 * Delete a file from SharePoint document library
 * @param filePath - The path within the document library
 */
export async function deleteFile(filePath: string): Promise<void> {
  const siteId = await getSiteId();
  const driveId = await getDriveId();
  const token = await getAccessToken();

  const deleteUrl = `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root:/${filePath}`;

  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to delete file: ${response.status} - ${error}`);
  }
}

/**
 * Get a download URL for a file (valid for a short time)
 * @param filePath - The path within the document library
 * @returns A temporary download URL
 */
export async function getDownloadUrl(filePath: string): Promise<string> {
  const siteId = await getSiteId();
  const driveId = await getDriveId();
  const token = await getAccessToken();

  const url = `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root:/${filePath}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get file info: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data['@microsoft.graph.downloadUrl'] || data.webUrl;
}

/**
 * Create a sharing link for a file (public or organization-wide)
 * @param filePath - The path within the document library
 * @param type - 'view' for read-only, 'edit' for editable
 * @param scope - 'anonymous' for public, 'organization' for internal only
 * @returns The sharing link URL
 */
export async function createSharingLink(
  filePath: string,
  type: 'view' | 'edit' = 'view',
  scope: 'anonymous' | 'organization' = 'organization'
): Promise<string> {
  const siteId = await getSiteId();
  const driveId = await getDriveId();
  const token = await getAccessToken();

  const url = `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root:/${filePath}:/createLink`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      scope,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create sharing link: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.link.webUrl;
}

/**
 * Helper function to upload and get a shareable URL
 * This is the main function to replace R2 uploadAsset
 */
export async function uploadAsset(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const url = await uploadFile(key, body, contentType);
  return url;
}

/**
 * Get SharePoint file storage configuration
 * This replaces getR2Config for compatibility
 */
export function getSharePointFileConfig() {
  return {
    uploadAsset,
    deleteFile,
    getDownloadUrl,
    createSharingLink,
    // For compatibility with existing code
    publicUrl: process.env.SHAREPOINT_SITE_URL || '',
  };
}

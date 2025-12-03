/**
 * Dynamic Resources API - Documents
 *
 * Reads documents from SharePoint document libraries with folder support.
 * GET /api/resources/documents?library=Specifications&folder=Main%20Roads%20WA
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAccessToken } from '../../src/lib/sharepoint/auth.js';

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

// Allowed document libraries
const ALLOWED_LIBRARIES = ['Specifications', 'TestMethods', 'QADocuments', 'SGAQAFiles'];

interface DocumentItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  webUrl: string;
  downloadUrl?: string;
  lastModified: string;
  createdBy?: string;
  path: string;
}

interface DocumentsResponse {
  library: string;
  folder: string | null;
  items: DocumentItem[];
  breadcrumb: { name: string; path: string }[];
}

async function getSiteId(token: string): Promise<string> {
  const siteUrl = process.env.SHAREPOINT_SITE_URL;
  if (!siteUrl) throw new Error('SHAREPOINT_SITE_URL not configured');

  const url = new URL(siteUrl);
  const graphUrl = `${GRAPH_API_BASE}/sites/${url.hostname}:${url.pathname}`;

  const response = await fetch(graphUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get site ID: ${response.status}`);
  }

  const data = await response.json();
  return data.id;
}

async function getDriveId(token: string, siteId: string, libraryName: string): Promise<string> {
  const listUrl = `${GRAPH_API_BASE}/sites/${siteId}/lists?$filter=displayName eq '${libraryName}'`;
  const listResponse = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listResponse.ok) {
    throw new Error(`Failed to find library: ${libraryName}`);
  }

  const listData = await listResponse.json();
  if (!listData.value || listData.value.length === 0) {
    throw new Error(`Library not found: ${libraryName}`);
  }

  const driveUrl = `${GRAPH_API_BASE}/sites/${siteId}/lists/${listData.value[0].id}/drive`;
  const driveResponse = await fetch(driveUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!driveResponse.ok) {
    throw new Error(`Failed to get drive for library: ${libraryName}`);
  }

  const driveData = await driveResponse.json();
  return driveData.id;
}

async function listFolderContents(
  token: string,
  siteId: string,
  driveId: string,
  folderPath: string | null
): Promise<DocumentItem[]> {
  const url = folderPath
    ? `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root:/${folderPath}:/children?$select=id,name,size,file,folder,webUrl,lastModifiedDateTime,createdBy,parentReference&$orderby=name`
    : `${GRAPH_API_BASE}/sites/${siteId}/drives/${driveId}/root/children?$select=id,name,size,file,folder,webUrl,lastModifiedDateTime,createdBy,parentReference&$orderby=name`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Failed to list folder contents: ${response.status}`);
  }

  const data = await response.json();
  const items: DocumentItem[] = [];

  for (const item of data.value || []) {
    const isFolder = !!item.folder;
    const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name;

    items.push({
      id: item.id,
      name: item.name,
      type: isFolder ? 'folder' : 'file',
      size: item.size,
      mimeType: item.file?.mimeType,
      webUrl: item.webUrl,
      downloadUrl: item['@microsoft.graph.downloadUrl'],
      lastModified: item.lastModifiedDateTime,
      createdBy: item.createdBy?.user?.displayName,
      path: itemPath,
    });
  }

  // Sort: folders first, then files
  items.sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });

  return items;
}

function buildBreadcrumb(library: string, folderPath: string | null): { name: string; path: string }[] {
  const breadcrumb = [{ name: library, path: '' }];

  if (folderPath) {
    const parts = folderPath.split('/');
    let currentPath = '';
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      breadcrumb.push({ name: part, path: currentPath });
    }
  }

  return breadcrumb;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { library, folder } = req.query;

    // Validate library parameter
    const libraryName = typeof library === 'string' ? library : 'Specifications';
    if (!ALLOWED_LIBRARIES.includes(libraryName)) {
      return res.status(400).json({
        error: 'Invalid library',
        allowed: ALLOWED_LIBRARIES,
      });
    }

    // Get folder path (optional)
    const folderPath = typeof folder === 'string' ? decodeURIComponent(folder) : null;

    // Get SharePoint access
    const token = await getAccessToken();
    const siteId = await getSiteId(token);
    const driveId = await getDriveId(token, siteId, libraryName);

    // List contents
    const items = await listFolderContents(token, siteId, driveId, folderPath);

    // Build response
    const response: DocumentsResponse = {
      library: libraryName,
      folder: folderPath,
      items,
      breadcrumb: buildBreadcrumb(libraryName, folderPath),
    };

    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Documents API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch documents',
      message: error.message,
    });
  }
}

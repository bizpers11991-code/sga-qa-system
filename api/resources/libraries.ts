/**
 * Dynamic Resources API - List Libraries
 *
 * Returns available document libraries from SharePoint.
 * GET /api/resources/libraries
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAccessToken } from '../../src/lib/sharepoint/auth.js';

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

interface LibraryInfo {
  name: string;
  displayName: string;
  description: string;
  itemCount: number;
  webUrl: string;
  icon: string;
}

// Library metadata
const LIBRARY_METADATA: Record<string, { description: string; icon: string }> = {
  'Specifications': {
    description: 'Main Roads WA, Australian Standards, and IPWEA specifications',
    icon: 'DocumentSet',
  },
  'TestMethods': {
    description: 'Asphalt, bitumen, density, and surface test methods',
    icon: 'TestBeaker',
  },
  'QADocuments': {
    description: 'Quality assurance documents and templates',
    icon: 'Certificate',
  },
  'SGAQAFiles': {
    description: 'Uploaded site photos and reports',
    icon: 'Photo2',
  },
};

async function getSiteId(token: string): Promise<string> {
  const siteUrl = process.env.SHAREPOINT_SITE_URL;
  if (!siteUrl) throw new Error('SHAREPOINT_SITE_URL not configured');

  const url = new URL(siteUrl);
  const graphUrl = `${GRAPH_API_BASE}/sites/${url.hostname}:${url.pathname}`;

  const response = await fetch(graphUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  return data.id;
}

async function getDocumentLibraries(token: string, siteId: string): Promise<LibraryInfo[]> {
  // Get all lists that are document libraries
  const url = `${GRAPH_API_BASE}/sites/${siteId}/lists?$filter=list/template eq 'documentLibrary'&$select=id,displayName,webUrl,list`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get libraries: ${response.status}`);
  }

  const data = await response.json();
  const libraries: LibraryInfo[] = [];

  for (const list of data.value || []) {
    // Skip system libraries
    if (list.displayName.startsWith('_') || list.displayName === 'Site Assets' || list.displayName === 'Site Pages') {
      continue;
    }

    const metadata = LIBRARY_METADATA[list.displayName] || {
      description: 'Document library',
      icon: 'FabricFolder',
    };

    libraries.push({
      name: list.displayName,
      displayName: list.displayName.replace(/([A-Z])/g, ' $1').trim(), // Add spaces before capitals
      description: metadata.description,
      itemCount: list.list?.itemCount || 0,
      webUrl: list.webUrl,
      icon: metadata.icon,
    });
  }

  // Sort by name
  libraries.sort((a, b) => a.name.localeCompare(b.name));

  return libraries;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await getAccessToken();
    const siteId = await getSiteId(token);
    const libraries = await getDocumentLibraries(token, siteId);

    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    return res.status(200).json({
      libraries,
      siteUrl: process.env.SHAREPOINT_SITE_URL,
    });

  } catch (error: any) {
    console.error('Libraries API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch libraries',
      message: error.message,
    });
  }
}

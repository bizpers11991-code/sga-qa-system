// src/api/_lib/sharepoint.ts
// SharePoint integration via Microsoft Graph API

import { Client } from '@microsoft/microsoft-graph-client';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';

// Environment variables
const TENANT_ID = process.env.TENANT_ID || '';
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const SHAREPOINT_SITE_URL = process.env.SHAREPOINT_SITE_URL || 'https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance';

// Utility function to get the site ID from the SharePoint Site URL
async function getSiteIdFromUrl(client: Client, siteUrl: string): Promise<string | null> {
  try {
    const url = new URL(siteUrl);
    const site = await client.api(`/sites/${url.hostname}:${url.pathname}`).get();
    return site.id as string;
  } catch (error) {
    console.error('Error getting site ID:', error);
    return null;
  }
}

// Authentication provider using client credentials flow
const authProvider = (callback: (error: any, accessToken: string | null) => void) => {
    const authority = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    const tokenRequest = {
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
    };

    const formBody = Object.keys(tokenRequest)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent((tokenRequest as any)[key]))
        .join('&');

    fetch(authority, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody,
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {
            callback(null, data.access_token);
        } else {
            callback(data, null);
        }
    })
    .catch(error => callback(error, null));
};

// Initialize Microsoft Graph client
const graphClient = Client.init({ authProvider });

// Define the library names
const libraryNames = {
    qaPacks: 'QA Packs',
    jobSheets: 'Job Sheets',
    sitePhotos: 'Site Photos',
    incidentReports: 'Incident Reports',
    ncrDocuments: 'NCR Documents',
};

type LibraryName = keyof typeof libraryNames;

// Helper function to get the drive ID from the library name
async function getDriveId(libraryName: LibraryName): Promise<string | null> {
  try {
    const siteId = await getSiteIdFromUrl(graphClient, SHAREPOINT_SITE_URL);
    if (!siteId) {
      console.error('Failed to get site ID.');
      return null;
    }

    const drives = await graphClient.api(`/sites/${siteId}/drives`).get();
    const drive = drives.value.find((d: MicrosoftGraph.Drive) => d.name === libraryNames[libraryName]);

    if (!drive) {
      console.error(`Drive with name "${libraryNames[libraryName]}" not found.`);
      return null;
    }

    return drive.id || null;
  } catch (error) {
    console.error(`Error getting drive ID for library ${libraryName}:`, error);
    return null;
  }
}

/**
 * Upload file to SharePoint library
 */
export async function uploadFile(
  libraryName: LibraryName,
  fileName: string,
  fileContent: ArrayBuffer
): Promise<MicrosoftGraph.DriveItem | null> {
    try {
        const driveId = await getDriveId(libraryName);
        if (!driveId) return null;

        const uploadResponse = await graphClient
            .api(`/drives/${driveId}/root:/${fileName}:/content`)
            .put(fileContent);

        return uploadResponse as MicrosoftGraph.DriveItem;
    } catch (error) {
        console.error(`Error uploading file to ${libraryName}:`, error);
        return null;
    }
}

/**
 * Get files from SharePoint library
 */
export async function getFiles(libraryName: LibraryName): Promise<MicrosoftGraph.DriveItem[] | null> {
    try {
        const driveId = await getDriveId(libraryName);
        if (!driveId) return null;

        const files = await graphClient
            .api(`/drives/${driveId}/root/children`)
            .get();

        return files.value as MicrosoftGraph.DriveItem[];
    } catch (error) {
        console.error(`Error getting files from ${libraryName}:`, error);
        return null;
    }
}

/**
 * Delete file from SharePoint library
 */
export async function deleteFile(libraryName: LibraryName, fileId: string): Promise<boolean> {
    try {
        const driveId = await getDriveId(libraryName);
        if (!driveId) return false;

        await graphClient
            .api(`/drives/${driveId}/items/${fileId}`)
            .delete();

        return true;
    } catch (error) {
        console.error(`Error deleting file ${fileId} from ${libraryName}:`, error);
        return false;
    }
}

/**
 * Create folder in SharePoint library
 */
export async function createFolder(
  libraryName: LibraryName,
  folderName: string
): Promise<MicrosoftGraph.DriveItem | null> {
    try {
        const driveId = await getDriveId(libraryName);
        if (!driveId) return null;

        const folder = {
            name: folderName,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'replace',
        };

        const createFolderResponse = await graphClient
            .api(`/drives/${driveId}/root/children`)
            .post(folder);

        return createFolderResponse as MicrosoftGraph.DriveItem;
    } catch (error) {
        console.error(`Error creating folder ${folderName} in ${libraryName}:`, error);
        return null;
    }
}

/**
 * Get download URL for a file
 */
export async function getDownloadUrl(libraryName: LibraryName, fileId: string): Promise<string | null> {
    try {
        const driveId = await getDriveId(libraryName);
        if (!driveId) return null;

        const item = await graphClient
            .api(`/drives/${driveId}/items/${fileId}`)
            .get();

        return item['@microsoft.graph.downloadUrl'] as string || null;
    } catch (error) {
        console.error(`Error getting download URL for file ${fileId} in ${libraryName}:`, error);
        return null;
    }
}

export default { uploadFile, getFiles, deleteFile, createFolder, getDownloadUrl };

// lib/dataverseService.ts
// Microsoft Dataverse integration for SGA QA Pack
// Provides authenticated access to Dataverse entities using Azure AD

const DynamicsWebApi = require('dynamics-web-api');
import { DefaultAzureCredential } from '@azure/identity';
import { InvocationContext } from '@azure/functions';

/**
 * Dataverse Configuration
 */
interface DataverseConfig {
    serverUrl: string;
    apiVersion?: string;
    callerObjectId?: string; // For impersonation
}

/**
 * QA Pack entity from Dataverse
 * Matches the sga_qapack table schema
 */
export interface QAPackEntity {
    sga_qapackid: string;
    sga_name: string;
    sga_jobnumber?: string;
    sga_client?: string;
    sga_division?: string;
    sga_submittedby?: string;
    sga_submitteddate?: Date;
    sga_temperature?: number;
    sga_weatherconditions?: string;
    sga_concretegrade?: string;
    sga_slump?: number;
    sga_comments?: string;
    sga_incidents?: any[];
    sga_photos?: any[];
    sga_status?: string;
    createdon?: Date;
    modifiedon?: Date;
}

/**
 * Singleton Dataverse client instance
 */
let dataverseClient: any = null;
let azureCredential: DefaultAzureCredential | null = null;

/**
 * Initialize Azure AD credential
 */
function getAzureCredential(): DefaultAzureCredential {
    if (!azureCredential) {
        azureCredential = new DefaultAzureCredential();
    }
    return azureCredential;
}

/**
 * Get or create authenticated Dataverse client
 *
 * @param config Dataverse configuration
 * @param context Azure Functions context for logging
 * @returns Authenticated DynamicsWebApi client
 */
export async function getDataverseClient(
    config: DataverseConfig,
    context?: InvocationContext
): Promise<any> {
    if (dataverseClient) {
        return dataverseClient;
    }

    context?.log('Initializing Dataverse client...');

    // Get Azure AD token for Dataverse
    const credential = getAzureCredential();
    const scope = `${config.serverUrl}/.default`;

    try {
        // Request access token
        const tokenResponse = await credential.getToken(scope);
        const accessToken = tokenResponse.token;

        context?.log('Azure AD authentication successful');

        // Initialize Dataverse Web API client
        dataverseClient = new DynamicsWebApi({
            webApiUrl: `${config.serverUrl}/api/data/v${config.apiVersion || '9.2'}/`,
            onTokenRefresh: async (callback: (token: string) => void) => {
                try {
                    const refreshedToken = await credential.getToken(scope);
                    callback(refreshedToken.token);
                } catch (error) {
                    context?.error('Token refresh failed:', error);
                    callback(''); // Return empty string to trigger re-auth
                }
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json; charset=utf-8',
                'Prefer': 'return=representation' // Return full entity on create/update
            }
        });

        // Set impersonation if caller ID provided
        if (config.callerObjectId) {
            dataverseClient.setConfig({
                impersonate: config.callerObjectId
            });
            context?.log(`Impersonating user: ${config.callerObjectId}`);
        }

        context?.log('Dataverse client initialized successfully');
        return dataverseClient;

    } catch (error) {
        context?.error('Failed to initialize Dataverse client:', error);
        throw new Error(`Dataverse authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Fetch QA Pack from Dataverse by ID
 *
 * @param qaPackId GUID of the QA Pack entity
 * @param config Dataverse configuration
 * @param context Azure Functions context for logging
 * @returns QA Pack entity with related data
 */
export async function fetchQAPackFromDataverse(
    qaPackId: string,
    config: DataverseConfig,
    context?: InvocationContext
): Promise<QAPackEntity> {
    context?.log(`Fetching QA Pack from Dataverse: ${qaPackId}`);

    try {
        const client = await getDataverseClient(config, context);

        // Fetch QA Pack with related entities expanded
        const qapack = await client.retrieve(
            'sga_qapacks',
            qaPackId,
            [
                'sga_qapackid',
                'sga_name',
                'sga_jobnumber',
                'sga_client',
                'sga_division',
                'sga_submittedby',
                'sga_submitteddate',
                'sga_temperature',
                'sga_weatherconditions',
                'sga_concretegrade',
                'sga_slump',
                'sga_comments',
                'sga_status',
                'createdon',
                'modifiedon'
            ],
            // Expand related entities
            'sga_sga_qapack_sga_incident,sga_sga_qapack_sga_photo'
        );

        if (!qapack) {
            throw new Error(`QA Pack not found: ${qaPackId}`);
        }

        context?.log(`Successfully fetched QA Pack: ${qapack.sga_name || qaPackId}`);
        return qapack;

    } catch (error) {
        context?.error('Failed to fetch QA Pack from Dataverse:', error);

        // Provide helpful error messages
        if (error instanceof Error) {
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                throw new Error('Dataverse authentication failed - check Azure AD permissions');
            } else if (error.message.includes('404') || error.message.includes('Not Found')) {
                throw new Error(`QA Pack not found in Dataverse: ${qaPackId}`);
            } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                throw new Error('Insufficient permissions to access Dataverse entity');
            }
        }

        throw new Error(`Dataverse query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Update QA Pack AI summary in Dataverse
 *
 * @param qaPackId GUID of the QA Pack entity
 * @param aiSummary Generated AI summary text
 * @param config Dataverse configuration
 * @param context Azure Functions context for logging
 */
export async function updateQAPackSummary(
    qaPackId: string,
    aiSummary: string,
    config: DataverseConfig,
    context?: InvocationContext
): Promise<void> {
    context?.log(`Updating QA Pack AI summary: ${qaPackId}`);

    try {
        const client = await getDataverseClient(config, context);

        await client.update(
            'sga_qapacks',
            qaPackId,
            {
                sga_aisummary: aiSummary,
                sga_aisummarygenerated: new Date()
            } as any
        );

        context?.log(`Successfully updated QA Pack AI summary`);

    } catch (error) {
        context?.error('Failed to update QA Pack summary:', error);
        throw new Error(`Failed to save AI summary to Dataverse: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Health check - verify Dataverse connectivity
 *
 * @param config Dataverse configuration
 * @param context Azure Functions context for logging
 * @returns true if connection is healthy
 */
export async function checkDataverseHealth(
    config: DataverseConfig,
    context?: InvocationContext
): Promise<boolean> {
    try {
        const client = await getDataverseClient(config, context);

        // Simple query to verify connectivity
        await client.retrieveMultiple('sga_qapacks', ['sga_qapackid'], '', 1);

        context?.log('Dataverse health check: OK');
        return true;

    } catch (error) {
        context?.error('Dataverse health check failed:', error);
        return false;
    }
}

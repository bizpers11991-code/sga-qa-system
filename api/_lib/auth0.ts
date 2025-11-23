// api/_lib/auth0.ts
import { ManagementClient } from 'auth0';
import { getRedisInstance } from './redis.js';

let managementClient: ManagementClient | null = null;

/**
 * Returns a singleton instance of the Auth0 Management Client.
 * This pattern ensures that for a 'warm' function (one that is reused for a subsequent request),
 * the existing client instance is reused, improving performance.
 */
export const getAuth0ManagementClient = async (): Promise<ManagementClient> => {
    if (managementClient) {
        return managementClient;
    }

    const { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET } = process.env;

    if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET) {
        const missingVars: string[] = [];
        if (!AUTH0_DOMAIN) missingVars.push('AUTH0_DOMAIN');
        if (!AUTH0_CLIENT_ID) missingVars.push('AUTH0_CLIENT_ID');
        if (!AUTH0_CLIENT_SECRET) missingVars.push('AUTH0_CLIENT_SECRET');

        const errorMessage = `AUTH0_CONFIGURATION_ERROR: The following required server-side environment variables are missing: ${missingVars.join(', ')}. ` +
            "Please add these to your Vercel project settings. These must be the credentials for your Auth0 'Machine-to-Machine (M2M)' application, not the frontend 'Single Page Application (SPA)'. " +
            "Refer to the README.md for detailed setup instructions.";
        
        throw new Error(errorMessage);
    }

    managementClient = new ManagementClient({
        domain: AUTH0_DOMAIN,
        clientId: AUTH0_CLIENT_ID,
        clientSecret: AUTH0_CLIENT_SECRET,
    });
    
    return managementClient;
};

const TOKEN_CACHE_KEY = 'auth0:management-api-token';

/**
 * Fetches and caches an Auth0 Management API token.
 * This function communicates directly with the /oauth/token endpoint.
 * @returns A promise that resolves to a valid access token.
 */
export const getManagementApiToken = async (): Promise<string> => {
    const redis = getRedisInstance();

    // 1. Try to get token from cache
    const cachedToken = await redis.get<string>(TOKEN_CACHE_KEY);
    if (cachedToken) {
        return cachedToken;
    }

    // 2. If not in cache, fetch a new one
    const { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET } = process.env;
    if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET) {
        throw new Error('AUTH0_CONFIGURATION_ERROR: M2M credentials are not set for token fetch.');
    }

    const audience = `https://${AUTH0_DOMAIN}/api/v2/`;
    const tokenUrl = `https://${AUTH0_DOMAIN}/oauth/token`;

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: AUTH0_CLIENT_ID,
            client_secret: AUTH0_CLIENT_SECRET,
            audience: audience,
            grant_type: 'client_credentials',
        }),
    });

    const data = await response.json();

    if (!response.ok || !data.access_token) {
        console.error('Failed to fetch Auth0 Management API token:', data);
        throw new Error('Could not authenticate with Auth0 Management API.');
    }

    // 3. Cache the new token with an expiry (expires_in seconds, minus a 60s buffer)
    const expiresIn = data.expires_in ? data.expires_in - 60 : 3600; // Default to 1 hour
    await redis.set(TOKEN_CACHE_KEY, data.access_token, { ex: expiresIn });

    return data.access_token;
};
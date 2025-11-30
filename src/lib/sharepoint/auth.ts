/**
 * @file src/lib/sharepoint/auth.ts
 * @description MSAL authentication for SharePoint backend access
 * Handles service account authentication using client credentials flow
 * Includes token caching to minimize authentication requests
 */

import { ConfidentialClientApplication, type AuthenticationResult } from '@azure/msal-node';
import { SharePointApiError, type SharePointConfig, type TokenCacheEntry } from './types.js';

/**
 * In-memory token cache
 * In production, consider using Redis or another distributed cache
 * For Vercel serverless, in-memory is acceptable due to function reuse
 */
let tokenCache: TokenCacheEntry | null = null;

/**
 * MSAL application instance
 * Cached to reuse across function invocations
 */
let msalApp: ConfidentialClientApplication | null = null;

/**
 * SharePoint scope for Microsoft Graph API
 * Using the default scope for SharePoint Online
 */
const SHAREPOINT_SCOPE = 'https://graph.microsoft.com/.default';

/**
 * Alternative scope specifically for SharePoint sites
 */
const SHAREPOINT_SITES_SCOPE = (siteUrl: string): string => {
  const url = new URL(siteUrl);
  return `${url.protocol}//${url.hostname}/.default`;
};

/**
 * Validates SharePoint configuration from environment variables
 * Throws detailed errors if configuration is incomplete
 *
 * Supports both AZURE_* and non-prefixed environment variable names for backward compatibility:
 * - AZURE_TENANT_ID or TENANT_ID
 * - AZURE_CLIENT_ID or CLIENT_ID
 * - AZURE_CLIENT_SECRET or CLIENT_SECRET
 *
 * @returns {SharePointConfig} Validated configuration object
 * @throws {SharePointApiError} If any required environment variable is missing
 */
export function getSharePointConfig(): SharePointConfig {
  const siteUrl = process.env.SHAREPOINT_SITE_URL;
  // Support both AZURE_* prefixed and non-prefixed variable names
  const tenantId = process.env.AZURE_TENANT_ID || process.env.TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET || process.env.CLIENT_SECRET;

  const missing: string[] = [];
  if (!siteUrl) missing.push('SHAREPOINT_SITE_URL');
  if (!tenantId) missing.push('AZURE_TENANT_ID or TENANT_ID');
  if (!clientId) missing.push('AZURE_CLIENT_ID or CLIENT_ID');
  if (!clientSecret) missing.push('AZURE_CLIENT_SECRET or CLIENT_SECRET');

  if (missing.length > 0) {
    throw new SharePointApiError(
      `Missing required environment variables: ${missing.join(', ')}`,
      500,
      'CONFIGURATION_ERROR',
      false
    );
  }

  return {
    siteUrl: siteUrl!,
    tenantId: tenantId!,
    clientId: clientId!,
    clientSecret: clientSecret!,
  };
}

/**
 * Initializes or retrieves the MSAL confidential client application
 * Uses singleton pattern to reuse the client across invocations
 *
 * @param {SharePointConfig} config - SharePoint configuration
 * @returns {ConfidentialClientApplication} MSAL client instance
 */
function getMsalApp(config: SharePointConfig): ConfidentialClientApplication {
  if (!msalApp) {
    msalApp = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
        clientSecret: config.clientSecret,
      },
      system: {
        loggerOptions: {
          loggerCallback(loglevel, message, containsPii) {
            // Only log errors in production
            if (loglevel === 0 && process.env.NODE_ENV === 'production') {
              console.error('[MSAL]', message);
            } else if (process.env.NODE_ENV === 'development') {
              console.log('[MSAL]', message);
            }
          },
          piiLoggingEnabled: false,
          logLevel: process.env.NODE_ENV === 'development' ? 3 : 1, // Verbose in dev, Error in prod
        },
      },
    });
  }
  return msalApp;
}

/**
 * Checks if cached token is still valid
 * Includes 5-minute buffer to prevent using tokens about to expire
 *
 * @returns {boolean} True if cache exists and is valid
 */
function isTokenCacheValid(): boolean {
  if (!tokenCache) return false;

  const now = Date.now();
  const bufferMs = 5 * 60 * 1000; // 5-minute buffer
  return tokenCache.expiresOn > now + bufferMs;
}

/**
 * Acquires access token for SharePoint using client credentials flow
 * Uses cached token if available and valid, otherwise requests new token
 *
 * This function is the primary entry point for authentication
 *
 * @param {boolean} forceRefresh - Force token refresh even if cache is valid
 * @returns {Promise<string>} Access token for SharePoint API
 * @throws {SharePointApiError} If authentication fails
 *
 * @example
 * ```typescript
 * const token = await getAccessToken();
 * // Use token in SharePoint API requests
 * ```
 */
export async function getAccessToken(forceRefresh: boolean = false): Promise<string> {
  // Return cached token if valid
  if (!forceRefresh && isTokenCacheValid() && tokenCache) {
    return tokenCache.accessToken;
  }

  try {
    const config = getSharePointConfig();
    const app = getMsalApp(config);

    // Use SharePoint-specific scope
    const scope = SHAREPOINT_SITES_SCOPE(config.siteUrl);

    // Request token using client credentials flow
    const result: AuthenticationResult | null = await app.acquireTokenByClientCredential({
      scopes: [scope],
      skipCache: forceRefresh,
    });

    if (!result || !result.accessToken) {
      throw new SharePointApiError(
        'Failed to acquire access token',
        401,
        'AUTH_TOKEN_FAILED',
        true
      );
    }

    // Cache the token
    tokenCache = {
      accessToken: result.accessToken,
      expiresOn: result.expiresOn?.getTime() || Date.now() + 3600000, // Default 1 hour
    };

    return result.accessToken;
  } catch (error) {
    // Clear invalid cache
    tokenCache = null;

    if (error instanceof SharePointApiError) {
      throw error;
    }

    // Handle MSAL-specific errors
    if (error && typeof error === 'object' && 'errorCode' in error) {
      const msalError = error as { errorCode: string; errorMessage: string };
      throw new SharePointApiError(
        `Authentication failed: ${msalError.errorMessage}`,
        401,
        msalError.errorCode,
        false
      );
    }

    // Generic error fallback
    throw new SharePointApiError(
      `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'AUTH_ERROR',
      false
    );
  }
}

/**
 * Clears the token cache
 * Useful for testing or forcing re-authentication
 *
 * @example
 * ```typescript
 * clearTokenCache();
 * const newToken = await getAccessToken();
 * ```
 */
export function clearTokenCache(): void {
  tokenCache = null;
}

/**
 * Validates that the current authentication configuration is correct
 * Attempts to acquire a token and returns success status
 *
 * @returns {Promise<{ valid: boolean; error?: string }>} Validation result
 *
 * @example
 * ```typescript
 * const { valid, error } = await validateAuthConfig();
 * if (!valid) {
 *   console.error('Auth config invalid:', error);
 * }
 * ```
 */
export async function validateAuthConfig(): Promise<{ valid: boolean; error?: string }> {
  try {
    await getAccessToken(true); // Force refresh to test
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown authentication error',
    };
  }
}

/**
 * Gets current token expiration time
 * Useful for monitoring and debugging
 *
 * @returns {number | null} Expiration timestamp or null if no cached token
 */
export function getTokenExpiration(): number | null {
  return tokenCache?.expiresOn || null;
}

/**
 * Environment Configuration Validator
 * 
 * Validates and provides typed access to environment variables.
 * Focused on Microsoft 365 / SharePoint stack with Azure OpenAI.
 * 
 * @module envConfig
 */

// ============================================================================
// CONFIGURATION STATUS TYPES
// ============================================================================

export interface ConfigStatus {
  sharepoint: {
    configured: boolean;
    siteUrl?: string;
  };
  azure: {
    configured: boolean;
    tenantId?: string;
    clientId?: string;
  };
  azureOpenAI: {
    configured: boolean;
    endpoint?: string;
  };
  gemini: {
    configured: boolean;
  };
  teams: {
    configured: boolean;
    webhooksCount: number;
  };
}

// ============================================================================
// CONFIGURATION STATUS CHECK
// ============================================================================

/**
 * Get current configuration status for health checks
 */
export function getConfigStatus(): ConfigStatus {
  const teamsWebhooks = [
    process.env.TEAMS_WEBHOOK_URL_SUMMARY,
    process.env.TEAMS_WEBHOOK_URL_QA_PACK,
    process.env.TEAMS_WEBHOOK_URL_ERROR,
    process.env.TEAMS_WEBHOOK_URL_MANAGEMENT,
    process.env.TEAMS_WEBHOOK_URL_ASPHALT_JOBS,
    process.env.TEAMS_WEBHOOK_URL_PROFILING_JOBS,
    process.env.TEAMS_WEBHOOK_URL_SPRAY_JOBS,
    process.env.TEAMS_WEBHOOK_URL_INCIDENTS,
  ].filter(Boolean).length;

  return {
    sharepoint: {
      configured: !!(
        process.env.SHAREPOINT_SITE_URL &&
        process.env.TENANT_ID &&
        process.env.CLIENT_ID &&
        process.env.CLIENT_SECRET
      ),
      siteUrl: process.env.SHAREPOINT_SITE_URL,
    },
    azure: {
      configured: !!(
        process.env.TENANT_ID &&
        process.env.CLIENT_ID &&
        process.env.CLIENT_SECRET
      ),
      tenantId: process.env.TENANT_ID ? '***configured***' : undefined,
      clientId: process.env.CLIENT_ID ? '***configured***' : undefined,
    },
    azureOpenAI: {
      configured: !!(
        process.env.AZURE_OPENAI_ENDPOINT &&
        process.env.AZURE_OPENAI_API_KEY
      ),
      endpoint: process.env.AZURE_OPENAI_ENDPOINT
        ? process.env.AZURE_OPENAI_ENDPOINT.replace(/^(https?:\/\/[^\/]+).*/, '$1/***')
        : undefined,
    },
    gemini: {
      configured: !!(process.env.GOOGLE_API_KEY || process.env.API_KEY),
    },
    teams: {
      configured: teamsWebhooks > 0,
      webhooksCount: teamsWebhooks,
    },
  };
}

// ============================================================================
// ENVIRONMENT VARIABLE GETTERS
// ============================================================================

/**
 * Get required environment variable (throws if not set)
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Get optional environment variable with default
 */
export function getEnv(name: string, defaultValue: string = ''): string {
  return process.env[name] || defaultValue;
}

/**
 * Get numeric environment variable
 */
export function getNumericEnv(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get boolean environment variable
 */
export function getBooleanEnv(name: string, defaultValue: boolean = false): boolean {
  const value = process.env[name]?.toLowerCase();
  if (!value) return defaultValue;
  return value === 'true' || value === '1' || value === 'yes';
}

// ============================================================================
// TYPED CONFIGURATION OBJECTS
// ============================================================================

export interface SharePointConfig {
  siteUrl: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export function getSharePointConfig(): SharePointConfig | null {
  const siteUrl = process.env.SHAREPOINT_SITE_URL;
  const tenantId = process.env.TENANT_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!siteUrl || !tenantId || !clientId || !clientSecret) return null;

  return { siteUrl, tenantId, clientId, clientSecret };
}

export interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion: string;
}

export function getAzureOpenAIConfig(): AzureOpenAIConfig | null {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;

  if (!endpoint || !apiKey) return null;

  return {
    endpoint,
    apiKey,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
  };
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

export function getGeminiConfig(): GeminiConfig | null {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.API_KEY;
  if (!apiKey) return null;

  return {
    apiKey,
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate configuration for production deployment
 */
export function validateProductionConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check SharePoint (required)
  const sharePointConfig = getSharePointConfig();
  if (!sharePointConfig) {
    errors.push('SharePoint not configured. Set SHAREPOINT_SITE_URL, TENANT_ID, CLIENT_ID, CLIENT_SECRET.');
  }

  // Check AI features (warning only)
  const azureOpenAIConfig = getAzureOpenAIConfig();
  const geminiConfig = getGeminiConfig();
  
  if (!azureOpenAIConfig && !geminiConfig) {
    warnings.push('No AI provider configured. AI features will be disabled. Set AZURE_OPENAI_* or GOOGLE_API_KEY.');
  } else if (azureOpenAIConfig) {
    // Good - using Microsoft stack
  } else if (geminiConfig) {
    warnings.push('Using Gemini instead of Azure OpenAI. Consider migrating to Azure OpenAI for M365 integration.');
  }

  // Check Teams webhooks (warning only)
  const status = getConfigStatus();
  if (!status.teams.configured) {
    warnings.push('No Teams webhooks configured. Notifications will not be sent.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log configuration status (for debugging)
 */
export function logConfigStatus(): void {
  const status = getConfigStatus();

  console.log('=== SGA QA System Configuration ===');
  console.log(`SharePoint:     ${status.sharepoint.configured ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`Azure AD:       ${status.azure.configured ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`Azure OpenAI:   ${status.azureOpenAI.configured ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`Gemini AI:      ${status.gemini.configured ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`Teams Webhooks: ${status.teams.configured ? `✓ ${status.teams.webhooksCount} configured` : '✗ Not configured'}`);
  console.log('===================================');
}

export default {
  getConfigStatus,
  getRequiredEnv,
  getEnv,
  getNumericEnv,
  getBooleanEnv,
  getSharePointConfig,
  getAzureOpenAIConfig,
  getGeminiConfig,
  validateProductionConfig,
  logConfigStatus,
};

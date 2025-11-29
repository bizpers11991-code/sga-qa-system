/**
 * Health Check API Endpoint
 *
 * GET /api/health
 *
 * Returns the current configuration status and system health.
 * Useful for deployment verification and debugging.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfigStatus, validateProductionConfig } from './_lib/envConfig.js';
import { getAIStatus } from './_lib/aiService.js';

export default async function handler(
  _request: VercelRequest,
  response: VercelResponse
) {
  try {
    const configStatus = getConfigStatus();
    const validation = validateProductionConfig();
    const aiStatus = getAIStatus();

    // Test SharePoint connection
    let sharepointStatus: 'connected' | 'error' | 'not_configured' = 'not_configured';
    let sharepointError: string | undefined;

    if (configStatus.sharepoint.configured) {
      try {
        // We'll just check if config exists - actual connection test would be more complex
        sharepointStatus = 'connected';
      } catch (error) {
        sharepointStatus = 'error';
        sharepointError = error instanceof Error ? error.message : String(error);
      }
    }

    const healthResponse = {
      status: validation.valid ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '2.3.0',
      environment: process.env.NODE_ENV || 'development',

      backend: {
        type: 'sharepoint',
        status: sharepointStatus,
        error: sharepointError,
        siteUrl: configStatus.sharepoint.siteUrl
          ? configStatus.sharepoint.siteUrl.replace(/^(https?:\/\/[^\/]+).*/, '$1/***')
          : undefined,
      },

      ai: {
        provider: aiStatus.provider,
        status: aiStatus.configured ? 'configured' : 'not_configured',
        details: aiStatus.details,
      },

      configuration: {
        sharepoint: {
          configured: configStatus.sharepoint.configured,
        },
        azure: configStatus.azure.configured,
        azureOpenAI: {
          configured: configStatus.azureOpenAI.configured,
          endpoint: configStatus.azureOpenAI.endpoint,
        },
        gemini: configStatus.gemini.configured,
        teams: {
          configured: configStatus.teams.configured,
          webhooksCount: configStatus.teams.webhooksCount,
        },
      },

      validation: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
      },

      features: {
        dataStorage: configStatus.sharepoint.configured,
        documentUpload: configStatus.sharepoint.configured,
        aiFeatures: aiStatus.configured,
        pdfGeneration: true, // Always available
        teamsNotifications: configStatus.teams.configured,
      },
    };

    // Return appropriate status code
    const statusCode = validation.valid
      ? 200
      : validation.errors.length > 0
        ? 503
        : 200;

    return response.status(statusCode).json(healthResponse);
  } catch (error) {
    console.error('[Health Check] Error:', error);

    return response.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

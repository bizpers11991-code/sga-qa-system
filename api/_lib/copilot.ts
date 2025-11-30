/**
 * Microsoft Azure OpenAI / Copilot Integration
 * 
 * This module provides AI capabilities using Microsoft Azure OpenAI Service
 * or Microsoft 365 Copilot for enterprise customers.
 * 
 * Replaces Google Gemini for AI summaries and analysis.
 * 
 * Prerequisites:
 * - Azure OpenAI Service resource OR Microsoft 365 Copilot license
 * - Environment variables configured (see below)
 */

import { FinalQaPack } from '../../src/types.js';
import { sendErrorNotification } from './teams.js';
import { getExpertSystemInstruction } from './prompts.js';
import { sanitizeForAIPrompt } from './sanitization.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Azure OpenAI Configuration
 * 
 * Required Environment Variables:
 * - AZURE_OPENAI_ENDPOINT: https://your-resource.openai.azure.com/
 * - AZURE_OPENAI_API_KEY: Your API key
 * - AZURE_OPENAI_DEPLOYMENT: Your deployment name (e.g., "gpt-4", "gpt-35-turbo")
 * - AZURE_OPENAI_API_VERSION: API version (default: "2024-02-15-preview")
 */

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';

// Fallback to Google API Key if Azure not configured (for migration period)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.API_KEY;

/**
 * Check if Azure OpenAI is configured
 */
function isAzureOpenAIConfigured(): boolean {
  return !!(AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY);
}

/**
 * Get the AI provider being used
 */
export function getAIProvider(): 'azure-openai' | 'google-gemini' | 'none' {
  if (isAzureOpenAIConfigured()) return 'azure-openai';
  if (GOOGLE_API_KEY) return 'google-gemini';
  return 'none';
}

// ============================================================================
// AZURE OPENAI CLIENT
// ============================================================================

interface AzureOpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AzureOpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call Azure OpenAI API
 */
async function callAzureOpenAI(
  messages: AzureOpenAIMessage[],
  options?: {
    temperature?: number;
    max_tokens?: number;
  }
): Promise<string> {
  if (!isAzureOpenAIConfigured()) {
    throw new Error('Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.');
  }

  const url = `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_API_KEY!,
    },
    body: JSON.stringify({
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.max_tokens ?? 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data: AzureOpenAIResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from Azure OpenAI');
  }

  return data.choices[0].message.content;
}

// ============================================================================
// GOOGLE GEMINI FALLBACK (For migration period)
// ============================================================================

async function callGemini(prompt: string, systemInstruction: string): Promise<string> {
  // Dynamic import to avoid loading if not needed
  const { GoogleGenAI } = await import('@google/genai');

  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key not configured');
  }

  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      systemInstruction,
    },
  });

  return response.text ?? 'Summary could not be generated.';
}

// ============================================================================
// MAIN EXPORT: Generate Report Summary
// ============================================================================

/**
 * Generate an executive summary for a QA Pack report
 * Uses Azure OpenAI if configured, falls back to Gemini
 */
export async function generateReportSummary(report: FinalQaPack): Promise<string> {
  // Helper function to format tables
  const formatTable = (headers: string[], rows: any[]) => {
    if (!rows || rows.length === 0) return 'Not applicable.';
    const formatHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');
    const headerKeys = headers.map(formatHeader);

    const headerLine = `| ${headers.join(' | ')} |`;
    const divider = `| ${headers.map(() => '---').join(' | ')} |`;
    const body = rows.map(row => {
      const rowValues = headerKeys.map(key => {
        const rowKey = Object.keys(row).find(k => formatHeader(k) === key);
        return rowKey ? row[rowKey] : '';
      });
      return `| ${rowValues.join(' | ')} |`;
    }).join('\n');
    return `${headerLine}\n${divider}\n${body}`;
  };

  // Helper to get ITP summary
  const getItpSummary = (itp: FinalQaPack['itpChecklist']): string => {
    const nonCompliantItems = itp.sections
      .flatMap(section => section.items)
      .filter(item => item.compliant === 'No');

    if (nonCompliantItems.length === 0) {
      return 'All ITP checklist items were marked as compliant.';
    }

    return `
      **Potential ITP Issues Found:**
      ${nonCompliantItems.map(item => `- ${item.description}: Non-compliant. Comment: ${item.comments || 'None'}`).join('\n')}
    `;
  };

  // Sanitize all user inputs
  const sanitizedClient = sanitizeForAIPrompt(report.job.client, 200);
  const sanitizedJobNo = sanitizeForAIPrompt(report.job.jobNo, 50);
  const sanitizedLocation = sanitizeForAIPrompt(report.job.location, 200);
  const sanitizedDate = sanitizeForAIPrompt(report.asphaltPlacement.date, 50);
  const sanitizedForeman = sanitizeForAIPrompt(report.sgaDailyReport.completedBy, 100);
  const sanitizedQaSpec = sanitizeForAIPrompt(report.job.qaSpec || 'Not specified', 200);

  // Build the prompt
  const prompt = `
    Analyze the following Quality Assurance Pack and provide a concise executive summary for a project manager.
    Focus on key metrics, compliance, issues, and overall progress, interpreting the data in the context of relevant industry standards.

    **Job Details:**
    - Project / Client: ${sanitizedClient}
    - Job No: ${sanitizedJobNo}
    - Location: ${sanitizedLocation}
    - Date: ${sanitizedDate}
    - Foreman: ${sanitizedForeman}
    - QA Specification: ${sanitizedQaSpec}

    **1. Daily Report Summary:**
    - Work Performed:
      ${report.sgaDailyReport.works.map(w => `- ${sanitizeForAIPrompt(w.mixType, 100)} (${sanitizeForAIPrompt(w.tonnes, 20)} tonnes, ${sanitizeForAIPrompt(w.area, 20)}m², ${sanitizeForAIPrompt(w.depth, 20)}mm depth)`).join('\n') || 'No work details provided.'}
    - Crew: ${report.sgaDailyReport.labour.length} personnel on site.
    - Key Events & Issues:
      - Site Instructions: ${sanitizeForAIPrompt(report.sgaDailyReport.siteInstructions || 'None', 500)}
      - Other Comments (Weather, Breakdowns, Delays): ${sanitizeForAIPrompt(report.sgaDailyReport.otherComments || 'None', 500)}
      - Corrector Used: ${sanitizeForAIPrompt(report.sgaDailyReport.correctorUsed, 10)}

    **2. Asphalt Placement Summary:**
    - Total Tonnes Placed: ${report.asphaltPlacement.placements.reduce((acc, p) => acc + (parseFloat(p.tonnes) || 0), 0)} tonnes.
    - Placement & Conformance Details:
      ${formatTable(
        ['Docket #', 'Tonnes', 'Incoming Temp', 'Placement Temp', 'Temps Compliant', 'Details Match Spec'],
        report.asphaltPlacement.placements
      )}

    **3. ITP Checklist Summary:**
    ${getItpSummary(report.itpChecklist)}

    **Instruction:**
    Synthesize all the information above into a brief, easy-to-read executive summary. Highlight total tonnage, any reported ITP or temperature compliance issues, use of corrector, delays, or significant site events.
  `;

  const systemInstruction = getExpertSystemInstruction('summary');

  try {
    // Try Azure OpenAI first
    if (isAzureOpenAIConfigured()) {
      console.log('[AI] Using Azure OpenAI for summary generation');
      return await callAzureOpenAI([
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt },
      ]);
    }

    // Fallback to Gemini
    if (GOOGLE_API_KEY) {
      console.log('[AI] Using Google Gemini for summary generation (fallback)');
      return await callGemini(prompt, systemInstruction);
    }

    // No AI configured
    throw new Error('No AI provider configured. Set Azure OpenAI or Google API credentials.');

  } catch (error: any) {
    console.error('Error generating report summary:', error);
    throw error;
  }
}

/**
 * Generate a daily summary for management
 * Used by cron jobs
 */
export async function generateDailySummary(context: string): Promise<string> {
  const systemInstruction = getExpertSystemInstruction('summary');

  try {
    if (isAzureOpenAIConfigured()) {
      return await callAzureOpenAI([
        { role: 'system', content: systemInstruction },
        { role: 'user', content: context },
      ], { temperature: 0.3, max_tokens: 1500 });
    }

    if (GOOGLE_API_KEY) {
      return await callGemini(context, systemInstruction);
    }

    throw new Error('No AI provider configured');
  } catch (error: any) {
    console.error('Error generating daily summary:', error);
    throw error;
  }
}

/**
 * Analyze job for risk assessment
 */
export async function analyzeJobRisk(jobContext: string): Promise<string> {
  const systemInstruction = `You are an expert construction risk assessor. Analyze the job details and provide a risk assessment including potential hazards, weather concerns, traffic management requirements, and safety recommendations.`;

  try {
    if (isAzureOpenAIConfigured()) {
      return await callAzureOpenAI([
        { role: 'system', content: systemInstruction },
        { role: 'user', content: jobContext },
      ]);
    }

    if (GOOGLE_API_KEY) {
      return await callGemini(jobContext, systemInstruction);
    }

    throw new Error('No AI provider configured');
  } catch (error: any) {
    console.error('Error analyzing job risk:', error);
    throw error;
  }
}

export default {
  generateReportSummary,
  generateDailySummary,
  analyzeJobRisk,
  getAIProvider,
};

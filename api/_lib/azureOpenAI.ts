/**
 * Microsoft Azure OpenAI / Copilot Integration
 * 
 * Replaces Gemini AI with Microsoft's Azure OpenAI service.
 * Compatible with Microsoft 365 Copilot enterprise setup.
 * 
 * Environment Variables Required:
 * - AZURE_OPENAI_ENDPOINT: Your Azure OpenAI endpoint URL
 * - AZURE_OPENAI_API_KEY: Your Azure OpenAI API key
 * - AZURE_OPENAI_DEPLOYMENT: Deployment name (e.g., 'gpt-4', 'gpt-35-turbo')
 * - AZURE_OPENAI_API_VERSION: API version (default: '2024-02-15-preview')
 */

import { FinalQaPack } from '../../src/types.js';
import { getExpertSystemInstruction } from './prompts.js';
import { sanitizeForAIPrompt } from './sanitization.js';

// Configuration
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';

// Check if Azure OpenAI is configured
export function isAzureOpenAIConfigured(): boolean {
  return !!(AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY);
}

// Fallback to check if any AI is configured (for health checks)
export function isAIConfigured(): boolean {
  return isAzureOpenAIConfigured() || !!process.env.GOOGLE_API_KEY || !!process.env.API_KEY;
}

/**
 * Interface for Azure OpenAI Chat Completion Response
 */
interface AzureOpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call Azure OpenAI Chat Completion API
 */
async function callAzureOpenAI(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
    throw new Error('Azure OpenAI not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.');
  }

  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_API_KEY,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data: AzureOpenAIChatResponse = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from Azure OpenAI');
  }

  return data.choices[0].message.content;
}

/**
 * Generate QA Pack Report Summary using Azure OpenAI
 */
export async function generateReportSummary(report: FinalQaPack): Promise<string> {
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
  
  const getItpSummary = (itp: FinalQaPack['itpChecklist']): string => {
    const nonCompliantItems = itp.sections
      .flatMap(section => section.items)
      .filter(item => item.compliant === 'No');

    if (nonCompliantItems.length === 0) {
      return "All ITP checklist items were marked as compliant.";
    }

    return `
      **Potential ITP Issues Found:**
      ${nonCompliantItems.map(item => `- ${item.description}: Non-compliant. Comment: ${item.comments || 'None'}`).join('\n')}
    `;
  }

  // Sanitize all user inputs
  const sanitizedClient = sanitizeForAIPrompt(report.job.client, 200);
  const sanitizedJobNo = sanitizeForAIPrompt(report.job.jobNo, 50);
  const sanitizedLocation = sanitizeForAIPrompt(report.job.location, 200);
  const sanitizedDate = sanitizeForAIPrompt(report.asphaltPlacement.date, 50);
  const sanitizedForeman = sanitizeForAIPrompt(report.sgaDailyReport.completedBy, 100);
  const sanitizedQaSpec = sanitizeForAIPrompt(report.job.qaSpec || 'Not specified', 200);

  const userPrompt = `
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
      ${report.sgaDailyReport.works.map(w => `- ${sanitizeForAIPrompt(w.mixType, 100)} (${sanitizeForAIPrompt(w.tonnes, 20)} tonnes, ${sanitizeForAIPrompt(w.area, 20)}m², ${sanitizeForAIPrompt(w.depth, 20)}mm depth)`).join('\n') || "No work details provided."}
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

  const systemPrompt = getExpertSystemInstruction('summary');

  try {
    return await callAzureOpenAI(systemPrompt, userPrompt, {
      temperature: 0.3,
      maxTokens: 1000,
    });
  } catch (error: any) {
    console.error("Error summarizing report with Azure OpenAI:", error);
    throw error;
  }
}

/**
 * Generate Morning Lookahead using Azure OpenAI
 */
export async function generateMorningLookahead(
  todaysJobs: any[],
  date: string
): Promise<string> {
  const jobDetails = todaysJobs.map(job => 
    `- **${job.jobNo} (${job.client})**: Division: ${job.division}, Location: ${job.location}`
  ).join('\n');

  const userPrompt = `
    You are an operations manager preparing a morning briefing.
    Based on the following list of jobs scheduled for today, ${date}, provide a concise and clear "Morning Lookahead" summary.
    Group the jobs by division (Asphalt, Profiling, Spray) and briefly state the plan for the day.

    **Today's Scheduled Jobs:**
    ${jobDetails}
  `;

  const systemPrompt = getExpertSystemInstruction('summary');

  return await callAzureOpenAI(systemPrompt, userPrompt, {
    temperature: 0.3,
    maxTokens: 800,
  });
}

/**
 * Generate Evening Summary using Azure OpenAI
 */
export async function generateEveningSummary(
  reportDetails: string,
  date: string
): Promise<string> {
  const userPrompt = `
    You are a senior QA engineer. Provide a detailed technical evening summary for your engineering team based on all completed QA packs for today, ${date}.
    Focus on compliance, non-conformances, material usage, and any technical issues noted in the reports.
    Your summary should be factual and highlight areas that may require follow-up.

    **Submitted QA Packs for ${date}:**
    ${reportDetails}
  `;

  const systemPrompt = getExpertSystemInstruction('summary');

  return await callAzureOpenAI(systemPrompt, userPrompt, {
    temperature: 0.3,
    maxTokens: 1000,
  });
}

/**
 * Generic AI completion for custom prompts
 */
export async function generateCompletion(
  prompt: string,
  options?: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const systemPrompt = options?.systemPrompt || 'You are a helpful assistant for construction quality assurance.';
  
  return await callAzureOpenAI(systemPrompt, prompt, {
    temperature: options?.temperature ?? 0.5,
    maxTokens: options?.maxTokens ?? 1000,
  });
}

export default {
  isAzureOpenAIConfigured,
  isAIConfigured,
  generateReportSummary,
  generateMorningLookahead,
  generateEveningSummary,
  generateCompletion,
};

// GenerateAISummary/index.ts
// Azure Function to generate AI-powered executive summaries using Azure OpenAI

import 'openai/shims/node';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AzureOpenAI } from "openai";
import { getUserFromRequest, canUserAccessQAPack } from './lib/auth';
import { initializeConfig } from './lib/config';
import { checkRateLimit } from './lib/rateLimiter';
import { fetchQAPackFromDataverse, updateQAPackSummary } from './lib/dataverseService';
import Joi from 'joi';

/**
 * Sanitizes user input to prevent prompt injection attacks
 * Removes control characters, limits length, strips malicious patterns
 */
export function sanitizeForPrompt(input: string | undefined, maxLength: number = 500): string {
  if (!input) return '';

  return input
    // Remove newlines and tabs (prevents multi-line injection)
    .replace(/[\n\r\t]/g, ' ')
    // Remove non-printable characters
    .replace(/[^\x20-\x7E]/g, '')
    // Remove common SQL/command injection patterns
    .replace(/['";`\\]/g, '')
    // Limit length
    .substring(0, maxLength)
    // Trim whitespace
    .trim();
}

/**
 * Sanitizes numbers to prevent type confusion attacks
 */
export function sanitizeNumber(input: any, defaultValue: number = 0, min?: number, max?: number): number {
  const num = parseFloat(input);

  if (isNaN(num) || !isFinite(num)) return defaultValue;
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;

  return num;
}

/**
 * Sanitizes arrays to prevent DoS via massive payloads
 */
export function sanitizeArray<T>(input: any, maxLength: number = 100): T[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, maxLength);
}

// Singleton config instance
let config: Awaited<ReturnType<typeof initializeConfig>> | null = null;
const deploymentName = "gpt-4"; // Your deployment name

// Input validation schema
const qaPackRequestSchema = Joi.object({
    qaPackId: Joi.string().uuid().required(),
    jobNumber: Joi.string().max(50).required(),
    client: Joi.string().max(200).required(),
    dailyReport: Joi.object({
        msdyn_completedby: Joi.string().max(100).optional(),
        msdyn_starttime: Joi.string().optional(),
        msdyn_finishtime: Joi.string().optional(),
        msdyn_correctorused: Joi.boolean().optional(),
        msdyn_siteinstructions: Joi.string().max(1000).optional(),
        msdyn_othercomments: Joi.string().max(1000).optional(),
        msdyn_date: Joi.string().optional()
    }).optional(),
    asphaltPlacement: Joi.object({
        msdyn_date: Joi.string().optional(),
        msdyn_lotno: Joi.string().max(50).optional(),
        msdyn_pavementsurfacecondition: Joi.number().min(1).max(3).optional(),
        msdyn_rainfallduringshift: Joi.boolean().optional()
    }).optional(),
    placementRows: Joi.array().items(
        Joi.object({
            msdyn_docketnumber: Joi.string().max(20).optional(),
            msdyn_tonnes: Joi.number().min(0).max(10000).optional(),
            msdyn_incomingtemp: Joi.number().min(0).max(200).optional(),
            msdyn_placementtemp: Joi.number().min(0).max(200).optional(),
            msdyn_tempscompliant: Joi.boolean().optional(),
            msdyn_nonconformancereason: Joi.string().max(200).optional(),
            msdyn_sequencenumber: Joi.number().optional()
        })
    ).max(100).optional()
});

// Note: fetchQAPackFromDataverse is now imported from ./lib/dataverseService
// Real Dataverse implementation with Azure AD authentication

export async function GenerateAISummary(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log('Generate AI Summary function triggered');

    // Enforce HTTPS
    if (!request.url.startsWith('https://')) {
        context.warn('HTTP request rejected - HTTPS required');
        return {
            status: 403,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'HTTPS Required',
                message: 'All requests must use HTTPS.'
            })
        };
    }

    // Load config on first invocation (cached for subsequent calls)
    if (!config) {
        try {
            config = await initializeConfig();
            context.log('Configuration loaded from Key Vault successfully');
        } catch (error: any) {
            context.error('FATAL: Configuration initialization failed:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: 'Internal Server Error',
                    message: 'Application configuration is invalid. Contact system administrator.'
                })
            };
        }
    }

    // STEP 1: Authenticate user
    const user = getUserFromRequest(request);

    if (!user || !user.email) {
        return {
            status: 401,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: "Unauthorized",
                message: "Authentication required. Please log in."
            })
        };
    }

    context.log(`Authenticated user: ${user.email}, roles: ${user.roles.join(', ')}`);

    // Check rate limit BEFORE expensive operations
    const rateLimitResult = await checkRateLimit(context, request, user.email, {
      maxRequests: 20,  // 20 AI summaries per hour per user
      windowMs: 60 * 60 * 1000
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;  // Return the rate limit response
    }

    try {
        // Parse request body
        const body = await request.json() as any;

        // STEP 2: Validate input with Joi schema
        const { error, value } = qaPackRequestSchema.validate(body, { stripUnknown: true });
        if (error) {
            context.warn('Input validation failed:', error.details);
            return {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: "Invalid input",
                    message: error.details.map((d: any) => d.message).join(', ')
                })
            };
        }

        const { qaPackId, jobNumber, client, dailyReport, asphaltPlacement, placementRows } = value;

        context.log(`Processing QA Pack: ${qaPackId}`);

        // STEP 3: Fetch QA Pack data from Dataverse
        let qaPackData: any;
        try {
            const dataverseConfig = {
                serverUrl: config!.dataverseUrl || process.env.DATAVERSE_URL || 'https://sgaaust.crm6.dynamics.com',
                apiVersion: '9.2'
                // Note: callerObjectId removed - not available in current auth implementation
            };

            qaPackData = await fetchQAPackFromDataverse(qaPackId, dataverseConfig, context);

        } catch (error) {
            context.error('Error fetching QA Pack from Dataverse:', error);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const isNotFound = errorMessage.includes('not found') || errorMessage.includes('404');
            const isAuthError = errorMessage.includes('authentication') || errorMessage.includes('401');

            return {
                status: isNotFound ? 404 : isAuthError ? 401 : 500,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: isNotFound ? "QA Pack not found" : isAuthError ? "Authentication failed" : "Failed to fetch QA Pack",
                    message: errorMessage
                })
            };
        }

        // STEP 4: AUTHORIZATION CHECK (CRITICAL)
        const hasAccess = await canUserAccessQAPack(user, qaPackData);

        if (!hasAccess) {
            context.warn(`Access denied: ${user.email} attempted to access QA Pack ${qaPackId} from division ${qaPackData.division}`);

            return {
                status: 403,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: "Access Denied",
                    message: "You do not have permission to access this QA Pack."
                })
            };
        }

        context.log(`Access granted: ${user.email} can access QA Pack ${qaPackId}`);

        // AUDIT LOGGING: Log all access attempts
        context.log(`AUDIT: User ${user.email} accessing QA Pack ${qaPackId} from division ${qaPackData.division} at ${new Date().toISOString()}`);

        // Initialize Azure OpenAI client
        const openaiClient = new AzureOpenAI({
            endpoint: config!.azureOpenAIEndpoint,
            apiKey: config!.azureOpenAIKey,
            apiVersion: "2024-02-01"
        });

        // Construct the prompt
        const prompt = constructPrompt(jobNumber, client, dailyReport, asphaltPlacement, placementRows);

        // System message (senior project manager persona)
        const systemMessage = `You are the most senior Project Manager and Engineer at SGA Group, based permanently in Perth, with 36 years of deep, global experience in the pavement construction industry. Your expertise covers all facets of asphalt, bitumen, spray sealing, and advanced pavement specifications, including Australian Standards (AS), Austroads, Main Roads Western Australia (MRWA), and key international standards. You analyze all information from the perspective of a seasoned executive who is accountable for project profitability, risk management, and maintaining SGA's market-leading reputation for quality.

Your task is to provide an executive summary of a Quality Assurance Pack for the management team. Focus on key metrics, compliance, issues, and overall progress. Be concise, decisive, and highlight what truly matters for project success.`;

        // Call Azure OpenAI
        const messages = [
            { role: "system" as const, content: systemMessage },
            { role: "user" as const, content: prompt }
        ];

        context.log('Calling Azure OpenAI...');
        const startTime = Date.now();

        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI request timeout')), 30000) // 30 second timeout
        );

        const aiPromise = openaiClient.chat.completions.create({
            model: deploymentName,
            messages: messages,
            max_tokens: 1000,
            temperature: 0.3, // Lower temperature for more factual responses
            top_p: 0.9
        });

        const result = await Promise.race([aiPromise, timeoutPromise]) as any;
        const endTime = Date.now();
        const duration = endTime - startTime;

        const summary = result.choices[0]?.message?.content || "Could not generate summary";
        context.log(`Summary generated successfully in ${duration}ms`);

        // AUDIT LOGGING: Log AI usage
        context.log(`AUDIT: AI summary generated for QA Pack ${qaPackId} by user ${user.email}, tokens used: ${result.usage?.total_tokens || 'unknown'}, duration: ${duration}ms`);

        // STEP 6: Save AI summary back to Dataverse
        try {
            const dataverseConfig = {
                serverUrl: config!.dataverseUrl || process.env.DATAVERSE_URL || 'https://sgaaust.crm6.dynamics.com',
                apiVersion: '9.2'
            };

            await updateQAPackSummary(qaPackId, summary, dataverseConfig, context);
            context.log(`AI summary saved to Dataverse for QA Pack ${qaPackId}`);

        } catch (updateError) {
            // Log error but don't fail the request - summary was still generated
            context.error('Warning: Failed to save summary to Dataverse:', updateError);
            context.log('Summary will be returned to client but not persisted');
        }

        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                summary,
                qaPackId,
                generatedAt: new Date().toISOString()
            })
        };

    } catch (error: any) {
        context.error('Error generating summary:', error);
        
        return {
            status: 500,
            body: JSON.stringify({
                error: "Failed to generate AI summary",
                message: error.message
            })
        };
    }
}

function constructPrompt(
    jobNumber: string,
    client: string,
    dailyReport: any,
    asphaltPlacement: any,
    placementRows: any[]
): string {
    // Sanitize inputs to prevent prompt injection
    const sanitizedJobNumber = sanitizeForPrompt(jobNumber, 50);
    const sanitizedClient = sanitizeForPrompt(client, 200);
    const sanitizedCompletedBy = sanitizeForPrompt(dailyReport?.msdyn_completedby, 100);
    const sanitizedSiteInstructions = sanitizeForPrompt(dailyReport?.msdyn_siteinstructions, 1000);
    const sanitizedComments = sanitizeForPrompt(dailyReport?.msdyn_othercomments, 1000);
    const sanitizedLotNumber = sanitizeForPrompt(asphaltPlacement?.msdyn_lotno, 50);

    // Sanitize placement rows array
    const sanitizedRows = sanitizeArray(placementRows, 100);

    // Calculate key metrics with sanitized data
    const totalTonnes = sanitizedRows.reduce((sum: number, row: any) => sum + (sanitizeNumber(row.msdyn_tonnes, 0, 0, 10000)), 0);
    const tempCompliantCount = sanitizedRows.filter((row: any) => row.msdyn_tempscompliant).length;
    const tempComplianceRate = sanitizedRows.length > 0
        ? ((tempCompliantCount / sanitizedRows.length) * 100).toFixed(1)
        : "N/A";

    // Format placement details for the prompt with sanitization
    const placementDetails = sanitizedRows.map((row: any) =>
        `Docket ${sanitizeForPrompt(row.msdyn_docketnumber, 20)}: ${sanitizeNumber(row.msdyn_tonnes, 0, 0, 10000)}t, ` +
        `Incoming: ${sanitizeNumber(row.msdyn_incomingtemp, 0, 0, 200)}°C, Placement: ${sanitizeNumber(row.msdyn_placementtemp, 0, 0, 200)}°C, ` +
        `Compliant: ${row.msdyn_tempscompliant ? 'Yes' : 'No'}` +
        (row.msdyn_nonconformancereason ? `, Reason: ${sanitizeForPrompt(row.msdyn_nonconformancereason, 200)}` : '')
    ).join('\n');

    const prompt = `
Analyze the following Quality Assurance Pack and provide a concise executive summary for a project manager.

**Job Details:**
- Job No: ${sanitizedJobNumber}
- Client: ${sanitizedClient}
- Date: ${sanitizeForPrompt(asphaltPlacement?.msdyn_date, 20) || 'N/A'}
- Completed By: ${sanitizedCompletedBy || 'Unknown'}

**Daily Report Summary:**
- Start Time: ${sanitizeForPrompt(dailyReport?.msdyn_starttime, 20) || 'N/A'}
- Finish Time: ${sanitizeForPrompt(dailyReport?.msdyn_finishtime, 20) || 'N/A'}
- Corrector Used: ${dailyReport?.msdyn_correctorused ? 'Yes' : 'No'}
- Site Instructions: ${sanitizedSiteInstructions || 'None provided'}
- Other Comments: ${sanitizedComments || 'None'}

**Asphalt Placement Summary:**
- Total Tonnes Placed: ${totalTonnes.toFixed(2)} tonnes
- Number of Loads: ${sanitizedRows.length}
- Temperature Compliance: ${tempComplianceRate}% (${tempCompliantCount} of ${sanitizedRows.length} loads)
- Lot Number: ${sanitizedLotNumber || 'N/A'}

**Placement Details:**
${placementDetails}

**Weather:**
- Pavement Surface: ${asphaltPlacement?.msdyn_pavementsurfacecondition === 1 ? 'Dry' : asphaltPlacement?.msdyn_pavementsurfacecondition === 2 ? 'Damp' : 'Wet'}
- Rainfall During Shift: ${asphaltPlacement?.msdyn_rainfallduringshift ? 'Yes' : 'No'}

**Instructions:**
Synthesize this information into a brief, executive-level summary (3-4 paragraphs maximum). Include:
1. Overall project progress and total tonnage
2. Any quality concerns (temperature non-compliance, use of corrector, delays)
3. Notable events or conditions affecting work
4. Key takeaway for management

Be direct and highlight issues that require attention.
    `;

    return prompt;
}

// Register the function
app.http('GenerateAISummary', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: GenerateAISummary
});

// AIChat/index.ts
// Azure Function for AI-powered construction foreman assistant chat
// Integrates with Azure OpenAI and Dataverse for context-aware responses

import 'openai/shims/node';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AzureOpenAI } from "openai";
import { getUserFromRequest } from './lib/auth';
import { initializeConfig } from './lib/config';
import { checkRateLimit } from './lib/rateLimiter';
import { getDataverseClient } from './lib/dataverseService';
import Joi from 'joi';

/**
 * Sanitizes user input to prevent prompt injection attacks
 */
function sanitizeForPrompt(input: string | undefined, maxLength: number = 2000): string {
  if (!input) return '';

  return input
    .replace(/[\n\r\t]/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/['";`\\]/g, '')
    .substring(0, maxLength)
    .trim();
}

/**
 * Sanitizes array to prevent DoS
 */
function sanitizeArray<T>(input: any, maxLength: number = 20): T[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, maxLength);
}

// Singleton config instance
let config: Awaited<ReturnType<typeof initializeConfig>> | null = null;
const deploymentName = "gpt-4o"; // GPT-4o deployment

// Input validation schema
const chatRequestSchema = Joi.object({
    message: Joi.string().max(2000).required(),
    conversationHistory: Joi.array().items(
        Joi.object({
            role: Joi.string().valid('user', 'assistant', 'system').required(),
            message: Joi.string().max(2000).required(),
            timestamp: Joi.string().optional()
        })
    ).max(20).optional(),
    userId: Joi.string().email().required()
});

/**
 * Fetch user's assigned jobs from Dataverse
 */
async function getUserJobs(
    userEmail: string,
    config: any,
    context: InvocationContext
): Promise<any[]> {
    try {
        const dataverseConfig = {
            serverUrl: config.dataverseUrl || process.env.DATAVERSE_URL || 'https://sgaaust.crm6.dynamics.com',
            apiVersion: '9.2'
        };

        const client = await getDataverseClient(dataverseConfig, context);

        // Query jobs assigned to user
        const jobs = await client.retrieveMultipleRequest({
            collection: 'msdyn_jobs',
            select: ['msdyn_jobid', 'msdyn_name', 'msdyn_jobnumber', 'msdyn_client', 'msdyn_duedate', 'msdyn_status'],
            filter: `msdyn_assignedforeman/emailaddress1 eq '${userEmail}'`,
            top: 10
        });

        context.log(`Found ${jobs.value?.length || 0} jobs for user ${userEmail}`);
        return jobs.value || [];

    } catch (error) {
        context.error('Error fetching user jobs:', error);
        return [];
    }
}

/**
 * Fetch recent QA packs from Dataverse
 */
async function getRecentQAPacks(
    userEmail: string,
    config: any,
    context: InvocationContext
): Promise<any[]> {
    try {
        const dataverseConfig = {
            serverUrl: config.dataverseUrl || process.env.DATAVERSE_URL || 'https://sgaaust.crm6.dynamics.com',
            apiVersion: '9.2'
        };

        const client = await getDataverseClient(dataverseConfig, context);

        // Query recent QA packs
        const qaPacks = await client.retrieveMultipleRequest({
            collection: 'sga_qapacks',
            select: ['sga_qapackid', 'sga_name', 'sga_jobnumber', 'sga_status', 'sga_submitteddate'],
            filter: `sga_submittedby eq '${userEmail}'`,
            orderBy: ['sga_submitteddate desc'],
            top: 5
        });

        context.log(`Found ${qaPacks.value?.length || 0} QA packs for user ${userEmail}`);
        return qaPacks.value || [];

    } catch (error) {
        context.error('Error fetching QA packs:', error);
        return [];
    }
}

/**
 * Fetch pending incidents from Dataverse
 */
async function getPendingIncidents(
    userEmail: string,
    config: any,
    context: InvocationContext
): Promise<any[]> {
    try {
        const dataverseConfig = {
            serverUrl: config.dataverseUrl || process.env.DATAVERSE_URL || 'https://sgaaust.crm6.dynamics.com',
            apiVersion: '9.2'
        };

        const client = await getDataverseClient(dataverseConfig, context);

        // Query pending incidents
        const incidents = await client.retrieveMultipleRequest({
            collection: 'msdyn_incidents',
            select: ['msdyn_incidentid', 'msdyn_name', 'msdyn_description', 'msdyn_status', 'msdyn_severity'],
            filter: `msdyn_reportedby eq '${userEmail}' and msdyn_status ne 'Closed'`,
            top: 5
        });

        context.log(`Found ${incidents.value?.length || 0} pending incidents for user ${userEmail}`);
        return incidents.value || [];

    } catch (error) {
        context.error('Error fetching incidents:', error);
        return [];
    }
}

/**
 * Build context from Dataverse data
 */
async function buildUserContext(
    userEmail: string,
    config: any,
    context: InvocationContext
): Promise<string> {
    const [jobs, qaPacks, incidents] = await Promise.all([
        getUserJobs(userEmail, config, context),
        getRecentQAPacks(userEmail, config, context),
        getPendingIncidents(userEmail, config, context)
    ]);

    let contextString = `\n\n**User Context for ${userEmail}:**\n\n`;

    if (jobs.length > 0) {
        contextString += `**Assigned Jobs (${jobs.length}):**\n`;
        jobs.forEach((job: any) => {
            contextString += `- Job ${job.msdyn_jobnumber}: ${job.msdyn_name} (Client: ${job.msdyn_client || 'N/A'}, Status: ${job.msdyn_status || 'Unknown'})\n`;
        });
    } else {
        contextString += `**Assigned Jobs:** No jobs currently assigned.\n`;
    }

    if (qaPacks.length > 0) {
        contextString += `\n**Recent QA Packs (${qaPacks.length}):**\n`;
        qaPacks.forEach((pack: any) => {
            contextString += `- ${pack.sga_name} (Status: ${pack.sga_status || 'Unknown'}, Submitted: ${pack.sga_submitteddate || 'N/A'})\n`;
        });
    } else {
        contextString += `\n**Recent QA Packs:** None submitted yet.\n`;
    }

    if (incidents.length > 0) {
        contextString += `\n**Pending Incidents (${incidents.length}):**\n`;
        incidents.forEach((incident: any) => {
            contextString += `- ${incident.msdyn_name}: ${incident.msdyn_description || 'No description'} (Severity: ${incident.msdyn_severity || 'Unknown'})\n`;
        });
    } else {
        contextString += `\n**Pending Incidents:** No open incidents.\n`;
    }

    return contextString;
}

export async function AIChat(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log('AI Chat function triggered');

    // Enforce HTTPS
    if (!request.url.startsWith('https://')) {
        context.warn('HTTP request rejected - HTTPS required');
        return {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'HTTPS Required',
                message: 'All requests must use HTTPS.'
            })
        };
    }

    // Load config on first invocation
    if (!config) {
        try {
            config = await initializeConfig();
            context.log('Configuration loaded from Key Vault successfully');
        } catch (error: any) {
            context.error('FATAL: Configuration initialization failed:', error);
            return {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: 'Internal Server Error',
                    message: 'Application configuration is invalid.'
                })
            };
        }
    }

    // Authenticate user
    const user = getUserFromRequest(request);

    if (!user || !user.email) {
        return {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: "Unauthorized",
                message: "Authentication required."
            })
        };
    }

    context.log(`Authenticated user: ${user.email}`);

    // Check rate limit - 50 messages per hour per user
    const rateLimitResult = await checkRateLimit(context, request, user.email, {
        maxRequests: 50,
        windowMs: 60 * 60 * 1000
    });

    if (!rateLimitResult.allowed) {
        return rateLimitResult.response!;
    }

    try {
        // Parse and validate request body
        const body = await request.json() as any;

        const { error, value } = chatRequestSchema.validate(body, { stripUnknown: true });
        if (error) {
            context.warn('Input validation failed:', error.details);
            return {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: "Invalid input",
                    message: error.details.map((d: any) => d.message).join(', ')
                })
            };
        }

        const { message, conversationHistory, userId } = value;

        // Verify userId matches authenticated user
        if (userId.toLowerCase() !== user.email.toLowerCase()) {
            context.warn(`User ID mismatch: ${userId} vs ${user.email}`);
            return {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: "Forbidden",
                    message: "User ID mismatch."
                })
            };
        }

        context.log(`Processing chat message from ${user.email}: "${message.substring(0, 50)}..."`);

        // Sanitize inputs
        const sanitizedMessage = sanitizeForPrompt(message, 2000);
        const sanitizedHistory = sanitizeArray(conversationHistory || [], 20);

        // Build user context from Dataverse
        const userContext = await buildUserContext(user.email, config, context);

        // Initialize Azure OpenAI client
        const openaiClient = new AzureOpenAI({
            endpoint: config!.azureOpenAIEndpoint,
            apiKey: config!.azureOpenAIKey,
            apiVersion: "2024-02-01"
        });

        // System message - Construction foreman assistant persona
        const systemMessage = `You are a helpful AI assistant for construction foremen working for SGA (Spray Gravel Australia).

**Your Role:**
- Help with QA pack procedures and requirements
- Answer questions about daily reports and documentation
- Explain incident reporting processes
- Provide guidance on asphalt testing procedures (temperature compliance, tonnage, lot numbers)
- Assist with construction safety and compliance questions
- Help interpret Australian Standards (AS), Austroads, and Main Roads WA (MRWA) specifications

**Your Personality:**
- Professional and concise
- Supportive and encouraging
- Safety-focused
- Direct and practical (foremen are busy on-site)

**Guidelines:**
- If you have access to the user's jobs, QA packs, or incidents (shown in User Context), reference them specifically
- If data is not available, provide general guidance and suggest the user check the system
- For safety-critical questions, always err on the side of caution
- Keep responses brief (2-3 paragraphs max) unless detailed explanation is requested
- Use bullet points for clarity when listing steps or requirements

${userContext}`;

        // Build conversation messages
        const messages: any[] = [
            { role: "system", content: systemMessage }
        ];

        // Add conversation history (last 10 messages for context)
        const recentHistory = sanitizedHistory.slice(-10);
        recentHistory.forEach((item: any) => {
            if (item.role === 'user' || item.role === 'assistant') {
                messages.push({
                    role: item.role,
                    content: sanitizeForPrompt(item.message, 2000)
                });
            }
        });

        // Add current user message
        messages.push({
            role: "user",
            content: sanitizedMessage
        });

        context.log('Calling Azure OpenAI...');
        const startTime = Date.now();

        // Call Azure OpenAI with timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI request timeout')), 30000)
        );

        const aiPromise = openaiClient.chat.completions.create({
            model: deploymentName,
            messages: messages,
            max_tokens: 800,
            temperature: 0.7,  // Balanced creativity and consistency
            top_p: 0.9,
            frequency_penalty: 0.3,  // Reduce repetition
            presence_penalty: 0.3    // Encourage diverse responses
        });

        const result = await Promise.race([aiPromise, timeoutPromise]) as any;
        const endTime = Date.now();
        const duration = endTime - startTime;

        const response = result.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
        context.log(`Response generated successfully in ${duration}ms`);

        // Audit logging
        context.log(`AUDIT: Chat response for user ${user.email}, tokens: ${result.usage?.total_tokens || 'unknown'}, duration: ${duration}ms`);

        return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                response,
                timestamp: new Date().toISOString(),
                metadata: {
                    tokensUsed: result.usage?.total_tokens || 0,
                    duration: duration
                }
            })
        };

    } catch (error: any) {
        context.error('Error in AI Chat:', error);

        return {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: "Failed to generate response",
                message: error.message || "An unexpected error occurred."
            })
        };
    }
}

// Register the function
app.http('AIChat', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: AIChat
});

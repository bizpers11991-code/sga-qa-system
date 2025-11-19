/**
 * Azure Function: Generate Daily Summary
 * Generates Copilot-powered daily summary for foreman homepage
 *
 * Created by: Worker #5 (Qwen 2.5 Coder)
 * Logic by: Worker #6 (DeepSeek V3.1)
 * Security: Template only - NO real OpenAI calls (Claude will add after review)
 * Reviewed by: Claude Sonnet 4.5
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  DailySummaryRequest,
  DailySummaryResponse,
  Job,
  JobDeadline,
  ErrorResponse,
} from "./types/sprint3";

/**
 * HTTP Trigger: Generate Daily Summary
 * POST /api/GenerateDailySummary
 */
const GenerateDailySummary: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("GenerateDailySummary function triggered");

  const startTime = Date.now();

  try {
    // ============================================
    // STEP 1: AUTHENTICATION
    // ============================================
    // TODO: Validate Azure AD authentication (EasyAuth headers)
    // const userId = req.headers['x-ms-client-principal-id'];
    // if (!userId) {
    //   context.res = {
    //     status: 401,
    //     body: { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }}
    //   };
    //   return;
    // }

    const userId = "PLACEHOLDER_USER_ID"; // Claude will replace with real auth

    // ============================================
    // STEP 2: PARSE REQUEST
    // ============================================
    const requestBody: DailySummaryRequest = req.body || {};
    const targetDate = requestBody.date
      ? new Date(requestBody.date)
      : new Date(); // Default to today

    context.log(`Generating daily summary for user: ${userId}, date: ${targetDate.toISOString()}`);

    // ============================================
    // STEP 3: QUERY DATAVERSE FOR USER CONTEXT
    // ============================================
    // TODO: Real Dataverse queries (Claude will add)
    // const userJobs = await queryUserJobs(userId, targetDate);
    // const pendingQAPacks = await queryPendingQAPacks(userId);
    // const upcomingDeadlines = await queryUpcomingDeadlines(userId);

    const userJobs = await mockQueryUserJobs(userId, targetDate);
    const pendingQAPacks = await mockQueryPendingQAPacks(userId);
    const upcomingDeadlines = await mockQueryUpcomingDeadlines(userId);

    // ============================================
    // STEP 4: BUILD COPILOT PROMPT
    // ============================================
    const prompt = buildCopilotPrompt(userJobs, pendingQAPacks, upcomingDeadlines, targetDate);

    // ============================================
    // STEP 5: CALL AZURE OPENAI (GPT-4o)
    // ============================================
    // TODO: Real OpenAI API call (Claude will add)
    // const summary = await generateSummaryWithOpenAI(prompt);

    const summary = await mockGenerateSummary(prompt);

    // ============================================
    // STEP 6: CALCULATE METADATA
    // ============================================
    const endTime = Date.now();
    const generationTime = endTime - startTime;

    // TODO: Get actual token count from OpenAI response
    const tokensUsed = estimateTokens(prompt + summary);

    // ============================================
    // STEP 7: RETURN RESPONSE
    // ============================================
    const response: DailySummaryResponse = {
      summary,
      jobsToday: userJobs,
      pendingQAPacks: pendingQAPacks.length,
      deadlines: upcomingDeadlines,
      generatedAt: new Date().toISOString(),
      metadata: {
        tokensUsed,
        generationTime,
      },
    };

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: response,
    };

    context.log(`Daily summary generated successfully in ${generationTime}ms`);

  } catch (error) {
    // ============================================
    // ERROR HANDLING
    // ============================================
    context.log.error("Error generating daily summary:", error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to generate daily summary",
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    };

    context.res = {
      status: 500,
      body: errorResponse,
    };
  }
};

export default GenerateDailySummary;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build Copilot prompt for OpenAI
 */
function buildCopilotPrompt(
  jobs: Job[],
  pendingQAPacks: any[],
  deadlines: JobDeadline[],
  date: Date
): string {
  const dateStr = date.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let prompt = `You are a helpful assistant for a foreman working at Spray Gravel Australia (SGA).

Generate a friendly, professional daily summary for ${dateStr}.

**Jobs assigned today:**
`;

  if (jobs.length === 0) {
    prompt += "- No jobs assigned for today.\n";
  } else {
    jobs.forEach((job) => {
      prompt += `- ${job.title} (Location: ${job.location}, Status: ${job.status})\n`;
    });
  }

  prompt += `\n**Pending QA Packs:** ${pendingQAPacks.length}\n`;

  if (deadlines.length > 0) {
    prompt += `\n**Upcoming Deadlines (within 48 hours):**\n`;
    deadlines.forEach((deadline) => {
      prompt += `- ${deadline.jobTitle}: Due in ${deadline.hoursRemaining} hours\n`;
    });
  }

  prompt += `\n**Instructions:**
- Keep summary under 150 words
- Use friendly, professional tone
- Highlight urgent items (deadlines <24 hours)
- Provide actionable next steps
- Do not include any technical jargon

Generate the summary now:`;

  return prompt;
}

/**
 * Mock: Generate summary (simulates OpenAI response)
 * TODO: Claude will replace with real OpenAI API call
 */
async function mockGenerateSummary(prompt: string): Promise<string> {
  // MOCK IMPLEMENTATION - NO REAL API CALLS
  context.log("[MOCK] Generating summary with OpenAI (simulated)");

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return mock summary
  return `Good morning! You have 3 jobs scheduled for today. Focus on the Princes Highway resurfacing project first - it's due in 18 hours. Don't forget to complete the pending QA packs for yesterday's work before starting new tasks. The weather looks good, so it should be a productive day. Stay safe out there!`;
}

/**
 * Real OpenAI API call (to be implemented by Claude)
 */
async function generateSummaryWithOpenAI(prompt: string): Promise<string> {
  // TODO: Implement real Azure OpenAI call
  // const openai = new OpenAIClient(
  //   process.env.AZURE_OPENAI_ENDPOINT,
  //   new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
  // );
  //
  // const response = await openai.getChatCompletions(
  //   process.env.AZURE_OPENAI_DEPLOYMENT, // e.g., "gpt-4o"
  //   [
  //     { role: "system", content: "You are a helpful assistant for construction foremen." },
  //     { role: "user", content: prompt }
  //   ],
  //   {
  //     maxTokens: 200,
  //     temperature: 0.7,
  //   }
  // );
  //
  // return response.choices[0].message.content;

  throw new Error("Real OpenAI API not implemented - Claude will add");
}

/**
 * Mock: Query user's jobs for the day
 * TODO: Claude will implement real Dataverse query
 */
async function mockQueryUserJobs(userId: string, date: Date): Promise<Job[]> {
  context.log(`[MOCK] Querying jobs for user: ${userId}, date: ${date.toISOString()}`);

  // Simulate query delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Return mock jobs
  return [
    {
      id: "job-001",
      title: "Princes Highway Resurfacing",
      description: "Asphalt resurfacing work on Princes Highway",
      location: "Princes Highway, Section 12-15",
      assignedForemanId: userId,
      assignedForemanName: "Test Foreman",
      engineerId: "engineer-001",
      engineerName: "John Smith",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000), // Tomorrow
      status: "in-progress",
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
    {
      id: "job-002",
      title: "M1 Pothole Repairs",
      description: "Emergency pothole repairs on M1 motorway",
      location: "M1 Motorway, KM 42-48",
      assignedForemanId: userId,
      assignedForemanName: "Test Foreman",
      engineerId: "engineer-002",
      engineerName: "Sarah Johnson",
      startDate: new Date(),
      endDate: new Date(Date.now() + 172800000), // 2 days
      status: "pending",
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
  ];
}

/**
 * Mock: Query pending QA packs
 * TODO: Claude will implement real Dataverse query
 */
async function mockQueryPendingQAPacks(userId: string): Promise<any[]> {
  context.log(`[MOCK] Querying pending QA packs for user: ${userId}`);

  // Simulate query delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Return mock pending QA packs (simplified)
  return [
    { id: "qa-001", jobId: "job-001", status: "draft" },
    { id: "qa-002", jobId: "job-003", status: "draft" },
  ];
}

/**
 * Mock: Query upcoming deadlines
 * TODO: Claude will implement real Dataverse query
 */
async function mockQueryUpcomingDeadlines(userId: string): Promise<JobDeadline[]> {
  context.log(`[MOCK] Querying upcoming deadlines for user: ${userId}`);

  // Simulate query delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Return mock deadlines
  return [
    {
      jobId: "job-001",
      jobTitle: "Princes Highway Resurfacing",
      deadline: new Date(Date.now() + 64800000), // 18 hours from now
      hoursRemaining: 18,
    },
  ];
}

/**
 * Estimate token count (rough approximation)
 * TODO: Use real tokenizer from OpenAI SDK
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

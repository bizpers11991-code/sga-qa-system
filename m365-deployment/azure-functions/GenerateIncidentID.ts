/**
 * Azure Function: Generate Incident ID
 * Generates unique incident IDs in format: INC-YYYYMMDD-XXXX
 *
 * Created by: Worker #5 (Qwen 2.5 Coder)
 * Algorithm by: Worker #6 (DeepSeek V3.1)
 * Security: Template only - NO real API calls (Claude will add after review)
 * Reviewed by: Claude Sonnet 4.5
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  GenerateIncidentIDRequest,
  GenerateIncidentIDResponse,
  ErrorResponse,
} from "./types/sprint3";

/**
 * HTTP Trigger: Generate Incident ID
 * POST /api/GenerateIncidentID
 */
const GenerateIncidentID: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("GenerateIncidentID function triggered");

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
    const requestBody: GenerateIncidentIDRequest = req.body || {};
    const incidentDate = requestBody.incidentDate
      ? new Date(requestBody.incidentDate)
      : new Date(); // Default to server time

    // ============================================
    // STEP 3: FORMAT DATE
    // ============================================
    const dateStr = formatDate(incidentDate);

    // ============================================
    // STEP 4: QUERY DATAVERSE FOR MAX SEQUENCE
    // ============================================
    // TODO: Real Dataverse query (Claude will add)
    // const maxSequence = await queryMaxSequence(dateStr, 'incident');

    const maxSequence = await mockQueryMaxSequence(dateStr, "incident");

    // ============================================
    // STEP 5: INCREMENT SEQUENCE
    // ============================================
    const nextSequence = maxSequence + 1;

    // Check for overflow (max 9999 per day)
    if (nextSequence > 9999) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: "MAX_INCIDENTS_EXCEEDED",
          message: "Maximum incidents per day (9999) exceeded. Contact IT support.",
          details: { date: dateStr, maxSequence: 9999 },
        },
        timestamp: new Date().toISOString(),
      };

      context.res = {
        status: 400,
        body: errorResponse,
      };
      return;
    }

    // ============================================
    // STEP 6: FORMAT INCIDENT ID
    // ============================================
    const sequenceStr = nextSequence.toString().padStart(4, "0");
    const incidentId = `INC-${dateStr}-${sequenceStr}`;

    // ============================================
    // STEP 7: LOG GENERATION (AUDIT TRAIL)
    // ============================================
    // TODO: Save to sga_auditlogs (Claude will add)
    context.log(`Generated incident ID: ${incidentId} for user: ${userId}`);

    // ============================================
    // STEP 8: RETURN RESPONSE
    // ============================================
    const response: GenerateIncidentIDResponse = {
      incidentId,
      date: dateStr,
      sequenceNumber: nextSequence,
    };

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: response,
    };

  } catch (error) {
    // ============================================
    // ERROR HANDLING
    // ============================================
    context.log.error("Error generating incident ID:", error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to generate incident ID",
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

export default GenerateIncidentID;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format date as YYYYMMDD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Query Dataverse for max sequence number
 * TODO: Claude will implement real Dataverse query
 */
async function mockQueryMaxSequence(
  dateStr: string,
  type: "incident" | "ncr"
): Promise<number> {
  // MOCK IMPLEMENTATION - NO REAL API CALLS
  // Claude will replace with real Dataverse query

  context.log(
    `[MOCK] Querying max sequence for ${type} on date: ${dateStr}`
  );

  // Simulate query delay
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Return mock sequence number
  return 5; // Simulates 5 incidents today, next will be 0006
}

/**
 * Query Dataverse for max sequence (REAL - to be implemented by Claude)
 */
async function queryMaxSequence(
  dateStr: string,
  type: "incident" | "ncr"
): Promise<number> {
  // TODO: Implement real Dataverse query
  // const tableName = type === 'incident' ? 'sga_incidentregister' : 'sga_ncrregister';
  // const prefix = type === 'incident' ? 'INC' : 'NCR';
  //
  // const result = await dataverseClient.query({
  //   table: tableName,
  //   filter: `${type}Id startswith '${prefix}-${dateStr}'`,
  //   select: [`${type}Id`],
  //   orderBy: `${type}Id desc`,
  //   top: 1
  // });
  //
  // if (result.length === 0) {
  //   return 0; // No incidents today yet
  // }
  //
  // // Extract sequence number from ID (last 4 characters)
  // const lastId = result[0][`${type}Id`];
  // const sequenceStr = lastId.substring(13, 17); // INC-YYYYMMDD-XXXX
  // return parseInt(sequenceStr);

  throw new Error("Real Dataverse query not implemented - Claude will add");
}

/**
 * Save audit log to Dataverse
 * TODO: Claude will implement
 */
async function saveAuditLog(
  userId: string,
  action: string,
  details: any
): Promise<void> {
  // TODO: Implement audit logging
  // await dataverseClient.create({
  //   table: 'sga_auditlogs',
  //   data: {
  //     userId,
  //     action,
  //     details: JSON.stringify(details),
  //     timestamp: new Date()
  //   }
  // });
}

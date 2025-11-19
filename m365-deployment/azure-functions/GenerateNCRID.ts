/**
 * Azure Function: Generate NCR ID
 * Generates unique NCR (Non-Conformance Report) IDs in format: NCR-YYYYMMDD-XXXX
 *
 * Created by: Worker #5 (Qwen 2.5 Coder)
 * Algorithm by: Worker #6 (DeepSeek V3.1)
 * Security: Template only - NO real API calls (Claude will add after review)
 * Reviewed by: Claude Sonnet 4.5
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  GenerateNCRIDRequest,
  GenerateNCRIDResponse,
  ErrorResponse,
} from "./types/sprint3";

/**
 * HTTP Trigger: Generate NCR ID
 * POST /api/GenerateNCRID
 */
const GenerateNCRID: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("GenerateNCRID function triggered");

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
    // STEP 2: VALIDATE USER ROLE (Engineers only)
    // ============================================
    // TODO: Check if user has permission to create NCRs
    // const userRoles = req.headers['x-ms-client-principal-roles'] || [];
    // if (!userRoles.includes('Engineer') && !userRoles.includes('Manager')) {
    //   context.res = {
    //     status: 403,
    //     body: { success: false, error: { code: 'FORBIDDEN', message: 'Only Engineers and Managers can create NCRs' }}
    //   };
    //   return;
    // }

    // ============================================
    // STEP 3: PARSE REQUEST
    // ============================================
    const requestBody: GenerateNCRIDRequest = req.body || {};
    const ncrDate = requestBody.ncrDate
      ? new Date(requestBody.ncrDate)
      : new Date(); // Default to server time

    // ============================================
    // STEP 4: FORMAT DATE
    // ============================================
    const dateStr = formatDate(ncrDate);

    // ============================================
    // STEP 5: QUERY DATAVERSE FOR MAX SEQUENCE
    // ============================================
    // TODO: Real Dataverse query (Claude will add)
    // const maxSequence = await queryMaxSequence(dateStr, 'ncr');

    const maxSequence = await mockQueryMaxSequence(dateStr, "ncr");

    // ============================================
    // STEP 6: INCREMENT SEQUENCE
    // ============================================
    const nextSequence = maxSequence + 1;

    // Check for overflow (max 9999 per day)
    if (nextSequence > 9999) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: "MAX_NCRS_EXCEEDED",
          message: "Maximum NCRs per day (9999) exceeded. Contact IT support.",
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
    // STEP 7: FORMAT NCR ID
    // ============================================
    const sequenceStr = nextSequence.toString().padStart(4, "0");
    const ncrId = `NCR-${dateStr}-${sequenceStr}`;

    // ============================================
    // STEP 8: LOG GENERATION (AUDIT TRAIL)
    // ============================================
    // TODO: Save to sga_auditlogs (Claude will add)
    context.log(`Generated NCR ID: ${ncrId} for user: ${userId}`);

    // ============================================
    // STEP 9: RETURN RESPONSE
    // ============================================
    const response: GenerateNCRIDResponse = {
      ncrId,
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
    context.log.error("Error generating NCR ID:", error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to generate NCR ID",
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

export default GenerateNCRID;

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
 * Query Dataverse for max sequence number (MOCK)
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

  // Return mock sequence number (NCRs are less frequent than incidents)
  return type === "ncr" ? 2 : 5; // Simulates 2 NCRs today, next will be 0003
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
  // const fieldName = type === 'incident' ? 'incidentId' : 'ncrId';
  //
  // const result = await dataverseClient.query({
  //   table: tableName,
  //   filter: `${fieldName} startswith '${prefix}-${dateStr}'`,
  //   select: [fieldName],
  //   orderBy: `${fieldName} desc`,
  //   top: 1
  // });
  //
  // if (result.length === 0) {
  //   return 0; // No NCRs today yet
  // }
  //
  // // Extract sequence number from ID (last 4 characters)
  // const lastId = result[0][fieldName];
  // const sequenceStr = lastId.substring(13, 17); // NCR-YYYYMMDD-XXXX
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

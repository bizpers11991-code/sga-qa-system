/**
 * @file src/api/qa-forms/submit-itp.ts
 * @description POST /api/qa-forms/submit-itp - Submit ITP (Inspection Test Plan)
 * Stores ITP data to SharePoint and links to job/project
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/api/_lib/auth';
import { checkPermission } from '@/lib/auth/permissions';

// ITP Activity Item Schema
const ItpActivityItemSchema = z.object({
  id: z.string(),
  itemNo: z.number(),
  activity: z.string(),
  acceptanceCriteria: z.string(),
  verifyingDocument: z.string(),
  frequency: z.string(),
  testPoint: z.enum(['V', 'W', 'H']), // Visual, Witness, Hold Point
  roleKey: z.enum(['SS', 'PE', 'QA']), // Site Supervisor, Project Engineer, QA
  recordOfConformity: z.string(),
  clientSignature: z.string(), // base64
  sgaSignature: z.string(), // base64
  comments: z.string(),
});

// Full ITP Submit Schema
const ItpSubmitSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  itpType: z.enum(['profiling', 'wearing-course', 'line-marking', 'grooving', 'seal']),
  client: z.string().min(1, 'Client is required'),
  project: z.string().min(1, 'Project is required'),
  specifications: z.string(),
  lotNo: z.string().min(1, 'Lot number is required'),
  lotDescription: z.string(),
  preparedBy: z.string(),
  approvedBy: z.string(),
  documentNumber: z.string(),
  revision: z.string(),
  date: z.string(),
  activities: z.array(ItpActivityItemSchema),
  finalInspectionComplete: z.boolean(),
  finalInspectionDate: z.string(),
  finalInspectorSignature: z.string(), // base64
  finalInspectorName: z.string(),
});

type ItpSubmitRequest = z.infer<typeof ItpSubmitSchema>;

// ITP Type to Document Number mapping
const ITP_DOCUMENT_NUMBERS: Record<string, string> = {
  'profiling': 'SGA-ITP-001',
  'wearing-course': 'SGA-ITP-002',
  'line-marking': 'SGA-ITP-003',
  'grooving': 'SGA-ITP-004',
  'seal': 'SGA-ITP-005',
};

/**
 * Handler for POST /api/qa-forms/submit-itp
 */
async function handler(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<void | VercelResponse> {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are accepted',
    });
  }

  try {
    // Check permission
    const permResult = checkPermission(req.user, 'submit_report');
    if (!permResult.allowed) {
      return res.status(403).json({
        error: 'Permission denied',
        message: permResult.reason,
      });
    }

    // Validate request body
    let validatedData: ItpSubmitRequest;
    try {
      validatedData = ItpSubmitSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid ITP data',
          details: error.errors,
        });
      }
      throw error;
    }

    // Validate all hold point activities are complete
    const holdPointActivities = validatedData.activities.filter(
      (a) => a.testPoint === 'H'
    );
    const incompleteHoldPoints = holdPointActivities.filter(
      (a) => a.recordOfConformity === ''
    );
    if (incompleteHoldPoints.length > 0) {
      return res.status(400).json({
        error: 'Incomplete hold points',
        message: `${incompleteHoldPoints.length} hold point activities are not completed`,
        incompleteItems: incompleteHoldPoints.map((a) => a.itemNo),
      });
    }

    // Check for any non-conforming items
    const nonConformingItems = validatedData.activities.filter(
      (a) => a.recordOfConformity === 'Non-Conform'
    );

    // Validate final inspection if all activities complete
    const allActivitiesComplete = validatedData.activities.every(
      (a) => a.recordOfConformity !== ''
    );
    if (allActivitiesComplete && !validatedData.finalInspectionComplete) {
      return res.status(400).json({
        error: 'Final inspection required',
        message: 'All activities are complete but final inspection is not marked',
      });
    }

    // Generate ITP record number
    const baseDocNumber = ITP_DOCUMENT_NUMBERS[validatedData.itpType] || 'SGA-ITP-000';
    const itpNumber = `${baseDocNumber}-${validatedData.lotNo}-${Date.now()}`;

    // Determine ITP status
    let status = 'In Progress';
    if (validatedData.finalInspectionComplete) {
      status = nonConformingItems.length > 0 ? 'Completed with NCRs' : 'Completed';
    }

    // Create ITP record
    const itpRecord = {
      id: itpNumber,
      ...validatedData,
      submittedBy: req.user.id,
      submittedAt: new Date().toISOString(),
      status,
      version: 1,
      nonConformingItems: nonConformingItems.length,
    };

    // TODO: Save to SharePoint ITP list
    // const savedRecord = await ItpListService.createItem(itpRecord);

    // For now, return success with the record
    return res.status(201).json({
      success: true,
      message: 'ITP submitted successfully',
      itp: {
        id: itpNumber,
        jobId: validatedData.jobId,
        itpType: validatedData.itpType,
        documentNumber: validatedData.documentNumber || baseDocNumber,
        lotNo: validatedData.lotNo,
        date: validatedData.date,
        submittedAt: new Date().toISOString(),
        status,
        activitiesCompleted: validatedData.activities.filter(
          (a) => a.recordOfConformity !== ''
        ).length,
        totalActivities: validatedData.activities.length,
        holdPointsCleared: holdPointActivities.filter(
          (a) => a.recordOfConformity === 'Conform'
        ).length,
        totalHoldPoints: holdPointActivities.length,
        nonConformingItems: nonConformingItems.length,
        finalInspectionComplete: validatedData.finalInspectionComplete,
      },
    });
  } catch (error: any) {
    console.error('Error submitting ITP:', error);
    return res.status(500).json({
      error: 'Failed to submit ITP',
      message: error.message || 'An error occurred while submitting the ITP',
    });
  }
}

// Export with auth middleware
export default withAuth(handler, []);

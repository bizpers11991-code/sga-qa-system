/**
 * @file src/api/qa-forms/submit-itr.ts
 * @description POST /api/qa-forms/submit-itr - Submit ITR (Inspection Test Report)
 * Stores ITR data to SharePoint and links to job
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/api/_lib/auth';
import { checkPermission } from '@/lib/auth/permissions';

// ITR Inspection Item Schema
const ItrInspectionItemSchema = z.object({
  id: z.string(),
  itemNo: z.number(),
  description: z.string(),
  acceptanceCriteria: z.string(),
  status: z.enum(['Yes', 'No', 'N/A', '']),
  holdPointSignOff: z.object({
    sga: z.boolean(),
    dti: z.boolean().optional(),
    ghd: z.boolean().optional(),
    rtio: z.boolean().optional(),
    client: z.boolean().optional(),
  }),
  comments: z.string(),
});

// ITR Sign Off Schema
const ItrSignOffSchema = z.object({
  name: z.string(),
  position: z.string(),
  signature: z.string(), // base64
  date: z.string(),
});

// Full ITR Submit Schema
const ItrSubmitSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  itrType: z.enum(['asphalt-laying', 'profiling']).default('asphalt-laying'),
  projectName: z.string().min(1, 'Project name is required'),
  client: z.string().min(1, 'Client is required'),
  description: z.string(),
  projectDocNo: z.string(),
  dateLaid: z.string(),
  lotNumber: z.string(),
  workArea: z.string(),
  chainage: z.string(),
  inspectionItems: z.array(ItrInspectionItemSchema),
  comments: z.string(),
  sgaRepresentative: ItrSignOffSchema,
  clientRepresentative: ItrSignOffSchema,
});

type ItrSubmitRequest = z.infer<typeof ItrSubmitSchema>;

/**
 * Handler for POST /api/qa-forms/submit-itr
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
    let validatedData: ItrSubmitRequest;
    try {
      validatedData = ItrSubmitSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid ITR data',
          details: error.errors,
        });
      }
      throw error;
    }

    // Validate all inspection items are complete
    const incompleteItems = validatedData.inspectionItems.filter(
      (item) => item.status === '' && item.acceptanceCriteria !== ''
    );
    if (incompleteItems.length > 0) {
      return res.status(400).json({
        error: 'Incomplete inspection',
        message: `${incompleteItems.length} inspection items are not completed`,
        incompleteItems: incompleteItems.map((i) => i.itemNo),
      });
    }

    // Validate hold points are signed off
    const holdPointItems = validatedData.inspectionItems.filter(
      (item) => item.status === 'Yes' && !item.holdPointSignOff.sga
    );
    if (holdPointItems.length > 0) {
      return res.status(400).json({
        error: 'Missing sign-off',
        message: 'All passed items require SGA sign-off',
        missingSignOff: holdPointItems.map((i) => i.itemNo),
      });
    }

    // Generate ITR document number
    const itrNumber = `ITR-${validatedData.jobId}-${Date.now()}`;

    // Create ITR record
    const itrRecord = {
      id: itrNumber,
      ...validatedData,
      submittedBy: req.user.id,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      version: 1,
    };

    // TODO: Save to SharePoint ITR list
    // const savedRecord = await ItrListService.createItem(itrRecord);

    // For now, return success with the record
    return res.status(201).json({
      success: true,
      message: 'ITR submitted successfully',
      itr: {
        id: itrNumber,
        jobId: validatedData.jobId,
        itrType: validatedData.itrType,
        lotNumber: validatedData.lotNumber,
        dateLaid: validatedData.dateLaid,
        submittedAt: new Date().toISOString(),
        status: 'Submitted',
        itemsCompleted: validatedData.inspectionItems.filter((i) => i.status !== '').length,
        totalItems: validatedData.inspectionItems.length,
        passedItems: validatedData.inspectionItems.filter((i) => i.status === 'Yes').length,
        failedItems: validatedData.inspectionItems.filter((i) => i.status === 'No').length,
      },
    });
  } catch (error: any) {
    console.error('Error submitting ITR:', error);
    return res.status(500).json({
      error: 'Failed to submit ITR',
      message: error.message || 'An error occurred while submitting the ITR',
    });
  }
}

// Export with auth middleware
export default withAuth(handler, []);

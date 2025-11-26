import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { TenderHandover } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';
import {
  generateHandoverNumber,
  validateHandover,
  createProjectFolderStructure,
  calculateSiteVisitDates,
  createSiteVisitEvents,
  sendHandoverNotifications,
} from './_lib/handoverHandler.js';

const prepareObjectForRedis = (obj: Record<string, any>): Record<string, string> => {
  const prepared: Record<string, string> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null) {
      const value = obj[key];
      if (typeof value === 'object') {
        prepared[key] = JSON.stringify(value);
      } else {
        prepared[key] = String(value);
      }
    }
  }
  return prepared;
};

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  const handoverData: Partial<TenderHandover> = request.body;

  try {
    const redis = getRedisInstance();

    // Validate handover data
    validateHandover(handoverData);

    // Get all existing handovers to generate next number
    const handoverKeys = await redis.smembers('handovers:index');
    const existingHandovers: TenderHandover[] = [];

    for (const handoverId of handoverKeys) {
      const handoverKey = `handover:${handoverId}`;
      const handoverHash = await redis.hgetall(handoverKey);

      if (handoverHash && Object.keys(handoverHash).length > 0) {
        const handover: Partial<TenderHandover> = {};
        for (const [key, value] of Object.entries(handoverHash)) {
          try {
            handover[key as keyof TenderHandover] = JSON.parse(value as string);
          } catch {
            (handover as any)[key] = value;
          }
        }
        existingHandovers.push(handover as TenderHandover);
      }
    }

    // Generate handover number and create full handover object
    const handoverNumber = generateHandoverNumber(existingHandovers);
    const handoverId = `handover-${Date.now()}`;

    const completeHandover: TenderHandover = {
      id: handoverId,
      handoverNumber,
      dateCreated: new Date().toISOString(),
      createdBy: request.user.id,
      clientId: handoverData.clientId!,
      clientName: handoverData.clientName!,
      clientTier: handoverData.clientTier!,
      projectName: handoverData.projectName!,
      projectDescription: handoverData.projectDescription!,
      location: handoverData.location!,
      estimatedStartDate: handoverData.estimatedStartDate!,
      estimatedEndDate: handoverData.estimatedEndDate!,
      divisionsRequired: handoverData.divisionsRequired!,
      projectOwnerId: handoverData.projectOwnerId!,
      scopingPersonId: handoverData.scopingPersonId!,
      estimatedArea: handoverData.estimatedArea,
      estimatedThickness: handoverData.estimatedThickness,
      asphaltPlant: handoverData.asphaltPlant,
      specialRequirements: handoverData.specialRequirements,
      contractValue: handoverData.contractValue,
      contractNumber: handoverData.contractNumber,
      purchaseOrderNumber: handoverData.purchaseOrderNumber,
      attachments: handoverData.attachments || [],
      status: handoverData.status || 'Draft',
    };

    // Store handover in Redis
    const handoverKey = `handover:${handoverId}`;
    const preparedHandover = prepareObjectForRedis(completeHandover);

    const pipeline = redis.pipeline();
    pipeline.hset(handoverKey, preparedHandover);
    pipeline.sadd('handovers:index', handoverId);

    await pipeline.exec();

    // Respond to user immediately
    response.status(201).json({
      success: true,
      message: `Handover ${handoverNumber} created successfully`,
      handover: completeHandover,
    });

    // --- Asynchronous Post-Creation Tasks ---
    // These run after the response has been sent

    // 1. Create SharePoint folder structure
    // Generate project number (will be used when project is actually created)
    const projectNumber = `PRJ-${new Date().getFullYear()}-${handoverNumber.split('-')[2]}`;
    createProjectFolderStructure(projectNumber).catch(err => {
      console.error(`[Non-blocking] Failed to create SharePoint folders for ${projectNumber}:`, err);
    });

    // 2. Create site visit calendar events
    const siteVisits = calculateSiteVisitDates(
      completeHandover.clientTier,
      completeHandover.estimatedStartDate
    );

    createSiteVisitEvents(completeHandover, siteVisits).catch(err => {
      console.error(`[Non-blocking] Failed to create site visit events for ${handoverNumber}:`, err);
    });

    // 3. Send notifications
    sendHandoverNotifications(completeHandover).catch(err => {
      console.error(`[Non-blocking] Failed to send notifications for ${handoverNumber}:`, err);
    });

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Create Handover Failure',
      context: {
        projectName: handoverData.projectName,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

// Only tender_admin, scheduler_admin, and management_admin can create handovers
export default withAuth(handler, ['tender_admin', 'scheduler_admin', 'management_admin']);

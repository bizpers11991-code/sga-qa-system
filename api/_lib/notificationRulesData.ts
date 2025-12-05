/**
 * Notification Rules Data Service
 *
 * Manages configurable notification rules for Teams, email, and in-app alerts.
 * Routes notifications based on trigger events and conditions.
 */

import { getSharePointSiteId, getAccessToken, graphRequest } from './sharepointData.js';

const LIST_NAME = 'NotificationRules';

export type NotificationTrigger =
  | 'JobCreated' | 'JobCompleted' | 'JobOverdue' | 'JobStatusChanged'
  | 'ProjectCreated' | 'ProjectCompleted' | 'ProjectOverdue'
  | 'QAPackSubmitted' | 'QAPackApproved' | 'QAPackRejected' | 'QAPackOverdue'
  | 'IncidentReported' | 'IncidentEscalated' | 'IncidentClosed'
  | 'NCRCreated' | 'NCRClosed'
  | 'CertificationExpiring' | 'CertificationExpired'
  | 'DivisionRequestCreated' | 'DivisionRequestAccepted' | 'DivisionRequestRejected'
  | 'ScopeReportDue' | 'ScopeReportSubmitted'
  | 'EquipmentMaintenance' | 'ResourceConflict';

export type NotificationAction = 'SendTeams' | 'SendEmail' | 'CreateTask' | 'InAppNotification' | 'Webhook';

export interface NotificationRule {
  id: string;
  ruleName: string;
  trigger: NotificationTrigger;
  conditions?: Record<string, any>;
  action: NotificationAction;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  channelWebhook?: string;
  emailRecipients?: string[];
  messageTemplate?: {
    title: string;
    body: string;
    placeholders?: string[];
  };
  delayMinutes?: number;
  escalationRuleId?: string;
  isActive: boolean;
  division?: string;
}

export interface NotificationContext {
  trigger: NotificationTrigger;
  entityType: string;
  entityId: string;
  entityTitle?: string;
  division?: string;
  clientTier?: string;
  severity?: string;
  data: Record<string, any>;
}

function parseJson(value: string | null | undefined, defaultValue: any = null): any {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

function mapNotificationRule(item: any): NotificationRule {
  const f = item.fields;
  return {
    id: item.id,
    ruleName: f.RuleName || f.Title,
    trigger: f.Trigger,
    conditions: parseJson(f.Conditions, {}),
    action: f.Action,
    priority: f.Priority,
    channelWebhook: f.ChannelWebhook,
    emailRecipients: parseJson(f.EmailRecipients, []),
    messageTemplate: parseJson(f.MessageTemplate, null),
    delayMinutes: f.DelayMinutes || 0,
    escalationRuleId: f.EscalationRuleId,
    isActive: f.IsActive ?? true,
    division: f.Division,
  };
}

/**
 * Get all active notification rules
 */
export async function getAllRules(): Promise<NotificationRule[]> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${LIST_NAME}/items?$expand=fields&$filter=fields/IsActive eq true&$top=500`,
    'GET'
  );

  return (response.value || []).map(mapNotificationRule);
}

/**
 * Get rules for a specific trigger
 */
export async function getRulesForTrigger(trigger: NotificationTrigger): Promise<NotificationRule[]> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${LIST_NAME}/items?$expand=fields&$filter=fields/IsActive eq true and fields/Trigger eq '${trigger}'&$top=100`,
    'GET'
  );

  return (response.value || []).map(mapNotificationRule);
}

/**
 * Get matching rules for a notification context
 */
export async function getMatchingRules(context: NotificationContext): Promise<NotificationRule[]> {
  const rules = await getRulesForTrigger(context.trigger);

  return rules.filter(rule => {
    // Check division match
    if (rule.division && rule.division !== 'All' && rule.division !== context.division) {
      return false;
    }

    // Check conditions
    if (rule.conditions) {
      for (const [key, value] of Object.entries(rule.conditions)) {
        const contextValue = context.data[key] ?? (context as any)[key];
        if (value !== contextValue) {
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * Create a notification rule
 */
export async function createRule(data: Omit<NotificationRule, 'id'>): Promise<NotificationRule> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const fields = {
    Title: data.ruleName,
    RuleName: data.ruleName,
    Trigger: data.trigger,
    Conditions: data.conditions ? JSON.stringify(data.conditions) : '',
    Action: data.action,
    Priority: data.priority || 'Medium',
    ChannelWebhook: data.channelWebhook || '',
    EmailRecipients: data.emailRecipients ? JSON.stringify(data.emailRecipients) : '',
    MessageTemplate: data.messageTemplate ? JSON.stringify(data.messageTemplate) : '',
    DelayMinutes: data.delayMinutes || 0,
    EscalationRuleId: data.escalationRuleId || '',
    IsActive: data.isActive ?? true,
    Division: data.division || 'All',
  };

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${LIST_NAME}/items`,
    'POST',
    { fields }
  );

  return mapNotificationRule(response);
}

/**
 * Update a notification rule
 */
export async function updateRule(id: string, data: Partial<NotificationRule>): Promise<void> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const fields: Record<string, any> = {};

  if (data.ruleName !== undefined) {
    fields.RuleName = data.ruleName;
    fields.Title = data.ruleName;
  }
  if (data.trigger !== undefined) fields.Trigger = data.trigger;
  if (data.conditions !== undefined) fields.Conditions = JSON.stringify(data.conditions);
  if (data.action !== undefined) fields.Action = data.action;
  if (data.priority !== undefined) fields.Priority = data.priority;
  if (data.channelWebhook !== undefined) fields.ChannelWebhook = data.channelWebhook;
  if (data.emailRecipients !== undefined) fields.EmailRecipients = JSON.stringify(data.emailRecipients);
  if (data.messageTemplate !== undefined) fields.MessageTemplate = JSON.stringify(data.messageTemplate);
  if (data.delayMinutes !== undefined) fields.DelayMinutes = data.delayMinutes;
  if (data.escalationRuleId !== undefined) fields.EscalationRuleId = data.escalationRuleId;
  if (data.isActive !== undefined) fields.IsActive = data.isActive;
  if (data.division !== undefined) fields.Division = data.division;

  await graphRequest(
    token,
    `/sites/${siteId}/lists/${LIST_NAME}/items/${id}/fields`,
    'PATCH',
    fields
  );
}

/**
 * Delete a notification rule (soft delete - deactivate)
 */
export async function deleteRule(id: string): Promise<void> {
  await updateRule(id, { isActive: false });
}

/**
 * Process a notification context and send notifications
 */
export async function processNotification(context: NotificationContext): Promise<void> {
  const matchingRules = await getMatchingRules(context);

  for (const rule of matchingRules) {
    try {
      await executeNotificationAction(rule, context);
    } catch (error) {
      console.error(`Failed to execute notification rule ${rule.ruleName}:`, error);
    }
  }
}

/**
 * Execute a notification action
 */
async function executeNotificationAction(rule: NotificationRule, context: NotificationContext): Promise<void> {
  const message = formatMessage(rule.messageTemplate, context);

  switch (rule.action) {
    case 'SendTeams':
      if (rule.channelWebhook) {
        await sendTeamsNotification(rule.channelWebhook, message, rule.priority);
      }
      break;

    case 'SendEmail':
      // TODO: Implement email sending
      console.log('Email notification:', message);
      break;

    case 'InAppNotification':
      // TODO: Create notification in Notifications list
      console.log('In-app notification:', message);
      break;

    case 'CreateTask':
      // TODO: Create task in Teams
      console.log('Task creation:', message);
      break;

    case 'Webhook':
      if (rule.channelWebhook) {
        await sendWebhook(rule.channelWebhook, context);
      }
      break;
  }
}

/**
 * Format message with placeholders
 */
function formatMessage(
  template: NotificationRule['messageTemplate'],
  context: NotificationContext
): { title: string; body: string } {
  if (!template) {
    return {
      title: `${context.trigger}: ${context.entityTitle || context.entityId}`,
      body: JSON.stringify(context.data),
    };
  }

  let title = template.title;
  let body = template.body;

  // Replace placeholders
  const placeholders = {
    entityId: context.entityId,
    entityTitle: context.entityTitle || context.entityId,
    entityType: context.entityType,
    division: context.division || 'Unknown',
    clientTier: context.clientTier || '',
    severity: context.severity || '',
    ...context.data,
  };

  for (const [key, value] of Object.entries(placeholders)) {
    const placeholder = `{{${key}}}`;
    title = title.replace(new RegExp(placeholder, 'g'), String(value));
    body = body.replace(new RegExp(placeholder, 'g'), String(value));
  }

  return { title, body };
}

/**
 * Send Teams notification via webhook
 */
async function sendTeamsNotification(
  webhookUrl: string,
  message: { title: string; body: string },
  priority?: 'Low' | 'Medium' | 'High' | 'Critical'
): Promise<void> {
  const themeColor = {
    Low: '808080',
    Medium: '0078D7',
    High: 'FF8C00',
    Critical: 'FF0000',
  }[priority || 'Medium'];

  const card = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor,
    summary: message.title,
    sections: [
      {
        activityTitle: message.title,
        text: message.body,
      },
    ],
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  });
}

/**
 * Send generic webhook
 */
async function sendWebhook(webhookUrl: string, context: NotificationContext): Promise<void> {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context),
  });
}

// ============================================================================
// CONVENIENCE FUNCTIONS FOR COMMON NOTIFICATIONS
// ============================================================================

/**
 * Notify when a job is created
 */
export async function notifyJobCreated(jobId: string, jobNumber: string, division: string, data: Record<string, any>): Promise<void> {
  await processNotification({
    trigger: 'JobCreated',
    entityType: 'Job',
    entityId: jobId,
    entityTitle: jobNumber,
    division,
    data,
  });
}

/**
 * Notify when a QA pack is submitted
 */
export async function notifyQAPackSubmitted(packId: string, jobNumber: string, division: string, data: Record<string, any>): Promise<void> {
  await processNotification({
    trigger: 'QAPackSubmitted',
    entityType: 'QAPack',
    entityId: packId,
    entityTitle: jobNumber,
    division,
    data,
  });
}

/**
 * Notify when an incident is reported
 */
export async function notifyIncidentReported(incidentId: string, incidentNumber: string, severity: string, data: Record<string, any>): Promise<void> {
  await processNotification({
    trigger: 'IncidentReported',
    entityType: 'Incident',
    entityId: incidentId,
    entityTitle: incidentNumber,
    severity,
    data,
  });
}

/**
 * Notify when certification is expiring
 */
export async function notifyCertificationExpiring(crewMemberId: string, certificationName: string, expiryDate: string): Promise<void> {
  await processNotification({
    trigger: 'CertificationExpiring',
    entityType: 'Certification',
    entityId: crewMemberId,
    entityTitle: certificationName,
    data: { expiryDate, crewMemberId, certificationName },
  });
}

export const NotificationRulesData = {
  getAllRules,
  getRulesForTrigger,
  getMatchingRules,
  createRule,
  updateRule,
  deleteRule,
  processNotification,
  notifyJobCreated,
  notifyQAPackSubmitted,
  notifyIncidentReported,
  notifyCertificationExpiring,
};

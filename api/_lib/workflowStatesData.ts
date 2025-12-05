/**
 * Workflow States Data Service
 *
 * Manages extended workflow states for jobs, projects, and other entities.
 * Provides state machine functionality with transition validation.
 */

import { getSharePointSiteId, getAccessToken, graphRequest } from './sharepointData.js';

const LIST_NAME = 'WorkflowStates';

export type EntityType = 'Job' | 'Project' | 'QAPack' | 'Incident' | 'NCR' | 'ScopeReport';

export interface WorkflowState {
  id: string;
  entityType: EntityType;
  stateName: string;
  stateCode: string;
  displayOrder: number;
  colorCode?: string;
  iconName?: string;
  allowedTransitions: string[];
  requiredFields?: string[];
  requiredApprovals?: string[];
  autoEscalationDays?: number;
  escalationAction?: 'Notify' | 'Escalate' | 'Auto-Close' | 'None';
  isActive: boolean;
  isFinalState: boolean;
}

export interface StateTransitionResult {
  success: boolean;
  message: string;
  newState?: WorkflowState;
  validationErrors?: string[];
}

// Cache for workflow states
let statesCache: Map<EntityType, WorkflowState[]> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function parseJson(value: string | null | undefined, defaultValue: any = null): any {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

function mapWorkflowState(item: any): WorkflowState {
  const f = item.fields;
  return {
    id: item.id,
    entityType: f.EntityType,
    stateName: f.StateName,
    stateCode: f.StateCode,
    displayOrder: f.DisplayOrder || 0,
    colorCode: f.ColorCode,
    iconName: f.IconName,
    allowedTransitions: parseJson(f.AllowedTransitions, []),
    requiredFields: parseJson(f.RequiredFields, []),
    requiredApprovals: parseJson(f.RequiredApprovals, []),
    autoEscalationDays: f.AutoEscalationDays,
    escalationAction: f.EscalationAction,
    isActive: f.IsActive ?? true,
    isFinalState: f.IsFinalState ?? false,
  };
}

function isCacheValid(): boolean {
  return statesCache !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

async function loadCache(): Promise<void> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${LIST_NAME}/items?$expand=fields&$filter=fields/IsActive eq true&$top=500`,
    'GET'
  );

  const states = (response.value || []).map(mapWorkflowState);

  statesCache = new Map();
  for (const state of states) {
    if (!statesCache.has(state.entityType)) {
      statesCache.set(state.entityType, []);
    }
    statesCache.get(state.entityType)!.push(state);
  }

  // Sort each entity type's states by display order
  statesCache.forEach((states, entityType) => {
    states.sort((a, b) => a.displayOrder - b.displayOrder);
  });

  cacheTimestamp = Date.now();
}

/**
 * Get all workflow states for an entity type
 */
export async function getStatesForEntity(entityType: EntityType): Promise<WorkflowState[]> {
  if (!isCacheValid()) {
    await loadCache();
  }
  return statesCache?.get(entityType) || [];
}

/**
 * Get a specific workflow state by code
 */
export async function getStateByCode(entityType: EntityType, stateCode: string): Promise<WorkflowState | null> {
  const states = await getStatesForEntity(entityType);
  return states.find(s => s.stateCode === stateCode) || null;
}

/**
 * Get a specific workflow state by name
 */
export async function getStateByName(entityType: EntityType, stateName: string): Promise<WorkflowState | null> {
  const states = await getStatesForEntity(entityType);
  return states.find(s => s.stateName === stateName) || null;
}

/**
 * Get allowed transitions from a state
 */
export async function getAllowedTransitions(entityType: EntityType, currentStateCode: string): Promise<WorkflowState[]> {
  const currentState = await getStateByCode(entityType, currentStateCode);
  if (!currentState) return [];

  const states = await getStatesForEntity(entityType);
  return states.filter(s => currentState.allowedTransitions.includes(s.stateCode));
}

/**
 * Validate if a state transition is allowed
 */
export async function canTransition(
  entityType: EntityType,
  currentStateCode: string,
  newStateCode: string
): Promise<boolean> {
  const currentState = await getStateByCode(entityType, currentStateCode);
  if (!currentState) return false;

  return currentState.allowedTransitions.includes(newStateCode);
}

/**
 * Validate a state transition with full context
 */
export async function validateTransition(
  entityType: EntityType,
  currentStateCode: string,
  newStateCode: string,
  entityData: Record<string, any>,
  userRoles: string[]
): Promise<StateTransitionResult> {
  const currentState = await getStateByCode(entityType, currentStateCode);
  const newState = await getStateByCode(entityType, newStateCode);

  if (!currentState) {
    return { success: false, message: `Current state '${currentStateCode}' not found` };
  }

  if (!newState) {
    return { success: false, message: `Target state '${newStateCode}' not found` };
  }

  // Check if transition is allowed
  if (!currentState.allowedTransitions.includes(newStateCode)) {
    return {
      success: false,
      message: `Transition from '${currentState.stateName}' to '${newState.stateName}' is not allowed`,
    };
  }

  // Check required fields
  const validationErrors: string[] = [];
  if (newState.requiredFields) {
    for (const field of newState.requiredFields) {
      if (!entityData[field]) {
        validationErrors.push(`Field '${field}' is required for state '${newState.stateName}'`);
      }
    }
  }

  // Check required approvals
  if (newState.requiredApprovals && newState.requiredApprovals.length > 0) {
    const hasRequiredRole = newState.requiredApprovals.some(role => userRoles.includes(role));
    if (!hasRequiredRole) {
      validationErrors.push(`Approval required from one of: ${newState.requiredApprovals.join(', ')}`);
    }
  }

  if (validationErrors.length > 0) {
    return {
      success: false,
      message: 'Validation failed',
      validationErrors,
    };
  }

  return {
    success: true,
    message: `Transition to '${newState.stateName}' is valid`,
    newState,
  };
}

/**
 * Get the initial state for an entity type
 */
export async function getInitialState(entityType: EntityType): Promise<WorkflowState | null> {
  const states = await getStatesForEntity(entityType);
  return states.find(s => s.displayOrder === 1) || states[0] || null;
}

/**
 * Get all final states for an entity type
 */
export async function getFinalStates(entityType: EntityType): Promise<WorkflowState[]> {
  const states = await getStatesForEntity(entityType);
  return states.filter(s => s.isFinalState);
}

/**
 * Check if a state is a final state
 */
export async function isFinalState(entityType: EntityType, stateCode: string): Promise<boolean> {
  const state = await getStateByCode(entityType, stateCode);
  return state?.isFinalState ?? false;
}

/**
 * Get states that need escalation checking
 */
export async function getStatesWithEscalation(entityType: EntityType): Promise<WorkflowState[]> {
  const states = await getStatesForEntity(entityType);
  return states.filter(s => s.autoEscalationDays && s.autoEscalationDays > 0 && s.escalationAction !== 'None');
}

/**
 * Clear the workflow states cache
 */
export function clearCache(): void {
  statesCache = null;
  cacheTimestamp = 0;
}

// ============================================================================
// CONVENIENCE FUNCTIONS FOR COMMON ENTITY TYPES
// ============================================================================

/**
 * Job workflow helpers
 */
export const JobWorkflow = {
  getStates: () => getStatesForEntity('Job'),
  getState: (code: string) => getStateByCode('Job', code),
  canTransition: (from: string, to: string) => canTransition('Job', from, to),
  getAllowedTransitions: (current: string) => getAllowedTransitions('Job', current),
  validateTransition: (from: string, to: string, data: Record<string, any>, roles: string[]) =>
    validateTransition('Job', from, to, data, roles),
};

/**
 * Project workflow helpers
 */
export const ProjectWorkflow = {
  getStates: () => getStatesForEntity('Project'),
  getState: (code: string) => getStateByCode('Project', code),
  canTransition: (from: string, to: string) => canTransition('Project', from, to),
  getAllowedTransitions: (current: string) => getAllowedTransitions('Project', current),
  validateTransition: (from: string, to: string, data: Record<string, any>, roles: string[]) =>
    validateTransition('Project', from, to, data, roles),
};

/**
 * QA Pack workflow helpers
 */
export const QAPackWorkflow = {
  getStates: () => getStatesForEntity('QAPack'),
  getState: (code: string) => getStateByCode('QAPack', code),
  canTransition: (from: string, to: string) => canTransition('QAPack', from, to),
  getAllowedTransitions: (current: string) => getAllowedTransitions('QAPack', current),
};

/**
 * Incident workflow helpers
 */
export const IncidentWorkflow = {
  getStates: () => getStatesForEntity('Incident'),
  getState: (code: string) => getStateByCode('Incident', code),
  canTransition: (from: string, to: string) => canTransition('Incident', from, to),
  getAllowedTransitions: (current: string) => getAllowedTransitions('Incident', current),
};

export const WorkflowStatesData = {
  getStatesForEntity,
  getStateByCode,
  getStateByName,
  getAllowedTransitions,
  canTransition,
  validateTransition,
  getInitialState,
  getFinalStates,
  isFinalState,
  getStatesWithEscalation,
  clearCache,
  JobWorkflow,
  ProjectWorkflow,
  QAPackWorkflow,
  IncidentWorkflow,
};

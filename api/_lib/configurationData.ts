/**
 * Configuration Data Service
 *
 * Provides access to centralized configuration stored in SharePoint.
 * Configurations are cached for performance.
 */

import { getSharePointSiteId, getAccessToken, graphRequest } from './sharepointData.js';

const LIST_NAME = 'Configuration';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface ConfigCache {
  data: Map<string, any>;
  timestamp: number;
}

let configCache: ConfigCache | null = null;

interface ConfigItem {
  id: string;
  configKey: string;
  configValue: any;
  category: string;
  division?: string;
  isActive: boolean;
  effectiveDate?: string;
  expiryDate?: string;
  description?: string;
}

/**
 * Get all active configurations
 */
async function getAllConfigs(): Promise<ConfigItem[]> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  const response = await graphRequest(
    token,
    `/sites/${siteId}/lists/${LIST_NAME}/items?$expand=fields&$filter=fields/IsActive eq true&$top=500`,
    'GET'
  );

  return (response.value || []).map((item: any) => ({
    id: item.id,
    configKey: item.fields.ConfigKey || item.fields.Title,
    configValue: parseConfigValue(item.fields.ConfigValue),
    category: item.fields.Category,
    division: item.fields.Division,
    isActive: item.fields.IsActive ?? true,
    effectiveDate: item.fields.EffectiveDate,
    expiryDate: item.fields.ExpiryDate,
    description: item.fields.Description,
  }));
}

function parseConfigValue(value: string): any {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isCacheValid(): boolean {
  if (!configCache) return false;
  return Date.now() - configCache.timestamp < CACHE_TTL_MS;
}

async function loadCache(): Promise<void> {
  const configs = await getAllConfigs();
  const data = new Map<string, any>();

  for (const config of configs) {
    // Check if config is within effective date range
    const now = new Date();
    if (config.effectiveDate && new Date(config.effectiveDate) > now) continue;
    if (config.expiryDate && new Date(config.expiryDate) < now) continue;

    data.set(config.configKey, config);
  }

  configCache = { data, timestamp: Date.now() };
}

/**
 * Get a configuration value by key
 */
export async function getConfig<T = any>(key: string, defaultValue?: T): Promise<T> {
  if (!isCacheValid()) {
    await loadCache();
  }

  const config = configCache?.data.get(key);
  if (!config) return defaultValue as T;

  return config.configValue as T;
}

/**
 * Get a configuration value for a specific division
 */
export async function getConfigForDivision<T = any>(
  key: string,
  division: string,
  defaultValue?: T
): Promise<T> {
  if (!isCacheValid()) {
    await loadCache();
  }

  // First try division-specific config
  const divisionKey = `${key}_${division}`;
  let config = configCache?.data.get(divisionKey);

  // Fall back to global config
  if (!config) {
    config = configCache?.data.get(key);
  }

  if (!config) return defaultValue as T;

  return config.configValue as T;
}

/**
 * Get all configurations in a category
 */
export async function getConfigsByCategory(category: string): Promise<ConfigItem[]> {
  if (!isCacheValid()) {
    await loadCache();
  }

  const results: ConfigItem[] = [];
  configCache?.data.forEach((config) => {
    if (config.category === category) {
      results.push(config);
    }
  });

  return results;
}

/**
 * Clear the configuration cache
 */
export function clearConfigCache(): void {
  configCache = null;
}

/**
 * Create or update a configuration
 */
export async function setConfig(
  key: string,
  value: any,
  category: string,
  division?: string,
  description?: string
): Promise<void> {
  const siteId = await getSharePointSiteId();
  const token = await getAccessToken();

  // Check if config exists
  const existing = await graphRequest(
    token,
    `/sites/${siteId}/lists/${LIST_NAME}/items?$expand=fields&$filter=fields/ConfigKey eq '${key}'`,
    'GET'
  );

  const fields = {
    Title: key,
    ConfigKey: key,
    ConfigValue: typeof value === 'string' ? value : JSON.stringify(value),
    Category: category,
    Division: division || 'Global',
    IsActive: true,
    Description: description,
  };

  if (existing.value && existing.value.length > 0) {
    // Update existing
    await graphRequest(
      token,
      `/sites/${siteId}/lists/${LIST_NAME}/items/${existing.value[0].id}/fields`,
      'PATCH',
      fields
    );
  } else {
    // Create new
    await graphRequest(
      token,
      `/sites/${siteId}/lists/${LIST_NAME}/items`,
      'POST',
      { fields }
    );
  }

  // Clear cache to force reload
  clearConfigCache();
}

// ============================================================================
// CONVENIENCE FUNCTIONS FOR COMMON CONFIGURATIONS
// ============================================================================

/**
 * Get asphalt mix type specifications
 */
export async function getAsphaltMixTypes(): Promise<Record<string, any>> {
  return getConfig('ASPHALT_MIX_TYPES', {});
}

/**
 * Get temperature requirements for asphalt
 */
export async function getTemperatureRequirements(): Promise<{
  standardBinder: { min: number; max: number };
  pmb: { min: number; max: number };
  warmMix: { min: number; max: number };
  minAirTemp: number;
  minRoadTemp: number;
  maxWindSpeed: number;
}> {
  return getConfig('TEMPERATURE_REQUIREMENTS', {
    standardBinder: { min: 130, max: 165 },
    pmb: { min: 145, max: 175 },
    warmMix: { min: 110, max: 140 },
    minAirTemp: 10,
    minRoadTemp: 5,
    maxWindSpeed: 40,
  });
}

/**
 * Get client tier rules
 */
export async function getClientTierRules(): Promise<Record<string, {
  siteVisits: string[];
  qaPackReviewRequired: boolean;
  escalationHours: number;
}>> {
  return getConfig('CLIENT_TIER_RULES', {
    'Tier 1': { siteVisits: ['14-Day', '7-Day', '3-Day'], qaPackReviewRequired: true, escalationHours: 24 },
    'Tier 2': { siteVisits: ['7-Day', '3-Day'], qaPackReviewRequired: true, escalationHours: 48 },
    'Tier 3': { siteVisits: ['72-Hour'], qaPackReviewRequired: false, escalationHours: 72 },
  });
}

/**
 * Get division role mappings
 */
export async function getDivisionRoleMappings(): Promise<Record<string, { foreman: string; engineer?: string; admin?: string }>> {
  return getConfig('DIVISION_ROLE_MAPPINGS', {
    Asphalt: { foreman: 'asphalt_foreman', engineer: 'asphalt_engineer' },
    Profiling: { foreman: 'profiling_foreman', engineer: 'profiling_engineer' },
    Spray: { foreman: 'spray_foreman', admin: 'spray_admin' },
  });
}

/**
 * Get QA pack review timeout
 */
export async function getQAPackReviewTimeout(clientTier?: string): Promise<number> {
  const timeouts = await getConfig('QA_PACK_REVIEW_TIMEOUT_HOURS', { default: 48 });
  if (clientTier) {
    const tierKey = clientTier.toLowerCase().replace(' ', '');
    return timeouts[tierKey] || timeouts.default;
  }
  return timeouts.default;
}

export const ConfigurationData = {
  getConfig,
  getConfigForDivision,
  getConfigsByCategory,
  setConfig,
  clearConfigCache,
  getAsphaltMixTypes,
  getTemperatureRequirements,
  getClientTierRules,
  getDivisionRoleMappings,
  getQAPackReviewTimeout,
};

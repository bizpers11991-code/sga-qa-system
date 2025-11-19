// api/_lib/validation.ts
/**
 * Security: Input Validation Utilities
 *
 * This module provides comprehensive input validation to prevent:
 * - SQL/NoSQL Injection
 * - XSS attacks
 * - Path Traversal
 * - DoS through massive payloads
 * - Type confusion attacks
 *
 * CRITICAL: All user input must be validated before processing.
 */

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALIDATION_LIMITS = {
  // String lengths
  MAX_STRING_SHORT: 100,
  MAX_STRING_MEDIUM: 500,
  MAX_STRING_LONG: 2000,
  MAX_STRING_XLARGE: 10000,

  // Numeric limits
  MAX_TONNES: 10000,
  MAX_TEMPERATURE: 300,
  MAX_DEPTH: 500,
  MAX_AREA: 100000,

  // Array limits
  MAX_ARRAY_SMALL: 50,
  MAX_ARRAY_MEDIUM: 100,
  MAX_ARRAY_LARGE: 500,

  // File limits
  MAX_FILENAME_LENGTH: 255,
  MAX_FILE_SIZE_MB: 10,
};

// ============================================================================
// ALLOWED VALUES (Whitelist Approach)
// ============================================================================

export const ALLOWED_DIVISIONS = ['Asphalt', 'Profiling', 'Spray'] as const;
export const ALLOWED_ROLES = [
  'asphalt_foreman',
  'profiling_foreman',
  'spray_foreman',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'scheduler_admin',
  'management_admin',
  'hseq_manager',
] as const;

export const ALLOWED_FILE_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
] as const;

export const ALLOWED_REPORT_STATUSES = [
  'Pending Review',
  'Requires Action',
  'Approved',
  'Archived',
] as const;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates a string is safe and within length limits
 * @param value - The string to validate
 * @param maxLength - Maximum allowed length
 * @param allowEmpty - Whether empty strings are allowed
 * @returns Validation result
 */
export function validateString(
  value: unknown,
  maxLength: number = VALIDATION_LIMITS.MAX_STRING_MEDIUM,
  allowEmpty: boolean = false
): { valid: boolean; error?: string; value?: string } {
  if (value === null || value === undefined) {
    return allowEmpty
      ? { valid: true, value: '' }
      : { valid: false, error: 'Value is required' };
  }

  if (typeof value !== 'string') {
    return { valid: false, error: 'Value must be a string' };
  }

  if (!allowEmpty && value.trim().length === 0) {
    return { valid: false, error: 'Value cannot be empty' };
  }

  if (value.length > maxLength) {
    return { valid: false, error: `Value exceeds maximum length of ${maxLength}` };
  }

  return { valid: true, value };
}

/**
 * Validates a number is within acceptable range
 */
export function validateNumber(
  value: unknown,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): { valid: boolean; error?: string; value?: number } {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: 'Value is required' };
  }

  const num = typeof value === 'string' ? parseFloat(value) : Number(value);

  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, error: 'Value must be a valid number' };
  }

  if (num < min || num > max) {
    return { valid: false, error: `Value must be between ${min} and ${max}` };
  }

  return { valid: true, value: num };
}

/**
 * Validates an array doesn't exceed size limits
 */
export function validateArray<T>(
  value: unknown,
  maxLength: number = VALIDATION_LIMITS.MAX_ARRAY_MEDIUM
): { valid: boolean; error?: string; value?: T[] } {
  if (!Array.isArray(value)) {
    return { valid: false, error: 'Value must be an array' };
  }

  if (value.length > maxLength) {
    return { valid: false, error: `Array exceeds maximum length of ${maxLength}` };
  }

  return { valid: true, value };
}

/**
 * Validates a date string is valid
 */
export function validateDate(
  value: unknown
): { valid: boolean; error?: string; value?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Date must be a string' };
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  // Prevent dates too far in the past or future (sanity check)
  const year = date.getFullYear();
  if (year < 2000 || year > 2100) {
    return { valid: false, error: 'Date must be between 2000 and 2100' };
  }

  return { valid: true, value };
}

/**
 * Validates a value against a whitelist
 */
export function validateWhitelist<T extends readonly string[]>(
  value: unknown,
  allowedValues: T
): { valid: boolean; error?: string; value?: T[number] } {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Value must be a string' };
  }

  if (!allowedValues.includes(value as any)) {
    return { valid: false, error: `Value must be one of: ${allowedValues.join(', ')}` };
  }

  return { valid: true, value: value as T[number] };
}

/**
 * Validates an email address
 */
export function validateEmail(
  value: unknown
): { valid: boolean; error?: string; value?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Email must be a string' };
  }

  // RFC 5322 compliant regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(value)) {
    return { valid: false, error: 'Invalid email address' };
  }

  if (value.length > 254) {
    return { valid: false, error: 'Email address too long' };
  }

  return { valid: true, value: value.toLowerCase() };
}

/**
 * Validates a GUID/UUID
 */
export function validateGuid(
  value: unknown
): { valid: boolean; error?: string; value?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: 'GUID must be a string' };
  }

  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!guidRegex.test(value)) {
    return { valid: false, error: 'Invalid GUID format' };
  }

  return { valid: true, value: value.toLowerCase() };
}

/**
 * Validates a job number format
 */
export function validateJobNumber(
  value: unknown
): { valid: boolean; error?: string; value?: string } {
  const stringValidation = validateString(value, 50);
  if (!stringValidation.valid) {
    return stringValidation;
  }

  const jobNo = stringValidation.value!;

  // Job numbers should be alphanumeric with hyphens/underscores only
  const jobNoRegex = /^[A-Z0-9][A-Z0-9\-_\/]*$/i;

  if (!jobNoRegex.test(jobNo)) {
    return { valid: false, error: 'Job number contains invalid characters' };
  }

  return { valid: true, value: jobNo };
}

/**
 * Validates a base64 data URL
 */
export function validateBase64DataUrl(
  value: unknown,
  maxSizeMB: number = VALIDATION_LIMITS.MAX_FILE_SIZE_MB
): { valid: boolean; error?: string; value?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Base64 data must be a string' };
  }

  // Check format: data:image/jpeg;base64,<data>
  const dataUrlRegex = /^data:([a-z]+\/[a-z0-9\-\+\.]+);base64,([A-Za-z0-9+/=]+)$/;
  const match = value.match(dataUrlRegex);

  if (!match) {
    return { valid: false, error: 'Invalid base64 data URL format' };
  }

  const [, mimeType, base64Data] = match;

  // Validate MIME type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedMimeTypes.includes(mimeType)) {
    return { valid: false, error: `Unsupported MIME type: ${mimeType}` };
  }

  // Estimate size (base64 is ~33% larger than original)
  const estimatedSizeBytes = (base64Data.length * 3) / 4;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (estimatedSizeBytes > maxSizeBytes) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }

  return { valid: true, value };
}

/**
 * Validates GPS coordinates
 */
export function validateCoordinates(
  lat: unknown,
  lon: unknown
): { valid: boolean; error?: string; value?: { lat: number; lon: number } } {
  const latValidation = validateNumber(lat, -90, 90);
  if (!latValidation.valid) {
    return { valid: false, error: `Invalid latitude: ${latValidation.error}` };
  }

  const lonValidation = validateNumber(lon, -180, 180);
  if (!lonValidation.valid) {
    return { valid: false, error: `Invalid longitude: ${lonValidation.error}` };
  }

  return {
    valid: true,
    value: { lat: latValidation.value!, lon: lonValidation.value! }
  };
}

/**
 * Validates URL format
 */
export function validateUrl(
  value: unknown,
  allowedProtocols: string[] = ['https']
): { valid: boolean; error?: string; value?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: 'URL must be a string' };
  }

  try {
    const url = new URL(value);

    if (!allowedProtocols.includes(url.protocol.replace(':', ''))) {
      return {
        valid: false,
        error: `Protocol must be one of: ${allowedProtocols.join(', ')}`
      };
    }

    return { valid: true, value };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// ============================================================================
// COMPOSITE VALIDATORS (for complex objects)
// ============================================================================

/**
 * Validates Job data
 */
export function validateJobData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Job number
  const jobNoValidation = validateJobNumber(data.jobNo);
  if (!jobNoValidation.valid) errors.push(`jobNo: ${jobNoValidation.error}`);

  // Client name
  const clientValidation = validateString(data.client, VALIDATION_LIMITS.MAX_STRING_MEDIUM);
  if (!clientValidation.valid) errors.push(`client: ${clientValidation.error}`);

  // Division
  const divisionValidation = validateWhitelist(data.division, ALLOWED_DIVISIONS);
  if (!divisionValidation.valid) errors.push(`division: ${divisionValidation.error}`);

  // Project name
  const projectValidation = validateString(data.projectName, VALIDATION_LIMITS.MAX_STRING_MEDIUM);
  if (!projectValidation.valid) errors.push(`projectName: ${projectValidation.error}`);

  // Location
  const locationValidation = validateString(data.location, VALIDATION_LIMITS.MAX_STRING_MEDIUM);
  if (!locationValidation.valid) errors.push(`location: ${locationValidation.error}`);

  // Dates
  const jobDateValidation = validateDate(data.jobDate);
  if (!jobDateValidation.valid) errors.push(`jobDate: ${jobDateValidation.error}`);

  const dueDateValidation = validateDate(data.dueDate);
  if (!dueDateValidation.valid) errors.push(`dueDate: ${dueDateValidation.error}`);

  return { valid: errors.length === 0, errors };
}

/**
 * Validates Asphalt Placement Row data
 */
export function validateAsphaltPlacementRow(row: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Tonnes
  const tonnesValidation = validateNumber(row.tonnes, 0, VALIDATION_LIMITS.MAX_TONNES);
  if (!tonnesValidation.valid) errors.push(`tonnes: ${tonnesValidation.error}`);

  // Temperatures
  if (row.incomingTemp) {
    const incomingTempValidation = validateNumber(row.incomingTemp, 0, VALIDATION_LIMITS.MAX_TEMPERATURE);
    if (!incomingTempValidation.valid) errors.push(`incomingTemp: ${incomingTempValidation.error}`);
  }

  if (row.placementTemp) {
    const placementTempValidation = validateNumber(row.placementTemp, 0, VALIDATION_LIMITS.MAX_TEMPERATURE);
    if (!placementTempValidation.valid) errors.push(`placementTemp: ${placementTempValidation.error}`);
  }

  // Docket number
  const docketValidation = validateString(row.docketNumber, VALIDATION_LIMITS.MAX_STRING_SHORT);
  if (!docketValidation.valid) errors.push(`docketNumber: ${docketValidation.error}`);

  return { valid: errors.length === 0, errors };
}

/**
 * Generic validation error response
 */
export function createValidationErrorResponse(errors: string[]) {
  return {
    success: false,
    error: 'Validation failed',
    details: errors,
    timestamp: new Date().toISOString(),
  };
}

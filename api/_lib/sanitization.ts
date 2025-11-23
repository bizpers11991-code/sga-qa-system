// api/_lib/sanitization.ts
/**
 * Security: Data Sanitization Utilities
 *
 * This module provides data sanitization to prevent:
 * - Prompt Injection in AI features
 * - XSS (Cross-Site Scripting)
 * - Path Traversal
 * - SQL/NoSQL Injection
 * - Data leakage through PII exposure
 *
 * CRITICAL: All user input must be sanitized before use.
 */

// ============================================================================
// FILENAME SANITIZATION (Path Traversal Prevention)
// ============================================================================

/**
 * Sanitizes a filename to prevent path traversal attacks
 * Removes: ../, ..\, /, \, null bytes, and other dangerous characters
 *
 * @param filename - The filename to sanitize
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }

  let sanitized = filename;

  // Remove path traversal sequences
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/\//g, '_');
  sanitized = sanitized.replace(/\\/g, '_');

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/\0/g, '');
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');

  // Limit to alphanumeric, dash, underscore, dot, and space
  sanitized = sanitized.replace(/[^a-zA-Z0-9\-_\.\s]/g, '');

  // Collapse multiple spaces/underscores
  sanitized = sanitized.replace(/\s+/g, ' ').replace(/_+/g, '_');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > 200) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, 200 - ext.length) + ext;
  }

  // Ensure we have something left
  if (sanitized.length === 0 || sanitized === '.') {
    sanitized = 'unnamed';
  }

  return sanitized;
}

/**
 * Validates and sanitizes file extension
 * @param filename - Filename to check
 * @param allowedExtensions - Whitelist of allowed extensions
 * @returns { valid, sanitizedName, extension }
 */
export function sanitizeFileExtension(
  filename: string,
  allowedExtensions: readonly string[] = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx']
): { valid: boolean; sanitizedName: string; extension: string; error?: string } {
  const sanitizedName = sanitizeFilename(filename);
  const lastDot = sanitizedName.lastIndexOf('.');

  if (lastDot === -1) {
    return {
      valid: false,
      sanitizedName,
      extension: '',
      error: 'No file extension found'
    };
  }

  const extension = sanitizedName.substring(lastDot).toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      sanitizedName,
      extension,
      error: `File extension ${extension} not allowed. Allowed: ${allowedExtensions.join(', ')}`
    };
  }

  return { valid: true, sanitizedName, extension };
}

// ============================================================================
// PROMPT INJECTION PREVENTION (AI Safety)
// ============================================================================

/**
 * Sanitizes text before sending to AI models to prevent prompt injection
 * Removes control characters, limits length, strips instruction-like patterns
 *
 * @param input - User input to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized text safe for AI prompts
 */
export function sanitizeForAIPrompt(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove newlines and carriage returns (prevent instruction injection)
  sanitized = sanitized.replace(/[\n\r\t]/g, ' ');

  // Remove non-printable ASCII characters
  sanitized = sanitized.replace(/[^\x20-\x7E]/g, '');

  // Remove common prompt injection patterns
  const dangerousPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions?/gi,
    /ignore\s+(all\s+)?above/gi,
    /disregard\s+(all\s+)?previous/gi,
    /forget\s+(all\s+)?previous/gi,
    /new\s+instructions?:/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /human\s*:/gi,
    /<\|.*?\|>/gi, // Remove special tokens
    /\[INST\]/gi,
    /\[\/INST\]/gi,
  ];

  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Collapse multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Trim and limit length
  sanitized = sanitized.trim().substring(0, maxLength);

  return sanitized;
}

/**
 * Sanitizes structured data for AI prompts (e.g., JSON objects)
 * Recursively sanitizes all string fields
 */
export function sanitizeObjectForAI<T extends Record<string, any>>(
  obj: T,
  maxStringLength: number = 500
): Record<string, any> {
  const sanitized: Record<string, any> = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeForAIPrompt(sanitized[key], maxStringLength);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      if (Array.isArray(sanitized[key])) {
        sanitized[key] = sanitized[key].map((item: any) =>
          typeof item === 'string'
            ? sanitizeForAIPrompt(item, maxStringLength)
            : typeof item === 'object'
            ? sanitizeObjectForAI(item, maxStringLength)
            : item
        );
      } else {
        sanitized[key] = sanitizeObjectForAI(sanitized[key], maxStringLength);
      }
    }
  }

  return sanitized;
}

// ============================================================================
// XSS PREVENTION (HTML/Script Injection)
// ============================================================================

/**
 * Escapes HTML special characters to prevent XSS
 * @param text - Text to escape
 * @returns HTML-safe text
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, char => htmlEscapeMap[char] || char);
}

/**
 * Strips all HTML tags from text
 * @param text - Text that may contain HTML
 * @returns Plain text
 */
export function stripHtmlTags(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove all HTML tags
  let stripped = text.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  stripped = stripped
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  return stripped;
}

// ============================================================================
// PII MASKING (Sensitive Data Protection)
// ============================================================================

/**
 * Masks email addresses for privacy
 * Example: john.doe@example.com -> j***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return '[REDACTED]';
  }

  const [localPart, domain] = email.split('@');

  if (localPart.length <= 1) {
    return `${localPart[0]}***@${domain}`;
  }

  return `${localPart[0]}***@${domain}`;
}

/**
 * Masks phone numbers for privacy
 * Example: 0412345678 -> 04****5678
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '[REDACTED]';
  }

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 6) {
    return '***';
  }

  if (digits.length <= 10) {
    return `${digits.substring(0, 2)}****${digits.substring(digits.length - 4)}`;
  }

  return `${digits.substring(0, 3)}****${digits.substring(digits.length - 4)}`;
}

/**
 * Masks a person's full name
 * Example: John Michael Doe -> John D.
 */
export function maskName(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return '[REDACTED]';
  }

  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 0) {
    return '[REDACTED]';
  }

  if (parts.length === 1) {
    return parts[0];
  }

  // Return first name + last initial
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/**
 * Masks GPS coordinates to show approximate location only
 * Reduces precision to ~1km accuracy
 */
export function maskCoordinates(lat: number, lon: number): { lat: number; lon: number } {
  // Round to 2 decimal places (~1km accuracy)
  return {
    lat: Math.round(lat * 100) / 100,
    lon: Math.round(lon * 100) / 100,
  };
}

/**
 * Redacts sensitive fields from an object for logging/notifications
 * @param obj - Object to redact
 * @param sensitiveFields - Array of field names to redact
 * @returns Redacted copy of object
 */
export function redactSensitiveFields<T extends Record<string, any>>(
  obj: T,
  sensitiveFields: string[] = ['password', 'token', 'apiKey', 'secret', 'ssn', 'creditCard']
): Record<string, any> {
  const redacted: Record<string, any> = { ...obj };

  for (const key in redacted) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      if (Array.isArray(redacted[key])) {
        redacted[key] = redacted[key].map((item: any) =>
          typeof item === 'object' ? redactSensitiveFields(item, sensitiveFields) : item
        );
      } else {
        redacted[key] = redactSensitiveFields(redacted[key], sensitiveFields);
      }
    }
  }

  return redacted;
}

// ============================================================================
// SQL/NOSQL INJECTION PREVENTION
// ============================================================================

/**
 * Escapes characters that could be used in SQL injection
 * Note: Parameterized queries are still preferred
 */
export function escapeSqlString(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

/**
 * Sanitizes input for FetchXML queries (Dataverse/Dynamics)
 */
export function sanitizeForFetchXML(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================================
// COMPOSITE SANITIZATION (for specific use cases)
// ============================================================================

/**
 * Prepares report data for Teams notifications with PII removed
 */
export function sanitizeForTeamsNotification(report: any): any {
  return {
    jobNo: report.job?.jobNo || 'Unknown',
    client: report.job?.client || 'Confidential',
    division: report.job?.division || 'Unknown',
    location: report.job?.location ? maskLocation(report.job.location) : 'Undisclosed',
    submittedBy: report.submittedBy ? maskName(report.submittedBy) : 'Staff Member',
    date: report.timestamp ? new Date(report.timestamp).toLocaleDateString('en-AU') : 'Unknown',
    totalTonnes: report.sgaDailyReport?.works
      ? report.sgaDailyReport.works.reduce((acc: number, w: any) => acc + (parseFloat(w.tonnes) || 0), 0).toFixed(2)
      : 'N/A',
    // Remove all URLs to prevent unauthorized access
    pdfUrl: undefined,
    foremanPhotoUrl: undefined,
    sitePhotoUrls: undefined,
  };
}

/**
 * Masks location to show general area only
 */
export function maskLocation(location: string): string {
  if (!location || typeof location !== 'string') {
    return 'Undisclosed Location';
  }

  // Extract suburb/city if present (before comma)
  const parts = location.split(',');
  if (parts.length > 0) {
    return `${parts[0].trim()} Area`;
  }

  return 'Metro Area';
}

/**
 * Sanitizes data for PDF generation (prevents code injection)
 */
export function sanitizeForPdf(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Escape HTML
  let sanitized = escapeHtml(text);

  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  return sanitized;
}

/**
 * Generates a safe S3/R2 key from user input
 * Combines sanitization with timestamp and random suffix for uniqueness
 */
export function generateSafeStorageKey(
  prefix: string,
  userFilename: string,
  extension: string = '.pdf'
): string {
  const sanitizedPrefix = sanitizeFilename(prefix);
  const sanitizedName = sanitizeFilename(userFilename);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  return `${sanitizedPrefix}/${timestamp}/${sanitizedName}_${randomSuffix}${extension}`;
}

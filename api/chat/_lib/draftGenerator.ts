/**
 * Draft Generator
 *
 * Generates draft content for jobs, incidents, NCRs, etc.
 * based on natural language descriptions.
 */

import type {
  JobDraftParams,
  IncidentDraftParams,
  NCRDraftParams,
  ClassificationResult,
} from '../../../src/types/chat.js';
import { generateCompletion, getAIStatus } from '../../_lib/aiService.js';
import { getDraftGenerationPrompt } from './systemPrompts.js';

/**
 * Generate a job draft from natural language
 */
export async function generateJobDraft(
  params: JobDraftParams
): Promise<{ draft: Record<string, any>; summary: string }> {
  const { description, projectId, division, hints } = params;

  // Try to extract details from description
  const extracted = extractJobDetails(description);

  // Build the draft
  const draft: Record<string, any> = {
    division: division || extracted.division || 'Asphalt',
    location: extracted.location || '',
    workDescription: description,
    jobDate: extracted.date || '',
    area: extracted.area,
    estimatedTonnes: extracted.tonnes,
    ...hints,
  };

  if (projectId) {
    draft.projectId = projectId;
  }

  // Use AI to enhance if available
  const aiStatus = getAIStatus();
  if (aiStatus.configured) {
    try {
      const prompt = `Based on this job description, extract and suggest values:

Description: "${description}"

Return a JSON object with these fields (only include if you can determine):
- division: "Asphalt", "Profiling", or "Spray"
- location: street address or location name
- workDescription: clear work description
- jobDate: YYYY-MM-DD format if a date is mentioned
- area: estimated area in sqm as number
- estimatedTonnes: estimated tonnes as number
- thickness: layer thickness in mm as number

Only include fields you can reasonably determine from the description.`;

      const response = await generateCompletion(prompt, {
        systemPrompt: getDraftGenerationPrompt('job'),
        temperature: 0.3,
        maxTokens: 300,
      });

      // Try to parse JSON from response
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const aiDraft = JSON.parse(jsonMatch[0]);
          Object.assign(draft, {
            ...aiDraft,
            // Keep original description
            workDescription: description,
          });
        }
      } catch {
        // Ignore JSON parse errors
      }
    } catch (error) {
      console.error('[DraftGenerator] AI enhancement failed:', error);
    }
  }

  // Generate summary
  const summary = generateJobSummary(draft);

  return { draft, summary };
}

/**
 * Extract job details using regex patterns
 */
function extractJobDetails(description: string): Record<string, any> {
  const details: Record<string, any> = {};
  const lower = description.toLowerCase();

  // Division
  if (lower.includes('asphalt') || lower.includes('bitumen') || lower.includes('paving')) {
    details.division = 'Asphalt';
  } else if (lower.includes('profil') || lower.includes('mill')) {
    details.division = 'Profiling';
  } else if (lower.includes('spray') || lower.includes('seal') || lower.includes('emulsion')) {
    details.division = 'Spray';
  }

  // Tonnes
  const tonnesMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:tonnes?|t)\b/i);
  if (tonnesMatch) {
    details.tonnes = parseFloat(tonnesMatch[1]);
  }

  // Area
  const areaMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:sqm|m2|m²|square met)/i);
  if (areaMatch) {
    details.area = parseFloat(areaMatch[1]);
  }

  // Thickness
  const thicknessMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:mm|millime)/i);
  if (thicknessMatch) {
    details.thickness = parseFloat(thicknessMatch[1]);
  }

  // Location patterns
  const locationPatterns = [
    /(?:at|on|in)\s+([A-Z][a-zA-Z\s]+(?:Street|Road|Highway|Avenue|Drive|Way|Lane|Crescent))/i,
    /(?:at|on|in)\s+([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z]+)/i,
  ];

  for (const pattern of locationPatterns) {
    const match = description.match(pattern);
    if (match) {
      details.location = match[1].trim();
      break;
    }
  }

  // Date patterns
  const now = new Date();

  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    details.date = tomorrow.toISOString().split('T')[0];
  } else if (lower.includes('next monday')) {
    const nextMonday = getNextWeekday(1);
    details.date = nextMonday.toISOString().split('T')[0];
  } else if (lower.includes('next tuesday')) {
    details.date = getNextWeekday(2).toISOString().split('T')[0];
  } else if (lower.includes('next wednesday')) {
    details.date = getNextWeekday(3).toISOString().split('T')[0];
  } else if (lower.includes('next thursday')) {
    details.date = getNextWeekday(4).toISOString().split('T')[0];
  } else if (lower.includes('next friday')) {
    details.date = getNextWeekday(5).toISOString().split('T')[0];
  }

  // Try date format
  const dateMatch = description.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]) - 1;
    let year = parseInt(dateMatch[3]);
    if (year < 100) year += 2000;
    details.date = new Date(year, month, day).toISOString().split('T')[0];
  }

  return details;
}

/**
 * Get the next occurrence of a weekday
 */
function getNextWeekday(targetDay: number): Date {
  const today = new Date();
  const currentDay = today.getDay();
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) daysToAdd += 7;
  const result = new Date(today);
  result.setDate(today.getDate() + daysToAdd);
  return result;
}

/**
 * Generate job summary text
 */
function generateJobSummary(draft: Record<string, any>): string {
  const parts: string[] = ['Here\'s the job draft I\'ve created:'];

  parts.push(`\n**Division:** ${draft.division || 'Not specified'}`);

  if (draft.location) {
    parts.push(`**Location:** ${draft.location}`);
  }

  if (draft.jobDate) {
    parts.push(`**Date:** ${draft.jobDate}`);
  }

  if (draft.area) {
    parts.push(`**Area:** ${draft.area} sqm`);
  }

  if (draft.estimatedTonnes) {
    parts.push(`**Estimated Tonnes:** ${draft.estimatedTonnes}`);
  }

  if (draft.thickness) {
    parts.push(`**Thickness:** ${draft.thickness}mm`);
  }

  parts.push(`**Work Description:** ${draft.workDescription}`);

  parts.push('\nWould you like me to adjust anything before creating this job?');

  return parts.join('\n');
}

/**
 * Generate an incident draft
 */
export async function generateIncidentDraft(
  params: IncidentDraftParams
): Promise<{ draft: Record<string, any>; summary: string }> {
  const { description, type, severity, location } = params;

  // Extract details from description
  const lower = description.toLowerCase();

  // Determine incident type
  let incidentType = type;
  if (!incidentType) {
    if (lower.includes('injur') || lower.includes('hurt')) {
      incidentType = 'Injury';
    } else if (lower.includes('near miss') || lower.includes('almost')) {
      incidentType = 'Near Miss';
    } else if (lower.includes('damage') || lower.includes('broke')) {
      incidentType = 'Property Damage';
    } else if (lower.includes('spill') || lower.includes('environment')) {
      incidentType = 'Environmental';
    } else {
      incidentType = 'Near Miss';
    }
  }

  // Determine severity
  let incidentSeverity = severity;
  if (!incidentSeverity) {
    if (lower.includes('serious') || lower.includes('hospital') || lower.includes('ambulance')) {
      incidentSeverity = 'Serious';
    } else if (lower.includes('minor') || lower.includes('first aid')) {
      incidentSeverity = 'Minor';
    } else {
      incidentSeverity = 'Moderate';
    }
  }

  const draft: Record<string, any> = {
    type: incidentType,
    severity: incidentSeverity,
    description: description,
    location: location || '',
    dateReported: new Date().toISOString(),
    status: 'Open',
  };

  const summary = `**Incident Draft Created:**

**Type:** ${draft.type}
**Severity:** ${draft.severity}
**Location:** ${draft.location || 'Not specified'}

**Description:**
${draft.description}

Please review and complete the following before submitting:
- Confirm incident details are accurate
- Add any witnesses
- Attach photos if available
- Describe immediate actions taken

Would you like to adjust anything?`;

  return { draft, summary };
}

/**
 * Generate an NCR draft
 */
export async function generateNCRDraft(
  params: NCRDraftParams
): Promise<{ draft: Record<string, any>; summary: string }> {
  const { description, jobId, severity } = params;

  // Determine severity
  let ncrSeverity = severity;
  const lower = description.toLowerCase();
  if (!ncrSeverity) {
    if (lower.includes('major') || lower.includes('critical') || lower.includes('fail')) {
      ncrSeverity = 'Major';
    } else if (lower.includes('minor') || lower.includes('small')) {
      ncrSeverity = 'Minor';
    } else {
      ncrSeverity = 'Moderate';
    }
  }

  const draft: Record<string, any> = {
    description: description,
    severity: ncrSeverity,
    status: 'Open',
    dateRaised: new Date().toISOString(),
  };

  if (jobId) {
    draft.jobId = jobId;
  }

  const summary = `**NCR Draft Created:**

**Severity:** ${draft.severity}
${draft.jobId ? `**Related Job:** ${draft.jobId}` : ''}

**Description:**
${draft.description}

To complete the NCR, please provide:
- Location and extent of non-conformance
- Root cause analysis
- Proposed corrective action
- Preventive measures

Would you like to adjust anything?`;

  return { draft, summary };
}

/**
 * Generate QA pack notes
 */
export async function generateQAPackNotes(
  context: Record<string, any>
): Promise<string> {
  const aiStatus = getAIStatus();

  if (!aiStatus.configured) {
    return 'AI service not available for note generation.';
  }

  try {
    const prompt = `Generate professional QA notes based on this context:

${JSON.stringify(context, null, 2)}

Create a concise summary suitable for a QA pack that covers:
- Work performed
- Key measurements or quantities
- Any issues or variations
- Compliance status

Keep it factual and professional.`;

    const response = await generateCompletion(prompt, {
      systemPrompt: getDraftGenerationPrompt('qa_notes'),
      temperature: 0.5,
      maxTokens: 400,
    });

    return response;
  } catch (error) {
    console.error('[DraftGenerator] Failed to generate QA notes:', error);
    return 'Failed to generate notes. Please enter manually.';
  }
}

/**
 * Handle draft generation based on classification
 */
export async function handleDraftGeneration(
  message: string,
  classification: ClassificationResult
): Promise<{ draft: Record<string, any>; summary: string }> {
  const subIntent = classification.subIntent || 'job';
  const { parameters } = classification;

  switch (subIntent) {
    case 'incident':
      return generateIncidentDraft({
        description: message,
        location: parameters.location,
      });

    case 'ncr':
      return generateNCRDraft({
        description: message,
        jobId: parameters.jobNo,
      });

    case 'job':
    default:
      return generateJobDraft({
        description: message,
        projectId: parameters.projectNo,
        division: parameters.division,
      });
  }
}

export default {
  generateJobDraft,
  generateIncidentDraft,
  generateNCRDraft,
  generateQAPackNotes,
  handleDraftGeneration,
};

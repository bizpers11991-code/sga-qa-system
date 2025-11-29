/**
 * Intent Classifier
 *
 * Classifies user message intent using pattern matching and entity extraction.
 */

import type {
  ChatIntent,
  ClassificationResult,
  ExtractedEntity,
  ConversationContext,
} from '../../../src/types/chat.js';

/**
 * Intent patterns with regex and confidence scores
 */
const INTENT_PATTERNS: Array<{
  intent: ChatIntent;
  patterns: RegExp[];
  confidence: number;
}> = [
  {
    intent: 'DATA_QUERY' as ChatIntent,
    patterns: [
      /\b(show|list|get|find|display|what are|how many|count|search)\b.*\b(jobs?|projects?|incidents?|ncrs?|tenders?|reports?)\b/i,
      /\b(jobs?|projects?|incidents?)\b.*\b(today|tomorrow|this week|scheduled|pending|open)\b/i,
      /\bwhat('s| is) the status\b/i,
      /\bmy (assigned|jobs?|tasks?)\b/i,
      /\boverdue\b/i,
    ],
    confidence: 0.85,
  },
  {
    intent: 'KNOWLEDGE_SEARCH' as ChatIntent,
    patterns: [
      /\b(what is|what's|what are)\b.*\b(spec|specification|requirement|standard)\b/i,
      /\btemp(erature)?\b.*\b(spec|requirement|ac\d{2})\b/i,
      /\bac\d{2}\b.*\b(temp|thickness|spec)\b/i,
      /\bwhat('s| is) the (procedure|process|requirement)\b/i,
      /\b(how to|how do i)\b.*\b(comply|meet|specification)\b/i,
      /\bcompaction\b.*\b(requirement|spec|density)\b/i,
      /\bppe\b.*\brequired\b/i,
    ],
    confidence: 0.8,
  },
  {
    intent: 'DRAFT_CREATE' as ChatIntent,
    patterns: [
      /\b(create|draft|write|help me (create|write|draft)|generate)\b.*\b(job|incident|ncr|report)\b/i,
      /\bcreate a (new )?(job|incident|ncr)\b/i,
      /\bdraft (an? )?(job|incident|report)\b/i,
      /\b(add|schedule) a job\b/i,
    ],
    confidence: 0.85,
  },
  {
    intent: 'HELP' as ChatIntent,
    patterns: [
      /\bhow (do|can|should) (i|we)\b/i,
      /\bwhere (is|can i find|do i)\b/i,
      /\bcan you (explain|show|help)\b/i,
      /\bwhat does\b.*\bmean\b/i,
      /\btutorial\b/i,
      /\bstep by step\b/i,
    ],
    confidence: 0.75,
  },
  {
    intent: 'CLARIFICATION' as ChatIntent,
    patterns: [
      /^(yes|no|correct|right|exactly|that's right|not quite)\b/i,
      /^(the (first|second|third|last) one)\b/i,
      /^(option [a-d1-4])\b/i,
      /^(more details?|tell me more|elaborate)\b/i,
    ],
    confidence: 0.7,
  },
];

/**
 * Entity extraction patterns
 */
const ENTITY_PATTERNS: Array<{
  type: ExtractedEntity['type'];
  patterns: Array<{
    regex: RegExp;
    normalize?: (match: string) => string | Date | number;
  }>;
}> = [
  {
    type: 'job',
    patterns: [
      {
        regex: /\b(job[- ]?(?:no|number|#)?[- ]?)?([A-Z]{2,4}[-]?\d{4}[-]?\d{3,4})\b/i,
        normalize: (match) => match.toUpperCase().replace(/\s/g, ''),
      },
      {
        regex: /\bjob\s+(\d{6,})\b/i,
        normalize: (match) => match,
      },
    ],
  },
  {
    type: 'project',
    patterns: [
      {
        regex: /\b(project[- ]?(?:no|number|#)?[- ]?)?([A-Z]{2,4}[-]?\d{4}[-]?\d{2,4})\b/i,
        normalize: (match) => match.toUpperCase(),
      },
    ],
  },
  {
    type: 'date',
    patterns: [
      {
        regex: /\b(today)\b/i,
        normalize: () => new Date(),
      },
      {
        regex: /\b(tomorrow)\b/i,
        normalize: () => {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          return d;
        },
      },
      {
        regex: /\b(yesterday)\b/i,
        normalize: () => {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          return d;
        },
      },
      {
        regex: /\b(this week)\b/i,
        normalize: () => 'this_week',
      },
      {
        regex: /\b(last week)\b/i,
        normalize: () => 'last_week',
      },
      {
        regex: /\b(next week)\b/i,
        normalize: () => 'next_week',
      },
      {
        regex: /\b(next monday|next tuesday|next wednesday|next thursday|next friday)\b/i,
        normalize: (match) => {
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const targetDay = days.indexOf(match.split(' ')[1].toLowerCase());
          const today = new Date();
          const currentDay = today.getDay();
          let daysToAdd = targetDay - currentDay;
          if (daysToAdd <= 0) daysToAdd += 7;
          today.setDate(today.getDate() + daysToAdd);
          return today;
        },
      },
      {
        regex: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/,
        normalize: (match) => {
          const parts = match.split(/[\/\-]/);
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          let year = parseInt(parts[2]);
          if (year < 100) year += 2000;
          return new Date(year, month, day);
        },
      },
    ],
  },
  {
    type: 'division',
    patterns: [
      {
        regex: /\b(asphalt|profiling|spray)\b/i,
        normalize: (match) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase(),
      },
    ],
  },
  {
    type: 'person',
    patterns: [
      {
        regex: /\b(foreman|supervisor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i,
        normalize: (match) => match,
      },
    ],
  },
  {
    type: 'location',
    patterns: [
      {
        regex: /\bat\s+(.+?)(?:\.|,|$)/i,
        normalize: (match) => match.replace(/^at\s+/i, '').trim(),
      },
      {
        regex: /\bon\s+(.+?(?:street|road|highway|avenue|drive|way))(?:\.|,|\s|$)/i,
        normalize: (match) => match.replace(/^on\s+/i, '').trim(),
      },
    ],
  },
  {
    type: 'number',
    patterns: [
      {
        regex: /\b(\d+(?:\.\d+)?)\s*(tonnes?|t)\b/i,
        normalize: (match) => parseFloat(match.replace(/[^\d.]/g, '')),
      },
      {
        regex: /\b(\d+(?:\.\d+)?)\s*(sqm|square met(?:er|re)s?|m2|m²)\b/i,
        normalize: (match) => parseFloat(match.replace(/[^\d.]/g, '')),
      },
      {
        regex: /\b(\d+(?:\.\d+)?)\s*(mm|millime(?:ter|tre)s?)\b/i,
        normalize: (match) => parseFloat(match.replace(/[^\d.]/g, '')),
      },
    ],
  },
];

/**
 * Extract entities from message
 */
function extractEntities(message: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  for (const { type, patterns } of ENTITY_PATTERNS) {
    for (const { regex, normalize } of patterns) {
      const match = message.match(regex);
      if (match) {
        const value = match[match.length - 1] || match[0]; // Use last capture group or full match
        entities.push({
          type,
          value,
          normalized: normalize ? normalize(value) : value,
          start: match.index,
          end: match.index! + match[0].length,
        });
      }
    }
  }

  return entities;
}

/**
 * Classify user message intent
 */
export function classifyIntent(
  message: string,
  context?: ConversationContext
): ClassificationResult {
  const lowerMessage = message.toLowerCase().trim();

  // Check for patterns
  let bestMatch: { intent: ChatIntent; confidence: number } | null = null;

  for (const { intent, patterns, confidence } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { intent, confidence };
        }
        break;
      }
    }
  }

  // Extract entities
  const entities = extractEntities(message);

  // Build parameters based on entities
  const parameters: Record<string, any> = {};

  for (const entity of entities) {
    if (entity.type === 'division') {
      parameters.division = entity.normalized;
    }
    if (entity.type === 'date') {
      parameters.date = entity.normalized;
    }
    if (entity.type === 'job') {
      parameters.jobNo = entity.normalized;
    }
    if (entity.type === 'project') {
      parameters.projectNo = entity.normalized;
    }
  }

  // Determine entity type for data queries
  if (!bestMatch || bestMatch.intent === ('DATA_QUERY' as ChatIntent)) {
    if (lowerMessage.includes('job')) {
      parameters.entityType = 'job';
    } else if (lowerMessage.includes('project')) {
      parameters.entityType = 'project';
    } else if (lowerMessage.includes('incident')) {
      parameters.entityType = 'incident';
    } else if (lowerMessage.includes('ncr')) {
      parameters.entityType = 'ncr';
    } else if (lowerMessage.includes('tender') || lowerMessage.includes('handover')) {
      parameters.entityType = 'tender';
    }
  }

  // Default to general chat if no pattern matched
  if (!bestMatch) {
    bestMatch = {
      intent: 'GENERAL_CHAT' as ChatIntent,
      confidence: 0.5,
    };
  }

  // Adjust confidence based on context
  if (context?.currentPage) {
    // Boost confidence for context-relevant intents
    if (context.currentPage.includes('job') && parameters.entityType === 'job') {
      bestMatch.confidence = Math.min(bestMatch.confidence + 0.1, 1);
    }
  }

  return {
    intent: bestMatch.intent,
    confidence: bestMatch.confidence,
    entities,
    parameters,
  };
}

/**
 * Get sub-intent for more specific routing
 */
export function getSubIntent(
  message: string,
  mainIntent: ChatIntent
): string | undefined {
  const lowerMessage = message.toLowerCase();

  switch (mainIntent) {
    case 'DATA_QUERY' as ChatIntent:
      if (lowerMessage.includes('count') || lowerMessage.includes('how many')) {
        return 'count';
      }
      if (lowerMessage.includes('status')) {
        return 'status';
      }
      if (lowerMessage.includes('list') || lowerMessage.includes('show')) {
        return 'list';
      }
      if (lowerMessage.includes('detail')) {
        return 'detail';
      }
      break;

    case 'KNOWLEDGE_SEARCH' as ChatIntent:
      if (lowerMessage.includes('temperature') || lowerMessage.includes('temp')) {
        return 'temperature';
      }
      if (lowerMessage.includes('thickness') || lowerMessage.includes('layer')) {
        return 'thickness';
      }
      if (lowerMessage.includes('compaction') || lowerMessage.includes('density')) {
        return 'compaction';
      }
      if (lowerMessage.includes('itp') || lowerMessage.includes('checklist')) {
        return 'itp';
      }
      if (lowerMessage.includes('safety') || lowerMessage.includes('ppe')) {
        return 'safety';
      }
      break;

    case 'DRAFT_CREATE' as ChatIntent:
      if (lowerMessage.includes('job')) {
        return 'job';
      }
      if (lowerMessage.includes('incident')) {
        return 'incident';
      }
      if (lowerMessage.includes('ncr')) {
        return 'ncr';
      }
      break;
  }

  return undefined;
}

export default {
  classifyIntent,
  extractEntities,
  getSubIntent,
};

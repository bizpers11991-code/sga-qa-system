/**
 * Knowledge Base Service
 *
 * Provides search functionality over the static knowledge base
 * using keyword matching and TF-IDF scoring.
 */

import type { KnowledgeEntry, KnowledgeBaseResult } from '../../../src/types/chat.js';
import { KNOWLEDGE_BASE } from './knowledgeData.js';

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Calculate term frequency
 */
function termFrequency(term: string, tokens: string[]): number {
  const count = tokens.filter(t => t === term).length;
  return count / tokens.length;
}

/**
 * Calculate inverse document frequency
 */
function inverseDocumentFrequency(term: string, documents: string[][]): number {
  const docsWithTerm = documents.filter(doc => doc.includes(term)).length;
  if (docsWithTerm === 0) return 0;
  return Math.log(documents.length / docsWithTerm);
}

/**
 * Calculate TF-IDF score
 */
function tfidfScore(queryTokens: string[], docTokens: string[], allDocs: string[][]): number {
  let score = 0;
  for (const term of queryTokens) {
    const tf = termFrequency(term, docTokens);
    const idf = inverseDocumentFrequency(term, allDocs);
    score += tf * idf;
  }
  return score;
}

/**
 * Calculate keyword match score
 */
function keywordMatchScore(queryTokens: string[], entry: KnowledgeEntry): {
  score: number;
  matchedKeywords: string[];
} {
  const matchedKeywords: string[] = [];
  let score = 0;

  for (const keyword of entry.keywords) {
    const keywordLower = keyword.toLowerCase();
    for (const token of queryTokens) {
      if (keywordLower.includes(token) || token.includes(keywordLower)) {
        matchedKeywords.push(keyword);
        score += 2; // Keyword matches are weighted higher
        break;
      }
    }
  }

  // Check question match
  const questionTokens = tokenize(entry.question);
  const questionMatches = queryTokens.filter(t => questionTokens.includes(t)).length;
  score += questionMatches * 0.5;

  return { score, matchedKeywords };
}

/**
 * Search the knowledge base
 */
export function searchKnowledge(query: string, limit: number = 3): KnowledgeBaseResult[] {
  if (!query.trim()) {
    return [];
  }

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return [];
  }

  // Prepare documents for TF-IDF
  const allDocTokens = KNOWLEDGE_BASE.map(entry =>
    tokenize(`${entry.question} ${entry.answer} ${entry.keywords.join(' ')}`)
  );

  // Score each entry
  const scored: Array<{
    entry: KnowledgeEntry;
    score: number;
    matchedKeywords: string[];
  }> = [];

  for (let i = 0; i < KNOWLEDGE_BASE.length; i++) {
    const entry = KNOWLEDGE_BASE[i];
    const docTokens = allDocTokens[i];

    // Calculate TF-IDF score
    const tfidf = tfidfScore(queryTokens, docTokens, allDocTokens);

    // Calculate keyword match score
    const { score: keywordScore, matchedKeywords } = keywordMatchScore(queryTokens, entry);

    // Combined score
    const totalScore = tfidf + keywordScore;

    if (totalScore > 0) {
      scored.push({
        entry,
        score: totalScore,
        matchedKeywords,
      });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Return top results
  return scored.slice(0, limit).map(item => ({
    entry: item.entry,
    score: Math.min(item.score / 5, 1), // Normalize to 0-1
    matchedKeywords: item.matchedKeywords,
    snippet: extractSnippet(item.entry.answer, queryTokens),
  }));
}

/**
 * Extract a relevant snippet from the answer
 */
function extractSnippet(answer: string, queryTokens: string[]): string {
  const lines = answer.split('\n').filter(l => l.trim());

  // Find the most relevant line
  let bestLine = lines[0];
  let bestScore = 0;

  for (const line of lines) {
    const lineTokens = tokenize(line);
    const matches = queryTokens.filter(t => lineTokens.includes(t)).length;
    if (matches > bestScore) {
      bestScore = matches;
      bestLine = line;
    }
  }

  // Truncate if too long
  if (bestLine.length > 200) {
    return bestLine.substring(0, 200) + '...';
  }

  return bestLine;
}

/**
 * Get a specific knowledge entry by ID
 */
export function getKnowledgeById(id: string): KnowledgeEntry | null {
  return KNOWLEDGE_BASE.find(entry => entry.id === id) || null;
}

/**
 * Get entries by category
 */
export function getKnowledgeByCategory(
  category: KnowledgeEntry['category']
): KnowledgeEntry[] {
  return KNOWLEDGE_BASE.filter(entry => entry.category === category);
}

/**
 * Format knowledge results for chat response
 */
export function formatKnowledgeResponse(results: KnowledgeBaseResult[]): string {
  if (results.length === 0) {
    return "I don't have specific information about that in my knowledge base. Try asking about:\n" +
      "- Temperature specifications (AC10, AC14, AC20)\n" +
      "- ITP checklist requirements\n" +
      "- QA pack contents and submission\n" +
      "- Safety procedures and PPE";
  }

  const best = results[0];
  let response = best.entry.answer;

  // Add source attribution
  if (best.entry.source) {
    response += `\n\n*Source: ${best.entry.source}*`;
  }

  // If confidence is low, add disclaimer
  if (best.score < 0.5) {
    response += "\n\n*Note: This may not be exactly what you're looking for. Feel free to ask a more specific question.*";
  }

  return response;
}

export default {
  searchKnowledge,
  getKnowledgeById,
  getKnowledgeByCategory,
  formatKnowledgeResponse,
};

/**
 * @file Heuristics for client-side video classification.
 */

// Placeholder for keyword-based heuristics
const POSITIVE_KEYWORDS = ['educational', 'tutorial', 'documentary', 'science', 'learning'];
const NEGATIVE_KEYWORDS = ['prank', 'challenge', 'reacts', 'unboxing', 'gaming'];

// Placeholder for duration-based heuristics
const DURATION_HEURISTICS = {
  MIN_DURATION_SEC: 60, // At least 1 minute
  MAX_DURATION_SEC: 3600, // At most 1 hour
};

/**
 * Analyzes video metadata using client-side heuristics.
 * @param {object} metadata - The video metadata.
 * @returns {object} A decision object.
 */
export const analyzeHeuristics = (metadata) => {
  const { title, descriptionSnippet, durationSec } = metadata;
  const decision = {
    isDecisive: false,
    reason: 'No heuristic matched',
    confidence: 0.5,
  };

  // Duration heuristics
  if (durationSec < DURATION_HEURISTICS.MIN_DURATION_SEC || durationSec > DURATION_HEURISTICS.MAX_DURATION_SEC) {
    decision.isDecisive = true;
    decision.reason = 'Duration out of range';
    decision.confidence = 0.8;
    return decision;
  }

  const lowerCaseTitle = title.toLowerCase();
  const lowerCaseDescription = descriptionSnippet ? descriptionSnippet.toLowerCase() : '';

  // Positive keywords
  for (const keyword of POSITIVE_KEYWORDS) {
    if (lowerCaseTitle.includes(keyword) || lowerCaseDescription.includes(keyword)) {
      decision.isDecisive = true;
      decision.reason = `Positive keyword found: ${keyword}`;
      decision.confidence = 0.7;
      return decision;
    }
  }

  // Negative keywords
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lowerCaseTitle.includes(keyword) || lowerCaseDescription.includes(keyword)) {
      decision.isDecisive = true;
      decision.reason = `Negative keyword found: ${keyword}`;
      decision.confidence = 0.9;
      return decision;
    }
  }

  return decision;
};

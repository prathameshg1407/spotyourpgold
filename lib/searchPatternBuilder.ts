/**
 * Search pattern builder utilities for MongoDB regex queries
 */

// Common Indian location suffixes
export const LOCATION_SUFFIXES = [
  'nagar', 'road', 'marg', 'path', 'colony', 'vihar', 
  'puram', 'enclave', 'extension', 'chowk', 'ganj', 
  'bagh', 'peth', 'square', 'circle', 'sector', 'town'
];

/**
 * Normalize string by removing spaces and converting to lowercase
 */
export function normalizeSearchTerm(term: string): string {
  return term.toLowerCase().replace(/\s+/g, "");
}

/**
 * Build word-boundary aware regex pattern
 * Handles cases like "tilaknagar" matching "Tilak Nagar"
 */
export function buildWordBoundaryPattern(query: string): string {
  const normalized = normalizeSearchTerm(query);
  
  // Check for location suffixes
  for (const suffix of LOCATION_SUFFIXES) {
    if (normalized.endsWith(suffix)) {
      const prefix = normalized.slice(0, -suffix.length);
      if (prefix.length > 0) {
        // Return pattern like "tilak\s*nagar"
        return `${prefix}\\s*${suffix}`;
      }
    }
  }
  
  // Fallback to character-spaced pattern
  return query.split("").join("\\s*");
}

/**
 * Build multiple regex patterns for comprehensive matching
 */
export function buildSearchPatterns(query: string): string[] {
  const patterns: string[] = [];
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const normalized = normalizeSearchTerm(query);
  
  // 1. Exact pattern (case-insensitive)
  patterns.push(escapedQuery);
  
  // 2. Word-boundary pattern for compound names
  const wordBoundary = buildWordBoundaryPattern(query);
  if (wordBoundary !== escapedQuery) {
    patterns.push(wordBoundary);
  }
  
  // 3. Character-spaced pattern (very fuzzy)
  const charSpaced = query.split("").join("\\s*");
  if (charSpaced !== wordBoundary && patterns.length < 3) {
    patterns.push(charSpaced);
  }
  
  return patterns;
}

/**
 * Build MongoDB $or conditions for multiple patterns on a field
 */
export function buildFieldPatterns(field: string, patterns: string[]): any[] {
  return patterns.map(pattern => ({
    [field]: { $regex: pattern, $options: "i" }
  }));
}
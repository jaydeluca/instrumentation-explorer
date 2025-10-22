/**
 * Utility functions for semantic convention display names and grouping
 */

/**
 * Maps semantic convention categories to display names
 * Takes raw formats like "HTTP_CLIENT_SPANS" and groups them into "HTTP"
 */
export function getSemanticConventionDisplayName(semconv: string): string {
  // Define the mapping from raw semantic conventions to display names
  const mappings: Record<string, string> = {
    // HTTP patterns
    'HTTP_CLIENT': 'HTTP',
    'HTTP_SERVER': 'HTTP',
    'HTTP': 'HTTP',
    
    // Client patterns
    'CLIENT': 'Client',
    
    // Database patterns
    'DATABASE_CLIENT': 'Database Client',
    'DATABASE': 'Database Client',
    'CASSANDRA': 'Cassandra',
    
    // Messaging patterns
    'MESSAGING': 'Messaging',
    
    // AWS patterns
    'AWS': 'Aws',
    
    // RPC patterns
    'RPC': 'Rpc',
    
    // Cloud patterns
    'CLOUD': 'Cloud',
    
    // Gen AI patterns
    'GEN_AI': 'Gen Ai',
    'GENAI': 'Gen Ai',
    
    // Network patterns
    'NETWORK': 'Network',
    
    // Code patterns
    'CODE': 'Code',
    
    // GraphQL patterns
    'GRAPHQL': 'Graphql',
    
    // Thread patterns
    'THREAD': 'Thread',
    
    // System patterns
    'SYSTEM': 'System',
  };

  // Convert to uppercase and remove common suffixes
  const normalized = semconv
    .toUpperCase()
    .replace(/_SPANS?$/, '')
    .replace(/_METRICS?$/, '')
    .replace(/_EVENTS?$/, '');

  // Try exact match first
  if (mappings[normalized]) {
    return mappings[normalized];
  }

  // Try partial matches
  for (const [key, displayName] of Object.entries(mappings)) {
    if (normalized.includes(key)) {
      return displayName;
    }
  }

  // Fallback: capitalize first letter and lowercase rest
  return semconv.charAt(0).toUpperCase() + semconv.slice(1).toLowerCase();
}

/**
 * Groups semantic conventions and returns unique display names
 * Takes an array like ["HTTP_CLIENT_SPANS", "HTTP_SERVER_METRICS"]
 * and returns ["HTTP"]
 */
export function groupSemanticConventions(semconvs: string[]): string[] {
  const displayNames = new Set<string>();
  
  for (const semconv of semconvs) {
    displayNames.add(getSemanticConventionDisplayName(semconv));
  }
  
  return Array.from(displayNames).sort();
}

/**
 * Get all unique semantic convention display names from a list of libraries
 */
export function extractUniqueSemanticConventionDisplayNames(
  allSemconvs: string[]
): string[] {
  return groupSemanticConventions(allSemconvs);
}


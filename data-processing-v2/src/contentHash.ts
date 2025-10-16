import { createHash } from 'crypto';
import { InstrumentationData } from './types.js';

/**
 * Computes a content hash for instrumentation data using SHA-256.
 * Returns the first 12 characters of the hash.
 * 
 * The data is normalized before hashing to ensure identical content
 * produces identical hashes:
 * 1. Object keys are sorted alphabetically
 * 2. JSON is minified (no whitespace)
 * 3. Consistent field ordering
 * 
 * @param data The instrumentation data to hash
 * @returns A 12-character hash string
 */
export function contentHash(data: InstrumentationData): string {
  // Normalize the data by sorting keys recursively
  const normalized = normalizeForHashing(data);
  
  // Convert to stable JSON string
  const json = JSON.stringify(normalized);
  
  // Compute SHA-256 hash and return first 12 chars
  return createHash('sha256')
    .update(json)
    .digest('hex')
    .slice(0, 12);
}

/**
 * Recursively sorts object keys to ensure consistent hashing.
 * Arrays and primitive values are preserved as-is.
 */
function normalizeForHashing(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => normalizeForHashing(item));
  }
  
  if (typeof obj === 'object') {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
      sorted[key] = normalizeForHashing(obj[key]);
    }
    
    return sorted;
  }
  
  return obj;
}

/**
 * Validates that a hash is in the correct format (12 hex characters)
 */
export function isValidHash(hash: string): boolean {
  return /^[0-9a-f]{12}$/.test(hash);
}




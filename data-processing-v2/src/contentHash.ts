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

/**
 * Creates a filename with ID prefix and content hash.
 * Format: {id}-{hash}.{extension}
 *
 * @param id The instrumentation identifier
 * @param hash The 12-character content hash
 * @param extension File extension (e.g., 'json', 'md')
 * @returns Filename in format: id-hash.extension
 *
 * @example
 * createFilename('aws-sdk-1.11', '48c8b39bee75', 'json')
 * // Returns: 'aws-sdk-1.11-48c8b39bee75.json'
 */
export function createFilename(id: string, hash: string, extension: string): string {
  return `${id}-${hash}.${extension}`;
}

/**
 * Computes a content hash for string content (e.g., markdown) using SHA-256.
 * Returns the first 12 characters of the hash.
 *
 * This matches the Python implementation in update-library-readmes.py.
 *
 * @param content The string content to hash
 * @returns A 12-character hash string
 *
 * @example
 * contentHashString('# README\n\nContent here')
 * // Returns: '7a2e91fc0123' (example)
 */
export function contentHashString(content: string): string {
  return createHash('sha256')
    .update(content, 'utf-8')
    .digest('hex')
    .slice(0, 12);
}




/**
 * Utility functions for handling version selection and sorting
 */

/**
 * Compares two version strings numerically (e.g., "2.17" vs "3.0")
 * Returns:
 * - negative number if a < b
 * - positive number if a > b  
 * - 0 if a === b
 */
export function compareVersions(a: string, b: string): number {
  // Handle special cases
  if (a === b) return 0;
  if (a === "latest") return 1;
  if (b === "latest") return -1;
  
  // Split versions into parts and compare numerically
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  const maxLength = Math.max(aParts.length, bParts.length);
  
  for (let i = 0; i < maxLength; i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    
    if (aPart !== bPart) {
      return aPart - bPart;
    }
  }
  
  return 0;
}

/**
 * Sorts an array of version strings in descending order (newest first)
 */
export function sortVersionsDescending(versions: string[]): string[] {
  return [...versions].sort((a, b) => compareVersions(b, a));
}

/**
 * Gets the latest (highest) version from an array of version strings
 * Prioritizes semantic versions but falls back to "latest" if present
 */
export function getLatestVersion(versions: string[]): string | null {
  if (versions.length === 0) return null;
  
  // If "latest" is present, it takes priority
  if (versions.includes("latest")) {
    return "latest";
  }
  
  // Otherwise, find the highest semantic version
  const sorted = sortVersionsDescending(versions);
  return sorted[0];
}

/**
 * Gets the default version to use in the application
 * Returns the highest version that is NOT "3.0" (since 3.0 is hypothetical)
 * Falls back to latest if no other versions exist
 */
export function getDefaultVersion(versions: string[]): string | null {
  if (versions.length === 0) return null;
  
  // Filter out the hypothetical 3.0 version
  const realVersions = versions.filter(v => v !== "3.0");
  
  if (realVersions.length === 0) {
    // If only 3.0 exists, use it as fallback
    return getLatestVersion(versions);
  }
  
  // Return the latest real version (excluding 3.0)
  return getLatestVersion(realVersions);
}

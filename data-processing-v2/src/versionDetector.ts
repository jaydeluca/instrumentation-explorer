import { readdir } from 'fs/promises';
import { join, basename } from 'path';
import { existsSync } from 'fs';

export interface DetectedVersion {
  version: string;
  yamlPath: string;
  isLatest: boolean;
}

/**
 * Normalize version to x.x.x format
 * Examples: 2.20 -> 2.20.0, 2.21 -> 2.21.0, 3.0 -> 3.0.0
 */
export function normalizeVersion(version: string): string {
  const parts = version.split('.');
  while (parts.length < 3) {
    parts.push('0');
  }
  return parts.join('.');
}

/**
 * Scans the repository for instrumentation-list-*.yaml files and returns version information
 */
export async function detectVersions(repoRoot: string): Promise<DetectedVersion[]> {
  const files = await readdir(repoRoot);
  const yamlFiles = files.filter(f => 
    f.startsWith('instrumentation-list-') && f.endsWith('.yaml')
  );

  const versions: DetectedVersion[] = [];

  for (const file of yamlFiles) {
    // Extract version from filename: instrumentation-list-2.20.yaml -> 2.20
    const match = file.match(/instrumentation-list-(.+)\.yaml$/);
    if (!match) continue;

    // Normalize to x.x.x format
    const version = normalizeVersion(match[1]);
    const yamlPath = join(repoRoot, file);

    versions.push({
      version,
      yamlPath,
      isLatest: false // Will set later
    });
  }

  // Sort versions (semantic version sort)
  versions.sort((a, b) => {
    // Handle special versions like "3.0.0" specially
    if (a.version === '3.0.0') return 1;
    if (b.version === '3.0.0') return -1;
    
    // Parse semantic versions
    const aParts = a.version.split('.').map(Number);
    const bParts = b.version.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = aParts[i] || 0;
      const bVal = bParts[i] || 0;
      
      if (aVal !== bVal) {
        return aVal - bVal;
      }
    }
    
    return 0;
  });

  // Mark the latest stable version (excluding 3.0.0)
  const stableVersions = versions.filter(v => v.version !== '3.0.0');
  if (stableVersions.length > 0) {
    stableVersions[stableVersions.length - 1].isLatest = true;
  }

  return versions;
}

/**
 * Get just the latest version
 */
export async function getLatestVersion(repoRoot: string): Promise<DetectedVersion | null> {
  const versions = await detectVersions(repoRoot);
  return versions.find(v => v.isLatest) || null;
}

/**
 * Get a specific version by version string
 */
export async function getVersion(repoRoot: string, versionStr: string): Promise<DetectedVersion | null> {
  const versions = await detectVersions(repoRoot);
  return versions.find(v => v.version === versionStr) || null;
}

/**
 * Get the N most recent versions (excluding 3.0.0 by default)
 */
export async function getRecentVersions(
  repoRoot: string, 
  count: number,
  include3_0: boolean = false
): Promise<DetectedVersion[]> {
  let versions = await detectVersions(repoRoot);
  
  if (!include3_0) {
    versions = versions.filter(v => v.version !== '3.0.0');
  }
  
  return versions.slice(-count);
}


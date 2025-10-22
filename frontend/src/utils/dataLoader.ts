/**
 * Data loader for V2 content-addressed storage
 * Handles loading index, versions, manifests, and individual instrumentations
 */

import type {
  IndexData,
  VersionsData,
  VersionManifest,
  InstrumentationData,
} from '../types-v2';

const BASE_PATH = '/instrumentation-explorer/data';

// Cache for loaded data
const cache = new Map<string, unknown>();

// Cache for in-flight requests to prevent duplicate fetches
const inflightRequests = new Map<string, Promise<unknown>>();

/**
 * Load the lightweight index (for initial page load and search)
 */
export async function loadIndex(): Promise<IndexData> {
  const cacheKey = 'index';
  
  // Return cached data if available
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as IndexData;
  }

  // Return in-flight request if exists
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey) as Promise<IndexData>;
  }

  // Create new request
  const request = (async () => {
    const response = await fetch(`${BASE_PATH}/index.json`);
    if (!response.ok) {
      throw new Error(`Failed to load index: ${response.statusText}`);
    }

    const data = await response.json();
    cache.set(cacheKey, data);
    inflightRequests.delete(cacheKey);
    return data;
  })();

  inflightRequests.set(cacheKey, request);
  return request;
}

/**
 * Load the versions list
 */
export async function loadVersions(): Promise<VersionsData> {
  const cacheKey = 'versions';
  
  // Return cached data if available
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as VersionsData;
  }

  // Return in-flight request if exists
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey) as Promise<VersionsData>;
  }

  // Create new request
  const request = (async () => {
    const response = await fetch(`${BASE_PATH}/versions.json`);
    if (!response.ok) {
      throw new Error(`Failed to load versions: ${response.statusText}`);
    }

    const data = await response.json();
    cache.set(cacheKey, data);
    inflightRequests.delete(cacheKey);
    return data;
  })();

  inflightRequests.set(cacheKey, request);
  return request;
}

/**
 * Load a version manifest (maps instrumentation IDs to content hashes)
 */
export async function loadVersionManifest(
  version: string
): Promise<VersionManifest> {
  const cacheKey = `manifest-${version}`;
  
  // Return cached data if available
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as VersionManifest;
  }

  // Return in-flight request if exists
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey) as Promise<VersionManifest>;
  }

  // Create new request
  const request = (async () => {
    const response = await fetch(`${BASE_PATH}/versions/${version}.json`);
    if (!response.ok) {
      throw new Error(
        `Failed to load manifest for version ${version}: ${response.statusText}`
      );
    }

    const data = await response.json();
    cache.set(cacheKey, data);
    inflightRequests.delete(cacheKey);
    return data;
  })();

  inflightRequests.set(cacheKey, request);
  return request;
}

/**
 * Load a single instrumentation by content hash
 */
export async function loadInstrumentation(
  hash: string
): Promise<InstrumentationData> {
  const cacheKey = `instrumentation-${hash}`;
  
  // Return cached data if available
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as InstrumentationData;
  }

  // Return in-flight request if exists
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey) as Promise<InstrumentationData>;
  }

  // Create new request
  const request = (async () => {
    const response = await fetch(`${BASE_PATH}/instrumentations/${hash}.json`);
    if (!response.ok) {
      throw new Error(
        `Failed to load instrumentation ${hash}: ${response.statusText}`
      );
    }

    const data = await response.json();
    cache.set(cacheKey, data);
    inflightRequests.delete(cacheKey);
    return data;
  })();

  inflightRequests.set(cacheKey, request);
  return request;
}

/**
 * Load a single instrumentation by ID and version
 */
export async function loadInstrumentationByIdAndVersion(
  id: string,
  version: string
): Promise<InstrumentationData> {
  const manifest = await loadVersionManifest(version);
  const reference = manifest.instrumentations[id];

  if (!reference) {
    throw new Error(
      `Instrumentation ${id} not found in version ${version}`
    );
  }

  return loadInstrumentation(reference.hash);
}

/**
 * Load all instrumentations for a given version
 * (Used when we need all data, e.g., for search/filter)
 */
export async function loadAllInstrumentationsForVersion(
  version: string
): Promise<InstrumentationData[]> {
  const manifest = await loadVersionManifest(version);
  const instrumentationIds = Object.keys(manifest.instrumentations);

  // Load all instrumentations in parallel
  const instrumentations = await Promise.all(
    instrumentationIds.map(async (id) => {
      const reference = manifest.instrumentations[id];
      return loadInstrumentation(reference.hash);
    })
  );

  return instrumentations;
}

/**
 * Load markdown content by hash
 */
export async function loadMarkdown(hash: string): Promise<string> {
  const cacheKey = `markdown-${hash}`;
  
  // Return cached data if available
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as string;
  }

  // Return in-flight request if exists
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey) as Promise<string>;
  }

  // Create new request
  const request = (async () => {
    const response = await fetch(`${BASE_PATH}/markdown/${hash}.md`);
    if (!response.ok) {
      throw new Error(
        `Failed to load markdown ${hash}: ${response.statusText}`
      );
    }

    const content = await response.text();
    cache.set(cacheKey, content);
    inflightRequests.delete(cacheKey);
    return content;
  })();

  inflightRequests.set(cacheKey, request);
  return request;
}

/**
 * Clear the cache (useful for testing or force refresh)
 */
export function clearCache(): void {
  cache.clear();
  inflightRequests.clear();
}


/**
 * Types for V2 content-addressed storage system
 * These types match the output from data-processing-v2
 */

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Lightweight index for browse/search - loaded on initial page load
 */
export interface IndexData {
  generated_at: string;
  latest_version: string;
  instrumentations: IndexInstrumentation[];
}

export interface IndexInstrumentation {
  id: string;
  display_name: string;
  library_group: string;
  description?: string;
  tags?: string[];
  semantic_conventions?: string[];
  features?: string[];
  has_telemetry: boolean;
}

/**
 * List of all available agent versions
 */
export interface VersionsData {
  versions: VersionInfo[];
}

export interface VersionInfo {
  version: string;
  release_date: string;
  manifest_url: string;
  is_latest: boolean;
}

/**
 * Version manifest - maps instrumentation IDs to content hashes
 */
export interface VersionManifest {
  version: string;
  release_date: string;
  agent_version: string;
  instrumentations: Record<string, InstrumentationReference>;
  metadata: {
    total_count: number;
    changed_from_previous?: number;
  };
}

export interface InstrumentationReference {
  hash: string;
  url: string;
}

/**
 * Full instrumentation data - content-addressed by hash
 */
export interface InstrumentationData {
  id: string;
  display_name: string;
  library_group: string;
  description?: string;
  library_link?: string;
  source_path?: string;
  minimum_java_version?: number;
  semantic_conventions?: string[];
  features?: string[];
  scope?: {
    name: string;
  };
  target_versions?: {
    javaagent?: string[];
    library?: string[];
  };
  configurations?: Configuration[];
  telemetry?: TelemetryConfig;
}

export interface Configuration {
  name: string;
  description: string;
  type: string;
  default: string | boolean | number;
}

export interface TelemetryConfig {
  [when: string]: {
    metrics?: Metric[];
    spans?: Span[];
  };
}

export interface Metric {
  name: string;
  description: string;
  type: string;
  unit: string;
  attributes?: Attribute[];
}

export interface Span {
  span_kind: string;
  attributes?: Attribute[];
}

export interface Attribute {
  name: string;
  type: string;
}


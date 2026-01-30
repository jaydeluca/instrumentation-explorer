import { readFile } from 'fs/promises';
import YAML from 'yaml';
import { 
  InstrumentationListYAML,
  InstrumentationYAML,
  InstrumentationData,
  TelemetryConfig
} from './types.js';

/**
 * Parses an instrumentation-list YAML file and returns the structured data
 */
export async function parseYAML(filePath: string): Promise<InstrumentationListYAML> {
  const content = await readFile(filePath, 'utf-8');
  return YAML.parse(content) as InstrumentationListYAML;
}

/**
 * Transforms YAML instrumentation data to our InstrumentationData format
 */
export function transformInstrumentation(
  yamlData: InstrumentationYAML,
  libraryGroup: string
): InstrumentationData {
  const data: InstrumentationData = {
    id: yamlData.name,
    display_name: yamlData.display_name,
    library_group: libraryGroup
  };

  // Add optional fields only if they exist
  if (yamlData.description) {
    data.description = yamlData.description;
  }

  if (yamlData.library_link) {
    data.library_link = yamlData.library_link;
  }

  if (yamlData.source_path) {
    data.source_path = yamlData.source_path;
  }

  if (yamlData.minimum_java_version !== undefined) {
    data.minimum_java_version = yamlData.minimum_java_version;
  }

  if (yamlData.semantic_conventions && yamlData.semantic_conventions.length > 0) {
    data.semantic_conventions = yamlData.semantic_conventions;
  }

  if (yamlData.features && yamlData.features.length > 0) {
    data.features = yamlData.features;
  }

  if (yamlData.disabled_by_default !== undefined) {
    data.disabled_by_default = yamlData.disabled_by_default;
  }

  if (yamlData.scope) {
    data.scope = yamlData.scope;
  }

  // Normalize target versions to format 0.2
  // Priority: use format 0.2 fields if present, otherwise convert from format 0.1
  if (yamlData.javaagent_target_versions) {
    // Format 0.2: use directly
    data.javaagent_target_versions = yamlData.javaagent_target_versions;
  } else if (yamlData.target_versions?.javaagent) {
    // Format 0.1: convert to new format
    data.javaagent_target_versions = yamlData.target_versions.javaagent;
  }

  if (yamlData.has_standalone_library !== undefined) {
    // Format 0.2: use directly
    data.has_standalone_library = yamlData.has_standalone_library;
  } else if (yamlData.target_versions?.library) {
    // Format 0.1: convert to boolean (if library versions exist, has_standalone_library = true)
    data.has_standalone_library = yamlData.target_versions.library.length > 0;
  }

  if (yamlData.configurations && yamlData.configurations.length > 0) {
    data.configurations = yamlData.configurations;
  }

  if (yamlData.telemetry && yamlData.telemetry.length > 0) {
    data.telemetry = transformTelemetry(yamlData.telemetry);
  }

  return data;
}

/**
 * Transforms the telemetry array from YAML into our indexed format
 */
function transformTelemetry(telemetryArray: any[]): TelemetryConfig {
  const telemetry: TelemetryConfig = {};

  for (const config of telemetryArray) {
    const when = config.when || 'default';
    telemetry[when] = {
      metrics: config.metrics || [],
      spans: config.spans || []
    };
  }

  return telemetry;
}

/**
 * Extracts all instrumentations from a parsed YAML file
 */
export function extractInstrumentations(
  yamlData: InstrumentationListYAML
): InstrumentationData[] {
  const instrumentations: InstrumentationData[] = [];

  for (const [libraryGroup, instruments] of Object.entries(yamlData.libraries)) {
    for (const instrument of instruments) {
      instrumentations.push(transformInstrumentation(instrument, libraryGroup));
    }
  }

  return instrumentations;
}

/**
 * Extracts tags from instrumentation data for search/filter
 */
export function extractTags(data: InstrumentationData): string[] {
  const tags = new Set<string>();

  // Add library group as a tag
  tags.add(data.library_group);

  // Extract technology type from description or name
  const lowerName = data.id.toLowerCase();
  const lowerDesc = (data.description || '').toLowerCase();

  // Common technology keywords
  const keywords = [
    'http', 'grpc', 'kafka', 'redis', 'mongodb', 'sql', 'jdbc',
    'spring', 'servlet', 'netty', 'okhttp', 'akka', 'reactor',
    'client', 'server', 'database', 'messaging', 'rpc'
  ];

  for (const keyword of keywords) {
    if (lowerName.includes(keyword) || lowerDesc.includes(keyword)) {
      tags.add(keyword);
    }
  }

  // Add semantic conventions as tags
  if (data.semantic_conventions) {
    for (const sc of data.semantic_conventions) {
      tags.add(sc.toLowerCase());
    }
  }

  return Array.from(tags);
}

/**
 * Checks if instrumentation has telemetry data
 */
export function hasTelemetry(data: InstrumentationData): boolean {
  if (!data.telemetry) {
    return false;
  }

  for (const config of Object.values(data.telemetry)) {
    if ((config.metrics && config.metrics.length > 0) ||
        (config.spans && config.spans.length > 0)) {
      return true;
    }
  }

  return false;
}


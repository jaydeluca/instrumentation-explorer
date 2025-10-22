/**
 * Adapter to convert V2 data format to V1 Library format
 * This allows us to use the new V2 data loader while maintaining compatibility
 * with existing frontend components
 */

import type { Library, Telemetry, Metric as V1Metric, Span as V1Span, Attribute as V1Attribute } from '../types';
import type { InstrumentationData, Metric as V2Metric, Span as V2Span, Attribute as V2Attribute } from '../types-v2';
import { groupSemanticConventions } from './semconvUtils';

/**
 * Convert V2 Attribute to V1 Attribute
 */
function convertAttribute(attr: V2Attribute): V1Attribute {
  return {
    name: attr.name,
    type: attr.type,
    semconv: attr.semconv,
  };
}

/**
 * Convert V2 Metric to V1 Metric
 */
function convertMetric(metric: V2Metric): V1Metric {
  return {
    name: metric.name,
    description: metric.description,
    type: metric.type,
    unit: metric.unit,
    attributes: metric.attributes?.map(convertAttribute) || [],
  };
}

/**
 * Convert V2 Span to V1 Span
 */
function convertSpan(span: V2Span): V1Span {
  return {
    span_kind: span.span_kind,
    attributes: span.attributes?.map(convertAttribute) || [],
  };
}

/**
 * Convert V2 InstrumentationData to V1 Library format
 */
export function convertV2ToV1Library(data: InstrumentationData): Library {
  // Convert telemetry from record to array format
  const telemetry: Telemetry[] | undefined = data.telemetry
    ? Object.entries(data.telemetry).map(([when, config]) => ({
        when,
        metrics: config.metrics?.map(convertMetric),
        spans: config.spans?.map(convertSpan),
      }))
    : undefined;

  // Group semantic conventions to display names
  const groupedSemconv = data.semantic_conventions 
    ? groupSemanticConventions(data.semantic_conventions)
    : undefined;

  return {
    name: data.id,
    display_name: data.display_name,
    library_link: data.library_link,
    description: data.description,
    source_path: data.source_path || '',
    minimum_java_version: data.minimum_java_version,
    scope: data.scope || { name: '' },
    target_versions: data.target_versions,
    telemetry,
    configurations: data.configurations,
    semconv: groupedSemconv,
    // Store markdown hash for lazy loading
    markdown_hash: data.markdown_hash,
    // V2 doesn't have these fields yet, but V1 components might expect them
    technology: undefined,
    type: undefined,
    links: undefined,
    notes: undefined,
    disabled_by_default: undefined,
    markdown_content: undefined,
  };
}

/**
 * Convert array of V2 InstrumentationData to V1 Library array
 */
export function convertV2ArrayToV1Libraries(
  data: InstrumentationData[]
): Library[] {
  return data.map(convertV2ToV1Library);
}

/**
 * Get all unique semantic conventions from index
 */
export function extractSemanticConventions(
  instrumentations: InstrumentationData[]
): string[] {
  const semconvSet = new Set<string>();
  instrumentations.forEach((instr) => {
    if (instr.semantic_conventions) {
      instr.semantic_conventions.forEach((sc) => semconvSet.add(sc));
    }
  });
  return Array.from(semconvSet).sort();
}

/**
 * Get all unique features from index
 */
export function extractFeatures(
  instrumentations: InstrumentationData[]
): string[] {
  const featuresSet = new Set<string>();
  instrumentations.forEach((instr) => {
    if (instr.features) {
      instr.features.forEach((f) => featuresSet.add(f));
    }
  });
  return Array.from(featuresSet).sort();
}


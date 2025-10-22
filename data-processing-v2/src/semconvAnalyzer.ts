/**
 * Semantic Convention Analyzer
 * Analyzes telemetry attributes to determine if they follow OpenTelemetry semantic conventions
 */

import { Attribute, Metric, Span } from './types.js';

interface ConventionMappings {
  metrics: Record<string, string>;
  attributes: Record<string, string>;
}

let cachedMappings: ConventionMappings | null = null;

/**
 * Sets the semantic convention mappings to use for analysis
 */
export function setSemanticConventionMappings(mappings: ConventionMappings): void {
  cachedMappings = mappings;
}

/**
 * Checks if an attribute name follows OpenTelemetry semantic conventions
 */
export function isSemanticConventionAttribute(attributeName: string): boolean {
  if (!cachedMappings) {
    // Fallback: if no mappings loaded, return false
    return false;
  }
  
  return attributeName in cachedMappings.attributes;
}

/**
 * Analyzes an attribute and adds semconv field
 */
export function analyzeAttribute(attr: Attribute): Attribute {
  return {
    ...attr,
    semconv: isSemanticConventionAttribute(attr.name)
  };
}

/**
 * Analyzes all attributes in a metric
 */
export function analyzeMetric(metric: Metric): Metric {
  if (!metric.attributes || metric.attributes.length === 0) {
    return metric;
  }

  return {
    ...metric,
    attributes: metric.attributes.map(analyzeAttribute)
  };
}

/**
 * Analyzes all attributes in a span
 */
export function analyzeSpan(span: Span): Span {
  if (!span.attributes || span.attributes.length === 0) {
    return span;
  }

  return {
    ...span,
    attributes: span.attributes.map(analyzeAttribute)
  };
}


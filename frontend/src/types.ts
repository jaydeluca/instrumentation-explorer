export interface Attribute {
  name: string;
  type: string;
  semconv?: boolean;
}

export interface Metric {
  name: string;
  description: string;
  type: string;
  unit: string;
  attributes: Attribute[];
  semconv?: boolean;
}

export interface Span {
  span_kind: string;
  attributes: Attribute[];
}

export interface Telemetry {
  when: string;
  metrics?: Metric[];
  spans?: Span[];
}

export interface Library {
  name: string;
  description?: string;
  source_path: string;
  minimum_java_version?: number;
  scope: {
    name: string;
  };
  target_versions?: {
    javaagent?: string[];
    library?: string[];
  };
  telemetry?: Telemetry[];
  technology?: string;
  type?: string;
  maturity?: string;
  links?: { [key: string]: string };
  notes?: string;
  disabled_by_default?: boolean;
  configurations?: {
    name: string;
    description: string;
    type: string;
    default: string | boolean | number;
  }[];
  semconv?: string[];
}

export interface DiffResult {
  added: (Metric | Span)[];
  removed: (Metric | Span)[];
  common: {
    base: Metric | Span;
    compare: Metric | Span;
    attributeDiff: {
      added: Attribute[];
      removed: Attribute[];
    }
  }[];
}

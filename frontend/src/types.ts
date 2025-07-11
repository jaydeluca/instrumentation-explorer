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
  telemetry?: {
    when: string;
    metrics?: {
      name: string;
      description: string;
      type: string;
      unit: string;
      attributes: { name: string; type: string; }[];
    }[];
    spans?: {
      span_kind: string;
      attributes: { name: string; type: string; }[];
    }[];
  }[];
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
}

export interface InstrumentationData {
  libraries: { [key: string]: Library[] };
}

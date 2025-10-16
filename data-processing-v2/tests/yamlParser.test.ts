import { describe, it, expect } from 'vitest';
import {
  transformInstrumentation,
  extractInstrumentations,
  extractTags,
  hasTelemetry
} from '../src/yamlParser.js';
import {
  InstrumentationYAML,
  InstrumentationListYAML,
  InstrumentationData
} from '../src/types.js';

describe('transformInstrumentation', () => {
  it('should transform minimal instrumentation', () => {
    const yaml: InstrumentationYAML = {
      name: 'test-1.0',
      display_name: 'Test Library'
    };

    const result = transformInstrumentation(yaml, 'test');

    expect(result).toEqual({
      id: 'test-1.0',
      display_name: 'Test Library',
      library_group: 'test'
    });
  });

  it('should transform complete instrumentation', () => {
    const yaml: InstrumentationYAML = {
      name: 'akka-http-10.0',
      display_name: 'Akka HTTP',
      description: 'HTTP client and server instrumentation',
      library_link: 'https://doc.akka.io/docs/akka-http/current/',
      source_path: 'instrumentation/akka/akka-http-10.0',
      minimum_java_version: 8,
      semantic_conventions: ['HTTP_CLIENT_SPANS', 'HTTP_SERVER_SPANS'],
      features: ['HTTP_ROUTE'],
      scope: {
        name: 'io.opentelemetry.akka-http-10.0'
      },
      target_versions: {
        javaagent: [
          'com.typesafe.akka:akka-http_2.12:[10,)',
          'com.typesafe.akka:akka-http_2.13:[10,)'
        ]
      }
    };

    const result = transformInstrumentation(yaml, 'akka');

    expect(result.id).toBe('akka-http-10.0');
    expect(result.display_name).toBe('Akka HTTP');
    expect(result.library_group).toBe('akka');
    expect(result.description).toBe('HTTP client and server instrumentation');
    expect(result.semantic_conventions).toEqual(['HTTP_CLIENT_SPANS', 'HTTP_SERVER_SPANS']);
    expect(result.features).toEqual(['HTTP_ROUTE']);
    expect(result.scope?.name).toBe('io.opentelemetry.akka-http-10.0');
  });

  it('should transform telemetry data', () => {
    const yaml: InstrumentationYAML = {
      name: 'test-1.0',
      display_name: 'Test',
      telemetry: [
        {
          when: 'default',
          metrics: [
            {
              name: 'http.server.request.duration',
              description: 'Duration of HTTP server requests',
              type: 'HISTOGRAM',
              unit: 's',
              attributes: [
                { name: 'http.request.method', type: 'STRING' },
                { name: 'http.response.status_code', type: 'LONG' }
              ]
            }
          ],
          spans: [
            {
              span_kind: 'SERVER',
              attributes: [
                { name: 'http.request.method', type: 'STRING' }
              ]
            }
          ]
        }
      ]
    };

    const result = transformInstrumentation(yaml, 'test');

    expect(result.telemetry).toBeDefined();
    expect(result.telemetry?.default).toBeDefined();
    expect(result.telemetry?.default.metrics).toHaveLength(1);
    expect(result.telemetry?.default.spans).toHaveLength(1);
    expect(result.telemetry?.default.metrics?.[0].name).toBe('http.server.request.duration');
  });

  it('should handle configurations', () => {
    const yaml: InstrumentationYAML = {
      name: 'test-1.0',
      display_name: 'Test',
      configurations: [
        {
          name: 'otel.instrumentation.test.enabled',
          description: 'Enable test instrumentation',
          type: 'boolean',
          default: true
        }
      ]
    };

    const result = transformInstrumentation(yaml, 'test');

    expect(result.configurations).toHaveLength(1);
    expect(result.configurations?.[0].name).toBe('otel.instrumentation.test.enabled');
  });
});

describe('extractInstrumentations', () => {
  it('should extract all instrumentations from YAML', () => {
    const yaml: InstrumentationListYAML = {
      file_format: '0.1',
      libraries: {
        akka: [
          {
            name: 'akka-actor-2.3',
            display_name: 'Akka Actors'
          },
          {
            name: 'akka-http-10.0',
            display_name: 'Akka HTTP'
          }
        ],
        spring: [
          {
            name: 'spring-boot-3.0',
            display_name: 'Spring Boot'
          }
        ]
      }
    };

    const result = extractInstrumentations(yaml);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('akka-actor-2.3');
    expect(result[0].library_group).toBe('akka');
    expect(result[1].id).toBe('akka-http-10.0');
    expect(result[1].library_group).toBe('akka');
    expect(result[2].id).toBe('spring-boot-3.0');
    expect(result[2].library_group).toBe('spring');
  });

  it('should handle empty libraries', () => {
    const yaml: InstrumentationListYAML = {
      file_format: '0.1',
      libraries: {}
    };

    const result = extractInstrumentations(yaml);
    expect(result).toHaveLength(0);
  });
});

describe('extractTags', () => {
  it('should extract basic tags', () => {
    const data: InstrumentationData = {
      id: 'akka-http-10.0',
      display_name: 'Akka HTTP',
      library_group: 'akka',
      description: 'HTTP client and server instrumentation'
    };

    const tags = extractTags(data);

    expect(tags).toContain('akka');
    expect(tags).toContain('http');
    expect(tags).toContain('client');
    expect(tags).toContain('server');
  });

  it('should extract semantic convention tags', () => {
    const data: InstrumentationData = {
      id: 'test-1.0',
      display_name: 'Test',
      library_group: 'test',
      semantic_conventions: ['HTTP_CLIENT_SPANS', 'HTTP_SERVER_METRICS']
    };

    const tags = extractTags(data);

    expect(tags).toContain('http_client_spans');
    expect(tags).toContain('http_server_metrics');
  });

  it('should extract technology keywords from name', () => {
    const data: InstrumentationData = {
      id: 'kafka-clients-2.6',
      display_name: 'Kafka Clients',
      library_group: 'kafka'
    };

    const tags = extractTags(data);

    expect(tags).toContain('kafka');
  });

  it('should not duplicate tags', () => {
    const data: InstrumentationData = {
      id: 'http-client-1.0',
      display_name: 'HTTP Client',
      library_group: 'http',
      description: 'HTTP client instrumentation',
      semantic_conventions: ['HTTP_CLIENT_SPANS']
    };

    const tags = extractTags(data);
    const httpCount = tags.filter(t => t === 'http').length;
    
    expect(httpCount).toBe(1);
  });
});

describe('hasTelemetry', () => {
  it('should return true for instrumentation with metrics', () => {
    const data: InstrumentationData = {
      id: 'test-1.0',
      display_name: 'Test',
      library_group: 'test',
      telemetry: {
        default: {
          metrics: [
            {
              name: 'test.metric',
              description: 'Test metric',
              type: 'COUNTER',
              unit: '1'
            }
          ]
        }
      }
    };

    expect(hasTelemetry(data)).toBe(true);
  });

  it('should return true for instrumentation with spans', () => {
    const data: InstrumentationData = {
      id: 'test-1.0',
      display_name: 'Test',
      library_group: 'test',
      telemetry: {
        default: {
          spans: [
            {
              span_kind: 'CLIENT'
            }
          ]
        }
      }
    };

    expect(hasTelemetry(data)).toBe(true);
  });

  it('should return false for instrumentation without telemetry', () => {
    const data: InstrumentationData = {
      id: 'test-1.0',
      display_name: 'Test',
      library_group: 'test'
    };

    expect(hasTelemetry(data)).toBe(false);
  });

  it('should return false for empty telemetry', () => {
    const data: InstrumentationData = {
      id: 'test-1.0',
      display_name: 'Test',
      library_group: 'test',
      telemetry: {
        default: {
          metrics: [],
          spans: []
        }
      }
    };

    expect(hasTelemetry(data)).toBe(false);
  });
});




import { describe, it, expect } from 'vitest';
import { contentHash, isValidHash } from '../src/contentHash.js';
import { InstrumentationData } from '../src/types.js';

describe('contentHash', () => {
  const sampleData: InstrumentationData = {
    id: 'akka-http-10.0',
    display_name: 'Akka HTTP',
    library_group: 'akka',
    description: 'HTTP client and server instrumentation',
    semantic_conventions: ['HTTP_CLIENT_SPANS', 'HTTP_SERVER_SPANS'],
    features: ['HTTP_ROUTE'],
    scope: {
      name: 'io.opentelemetry.akka-http-10.0'
    }
  };

  it('should return a 12-character hash', () => {
    const hash = contentHash(sampleData);
    expect(hash).toHaveLength(12);
  });

  it('should return a valid hex hash', () => {
    const hash = contentHash(sampleData);
    expect(isValidHash(hash)).toBe(true);
    expect(/^[0-9a-f]{12}$/.test(hash)).toBe(true);
  });

  it('should produce the same hash for identical data', () => {
    const hash1 = contentHash(sampleData);
    const hash2 = contentHash(sampleData);
    expect(hash1).toBe(hash2);
  });

  it('should produce the same hash regardless of key order', () => {
    const data1 = {
      id: 'test',
      display_name: 'Test',
      library_group: 'test'
    };

    const data2 = {
      library_group: 'test',
      id: 'test',
      display_name: 'Test'
    };

    const hash1 = contentHash(data1 as InstrumentationData);
    const hash2 = contentHash(data2 as InstrumentationData);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different data', () => {
    const data1: InstrumentationData = {
      id: 'test-1',
      display_name: 'Test 1',
      library_group: 'test'
    };

    const data2: InstrumentationData = {
      id: 'test-2',
      display_name: 'Test 2',
      library_group: 'test'
    };

    const hash1 = contentHash(data1);
    const hash2 = contentHash(data2);
    expect(hash1).not.toBe(hash2);
  });

  it('should handle nested objects consistently', () => {
    const data1: InstrumentationData = {
      id: 'test',
      display_name: 'Test',
      library_group: 'test',
      scope: {
        name: 'io.opentelemetry.test'
      },
      target_versions: {
        javaagent: ['com.example:lib:[1.0,)']
      }
    };

    const data2: InstrumentationData = {
      id: 'test',
      display_name: 'Test',
      library_group: 'test',
      target_versions: {
        javaagent: ['com.example:lib:[1.0,)']
      },
      scope: {
        name: 'io.opentelemetry.test'
      }
    };

    const hash1 = contentHash(data1);
    const hash2 = contentHash(data2);
    expect(hash1).toBe(hash2);
  });

  it('should handle arrays in consistent order', () => {
    const data: InstrumentationData = {
      id: 'test',
      display_name: 'Test',
      library_group: 'test',
      semantic_conventions: ['HTTP_CLIENT_SPANS', 'HTTP_SERVER_SPANS'],
      features: ['FEATURE_A', 'FEATURE_B']
    };

    const hash1 = contentHash(data);
    const hash2 = contentHash(data);
    expect(hash1).toBe(hash2);
  });

  it('should handle optional fields', () => {
    const minimal: InstrumentationData = {
      id: 'test',
      display_name: 'Test',
      library_group: 'test'
    };

    const withOptional: InstrumentationData = {
      id: 'test',
      display_name: 'Test',
      library_group: 'test',
      description: 'A test instrumentation'
    };

    const hash1 = contentHash(minimal);
    const hash2 = contentHash(withOptional);
    expect(hash1).not.toBe(hash2);
  });

  it('should handle telemetry data', () => {
    const data: InstrumentationData = {
      id: 'test',
      display_name: 'Test',
      library_group: 'test',
      telemetry: {
        default: {
          metrics: [{
            name: 'http.server.request.duration',
            description: 'Duration of HTTP server requests',
            type: 'HISTOGRAM',
            unit: 's',
            attributes: [
              { name: 'http.request.method', type: 'STRING' },
              { name: 'http.response.status_code', type: 'LONG' }
            ]
          }],
          spans: [{
            span_kind: 'SERVER',
            attributes: [
              { name: 'http.request.method', type: 'STRING' }
            ]
          }]
        }
      }
    };

    const hash = contentHash(data);
    expect(isValidHash(hash)).toBe(true);
  });
});

describe('isValidHash', () => {
  it('should validate correct hashes', () => {
    expect(isValidHash('abc123def456')).toBe(true);
    expect(isValidHash('000000000000')).toBe(true);
    expect(isValidHash('ffffffff9999')).toBe(true);
  });

  it('should reject invalid hashes', () => {
    expect(isValidHash('abc123')).toBe(false); // too short
    expect(isValidHash('abc123def4567890')).toBe(false); // too long
    expect(isValidHash('abc123def45g')).toBe(false); // invalid char
    expect(isValidHash('ABC123DEF456')).toBe(false); // uppercase
    expect(isValidHash('')).toBe(false); // empty
  });
});




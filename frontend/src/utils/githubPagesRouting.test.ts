import { describe, it, expect } from 'vitest';
import { handleGitHubPagesRedirect, createGitHubPagesRedirectUrl } from './githubPagesRouting';

describe('handleGitHubPagesRedirect', () => {
  it('should return null when no p parameter is present', () => {
    const params = new URLSearchParams('version=2.19&other=value');
    const result = handleGitHubPagesRedirect(params);
    expect(result).toBeNull();
  });

  it('should handle redirect with path only', () => {
    const params = new URLSearchParams('p=%2Fanalyze');
    const result = handleGitHubPagesRedirect(params);
    expect(result).toBe('/analyze');
  });

  it('should handle redirect with path and query parameters', () => {
    const params = new URLSearchParams('p=%2Fanalyze&version=2.19&instrumentations=test');
    const result = handleGitHubPagesRedirect(params);
    expect(result).toBe('/analyze?version=2.19&instrumentations=test');
  });

  it('should handle redirect with encoded path containing special characters', () => {
    const params = new URLSearchParams('p=%2Flibrary%2F2.19%2Fapache-httpclient');
    const result = handleGitHubPagesRedirect(params);
    expect(result).toBe('/library/2.19/apache-httpclient');
  });

  it('should handle complex instrumentation URL from the issue', () => {
    const base64Instrumentations = 'YXBhY2hlLWh0dHBjbGllbnQsZXhlY3V0b3JzLGhpa2FyaWNwLTMuMCxodHRwLXVybC1jb25uZWN0aW9uLGphdmEtaHR0cC1jbGllbnQsamF2YS1odHRwLXNlcnZlcixqZGJjLGthZmthLGxvZ2JhY2ssbWljcm9tZXRlcixybWksc3ByaW5nLHRvbWNhdA==';
    // URLSearchParams automatically URL-encodes the = signs in base64, so we need to expect the encoded version
    const params = new URLSearchParams(`p=%2Fanalyze&instrumentations=${base64Instrumentations}&version=2.19`);
    const result = handleGitHubPagesRedirect(params);
    // The result will have URL-encoded = signs (%3D%3D instead of ==)
    expect(result).toBe(`/analyze?instrumentations=${encodeURIComponent(base64Instrumentations)}&version=2.19`);
  });

  it('should not modify the original URLSearchParams object', () => {
    const params = new URLSearchParams('p=%2Fanalyze&version=2.19');
    const originalSize = params.size;
    handleGitHubPagesRedirect(params);
    expect(params.size).toBe(originalSize);
    expect(params.has('p')).toBe(true);
  });
});

describe('createGitHubPagesRedirectUrl', () => {
  it('should create redirect URL with path only', () => {
    const result = createGitHubPagesRedirectUrl('/instrumentation-explorer/', '/analyze');
    expect(result).toBe('/instrumentation-explorer/?p=%2Fanalyze');
  });

  it('should create redirect URL with path and search params', () => {
    const result = createGitHubPagesRedirectUrl(
      '/instrumentation-explorer/', 
      '/analyze', 
      '?version=2.19&instrumentations=test'
    );
    expect(result).toBe('/instrumentation-explorer/?p=%2Fanalyze&version=2.19&instrumentations=test');
  });

  it('should create redirect URL with path, search params, and hash', () => {
    const result = createGitHubPagesRedirectUrl(
      '/instrumentation-explorer/', 
      '/analyze', 
      '?version=2.19',
      '#section1'
    );
    expect(result).toBe('/instrumentation-explorer/?p=%2Fanalyze&version=2.19#section1');
  });

  it('should handle search params without leading question mark', () => {
    const result = createGitHubPagesRedirectUrl(
      '/instrumentation-explorer/', 
      '/analyze', 
      'version=2.19&instrumentations=test'
    );
    expect(result).toBe('/instrumentation-explorer/?p=%2Fanalyze&version=2.19&instrumentations=test');
  });

  it('should create redirect URL matching the real-world scenario', () => {
    const base64Instrumentations = 'YXBhY2hlLWh0dHBjbGllbnQsZXhlY3V0b3JzLGhpa2FyaWNwLTMuMCxodHRwLXVybC1jb25uZWN0aW9uLGphdmEtaHR0cC1jbGllbnQsamF2YS1odHRwLXNlcnZlcixqZGJjLGthZmthLGxvZ2JhY2ssbWljcm9tZXRlcixybWksc3ByaW5nLHRvbWNhdA==';
    const result = createGitHubPagesRedirectUrl(
      '/instrumentation-explorer/', 
      '/analyze', 
      `?instrumentations=${base64Instrumentations}&version=2.19`
    );
    expect(result).toBe(`/instrumentation-explorer/?p=%2Fanalyze&instrumentations=${base64Instrumentations}&version=2.19`);
  });
});

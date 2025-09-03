import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleGitHubPagesRedirect } from '../utils/githubPagesRouting';

// Test the redirect logic without importing main.tsx (which has Faro dependencies)
describe('GitHub Pages Redirect Integration Logic', () => {
  let mockReplaceState: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    mockReplaceState = vi.fn();
    
    // Mock window.history
    Object.defineProperty(window, 'history', {
      value: {
        replaceState: mockReplaceState,
      },
      writable: true,
    });
  });

  it('should process redirect parameters correctly', () => {
    const searchParams = new URLSearchParams('?p=%2Fanalyze&version=2.19');
    const redirectedUrl = handleGitHubPagesRedirect(searchParams);
    
    expect(redirectedUrl).toBe('/analyze?version=2.19');
  });

  it('should handle redirect logic with hash', () => {
    const searchParams = new URLSearchParams('?p=%2Fanalyze&version=2.19');
    const redirectedUrl = handleGitHubPagesRedirect(searchParams);
    const hash = '#section1';
    
    if (redirectedUrl) {
      const fullUrl = redirectedUrl + hash;
      mockReplaceState(null, '', fullUrl);
    }
    
    expect(mockReplaceState).toHaveBeenCalledWith(
      null, 
      '', 
      '/analyze?version=2.19#section1'
    );
  });

  it('should not call replaceState when no redirect is needed', () => {
    const searchParams = new URLSearchParams('?version=2.19');
    const redirectedUrl = handleGitHubPagesRedirect(searchParams);
    
    if (redirectedUrl) {
      mockReplaceState(null, '', redirectedUrl);
    }
    
    expect(mockReplaceState).not.toHaveBeenCalled();
  });

  it('should handle the real-world instrumentation URL scenario', () => {
    const base64Instrumentations = 'YXBhY2hlLWh0dHBjbGllbnQsZXhlY3V0b3JzLGhpa2FyaWNwLTMuMCxodHRwLXVybC1jb25uZWN0aW9uLGphdmEtaHR0cC1jbGllbnQsamF2YS1odHRwLXNlcnZlcixqZGJjLGthZmthLGxvZ2JhY2ssbWljcm9tZXRlcixybWksc3ByaW5nLHRvbWNhdA==';
    const searchParams = new URLSearchParams(`?p=%2Fanalyze&instrumentations=${base64Instrumentations}&version=2.19`);
    const redirectedUrl = handleGitHubPagesRedirect(searchParams);
    
    if (redirectedUrl) {
      mockReplaceState(null, '', redirectedUrl);
    }
    
    expect(mockReplaceState).toHaveBeenCalledWith(
      null, 
      '', 
      `/analyze?instrumentations=${encodeURIComponent(base64Instrumentations)}&version=2.19`
    );
  });
});

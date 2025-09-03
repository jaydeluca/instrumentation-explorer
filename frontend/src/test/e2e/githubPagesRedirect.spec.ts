import { test, expect } from '@playwright/test';

test.describe('GitHub Pages Redirect Flow', () => {
  test('should handle direct link to analyze page with instrumentations', async ({ page }) => {
    const base64Instrumentations = 'YXBhY2hlLWh0dHBjbGllbnQsZXhlY3V0b3JzLGhpa2FyaWNwLTMuMCxodHRwLXVybC1jb25uZWN0aW9uLGphdmEtaHR0cC1jbGllbnQsamF2YS1odHRwLXNlcnZlcixqZGJjLGthZmthLGxvZ2JhY2ssbWljcm9tZXRlcixybWksc3ByaW5nLHRvbWNhdA==';
    
    // Simulate what the 404.html script would create as a redirect URL
    const redirectUrl = `/instrumentation-explorer/?p=${encodeURIComponent('/analyze')}&instrumentations=${base64Instrumentations}&version=2.19`;
    
    await page.goto(`http://localhost:4173${redirectUrl}`);
    
    // Wait for the redirect to be processed
    await page.waitForLoadState('domcontentloaded');
    
    // Check that the URL has been corrected by the client-side redirect
    await expect(page).toHaveURL(/\/analyze\?instrumentations=.*&version=2\.19/);
    
    // Verify the analyze page is loaded by checking the URL path
    expect(page.url()).toContain('/analyze');
    expect(page.url()).toContain('instrumentations=');
    expect(page.url()).toContain('version=2.19');
  });

  test('should handle direct link to library detail page', async ({ page }) => {
    const libraryName = 'apache-httpclient';
    const version = '2.19';
    
    // Simulate redirect for library detail page
    const redirectUrl = `/instrumentation-explorer/?p=${encodeURIComponent(`/library/${version}/${libraryName}`)}`;
    
    await page.goto(`http://localhost:4173${redirectUrl}`);
    await page.waitForLoadState('domcontentloaded');
    
    // Check that the URL has been corrected
    await expect(page).toHaveURL(`/library/${version}/${libraryName}`);
    
    // Verify the correct path is in the URL
    expect(page.url()).toContain(`/library/${version}/${libraryName}`);
  });

  test('should handle redirect with hash fragment', async ({ page }) => {
    const redirectUrl = `/instrumentation-explorer/?p=${encodeURIComponent('/analyze')}&version=2.19#results`;
    
    await page.goto(`http://localhost:4173${redirectUrl}`);
    await page.waitForLoadState('domcontentloaded');
    
    // Check that both the path and hash are preserved
    await expect(page).toHaveURL('/analyze?version=2.19#results');
    
    // Verify the URL components
    expect(page.url()).toContain('/analyze');
    expect(page.url()).toContain('version=2.19');
    expect(page.url()).toContain('#results');
  });

  test('should not redirect when no p parameter is present', async ({ page }) => {
    await page.goto('http://localhost:4173/instrumentation-explorer/?version=2.19');
    await page.waitForLoadState('domcontentloaded');
    
    // Should stay on the home page
    await expect(page).toHaveURL('/instrumentation-explorer/?version=2.19');
    
    // Verify we're still on the base path
    expect(page.url()).toContain('/instrumentation-explorer/');
    expect(page.url()).toContain('version=2.19');
  });

  test('should handle about page redirect', async ({ page }) => {
    const redirectUrl = `/instrumentation-explorer/?p=${encodeURIComponent('/about')}`;
    
    await page.goto(`http://localhost:4173${redirectUrl}`);
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL('/about');
    
    // Verify the URL is correct
    expect(page.url()).toContain('/about');
  });
});

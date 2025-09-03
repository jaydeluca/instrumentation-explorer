import { test, expect } from '@playwright/test';

test.describe('GitHub Pages Redirect Flow', () => {
  test('should handle direct link to analyze page with instrumentations', async ({ page }) => {
    const base64Instrumentations = 'YXBhY2hlLWh0dHBjbGllbnQsZXhlY3V0b3JzLGhpa2FyaWNwLTMuMCxodHRwLXVybC1jb25uZWN0aW9uLGphdmEtaHR0cC1jbGllbnQsamF2YS1odHRwLXNlcnZlcixqZGJjLGthZmthLGxvZ2JhY2ssbWljcm9tZXRlcixybWksc3ByaW5nLHRvbWNhdA==';
    
    // Simulate what the 404.html script would create as a redirect URL
    const redirectUrl = `/instrumentation-explorer/?p=${encodeURIComponent('/analyze')}&instrumentations=${base64Instrumentations}&version=2.19`;
    
    await page.goto(`http://localhost:4173${redirectUrl}`);
    
    // Wait for the redirect to be processed and the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the URL has been corrected by the client-side redirect
    await expect(page).toHaveURL(/\/analyze\?instrumentations=.*&version=2\.19/);
    
    // Verify the page content loaded correctly
    await expect(page.locator('h1')).toContainText('JAR Analyzer');
    
    // Verify that the instrumentations were decoded and loaded
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    
    // The base64 should be decoded to the actual instrumentation names
    const expectedInstrumentations = 'apache-httpclient,executors,hikaricp-3.0,http-url-connection,java-http-client,java-http-server,jdbc,kafka,logback,micrometer,rmi,spring,tomcat';
    await expect(textarea).toHaveValue(expectedInstrumentations);
  });

  test('should handle direct link to library detail page', async ({ page }) => {
    const libraryName = 'apache-httpclient';
    const version = '2.19';
    
    // Simulate redirect for library detail page
    const redirectUrl = `/instrumentation-explorer/?p=${encodeURIComponent(`/library/${version}/${libraryName}`)}`;
    
    await page.goto(`http://localhost:4173${redirectUrl}`);
    await page.waitForLoadState('networkidle');
    
    // Check that the URL has been corrected
    await expect(page).toHaveURL(`/library/${version}/${libraryName}`);
    
    // Verify the library detail page loaded
    await expect(page.locator('h1')).toContainText(libraryName);
  });

  test('should handle redirect with hash fragment', async ({ page }) => {
    const redirectUrl = `/instrumentation-explorer/?p=${encodeURIComponent('/analyze')}&version=2.19#results`;
    
    await page.goto(`http://localhost:4173${redirectUrl}`);
    await page.waitForLoadState('networkidle');
    
    // Check that both the path and hash are preserved
    await expect(page).toHaveURL('/analyze?version=2.19#results');
  });

  test('should not redirect when no p parameter is present', async ({ page }) => {
    await page.goto('http://localhost:4173/instrumentation-explorer/?version=2.19');
    await page.waitForLoadState('networkidle');
    
    // Should stay on the home page
    await expect(page).toHaveURL('/instrumentation-explorer/?version=2.19');
    await expect(page.locator('.library-list')).toBeVisible();
  });

  test('should handle about page redirect', async ({ page }) => {
    const redirectUrl = `/instrumentation-explorer/?p=${encodeURIComponent('/about')}`;
    
    await page.goto(`http://localhost:4173${redirectUrl}`);
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL('/about');
    await expect(page.locator('h1')).toContainText('About');
  });
});

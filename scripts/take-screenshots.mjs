// scripts/take-screenshots.mjs
import { spawn } from 'child_process';
import { chromium } from 'playwright';
import http from 'http';
import finalhandler from 'finalhandler';
import serveStatic from 'serve-static';
import path from 'path';

const PORT = 3000;
const BASE_PATH = '/instrumentation-explorer/';
const URL = `http://localhost:${PORT}${BASE_PATH}`;

async function takeScreenshots() {
  const serve = serveStatic('frontend/dist', { 'index': ['index.html'] });

  const server = http.createServer(function onRequest (req, res) {
    let originalUrl = req.url;

    // Adjust URL for serveStatic if it starts with the base path
    if (originalUrl.startsWith(BASE_PATH)) {
      req.url = originalUrl.substring(BASE_PATH.length - 1); // Remove base path, keep leading slash
    }

    serve(req, res, function onNext(err) {
      if (err) {
        finalhandler(req, res)(err);
        return;
      }

      // If serveStatic didn't find a file, serve index.html for client-side routing
      if (!res.headersSent) {
        req.url = '/index.html'; // Serve index.html
        serve(req, res, finalhandler(req, res));
      }
    });
  });

  server.listen(PORT);

  // Wait for the server to be ready
  await new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      http.get(URL, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve();
        }
      }).on('error', () => {
        if (Date.now() - start > 10000) { // 10-second timeout
          clearInterval(interval);
          reject(new Error('Server did not become ready in time.'));
        }
      });
    }, 100); // Check every 100ms
  });

  let browser;
  let page;
  try {
    console.log('Launching browser...');
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1800, height: 2000 });
    
    console.log('Taking home page screenshots...');
    // Navigate to the home page and take a screenshot
    await page.goto(URL);
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForSelector('body', { state: 'visible' });
    await page.screenshot({ path: `screenshots/home.png` });

    await page.selectOption('#theme-select', 'grafana');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.screenshot({ path: `screenshots/home-grafana.png` });

    console.log('Taking Couchbase library screenshots...');
    // Take a full-page screenshot of the Couchbase library page
    await page.selectOption('#theme-select', 'default');
    await page.goto(`${URL}library/2.19/couchbase-2.6`);
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    
    // Wait for page to load and check if comparison selects exist
    try {
      await page.waitForSelector('#base-version-select', { state: 'visible', timeout: 10000 });
      
      // Select options in dropdowns and click compare button
      await page.selectOption('#base-version-select', '2.19');
      await page.selectOption('#compare-version-select', '3.0');
      await page.click('button:has-text("Compare")');

      await page.waitForLoadState('networkidle', { timeout: 60000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log('Comparison selectors not found, taking screenshot without comparison');
    }
    
    await page.screenshot({ path: `screenshots/couchbase-2.6.png`, fullPage: true });

    // Wait for theme selector to be available and switch to Grafana theme
    // First try to expand mobile menu if needed
    try {
      const mobileMenuToggle = await page.locator('.mobile-menu-toggle');
      if (await mobileMenuToggle.isVisible()) {
        await mobileMenuToggle.click();
        await page.waitForTimeout(500); // Wait for animation
      }
    } catch (error) {
      console.log('Mobile menu toggle not found or not needed');
    }
    
    await page.waitForSelector('#theme-select', { state: 'visible', timeout: 30000 });
    await page.selectOption('#theme-select', 'grafana');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.screenshot({ path: `screenshots/couchbase-2.6-grafana.png`, fullPage: true });

    console.log('Taking Alibaba Druid library screenshots...');
    // Take a full-page screenshot of the alibaba-druid-1.0 client library page
    await page.goto(`${URL}library/2.19/alibaba-druid-1.0`);
    
    // First try to expand mobile menu if needed
    try {
      const mobileMenuToggle = await page.locator('.mobile-menu-toggle');
      if (await mobileMenuToggle.isVisible()) {
        await mobileMenuToggle.click();
        await page.waitForTimeout(500); // Wait for animation
      }
    } catch (error) {
      console.log('Mobile menu toggle not found or not needed');
    }
    
    await page.waitForSelector('#theme-select', { state: 'visible', timeout: 30000 });
    await page.selectOption('#theme-select', 'default');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to do comparison if available
    try {
      await page.waitForSelector('#base-version-select', { state: 'visible', timeout: 10000 });
      
      // Select options in dropdowns and click compare button
      await page.selectOption('#base-version-select', '2.19');
      await page.selectOption('#compare-version-select', '3.0');
      await page.click('button:has-text("Compare")');

      await page.waitForLoadState('networkidle', { timeout: 60000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log('Comparison selectors not found for alibaba-druid, taking screenshot without comparison');
    }
    
    await page.screenshot({ path: `screenshots/alibaba-druid.png`, fullPage: true });

    // First try to expand mobile menu if needed
    try {
      const mobileMenuToggle = await page.locator('.mobile-menu-toggle');
      if (await mobileMenuToggle.isVisible()) {
        await mobileMenuToggle.click();
        await page.waitForTimeout(500); // Wait for animation
      }
    } catch (error) {
      console.log('Mobile menu toggle not found or not needed');
    }
    
    await page.waitForSelector('#theme-select', { state: 'visible', timeout: 30000 });
    await page.selectOption('#theme-select', 'grafana');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.screenshot({ path: `screenshots/alibaba-druid-grafana.png`, fullPage: true });

    console.log('Taking Apache DBCP library screenshots with Standalone Library tab...');
    // Take a full-page screenshot of the apache-dbcp-2.0 library page showing the standalone library tab
    await page.goto(`${URL}library/2.18/apache-dbcp-2.0`);
    
    // First try to expand mobile menu if needed
    try {
      const mobileMenuToggle = await page.locator('.mobile-menu-toggle');
      if (await mobileMenuToggle.isVisible()) {
        await mobileMenuToggle.click();
        await page.waitForTimeout(500); // Wait for animation
      }
    } catch (error) {
      console.log('Mobile menu toggle not found or not needed');
    }
    
    await page.waitForSelector('#theme-select', { state: 'visible', timeout: 30000 });
    await page.selectOption('#theme-select', 'default');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    
    // Wait for the tabs to load and click on the "Standalone Library" tab
    try {
      await page.waitForSelector('.tab-navigation', { state: 'visible', timeout: 10000 });
      await page.click('button:has-text("Standalone Library")');
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for tab content to render
    } catch (error) {
      console.log('Standalone Library tab not found, taking screenshot of Details tab');
    }
    
    await page.screenshot({ path: `screenshots/apache-dbcp-standalone.png`, fullPage: true });

    // Switch to Grafana theme for the same library
    await page.waitForSelector('#theme-select', { state: 'visible', timeout: 30000 });
    await page.selectOption('#theme-select', 'grafana');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.screenshot({ path: `screenshots/apache-dbcp-standalone-grafana.png`, fullPage: true });

    console.log('Screenshots completed successfully!');

  } catch (error) {
    console.error('Error during screenshot process:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
    await new Promise(resolve => server.close(resolve));
  }
}

takeScreenshots();
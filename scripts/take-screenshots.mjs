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

const AGENT_VERSION = "2.21.0"

async function takeScreenshots() {
  const serve = serveStatic('frontend/dist', { 'index': ['index.html'] });

  const server = http.createServer(function onRequest (req, res) {
    let originalUrl = req.url;

    // Adjust URL for serveStatic if it starts with the base path
    if (originalUrl.startsWith(BASE_PATH)) {
      req.url = originalUrl.substring(BASE_PATH.length); // Remove base path entirely
      if (!req.url.startsWith('/')) {
        req.url = '/' + req.url; // Ensure leading slash
      }
    }

    const done = finalhandler(req, res);
    serve(req, res, function onNext(err) {
      if (err) {
        done(err);
        return;
      }

      // If serveStatic didn't find a file, serve index.html for client-side routing
      if (!res.headersSent) {
        req.url = '/index.html';
        serve(req, res, done);
      }
    });
  });

  await new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}${BASE_PATH}`);
      resolve();
    });
  });

  let browser;
  let page;
  try {
    const startTime = Date.now();
    const logTime = (label) => console.log(`[${((Date.now() - startTime) / 1000).toFixed(1)}s] ${label}`);
    
    logTime('Launching browser...');
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1800, height: 2000 });
    logTime('Browser ready');
    
    // Block external requests that can cause timeouts (Google Analytics, fonts, etc.)
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.includes('googletagmanager.com') || 
          url.includes('google-analytics.com') ||
          url.includes('fonts.googleapis.com') ||
          url.includes('fonts.gstatic.com')) {
        console.log(`Blocking external request: ${url}`);
        route.abort();
      } else {
        route.continue();
      }
    });
    
    logTime('Taking home page screenshots...');
    // Navigate to the home page
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 5000 });
    // Wait for the library list to render (means data loaded)
    await page.waitForSelector('.library-group', { state: 'visible', timeout: 3000 });
    await page.screenshot({ path: `screenshots/home.png` });
    logTime('Home default screenshot done');

    await page.selectOption('#theme-select', 'grafana');
    await new Promise(resolve => setTimeout(resolve, 300));
    await page.screenshot({ path: `screenshots/home-grafana.png` });
    logTime('Home grafana screenshot done');

    logTime('Taking Couchbase library screenshots...');
    // Take a screenshot of the Couchbase library page
    await page.selectOption('#theme-select', 'default');
    await page.goto(`${URL}library/${AGENT_VERSION}/couchbase-2.6`, { waitUntil: 'domcontentloaded', timeout: 3000 });
    await page.waitForSelector('.library-detail', { state: 'visible', timeout: 2000 });
    await page.screenshot({ path: `screenshots/couchbase-2.6.png` });
    logTime('Couchbase default screenshot done');

    await page.selectOption('#theme-select', 'grafana');
    await new Promise(resolve => setTimeout(resolve, 200));
    await page.screenshot({ path: `screenshots/couchbase-2.6-grafana.png` });
    logTime('Couchbase grafana screenshot done');

    logTime('Taking Alibaba Druid library screenshots...');
    // Take a screenshot of the alibaba-druid-1.0 client library page
    await page.selectOption('#theme-select', 'default');
    await page.goto(`${URL}library/${AGENT_VERSION}/alibaba-druid-1.0`, { waitUntil: 'domcontentloaded', timeout: 3000 });
    await page.waitForSelector('.library-detail', { state: 'visible', timeout: 2000 });
    await page.screenshot({ path: `screenshots/alibaba-druid.png` });
    logTime('Alibaba Druid default screenshot done');

    await page.selectOption('#theme-select', 'grafana');
    await new Promise(resolve => setTimeout(resolve, 200));
    await page.screenshot({ path: `screenshots/alibaba-druid-grafana.png` });
    logTime('Alibaba Druid grafana screenshot done');

    logTime('Taking Apache DBCP library screenshots with Standalone Library tab...');
    // Take a full-page screenshot of the apache-dbcp-2.0 library page showing the standalone library tab
    await page.selectOption('#theme-select', 'default');
    await page.goto(`${URL}library/2.18.0/apache-dbcp-2.0`, { waitUntil: 'domcontentloaded', timeout: 3000 });
    
    // Wait for the tabs to load and click on the "Standalone Library" tab
    try {
      await page.waitForSelector('.tab-navigation', { state: 'visible', timeout: 1000 });
      await page.click('button:has-text("Standalone Library")');
      // Wait for markdown content to render
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log('Standalone Library tab not found, taking screenshot of Details tab');
    }
    
    await page.screenshot({ path: `screenshots/apache-dbcp-standalone.png` });
    logTime('Apache DBCP default screenshot done');

    // Switch to Grafana theme for the same library
    await page.selectOption('#theme-select', 'grafana');
    await new Promise(resolve => setTimeout(resolve, 200));
    await page.screenshot({ path: `screenshots/apache-dbcp-standalone-grafana.png` });
    logTime('Apache DBCP grafana screenshot done');

    logTime('Screenshots completed successfully!');

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
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
  await new Promise(resolve => setTimeout(resolve, 10000));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1800, height: 2000 });

  try {
    // Navigate to the home page and take a screenshot
    await page.goto(URL);
    await page.waitForLoadState('networkidle', { timeout: 60000 }); // Wait for network to be idle with longer timeout
    await new Promise(resolve => setTimeout(resolve, 2000)); // Add a short hard wait
    await page.screenshot({ path: `screenshots/home.png` });

    // Take a full-page screenshot of the ClickHouse client library page
    await page.goto(`${URL}library/2.17/clickhouse-client-0.5`);
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Select options in dropdowns and click compare button
    await page.selectOption('#base-version-select', '2.17');
    await page.selectOption('#compare-version-select', '3.0');
    await page.click('button:has-text("Compare")');

    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: `screenshots/clickhouse-client.png`, fullPage: true });

    // Take a full-page screenshot of the alibaba-druid-1.0 client library page
    await page.goto(`${URL}library/2.17/alibaba-druid-1.0`);
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Select options in dropdowns and click compare button
    await page.selectOption('#base-version-select', '2.17');
    await page.selectOption('#compare-version-select', '3.0');
    await page.click('button:has-text("Compare")');

    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: `screenshots/alibaba-druid.png`, fullPage: true });

  } finally {
    await browser.close();
    server.close(); // Close the http server
  }
}

takeScreenshots();
# Screenshot Testing Plan

This document outlines the plan for implementing automated screenshot testing for the `instrumentation-explorer` project using GitHub Actions and Playwright.

## Goal

For each push to a Pull Request (PR), the GitHub Action will:
1. Build the frontend application.
2. Start a local server for the built application.
3. Access the site using a headless browser (Playwright).
4. Take screenshots of various "scenes" (pages/components) of the application.
5. Add these screenshots to the PR in a commit for visual documentation.

## Project Structure

- `scripts/take-screenshots.mjs`: This file will contain the Playwright script responsible for launching the browser, navigating to pages, and taking screenshots.
- `.github/workflows/screenshots.yml`: This file will define the GitHub Actions workflow that triggers the screenshot process.
- `screenshots/`: This directory will be created by the workflow to store the generated screenshots.

## Implementation Steps

### 1. Create Screenshot Script (`scripts/take-screenshots.mjs`)

- Install Playwright as a dev dependency: `npm install --save-dev playwright`
- Create `scripts/take-screenshots.mjs` with the Playwright code to:
    - Start a local server for the built frontend (`frontend/dist`).
    - Launch a headless browser.
    - Navigate to specified URLs and take screenshots.
    - Stop the server.

### 2. Create GitHub Actions Workflow (`.github/workflows/screenshots.yml`)

- Define a workflow that triggers on `pull_request` events.
- Steps will include:
    - Checking out the code.
    - Setting up Node.js.
    - Installing dependencies (`npm install`).
    - Building the frontend (`npm run build --workspace=frontend`).
    - Creating the `screenshots` directory.
    - Running the `scripts/take-screenshots.mjs` script.
    - Uploading the `screenshots` directory as an artifact.

## Local Validation

Before integrating with GitHub Actions, we will validate the setup locally to ensure:
1. Playwright is correctly installed and configured.
2. The `take-screenshots.mjs` script can successfully:
    - Start the local server.
    - Navigate to the application.
    - Take screenshots and save them to the `screenshots` directory.
3. The frontend build process is working as expected.

## Considerations

- **Error Handling**: Add robust error handling to the screenshot script.
- **Dynamic Pages**: Implement waits for dynamic content to ensure accurate screenshots.
- **Authentication**: If required, add steps for authentication.
- **Cross-browser Testing**: Consider extending to other browsers.
- **Screenshot Naming**: Establish a clear naming convention for screenshots.
- **Commit to PR**: The current plan uploads artifacts. A future step will involve committing these screenshots back to the PR.

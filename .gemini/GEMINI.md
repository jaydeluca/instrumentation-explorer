# Gemini CLI Session Summary

## Project Overview

This project, "instrumentation-explorer," is a web-based tool designed to explore and display information about Java instrumentation libraries. The goal is to provide a clear, searchable, and filterable interface for understanding the capabilities of each library, including the telemetry data they generate (metrics and spans) and their adherence to semantic conventions.

## Current State

The application is in a good state. We have successfully:

*   Set up a React frontend using Vite.
*   Parsed the `instrumentation-list.yaml` file into a JSON format for the frontend.
*   Implemented a main view that displays a list of instrumentation libraries.
*   Added search and filtering capabilities to the main view.
*   Created a detailed view for each library.
*   Integrated semantic convention data from the OpenTelemetry GitHub repository to enrich the instrumentation data.
*   Highlighted semantic conventions in the UI.
*   Made significant styling and UX improvements, including a consistent layout, better data presentation, and a cleaner theme.
*   Added versioning to the instrumentation data, allowing users to switch between different versions of the libraries.
*   Implemented a telemetry version diff tool on the detail page to highlight differences in emitted telemetry between versions.
*   Implemented description truncation on the main list page with a "Show more/Show less" button for expansion, ensuring consistent library container height.
*   Improved the display of telemetry and semantic convention tags with distinct, labeled sections for clarity and better styling.
*   **Fixed GitHub Pages routing**: Implemented client-side routing fix for direct URL access (e.g., `/analyze?instrumentations=...`)
*   **Added comprehensive testing**: Unit tests (Vitest), E2E tests (Playwright), and CI integration for all PRs

## Key Technologies

*   **Frontend:** React, Vite, TypeScript
*   **Data:** YAML, JSON
*   **Styling:** CSS

## Other notes

There are requirement files and other GEMINI resources under the .gemini directory that should be referenced:

.gemini/jar-analyzer.md
.gemini/plan.md
.gemini/requirements.md
.gemini/semconv.md
.gemini/telemetry_delta.md
.gemini/screenshot-testing.md
.gemini/theme-switcher.md

Additionally, see the root-level TESTING.md for comprehensive testing documentation including the GitHub Pages routing fix.

Do not try and run "npm run dev", it does not work for you
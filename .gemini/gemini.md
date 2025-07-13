This file is used to store general information about the project that the Gemini CLI might need to know.

## Project Structure

*   **`enrich_instrumentation_data.py`**: A Python script responsible for fetching semantic convention data from the OpenTelemetry GitHub repository, enriching the `instrumentation-list.yaml` data, and generating `instrumentation-list-enriched.json`.
*   **`frontend/`**: Contains the React frontend application.
    *   **`frontend/src/instrumentation-list-enriched.json`**: The enriched data file used by the frontend.
    *   **`frontend/src/LibraryDetail.tsx`**: React component for displaying detailed library information.
    *   **`frontend/src/LibraryDetail.css`**: CSS for styling the `LibraryDetail` component.

## Development Environment

*   **Python Dependencies**: Managed by `requirements.txt`.
*   **Node.js Dependencies**: Managed by `package.json` and `package-lock.json` (for the frontend).

## Key Learnings

*   **Semantic Convention Data**: The semantic convention data is dynamically fetched from the OpenTelemetry GitHub repository, with caching and GitHub token authentication implemented to handle rate limiting. An allow list is used to process only relevant directories.
*   **Frontend Styling**: The frontend uses CSS for styling. Recent improvements include consistent container widths, side-by-side layouts for related data (metrics/spans, target versions), and a revamped theme for better visual hierarchy and distinct sections.
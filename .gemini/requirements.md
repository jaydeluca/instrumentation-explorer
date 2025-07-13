# Project Requirements: Instrumentation Explorer

## Current State (Completed Features):

*   **Project Scaffolding:** A React application initialized with Vite.
*   **Data Loading and Parsing:** A script successfully parses `instrumentation-list.yaml` into a JSON format (`instrumentation-list.json`) consumable by the frontend.
*   **Library List View:** Displays a list of all instrumentation libraries with their names and descriptions.
*   **Search and Filter Functionality:** Users can search and filter the library list by name, semantic convention, telemetry type (spans/metrics), and target version (javaagent/library). Filters are additive.
*   **Library Detail View:** A dedicated page/component displays detailed information for a selected library, including all fields from the YAML data.
*   **UI Enhancement - Centering Container:** The main application container is now centered for improved visual balance.
*   **UI Enhancement - Configuration Data Display:** Configuration data in the Library Detail View is now presented using a table format.
*   **UI Enhancement - Telemetry Data Display:** A toggle mechanism has been implemented for displaying telemetry data based on the `when` condition, showing only one at a time.
*   **UI Enhancement - Consistent Card Sizing:** Standardized the height of library cards on the main page and truncated long descriptions to create a uniform and clean grid layout.
*   **UI Enhancement - Improved Telemetry View:** Enhanced the Telemetry Detail View by visually separating Metrics and Spans into distinct sections for better readability.
*   **UI Enhancement - Styled Telemetry Attributes:** Improved the styling of telemetry attributes by highlighting metric names and span kinds, and presenting attributes in a more structured and visually appealing format.
*   **Semantic Convention Integration:**
    *   **Data Enrichment:** A script fetches semantic convention data from the OpenTelemetry GitHub repository and enriches the instrumentation data with this information.
    *   **UI Highlighting:** The UI now highlights metrics and attributes that adhere to semantic conventions using a green checkmark. A key has been added to the UI to explain the meaning of the checkmark.

*   **Backend Enhancements (Semantic Convention Data Fetching):**
    *   Dynamic fetching of semantic conventions from GitHub subdirectories.
    *   Caching mechanism for semantic convention files to prevent rate limiting.
    *   GitHub token authentication for API requests.
    *   Allow list for semantic convention directories to process only relevant data.

*   **Frontend Styling and Layout Improvements:**
    *   Consistent width (80%) for the library detail view container.
    *   Side-by-side display for metric and span telemetry data.
    *   Comprehensive theme revamp for a cleaner, more distinct, and hierarchically appropriate layout.
    *   Side-by-side display for Javaagent and Library target versions.

## Future State (New features)
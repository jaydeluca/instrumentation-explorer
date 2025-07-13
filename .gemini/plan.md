# Instrumentation Explorer Project Plan

This plan outlines the steps to build a web-based explorer for Java instrumentation libraries.

## Phase 1: Project Scaffolding & Data Foundation

*   **Step 1.1: Setup Frontend Framework.**
    *   **Action:** Initialize a new React project using Vite. This provides a fast development server and optimized build process.
    *   **Status: COMPLETE**
    *   **Verification:** The development server runs successfully, and a basic "Hello World" page is visible.

*   **Step 1.2: Data Loading and Parsing.**
    *   **Action:** Create a script to parse the `instrumentation-list.yaml` file into a JSON format that can be easily consumed by the frontend application. This script will be run at build time or on the server.
    *   **Status: COMPLETE**
    *   **Verification:** The YAML data is successfully parsed into a structured JSON object without errors.

## Phase 2: Core UI Implementation

*   **Step 2.1: Library List View.**
    *   **Action:** Develop a React component to display the list of all instrumentation libraries. Each item in the list should show the library's name and a brief description.
    *   **Status: COMPLETE**
    *   **Verification:** The application displays a list of libraries from the parsed data.

*   **Step 2.2: Search and Filter Functionality.**
    *   **Action:** Implement a search bar and filtering options (e.g., by name, by technology, by telemetry type, by target version) on the list view.
    *   **Status: COMPLETE**
    *   **Verification:** Users can type in the search bar to filter the list of libraries in real-time. Filters are additive.

*   **Step 2.3: Library Detail View.**
    *   **Action:** Create a new page/component that shows detailed information for a selected library. This includes all fields from the YAML file, presented in a clear and organized manner.
    *   **Status: COMPLETE**
    *   **Verification:** Clicking on a library from the list navigates to its detail page, displaying the correct information.

## Phase 3: Semantic Convention Integration

*   **Step 3.1: Data Enrichment.**
    *   **Action:** Create a script to fetch semantic convention data from the OpenTelemetry GitHub repository and enrich the instrumentation data with this information.
    *   **Status: COMPLETE**
    *   **Verification:** The script successfully fetches and processes the semantic convention data, and the enriched JSON file is generated.

*   **Step 3.2: UI Highlighting.**
    *   **Action:** Update the UI to highlight metrics and attributes that adhere to semantic conventions. This includes adding a visual indicator (e.g., a checkmark) and a key to explain its meaning.
    *   **Status: COMPLETE**
    *   **Verification:** The UI correctly displays the semantic convention information.

## Phase 4: Polishing and Deployment

*   **Step 4.1: Styling and UX Improvements.**
    *   **Action:** Apply CSS styling to make the application visually appealing and user-friendly. This involved:
        *   Ensuring a consistent width for the library detail view container (80% width).
        *   Arranging metric and span telemetry data to display side-by-side.
        *   Implementing a comprehensive theme revamp for a cleaner, more distinct, and hierarchically appropriate layout.
        *   Implementing side-by-side display for Javaagent and Library target versions.
    *   **Status: COMPLETE**
    *   **Verification:** The application has a consistent and polished look and feel.

*   **Step 4.2: Build and Deployment.**
    *   **Action:** Create a production build of the application and document the steps to deploy it.
    *   **Status: IN PROGRESS**
    *   **Verification:** The application is successfully deployed to a hosting service and is publicly accessible.
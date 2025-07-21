# JAR Analyzer Feature

## Feature Overview

The JAR Analyzer feature will provide a dedicated page where users can input a list of Java instrumentation library names and view the consolidated telemetry (metrics and spans) emitted by these libraries. This tool is designed to help users understand the combined observability footprint of a service composed of multiple instrumented components.

## User Experience (UX)

*   **Entry Point:** A prominent link labeled "Analyze Service" will be added to the top right corner of the main application page (`App.tsx`). This link will navigate to the new JAR Analyzer page.

*   **Input Mechanism:**
    *   **Query Parameter (Auto-processing):** The page will support a `?instrumentations` query parameter. If this parameter is present and contains a base64 encoded, comma-separated string of instrumentation names (e.g., `?instrumentations=Y2xpY2tob3VzZS1jbGllbnQtMDUsYWN0aXZlZi1odHRwLTYuMA==`), the application will automatically decode it, fetch the corresponding telemetry, and display it.
    *   **Plaintext Input (Manual):** If no `instrumentations` query parameter is provided, a text area will be displayed, allowing the user to paste a comma-separated list of instrumentation names directly. An "Analyze" button will trigger the telemetry display.

*   **Version Selection:** A version toggle (similar to the existing one on the detail page) will be available on the JAR Analyzer page. This will allow users to select which version of the telemetry data to display for the chosen instrumentations.

*   **Telemetry Display:**
    *   All metrics and spans from the selected instrumentations will be aggregated and displayed.
    *   Each displayed metric or span will clearly indicate which instrumentation library it originated from.
    *   Existing semantic convention highlighting (checkmark) will be maintained for relevant attributes.
    *   The display will be organized for readability, potentially grouping telemetry by instrumentation or by type (metrics/spans).

## Technical Design

### Frontend (React/TypeScript)

*   **Routing:** A new route will be defined in `main.tsx` for the JAR Analyzer page (e.g., `/analyze`).
*   **Component Structure:**
    *   `App.tsx`: Will include the "Analyze Service" link.
    *   `JarAnalyzerPage.tsx`: The main component for the new page, responsible for input handling, data fetching, and orchestrating sub-components.
    *   `InstrumentationInput.tsx`: A sub-component within `JarAnalyzerPage.tsx` to handle the query parameter parsing, base64 decoding, and plaintext input/button.
    *   `CombinedTelemetryDisplay.tsx`: A sub-component to render the aggregated metrics and spans, including their source instrumentation labels.
*   **Data Fetching:** The feature will leverage the existing `instrumentation-list-enriched.json` file. It will filter the data based on the selected instrumentation names and the chosen version.
*   **State Management:** React's `useState` and `useEffect` hooks will be used to manage the input string, selected instrumentations, current version, and the aggregated telemetry data.
*   **Base64 Decoding:** Standard JavaScript `atob()` function will be used for decoding the query parameter.

### Data Processing (within Frontend)

*   **Parsing Input:** The comma-separated list of instrumentation names (from either query parameter or plaintext input) will be parsed into an array of strings.
*   **Telemetry Aggregation:** For each selected instrumentation, its `telemetry` array will be iterated. All `metrics` and `spans` from these telemetry blocks will be collected into separate, consolidated arrays.
*   **Attribution:** When aggregating, each metric and span object will be augmented with a `sourceInstrumentation` property to store the name of the library it came from. This will be used for display.

## Implementation Plan

### Phase 1: Page Setup and Input Handling

1.  **Add new route:** Define a new route in `main.tsx` for `/analyze`.
    *   **Status: COMPLETE**
2.  **Create `JarAnalyzerPage.tsx`:** Scaffold the main component for the new page.
    *   **Status: COMPLETE**
3.  **Add "Analyze Service" link:** Implement the link in `App.tsx` (or a new header component) that navigates to `/analyze`.
    *   **Status: COMPLETE**
4.  **Implement `InstrumentationInput.tsx`:** Create this component to handle:
    *   Reading the `instrumentations` query parameter and decoding it.
    *   Providing a text area for plaintext input if no query parameter is present.
    *   A button to trigger the analysis.
    *   Passing the list of instrumentation names up to `JarAnalyzerPage.tsx`.
    *   **Status: COMPLETE**

### Phase 2: Data Aggregation and Display

1.  **Fetch and filter data:** In `JarAnalyzerPage.tsx`, use the list of instrumentation names and the selected version to fetch and filter the relevant `Library` objects from `instrumentation-list-enriched.json`.
    *   **Status: COMPLETE**
2.  **Implement version toggle:** Add a version selector to `JarAnalyzerPage.tsx` that controls which version of the telemetry data is displayed.
    *   **Status: COMPLETE**
3.  **Aggregate telemetry:** Develop logic in `JarAnalyzerPage.tsx` to combine all metrics and spans from the selected libraries, adding a `sourceInstrumentation` property to each telemetry item.
    *   **Status: COMPLETE**
4.  **Create `CombinedTelemetryDisplay.tsx`:** Develop this component to render the aggregated telemetry.
    *   Group metrics and spans by their `sourceInstrumentation`.
    *   Maintain existing display formats for metrics and spans (including semantic convention highlighting).
    *   **Status: COMPLETE**

### Phase 3: Styling and Refinements

1.  **Apply styling:** Ensure the new page and its components are visually consistent with the rest of the application.
    *   **Status: IN PROGRESS**
2.  **Error Handling:** Implement user-friendly error messages for invalid base64 input, non-existent instrumentations, or data fetching issues.
    *   **Status: NOT STARTED**
3.  **URL Synchronization:** Ensure the version selected in the toggle is reflected in the URL for shareability (optional, but good UX).
    *   **Status: COMPLETE**
    *   **Status: COMPLETE**
    *   **Status: COMPLETE**

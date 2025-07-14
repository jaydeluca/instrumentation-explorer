# Telemetry Version Diff Feature

## Feature Overview

The Telemetry Version Diff feature will provide users with a way to compare the telemetry data (metrics and spans) between two different versions of an instrumentation library. This will allow users to easily identify what has changed between versions, including added, removed, or modified telemetry.

## UI/UX

*   **Version Selection:** Two dropdown menus will be provided on the library detail page to select the "base" and "comparison" versions.
*   **"Compare" Button:** A "Compare" button will trigger the diff calculation and display the results.
*   **Diff Display:** The results will be displayed in a clear, intuitive, GitHub-style diff format:
    *   **Green highlighting:** for added metrics, spans, or attributes.
    *   **Red highlighting:** for removed metrics, spans, or attributes.
    *   **Semantic Convention Highlighting:** Attributes that adhere to semantic conventions will continue to be highlighted with a checkmark (✅) in the diff view.

## Logic

1.  **Data Fetching:** The feature will fetch the data for the two selected versions from the `instrumentation-list-enriched.json` file.
2.  **Diff Calculation:** A diffing algorithm will compare the metrics and spans of the two versions, identifying:
    *   **Added metrics/spans:** Items present in the comparison version but not the base version.
    *   **Removed metrics/spans:** Items present in the base version but not the comparison version.
    *   **Modified metrics/spans:** Items present in both versions but with different attributes.
3.  **Attribute-Level Diff:** For modified metrics and spans, the algorithm will perform a second-level diff on their attributes to identify specific changes.

## Implementation Plan

### Phase 1: Frontend Development

1.  **Create a new React component (`TelemetryDiff.tsx`):** This component will encapsulate the entire diff feature.
    *   **Status: COMPLETE**
2.  **Add version selection dropdowns:** The component will include two dropdowns populated with the available versions.
    *   **Status: COMPLETE**
3.  **Implement the diffing logic:** The component will contain the logic to calculate the diff between the two selected versions.
    *   **Status: COMPLETE**
4.  **Create the diff view:** The component will render the diff results in the specified GitHub-style format.
    *   **Status: COMPLETE**
5.  **Integrate the component:** The `TelemetryDiff` component will be integrated into the `LibraryDetail.tsx` page.
    *   **Status: COMPLETE**

### Phase 2: Styling

1.  **Create a new CSS file (`TelemetryDiff.css`):** This file will contain the styles for the diff view, including the red and green highlighting.
    *   **Status: COMPLETE**
2.  **Apply styles:** The styles will be applied to the `TelemetryDiff` component to ensure a clear and readable presentation of the diff results.
    *   **Status: COMPLETE**

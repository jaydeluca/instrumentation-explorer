# Instrumentation Explorer

This project is a web-based tool designed to explore and display information about Java instrumentation libraries. It provides a clear, searchable, and filterable interface for understanding the capabilities of each library, including the telemetry data they generate (metrics and spans), their adherence to semantic conventions, and changes between different versions.

## Features

*   **Library List View:** Browse a list of all instrumentation libraries.
*   **Search and Filter:** Easily find libraries by name, semantic convention, telemetry type, and target version.
*   **Library Detail View:** View comprehensive information for each library.
*   **Semantic Convention Integration:** See which metrics and attributes adhere to OpenTelemetry semantic conventions.
*   **Versioning:** Switch between different versions of the instrumentation data.
*   **Telemetry Version Diff Tool:** Compare telemetry changes (added, removed, modified metrics and spans, including attribute-level differences) between any two versions of a library.

## Project Structure

*   **`telemetry-processing/`**: Contains the Python script for processing and enriching instrumentation data.
*   **`frontend/`**: Contains the React frontend application.
    *   **`frontend/public/instrumentation-list-enriched.json`**: The enriched data file used by the frontend.

## Running the Project

### 1. Process Instrumentation Data

To generate or update the enriched instrumentation list:

1.  Navigate to the `data-processing` directory:
    ```bash
    cd telemetry-processing
    ```

2.  Follow the instructions in `telemetry-processing/README.md` to set up the Python environment (using `uv`) and run the `main.py` script.

    This will generate `frontend/public/instrumentation-list-enriched.json`.

### 2. Start the Frontend Application

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```

2.  Install Node.js dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

    The application will typically be available at `http://localhost:5173`.

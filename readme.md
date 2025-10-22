# Instrumentation Explorer

This project is a web-based tool designed to explore and display information about Java instrumentation libraries. It
provides a searchable and filterable interface for understanding the capabilities of each library, including the
telemetry data they generate (metrics and spans), their adherence to semantic conventions, and changes between different
versions.

The instrumentation data is automatically kept up to date with the latest releases from the [OpenTelemetry Java Instrumentation](https://github.com/open-telemetry/opentelemetry-java-instrumentation) repository.

<img src="./screenshots/home.png" width="800">

## Features

*   **Library List View:** Browse a list of all instrumentation libraries.
*   **Search and Filter:** Easily find libraries by name, semantic convention, telemetry type, and target version.
*   **Library Detail View:** View comprehensive information for each library.
*   **Semantic Convention Integration:** See which metrics and attributes adhere to OpenTelemetry semantic conventions.
*   **Versioning:** Switch between different versions of the instrumentation data.
*   **Telemetry Version Diff Tool:** Compare telemetry changes (added, removed, modified metrics and spans, including attribute-level differences) between any two versions of a library.
*   **Automated Updates:** Instrumentation data is automatically updated weekly and with new releases.


<img src="./screenshots/couchbase-2.6.png" width="800">


## Project Structure

*   **`data-processing-v2/`**: TypeScript pipeline with content-addressed storage for multi-version support (current).
*   **`data-processing/`**: Legacy Python script (V1, deprecated).
*   **`frontend/`**: React frontend application.
   *   **`frontend/public/data/`**: V2 content-addressed data (multi-version, deduplicated).
*   **`scripts/`**: Automation scripts for updating instrumentation data.
*   **`.github/workflows/`**: GitHub Actions workflows for automated updates.
*   **`instrumentation-list-*.yaml`**: Versioned instrumentation data files from OpenTelemetry.

## Automated Updates

The instrumentation data is automatically kept up to date through:

### GitHub Actions Workflow
- **Weekly Updates**: Runs every Monday at 9 AM UTC
- **Manual Trigger**: Can be triggered manually via GitHub Actions
- **Auto-merge**: Automatically creates PRs with updated data

### Manual Updates
You can also update the instrumentation data manually:

```bash
# Install Python dependencies for the update script
pip install requests pyyaml

# Run the update script
npm run update-instrumentation

# Or run directly
python3 scripts/update-instrumentation-list.py
```

This will:
1. Download the latest instrumentation list from the OpenTelemetry repository
2. Save it with the appropriate version number
3. Run the data processing to generate the enriched JSON file

## Running the Project

### 1. Install Dependencies

```bash
npm install
```

This will install dependencies for both the root workspace and the frontend.

### 2. Process Instrumentation Data (Optional)

The repository includes pre-generated data, but you can regenerate it:

```bash
# Install data processing dependencies
cd data-processing-v2
npm install
cd ..

# Generate and deploy data to frontend
npm run process-data:deploy
```

This generates content-addressed data in `frontend/public/data/` with support for multiple versions.

**Data Processing Commands:**
- `npm run process-data` - Generate data only (stays in `data-processing-v2/dist/output/`)
- `npm run process-data:deploy` - Generate and copy to frontend
- See [`data-processing-v2/README.md`](./data-processing-v2/README.md) for detailed documentation

**V2 Pipeline Features:**
- Content-addressed storage with automatic deduplication (~45% space savings)
- Multi-version support (currently 2.20, 2.21, and 3.0-projected)
- Lazy loading for fast initial page load
- Automatic version detection from YAML files
- Includes projected 3.0 version to demonstrate future breaking changes

### 3. Start the Frontend Application

You can use the npm scripts from the root directory:

```bash
# Install dependencies and start development server
npm install
npm run dev
```

Or manually:

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

## Screenshot automation

There is a github action that will generate screenshots of various scenes for each PR. You can run this locally: 

```
node scripts/take-screenshots.mjs
```
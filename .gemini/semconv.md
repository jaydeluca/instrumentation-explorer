This document outlines the system for pulling in semantic convention information.

## Semantic Convention Data Fetching

The `enrich_instrumentation_data.py` script is responsible for fetching semantic convention data from the OpenTelemetry GitHub repository. Instead of hardcoding URLs, the script now dynamically iterates through a predefined allow list of subdirectories within `https://api.github.com/repos/open-telemetry/semantic-conventions/contents/model/`.

### Features:

*   **Dynamic Directory Iteration:** The script iterates through a `ALLOWED_SEMCONV_DIRS` list to construct URLs for fetching semantic convention YAML files.
*   **Caching:** To prevent rate limiting and improve efficiency, the script implements a caching mechanism. Semantic convention files are first checked in a local cache directory (`./.semconv_cache`). If a file exists in the cache, it's loaded from there; otherwise, it's downloaded from GitHub and then saved to the cache.
*   **GitHub Token Authentication:** To further mitigate rate limiting issues, the script uses a GitHub Personal Access Token for authentication. The token is retrieved from the `GITHUB_TOKEN` environment variable and included in the `Authorization` header of API requests.
*   **Allow List:** Only subdirectories specified in the `ALLOWED_SEMCONV_DIRS` list are processed, ensuring that only relevant semantic convention data is fetched.

### Data Extraction:

From each semantic convention YAML file, the script extracts `metric_name` and `attributes` information. This data is then used to build a mapping that allows for easy checking of whether a particular metric or attribute name falls within a defined semantic convention.

### Integration with Instrumentation Data:

The extracted semantic convention mappings are used to enrich the `instrumentation-list.yaml` data. Metrics and attributes in the instrumentation data that match a semantic convention are flagged. Additionally, a `semconv` classification is added to each instrumentation module, summarizing the applicable conventions (e.g., `Database Client`).

### UI Highlighting:

In the frontend, the UI highlights metrics and attributes that adhere to semantic conventions with a visual indicator (e.g., a checkmark). The `semconv` classification for each instrumentation module is also displayed to provide an overview of the conventions supported.
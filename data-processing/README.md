# Data Processing

This directory contains the Python script responsible for processing and enriching the instrumentation data.

## Setup

1.  **Install `uv`:** If you don't have `uv` installed, you can install it using pip:
    ```bash
    pip install uv
    ```

2.  **Create a virtual environment:** Navigate to this directory and create a virtual environment using `uv`:
    ```bash
    uv venv
    ```

3.  **Activate the virtual environment:**
    *   On macOS/Linux:
        ```bash
        source .venv/bin/activate
        ```
    *   On Windows:
        ```bash
        .venv\Scripts\activate
        ```

4.  **Install dependencies:** Install the required Python packages using `uv`:
    ```bash
    uv pip install -r requirements.txt
    ```

## Usage

To run the data enrichment script, activate the virtual environment (as shown above) and then execute:

```bash
python main.py
```

This script will read the `instrumentation-list-*.yaml` files, enrich them with semantic convention data, and output the combined and enriched JSON to `frontend/public/instrumentation-list-enriched.json`.

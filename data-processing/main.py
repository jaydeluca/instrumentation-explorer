import json
import requests
import yaml
import os

# Constants
BASE_SEMCONV_URL = "https://api.github.com/repos/open-telemetry/semantic-conventions/contents/model"
ALLOWED_SEMCONV_DIRS = [
    "aws",
    "cassandra",
    "client",
    "cloud",
    "code",
    "container",
    "cpu",
    "database",
    "disk",
    "dns",
    "elasticsearch",
    "enduser",
    "error",
    "event",
    "file",
    "gen-ai",
    "graphql",
    "heroku",
    "host",
    "http",
    "jvm",
    "k8s",
    "linux",
    "log",
    "messaging",
    "network",
    "openai",
    "os",
    "peer",
    "process",
    "rpc",
    "server",
    "system",
    "telemetry",
    "thread",
    "tls",
    "url",
]
OUTPUT_FILE = "../frontend/public/instrumentation-list-enriched.json"
CACHE_DIR = "./.semconv_cache"


def get_convention_mappings():
    """
    Fetches semantic conventions from the OpenTelemetry GitHub repository
    and builds a mapping from metric/attribute names to convention types.
    """
    mappings = {"metrics": {}, "attributes": {}}

    headers = {}
    github_token = os.environ.get("GITHUB_TOKEN")
    if github_token:
        headers["Authorization"] = f"token {github_token}"

    os.makedirs(CACHE_DIR, exist_ok=True)

    for conv_type in ALLOWED_SEMCONV_DIRS:
        url = f"{BASE_SEMCONV_URL}/{conv_type}"
        
        conv_type_cache_dir = os.path.join(CACHE_DIR, conv_type)
        os.makedirs(conv_type_cache_dir, exist_ok=True)
        
        # Cache the directory listing as well to avoid API calls
        dir_listing_cache = os.path.join(conv_type_cache_dir, "_directory_listing.json")
        
        if os.path.exists(dir_listing_cache):
            print(f"Loading directory listing for {conv_type} from cache...")
            with open(dir_listing_cache, "r") as f:
                files = json.load(f)
        else:
            try:
                print(f"Fetching directory listing for {conv_type}...")
                response = requests.get(url, headers=headers)
                response.raise_for_status()
                files = response.json()
                # Cache the directory listing
                with open(dir_listing_cache, "w") as f:
                    json.dump(files, f, indent=2)
            except (requests.exceptions.RequestException, ValueError) as e:
                print(f"Error fetching convention files from {url}: {e}")
                continue

        for file in files:
            if not isinstance(file, dict) or not file.get("name", "").endswith(".yaml"):
                continue

            file_name = file["name"]
            download_url = file["download_url"]
            cache_file_path = os.path.join(conv_type_cache_dir, file_name)

            if os.path.exists(cache_file_path):
                print(f"Loading {file_name} from cache...")
                with open(cache_file_path, "r") as f:
                    data = yaml.safe_load(f)
            else:
                try:
                    print(f"Downloading {file_name}...")
                    content_response = requests.get(download_url, headers=headers)
                    content_response.raise_for_status()
                    data = yaml.safe_load(content_response.text)
                    with open(cache_file_path, "w") as f:
                        f.write(content_response.text)
                except (requests.exceptions.RequestException, yaml.YAMLError) as e:
                    print(f"Error fetching or parsing file {file_name}: {e}")
                    continue

            if not data or "groups" not in data:
                continue

            conv_name = ""
            if conv_type == "database":
                conv_name = "Database Client"
            elif conv_type == "http":
                if "client" in file_name:
                    conv_name = "HTTP Client"
                elif "server" in file_name:
                    conv_name = "HTTP Server"
                else:
                    conv_name = "HTTP"
            else:
                conv_name = conv_type.replace('_', ' ').replace('-', ' ').title()

            if not conv_name:
                continue

            for group in data.get("groups", []):
                # Extract metrics
                if group.get("type") == "metric" and "metric_name" in group:
                    mappings["metrics"][group["metric_name"]] = conv_name

                # Extract attributes
                prefix = group.get("prefix", "")
                for attr in group.get("attributes", []):
                    attr_name = ""
                    if "id" in attr:
                        if prefix:
                            attr_name = f"{prefix}.{attr['id']}"
                        else:
                            attr_name = attr['id']
                    elif "ref" in attr:
                        attr_name = attr["ref"]

                    if attr_name and attr_name not in mappings["attributes"]:
                        mappings["attributes"][attr_name] = conv_name

    return mappings


def sort_data_recursively(data):
    """
    Recursively sorts data to ensure deterministic output.
    Sorts dictionary keys and list elements where appropriate.
    """
    if isinstance(data, dict):
        # Sort dictionary by keys and recursively sort values
        return {key: sort_data_recursively(data[key]) for key in sorted(data.keys())}
    elif isinstance(data, list):
        # For lists, sort the elements if they are dictionaries with a 'name' field
        # This ensures consistent ordering of metrics, attributes, spans, etc.
        if data and isinstance(data[0], dict) and 'name' in data[0]:
            # Sort by name field for named objects like metrics, attributes, spans
            sorted_list = sorted(data, key=lambda x: x.get('name', ''))
        else:
            # For other lists (like semconv lists), just sort if all elements are strings
            if data and all(isinstance(item, str) for item in data):
                sorted_list = sorted(data)
            else:
                sorted_list = data
        return [sort_data_recursively(item) for item in sorted_list]
    else:
        return data


def enrich_instrumentation_data(instrumentation_data, mappings):
    """
    Enriches the instrumentation data with semantic convention information.
    """
    enriched_data = []
    libraries = instrumentation_data.get('libraries', {})
    
    # Sort libraries by name for deterministic processing
    for library_name in sorted(libraries.keys()):
        details_list = libraries[library_name]
        for details in details_list:
            semconv_matches = set()

            if "telemetry" in details:
                for telemetry_block in details["telemetry"]:
                    # check metrics
                    if "metrics" in telemetry_block:
                        for metric in telemetry_block.get("metrics", []):
                            metric_name = metric.get("name")
                            if metric_name in mappings["metrics"]:
                                semconv_matches.add(mappings["metrics"][metric_name])
                                metric['semconv'] = True
                            if "attributes" in metric:
                                for attr in metric.get("attributes", []):
                                    attr_name = attr.get("name")
                                    if attr_name in mappings["attributes"]:
                                        semconv_matches.add(
                                            mappings["attributes"][attr_name])
                                        attr['semconv'] = True
                    # check spans
                    if "spans" in telemetry_block:
                        for span in telemetry_block.get("spans", []):
                            if "attributes" in span:
                                for attr in span.get("attributes", []):
                                    attr_name = attr.get("name")
                                    if attr_name in mappings["attributes"]:
                                        semconv_matches.add(
                                            mappings["attributes"][attr_name])
                                        attr['semconv'] = True

            details["semconv"] = sorted(list(semconv_matches))
            enriched_data.append(details)
    
    # Sort the enriched data by library name for consistent output
    enriched_data.sort(key=lambda x: x.get('name', ''))
    return enriched_data


def main():
    """
    Main function to orchestrate the fetching and enrichment process for all versions.
    """
    import glob

    all_enriched_data = {}
    mappings = get_convention_mappings()

    for filepath in glob.glob("../instrumentation-list-*.yaml"):
        try:
            version = filepath.replace("../instrumentation-list-", "").replace(".yaml", "")
            with open(filepath, "r") as f:
                instrumentation_data = yaml.safe_load(f)
            
            enriched_data = enrich_instrumentation_data(instrumentation_data, mappings)
            all_enriched_data[version] = enriched_data

        except (IOError, yaml.YAMLError) as e:
            print(f"Error loading or processing {filepath}: {e}")
            continue

    try:
        # Ensure the output directory exists
        output_dir = os.path.dirname(OUTPUT_FILE)
        os.makedirs(output_dir, exist_ok=True)

        # Sort the data recursively for deterministic output
        sorted_data = sort_data_recursively(all_enriched_data)

        with open(OUTPUT_FILE, "w") as f:
            json.dump(sorted_data, f, indent=2, sort_keys=True)
        print(f"Successfully generated enriched data in {OUTPUT_FILE}")
    except IOError as e:
        print(f"Error writing to {OUTPUT_FILE}: {e}")


if __name__ == "__main__":
    main()

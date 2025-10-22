#!/usr/bin/env python3
"""
Script to download the latest instrumentation list from OpenTelemetry Java Instrumentation repository.
This script fetches the latest version from GitHub and saves it with the appropriate version number.
"""

import json
import os
import re
import requests
import sys
import yaml
from pathlib import Path


def get_latest_instrumentation_data():
    """Download the latest instrumentation list from GitHub."""
    url = "https://raw.githubusercontent.com/open-telemetry/opentelemetry-java-instrumentation/main/docs/instrumentation-list.yaml"
    
    headers = {}
    github_token = os.environ.get("GITHUB_TOKEN")
    if github_token:
        headers["Authorization"] = f"token {github_token}"
    
    try:
        print("Downloading latest instrumentation list from GitHub...")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error downloading instrumentation list: {e}")
        sys.exit(1)


def get_latest_release_version():
    """Get the latest release version from GitHub API."""
    url = "https://api.github.com/repos/open-telemetry/opentelemetry-java-instrumentation/releases/latest"
    
    headers = {}
    github_token = os.environ.get("GITHUB_TOKEN")
    if github_token:
        headers["Authorization"] = f"token {github_token}"
    
    try:
        print("Fetching latest release version...")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        tag_name = data["tag_name"]
        
        # Extract version number from tag (e.g., "v2.10.0" -> "2.10")
        version_match = re.match(r"v?(\d+\.\d+)", tag_name)
        if version_match:
            return version_match.group(1)
        else:
            print(f"Could not parse version from tag: {tag_name}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching release info: {e}")
        return None


def save_instrumentation_file(content, version):
    """Save the instrumentation content to a versioned file."""
    # Get the script directory and go up one level to the project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    filename = f"instrumentation-list-{version}.yaml"
    filepath = project_root / filename
    
    try:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Saved instrumentation list to {filepath}")
        return str(filepath)
    except IOError as e:
        print(f"Error saving file: {e}")
        sys.exit(1)


def generate_3_0_version(latest_content):
    """
    Generate a hypothetical 3.0 version where semconv opt-in features become defaults.
    
    This function processes the instrumentation data to simulate the upcoming 3.0 release
    where features previously behind feature flags will become the default behavior.
    """
    try:
        # Parse the YAML content
        data = yaml.safe_load(latest_content)
        
        if not data or 'libraries' not in data:
            print("Warning: Invalid YAML structure for 3.0 generation")
            return latest_content
        
        processed_count = 0
        opt_in_sections_found = 0
        
        # Process each library
        for library_name, library_versions in data['libraries'].items():
            for library_version in library_versions:
                if 'telemetry' not in library_version:
                    continue
                
                telemetry_blocks = library_version['telemetry']
                new_telemetry_blocks = []
                
                # Find default and opt-in sections
                default_block = None
                opt_in_blocks = []
                other_blocks = []
                
                for block in telemetry_blocks:
                    when_condition = block.get('when', '')
                    
                    if when_condition == 'default':
                        default_block = block
                    elif when_condition.startswith('otel.semconv-stability.opt-in='):
                        opt_in_blocks.append(block)
                        opt_in_sections_found += 1
                    else:
                        other_blocks.append(block)
                
                # If we have both default and opt-in blocks, replace default with opt-in content
                if default_block and opt_in_blocks:
                    # Create new default block by replacing with opt-in content
                    new_default_block = {'when': 'default'}
                    
                    # Replace default content with content from all opt-in blocks
                    for opt_in_block in opt_in_blocks:
                        # Replace metrics (not merge)
                        if 'metrics' in opt_in_block:
                            new_default_block['metrics'] = opt_in_block['metrics']
                        
                        # Replace spans (not merge)
                        if 'spans' in opt_in_block:
                            new_default_block['spans'] = opt_in_block['spans']
                    
                    new_telemetry_blocks.append(new_default_block)
                    processed_count += 1
                    
                elif default_block:
                    # Keep default block as-is if no opt-in blocks
                    new_telemetry_blocks.append(default_block)
                
                # Add other non-default, non-opt-in blocks
                new_telemetry_blocks.extend(other_blocks)
                
                # Update the library's telemetry
                library_version['telemetry'] = new_telemetry_blocks
        
        print(f"Generated 3.0 version: processed {processed_count} libraries, found {opt_in_sections_found} opt-in sections")
        
        # Convert back to YAML
        return yaml.dump(data, default_flow_style=False, sort_keys=False, allow_unicode=True)
        
    except yaml.YAMLError as e:
        print(f"Error processing YAML for 3.0 generation: {e}")
        return latest_content
    except Exception as e:
        print(f"Unexpected error during 3.0 generation: {e}")
        return latest_content


def run_data_processing_v2():
    """Run the V2 data processing script to generate content-addressed JSON."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    print("Running V2 data processing to generate content-addressed JSON...")
    
    # Run the V2 data processing bash script
    import subprocess
    result = subprocess.run(
        ["/bin/bash", str(script_dir / "update-instrumentation-list-v2.sh")],
        cwd=str(project_root),
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("V2 data processing completed successfully!")
        print(result.stdout)
    else:
        print("Error during V2 data processing:")
        print(result.stderr)
        sys.exit(1)


def main():
    """Main function to orchestrate the update process."""
    print("Starting instrumentation list update process...")
    
    # Get the latest version
    version = get_latest_release_version()
    if not version:
        print("Could not determine latest version, using 'latest' as filename")
        version = "latest"
    
    # Download the latest instrumentation data
    content = get_latest_instrumentation_data()
    
    # Validate that it's valid YAML
    try:
        yaml.safe_load(content)
    except yaml.YAMLError as e:
        print(f"Downloaded content is not valid YAML: {e}")
        sys.exit(1)
    
    # Save the latest version file
    filepath = save_instrumentation_file(content, version)
    
    # Generate and save the hypothetical 3.0 version
    print("Generating hypothetical 3.0 version with semconv opt-in features as defaults...")
    version_3_0_content = generate_3_0_version(content)
    save_instrumentation_file(version_3_0_content, "3.0")
    
    # Run V2 data processing (this will process all YAML files including the new 3.0)
    run_data_processing_v2()
    
    print(f"Update complete!")
    print(f"- Latest version saved as: instrumentation-list-{version}.yaml")
    print(f"- Hypothetical 3.0 version saved as: instrumentation-list-3.0.yaml")
    print("- The V2 content-addressed data has been updated in frontend/public/data/")


if __name__ == "__main__":
    main()

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


def run_data_processing():
    """Run the data processing script to generate the enriched JSON."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    data_processing_dir = project_root / "data-processing"
    
    if not data_processing_dir.exists():
        print("Error: data-processing directory not found")
        sys.exit(1)
    
    print("Running data processing to generate enriched JSON...")
    
    # Change to data-processing directory and run the script
    original_cwd = os.getcwd()
    try:
        os.chdir(data_processing_dir)
        import subprocess
        result = subprocess.run([sys.executable, "main.py"], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("Data processing completed successfully!")
            print(result.stdout)
        else:
            print("Error during data processing:")
            print(result.stderr)
            sys.exit(1)
    finally:
        os.chdir(original_cwd)


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
    
    # Save the file
    filepath = save_instrumentation_file(content, version)
    
    # Run data processing
    run_data_processing()
    
    print(f"Update complete! New instrumentation list saved as instrumentation-list-{version}.yaml")
    print("The enriched JSON file has been updated in frontend/public/instrumentation-list-enriched.json")


if __name__ == "__main__":
    main()

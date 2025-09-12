#!/usr/bin/env python3
"""
Script to download README files from OpenTelemetry Java Instrumentation libraries.
This script fetches README files for each instrumentation library and saves them 
in a versioned directory structure.
"""

import argparse
import base64
import os
import requests
import sys
import time
from pathlib import Path
from typing import List, Optional, Tuple


class GitHubClient:
    """Simple GitHub API client for fetching repository data."""
    
    def __init__(self):
        self.session = requests.Session()
        github_token = os.environ.get("GITHUB_TOKEN")
        if github_token:
            self.session.headers.update({'Authorization': f'Bearer {github_token}'})
        self.base_url = 'https://api.github.com'
    
    def _get(self, url, params=None):
        """Make a GET request with error handling."""
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            print(f"Error making request to {url}: {e}")
            return None
    
    def get_most_recent_commit(self, repo: str, branch: str = "main"):
        """Get the most recent commit SHA for a branch."""
        api_url = f"{self.base_url}/repos/{repo}/commits"
        params = {
            "per_page": 1,
            "sha": branch
        }
        
        response = self._get(api_url, params=params)
        if response and response.status_code == 200:
            commits = response.json()
            if commits:
                return commits[0]['sha']
        return None
    
    def get_commit_sha_for_tag(self, repo: str, tag: str):
        """Get the commit SHA for a specific tag."""
        # Try the specific tag ref endpoint first
        api_url = f"{self.base_url}/repos/{repo}/git/refs/tags/{tag}"
        
        response = self._get(api_url)
        if response and response.status_code == 200:
            ref_data = response.json()
            
            # Handle case where API returns a list of refs
            if isinstance(ref_data, list):
                if not ref_data:
                    return None
                # Find exact match or take the first one
                for ref in ref_data:
                    if ref["ref"] == f"refs/tags/{tag}":
                        ref_data = ref
                        break
                else:
                    ref_data = ref_data[0]
            
            # Handle both lightweight and annotated tags
            if ref_data["object"]["type"] == "commit":
                return ref_data["object"]["sha"]
            elif ref_data["object"]["type"] == "tag":
                # For annotated tags, we need to get the commit from the tag object
                tag_url = ref_data["object"]["url"]
                tag_response = self._get(tag_url)
                if tag_response and tag_response.status_code == 200:
                    tag_data = tag_response.json()
                    return tag_data["object"]["sha"]
        
        # Fallback: try to get commit SHA from releases API
        releases_url = f"{self.base_url}/repos/{repo}/releases/tags/{tag}"
        response = self._get(releases_url)
        if response and response.status_code == 200:
            release_data = response.json()
            return release_data.get("target_commitish")
            
        return None
    
    def get_latest_release_tag(self, repo: str):
        """Get the latest release tag."""
        api_url = f"{self.base_url}/repos/{repo}/releases/latest"
        
        response = self._get(api_url)
        if response and response.status_code == 200:
            release_data = response.json()
            return release_data["tag_name"]
        return None
    
    def get_repository_tree(self, repository: str, commit_sha: str):
        """Get the complete repository tree structure at a specific commit."""
        api_url = f"{self.base_url}/repos/{repository}/git/trees/{commit_sha}?recursive=1"
        
        response = self._get(api_url)
        if response and response.status_code == 200:
            return response.json()
        return None
    
    def get_file_content(self, repository: str, filepath: str, commit_sha: str):
        """Get file content at a specific commit."""
        api_url = f"{self.base_url}/repos/{repository}/contents/{filepath}"
        
        response = self._get(api_url, params={"ref": commit_sha})
        if response and response.status_code == 200:
            # File content is base64 encoded, decode it
            content = response.json().get("content", "")
            try:
                decoded_content = base64.b64decode(content)
                return decoded_content.decode('utf-8')
            except Exception as e:
                print(f"Error decoding content for {filepath}: {e}")
                return None
        elif response and response.status_code == 403:
            # Rate limited - wait and retry once
            print(f"  Rate limited, waiting 60 seconds before retry...")
            time.sleep(60)
            response = self._get(api_url, params={"ref": commit_sha})
            if response and response.status_code == 200:
                content = response.json().get("content", "")
                try:
                    decoded_content = base64.b64decode(content)
                    return decoded_content.decode('utf-8')
                except Exception as e:
                    print(f"Error decoding content for {filepath}: {e}")
                    return None
        return None




def discover_library_readmes(github_client: GitHubClient, commit_sha: str) -> List[Tuple[str, str]]:
    """
    Discover all library README files using GitHub API tree structure.
    Returns list of tuples: (library_name, readme_path)
    """
    repo = "open-telemetry/opentelemetry-java-instrumentation"
    
    print("Fetching repository tree structure...")
    tree_data = github_client.get_repository_tree(repo, commit_sha)
    
    if not tree_data:
        print("Error: Could not fetch repository tree")
        return []
    
    library_readmes = []
    
    # Filter for library README files
    for item in tree_data.get("tree", []):
        path = item["path"]
        
        # Look for README.md files in library directories
        if (path.startswith("instrumentation/") and 
            path.lower().endswith("/library/readme.md") and
            item["type"] == "blob"):
            
            # Extract library name from path - use final segment only
            # e.g., "instrumentation/apache-httpclient/apache-httpclient-4.3/library/README.md" -> "apache-httpclient-4.3"
            # e.g., "instrumentation/apache-dbcp-2.0/library/README.md" -> "apache-dbcp-2.0"
            parts = path.split("/")
            if len(parts) >= 3:
                library_name = parts[-3]  # The directory just before '/library/README.md'
                library_readmes.append((library_name, path))
    
    print(f"Found {len(library_readmes)} library README files")
    return library_readmes


def download_readme_content(github_client: GitHubClient, readme_path: str, commit_sha: str, library_name: str) -> Optional[str]:
    """Download README content using GitHub API."""
    repo = "open-telemetry/opentelemetry-java-instrumentation"
    
    print(f"Downloading README for {library_name}...")
    content = github_client.get_file_content(repo, readme_path, commit_sha)
    
    if content is None:
        print(f"  Failed to download README for {library_name}")
        return None
    
    return content

def save_readme(content: str, library_name: str, version: str) -> str:
    """Save README content to the versioned directory."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    # Create directory structure
    readme_dir = project_root / "data" / version / "library_readme"
    readme_dir.mkdir(parents=True, exist_ok=True)
    
    # Use library name directly (already just the final segment)
    # Save README file
    filename = f"{library_name}.md"
    filepath = readme_dir / filename
    
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  Saved README to {filepath}")
        return str(filepath)
    except IOError as e:
        print(f"  Error saving README for {library_name}: {e}")
        return ""

def process_readmes(github_client: GitHubClient, commit_sha: str, version: str, libraries: List[Tuple[str, str]], delay: float = 0.5):
    """
    Process README files for all libraries using GitHub API.
    Downloads and saves all README files to the versioned directory.
    """
    print(f"\nProcessing {len(libraries)} libraries for version {version}...")
    print(f"Using {delay}s delay between requests to respect API limits...")
    
    successful_downloads = 0
    failed_downloads = 0
    
    for i, (library_name, readme_path) in enumerate(libraries):
        print(f"[{i+1}/{len(libraries)}] Processing {library_name}")
        
        # Download README content
        content = download_readme_content(github_client, readme_path, commit_sha, library_name)
        
        if content is not None:
            # Save README file
            filepath = save_readme(content, library_name, version)
            if filepath:
                successful_downloads += 1
                print(f"  Saved README ({len(content):,} bytes)")
            else:
                failed_downloads += 1
        else:
            print(f"  Skipping {library_name} (README not found)")
            failed_downloads += 1
        
        # Rate limiting - sleep between requests except for the last one
        if i < len(libraries) - 1:
            time.sleep(delay)
    
    return successful_downloads, failed_downloads




def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Download README files from OpenTelemetry Java Instrumentation libraries"
    )
    parser.add_argument(
        "--version", 
        type=str, 
        help="Version/tag to process (e.g., 'v2.9.0', '2.19'). If not specified, uses latest release."
    )
    parser.add_argument(
        "--commit-sha",
        type=str,
        help="Specific commit SHA to use. Overrides version/tag if specified."
    )
    
    return parser.parse_args()


def process_single_version(github_client: GitHubClient, version_or_tag: str, commit_sha: str = None):
    """Process README files for a single version/tag."""
    repo = "open-telemetry/opentelemetry-java-instrumentation"
    
    print(f"\n{'='*60}")
    print(f"Processing version/tag: {version_or_tag}")
    print(f"{'='*60}")
    
    # Get commit SHA if not provided
    if not commit_sha:
        if version_or_tag:
            # Try to get commit SHA from tag first
            print(f"Fetching commit SHA for tag: {version_or_tag}")
            commit_sha = github_client.get_commit_sha_for_tag(repo, version_or_tag)
            
            if not commit_sha:
                # If tag doesn't exist, try with 'v' prefix
                prefixed_tag = f"v{version_or_tag}" if not version_or_tag.startswith('v') else version_or_tag
                print(f"Tag not found, trying with prefix: {prefixed_tag}")
                commit_sha = github_client.get_commit_sha_for_tag(repo, prefixed_tag)
        
        if not commit_sha:
            print("Tag not found, falling back to latest commit from main branch...")
            commit_sha = github_client.get_most_recent_commit(repo)
            
        if not commit_sha:
            print("Error: Could not fetch commit SHA")
            return False
    
    print(f"Using commit SHA: {commit_sha[:8]}...")
    
    # Extract version for directory naming (remove 'v' prefix if present)
    clean_version = version_or_tag.lstrip('v') if version_or_tag else "latest"
    
    # Discover library README files
    libraries = discover_library_readmes(github_client, commit_sha)
    if not libraries:
        print("No library README files found")
        return False
    
    print(f"Found {len(libraries)} library README files to process")
    
    # Process README files
    successful_downloads, failed_downloads = process_readmes(github_client, commit_sha, clean_version, libraries)
    
    print(f"\nREADME download process complete for version {clean_version}!")
    print(f"- Source: {version_or_tag}")
    print(f"- Commit SHA: {commit_sha[:8]}...")
    print(f"- Libraries processed: {len(libraries)}")
    print(f"- Successful downloads: {successful_downloads}")
    print(f"- Failed downloads: {failed_downloads}")
    print(f"- Files saved to: data/{clean_version}/library_readme/")
    
    return True


def main():
    """Main function to orchestrate the README download process."""
    print("Starting library README download process...")
    
    # Parse command line arguments
    args = parse_arguments()
    
    # Initialize GitHub client
    github_client = GitHubClient()
    repo = "open-telemetry/opentelemetry-java-instrumentation"
    
    # Determine version/tag to process
    version_or_tag = args.version
    commit_sha = args.commit_sha
    
    if not version_or_tag and not commit_sha:
        # Default: use latest release
        print("No version specified, fetching latest release...")
        version_or_tag = github_client.get_latest_release_tag(repo)
        if not version_or_tag:
            print("Could not determine latest release, falling back to main branch")
            version_or_tag = "main"
    
    # Process the specified version/tag
    process_single_version(github_client, version_or_tag, commit_sha)
    
    print(f"\n{'='*60}")
    print("PROCESS COMPLETE")
    print(f"{'='*60}")
    print("All README files have been downloaded to the data directory.")
    print("Use 'git diff' to check for changes and create a PR if needed.")


if __name__ == "__main__":
    main()

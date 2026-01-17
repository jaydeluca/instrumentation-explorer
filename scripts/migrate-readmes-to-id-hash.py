#!/usr/bin/env python3
"""
Migrate README files from version-specific directories to shared ID-prefixed content-hashed storage.

This script:
1. Scans data/{version}/library_readme/ directories
2. For each README, computes SHA-256 hash (first 12 chars)
3. Writes to shared location: data/library_readme/{id}-{hash}.md
4. Creates metadata JSON tracking which version each file came from
"""

import hashlib
import json
from pathlib import Path
from typing import Dict, Set, Tuple


def compute_content_hash(content: str) -> str:
    """Compute SHA-256 hash (first 12 chars) - matches TypeScript implementation."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()[:12]


def migrate_readmes(project_root: Path) -> Dict:
    """
    Migrate READMEs from version-specific directories to shared ID-prefixed storage.

    Returns metadata about the migration.
    """
    # Create shared library_readme directory
    library_readme_dir = project_root / "data" / "library_readme"
    library_readme_dir.mkdir(parents=True, exist_ok=True)

    # Track what we've seen
    seen_files: Dict[Tuple[str, str], str] = {}  # (id, hash) -> version first seen
    readme_versions: Dict[str, Set[str]] = {}  # id -> set of versions

    # Find all version directories
    data_dir = project_root / "data"
    version_dirs = sorted([d for d in data_dir.iterdir() if d.is_dir() and d.name[0].isdigit()])

    if not version_dirs:
        print("⚠️  No version directories found in data/")
        return {}

    print(f"📂 Found {len(version_dirs)} version directories")

    total_readmes = 0
    unique_readmes = 0

    # Process each version directory
    for version_dir in version_dirs:
        version = version_dir.name
        readme_dir = version_dir / "library_readme"

        if not readme_dir.exists():
            print(f"   {version}: No library_readme directory")
            continue

        readme_files = list(readme_dir.glob("*.md"))
        if not readme_files:
            print(f"   {version}: No README files")
            continue

        print(f"   {version}: Processing {len(readme_files)} READMEs...")
        version_unique = 0

        for readme_file in readme_files:
            library_id = readme_file.stem

            try:
                content = readme_file.read_text(encoding='utf-8')
            except Exception as e:
                print(f"      ⚠️  Error reading {readme_file.name}: {e}")
                continue

            # Compute content hash
            content_hash = compute_content_hash(content)

            # Track this version for this library
            if library_id not in readme_versions:
                readme_versions[library_id] = set()
            readme_versions[library_id].add(version)

            # Check if we've seen this exact content before
            key = (library_id, content_hash)
            if key in seen_files:
                # Already migrated this exact file
                total_readmes += 1
                continue

            # New content - write to shared location with ID prefix
            new_filename = f"{library_id}-{content_hash}.md"
            new_path = library_readme_dir / new_filename

            try:
                new_path.write_text(content, encoding='utf-8')
                seen_files[key] = version
                unique_readmes += 1
                version_unique += 1
            except Exception as e:
                print(f"      ⚠️  Error writing {new_filename}: {e}")
                continue

            total_readmes += 1

        if version_unique > 0:
            print(f"      ✅ Migrated {version_unique} unique READMEs")

    # Create metadata file
    metadata = {
        "migration_date": "2026-01-17",
        "total_readmes_processed": total_readmes,
        "unique_readmes": unique_readmes,
        "deduplication_savings": f"{(1 - unique_readmes / total_readmes) * 100:.1f}%" if total_readmes > 0 else "0%",
        "libraries_with_readmes": len(readme_versions),
        "readmes": {
            f"{lib_id}-{hash_val}": {
                "id": lib_id,
                "hash": hash_val,
                "first_seen_version": first_version
            }
            for (lib_id, hash_val), first_version in seen_files.items()
        }
    }

    metadata_path = library_readme_dir / "metadata.json"
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding='utf-8')

    print(f"\n📊 Migration Summary:")
    print(f"   Total READMEs processed: {total_readmes}")
    print(f"   Unique READMEs migrated: {unique_readmes}")
    print(f"   Deduplication savings: {metadata['deduplication_savings']}")
    print(f"   Libraries with READMEs: {len(readme_versions)}")
    print(f"   Metadata saved to: {metadata_path}")

    return metadata


def main():
    # Find project root (script is in scripts/ directory)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    print("🚀 README Migration Script")
    print("=" * 50)
    print(f"Project root: {project_root}\n")

    # Run migration
    metadata = migrate_readmes(project_root)

    if metadata:
        print("\n✅ Migration complete!")
        print(f"\n📂 Migrated files location:")
        print(f"   {project_root / 'data' / 'library_readme'}")
    else:
        print("\n⚠️  Migration completed with warnings")


if __name__ == "__main__":
    main()

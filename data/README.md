# Data Directory

This directory contains cached data from the OpenTelemetry Java Instrumentation repository.

## Structure

```
data/
├── {version}/                          # Version-specific data (e.g., 2.19, 9.0)
│   ├── library_readme/                 # README files from libraries
│   │   ├── {library-name}.md          # Individual library README files
│   │   └── ...
└── README.md                          # This file
```

## Library README Files

The `library_readme/` directories contain README files downloaded from each instrumentation library's `/library/` subdirectory in the OpenTelemetry Java Instrumentation repository.

### File Naming Convention

Library README files are named using the final directory segment:
- `apache-httpclient/apache-httpclient-4.3` → `apache-httpclient-4.3.md`
- `spring/spring-webmvc/spring-webmvc-5.3` → `spring-webmvc-5.3.md`
- `apache-dbcp-2.0` → `apache-dbcp-2.0.md`

### Source

All files are downloaded from:
https://github.com/open-telemetry/opentelemetry-java-instrumentation/tree/main/instrumentation/{library-path}/library/README.md

## Automation

These files are automatically updated daily via GitHub Actions workflow:
- **Workflow**: `.github/workflows/update-library-readmes.yml`
- **Script**: `scripts/update-library-readmes.py`
- **Schedule**: Daily at 10:00 AM UTC

The workflow creates a Pull Request when changes are detected.

## Manual Updates

To manually update the README files:

```bash
# Update from latest release
python scripts/update-library-readmes.py

# Update from specific version/tag
python scripts/update-library-readmes.py --version v2.9.0
python scripts/update-library-readmes.py --version 2.19.0
```


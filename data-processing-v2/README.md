# Data Processing V2 - Content-Addressed Storage

This is the data pipeline for the Ecosystem Explorer, using a content-addressed storage approach with version manifests.

## Features

- Content-addressed storage - Deduplicates identical instrumentations across versions
- Version manifests - Tracks which instrumentations exist in each version
- Lightweight index - Fast initial load with minimal data

## Architecture

### Output Structure

```
output/
  index.json                    # Lightweight index for browse/search (~80KB)
  versions.json                 # List of available versions (~2KB)
  versions/
    2.19.0.json                # Version manifest (~12KB)
    2.20.0.json
  instrumentations/
    abc123def456.json          # Content-addressed full data (~2-3KB each)
    789ghi012jkl.json
    ...
```

### Data Flow

```
YAML Files (2.19, 2.20)
    ↓
Parse & Extract
    ↓
Transform to InstrumentationData
    ↓
Compute Content Hash (SHA-256)
    ↓
Deduplicate (reuse existing files)
    ↓
Write to /instrumentations/{hash}.json
    ↓
Generate Version Manifests
    ↓
Generate Index & Versions List
```

## Installation

```bash
npm install
```

## Usage

### Quick Start: Generate and Deploy

Generate data and copy it to the frontend in one command:

```bash
npm run generate:deploy
```

### Generate Data Only

Generate data files in `dist/output/` without copying to frontend:

```bash
npm run generate
```

This will:
1. Parse `instrumentation-list-2.19.yaml` and `instrumentation-list-2.20.yaml`
2. Generate content-addressed files in `dist/output/`
3. Create version manifests
4. Generate index and versions list
5. Show deduplication statistics

### Copy to Frontend

After generating, copy the data to `frontend/public/data/`:

```bash
npm run copy-to-frontend
```

### Run from Repository Root

```bash
# Generate only (stays in data-processing-v2/dist/output/)
npm run process-data-v2

# Generate and copy to frontend
npm run process-data-v2:deploy
```

### Run Tests

```bash
# Run all tests
npm test

# Watch mode (for active development)
npm run test:watch
```

### Build TypeScript Only

```bash
npm run build
```

📖 **See [USAGE.md](./USAGE.md) for detailed workflows and troubleshooting.**

## Configuration

Edit `src/index.ts` to configure versions:

```typescript
const versions: VersionConfig[] = [
  {
    version: '2.19.0',
    yamlPath: './instrumentation-list-2.19.yaml',
    isLatest: false
  },
  {
    version: '2.20.0',
    yamlPath: './instrumentation-list-2.20.yaml',
    isLatest: true
  }
];
```

## Type Definitions

All types are defined in `src/types.ts` and can be shared with the frontend:

- **InstrumentationData** - Full instrumentation data (content-addressed)
- **IndexData** - Lightweight index for browse/search
- **VersionManifest** - Maps instrumentation IDs to content hashes
- **VersionsData** - List of available versions

## Deduplication

The pipeline automatically deduplicates instrumentations:

- Each unique content gets a single file
- Version manifests reference files by content hash

Example output:
```
Unique instrumentations: 300
Total instrumentations: 464 (across 2 versions)
Deduplication ratio: 35%
```

## Next Steps

1. ✅ Implement core pipeline with tests
2. ⏳ Deploy output to `frontend/public/data/`
3. ⏳ Update frontend to consume new data format
4. ⏳ Add support for 3.0 (future/beta versions)
5. ⏳ Add semantic convention enrichment
6. ⏳ Integrate with CI/CD




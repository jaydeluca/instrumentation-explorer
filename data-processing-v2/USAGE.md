# Usage Guide - Data Processing V2

This guide explains how to use the v2 data processing pipeline.

## Quick Start

### Generate and Deploy (One Command)

```bash
cd data-processing-v2
npm run generate:deploy
```

This does everything: builds, generates (latest 2 versions), and copies to frontend.

> **Auto-Detection:** The pipeline automatically detects available versions from `instrumentation-list-*.yaml` files in the repository root.

## Available Commands

### From `data-processing-v2/` Directory

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run build` | Build TypeScript code |
| `npm run generate` | Generate data (2 most recent versions) |
| `npm run generate -- --latest` | Generate only latest version |
| `npm run generate -- --all` | Generate all available versions |
| `npm run generate -- --recent 3` | Generate 3 most recent versions |
| `npm run copy-to-frontend` | Copy generated data to frontend |
| `npm run generate:deploy` | Generate + copy in one step |

> **Version Auto-Detection:** All commands automatically detect versions from YAML files in the repo.

### From Repository Root

| Command | Description |
|---------|-------------|
| `npm run process-data-v2` | Generate data (stays in v2 directory) |
| `npm run process-data-v2:deploy` | Generate and copy to frontend |

## Detailed Workflows

### 1. Development: Testing Changes

When working on the pipeline code:

```bash
cd data-processing-v2

# 1. Make your code changes in src/

# 2. Run tests
npm test

# 3. Generate data to verify output
npm run generate

# 4. Inspect the output
ls -lh dist/output/
cat dist/output/index.json | head -20

# 5. If satisfied, copy to frontend
npm run copy-to-frontend
```

### 2. Quick Generation

Just want to regenerate the data?

```bash
cd data-processing-v2
npm run generate:deploy
```

Done! Data is now in `frontend/public/data/`.

### 3. CI/CD Pipeline

For automated builds:

```bash
# From repository root
npm run process-data-v2:deploy
npm run build  # Build frontend with new data
```

## Understanding the Output

After generation, you'll see:

```
dist/output/
├── index.json              # 61 KB - Lightweight search index
├── versions.json           # 327 B - List of versions
├── versions/
│   ├── 2.19.0.json        # Version manifest
│   └── 2.20.0.json        # Version manifest
└── instrumentations/
    ├── abc123def456.json  # Individual instrumentation files
    ├── 789ghi012jkl.json
    └── ... (255 files)
```

### What Gets Copied to Frontend

Running `copy-to-frontend` copies everything to:

```
frontend/public/data/
├── index.json
├── versions.json
├── versions/
└── instrumentations/
```

The frontend can then access these at URLs like:
- `/data/index.json`
- `/data/versions.json`
- `/data/versions/2.20.0.json`
- `/data/instrumentations/abc123def456.json`

## Verification

### Check Generation Statistics

After running `generate`, you'll see:

```
📊 Statistics:
   Unique instrumentations: 255
   Versions processed: 2
   Total instrumentations: 464
   Deduplication ratio: 45%
```

### Verify Frontend Copy

After running `copy-to-frontend`:

```bash
ls -lh ../frontend/public/data/
```

Should show ~135 KB total with proper directory structure.

### Test in Frontend

```bash
cd ../frontend
npm run dev
# Visit http://localhost:5173/instrumentation-explorer/
```

## Configuration

### Adding/Removing Versions

Edit `src/index.ts`:

```typescript
const versions: VersionConfig[] = [
  {
    version: '2.19.0',
    yamlPath: join(__dirname, '../../../instrumentation-list-2.19.yaml'),
    releaseDate: '2024-09-15',
    isLatest: false
  },
  {
    version: '2.20.0',
    yamlPath: join(__dirname, '../../../instrumentation-list-2.20.yaml'),
    releaseDate: '2024-10-01',
    isLatest: true
  }
];
```

### Changing Output Location

Edit `src/index.ts`:

```typescript
const outputDir = join(__dirname, '../output');  // Change this
```

Or edit `scripts/copy-to-frontend.mjs` to change the frontend destination.

## Troubleshooting

### "Source directory does not exist"

Run `npm run generate` first before trying to copy.

### "Required file missing"

The generation may have failed. Check for errors in the generate output.

### TypeScript errors

Run `npm run build` and fix any compilation errors.

### Tests failing

Check your code changes and ensure they don't break existing functionality.

## Tips

- **Always run tests** before deploying: `npm test`
- **Check the output** before copying to frontend
- **Use generate:deploy** for convenience in development
- **Inspect the stats** to verify deduplication is working
- **Version control** - the output files are gitignored, only commit source code

## Next Steps

Once data is in the frontend:
1. Update React components to load from `/data/` instead of old format
2. Implement lazy loading for instrumentation detail views
3. Add version selector UI
4. Test thoroughly with the new data structure


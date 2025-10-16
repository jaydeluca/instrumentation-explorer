### Automation & CI/CD Integration

This document explains how the V2 pipeline integrates with the existing automation workflow.

## Overview

The V2 pipeline is designed to work seamlessly with the existing GitHub Actions workflow that updates instrumentation data daily.

## How It Works

### Current V1 Workflow (Existing)

1. **Daily Schedule**: GitHub Actions runs at 9 AM UTC
2. **Download**: `update-instrumentation-list.py` fetches latest from GitHub
3. **Auto-Detect Version**: Uses GitHub API to get latest release (e.g., "2.20")
4. **Save YAML**: Saves as `instrumentation-list-{version}.yaml` in repo
5. **Generate 3.0**: Creates hypothetical `instrumentation-list-3.0.yaml`
6. **Process**: Runs V1 data processing
7. **PR Creation**: If changes detected, opens PR

### New V2 Workflow (Parallel)

The V2 pipeline **reuses the same YAML files** from the V1 workflow:

1. ✅ YAML files already downloaded and cached by V1 workflow
2. ✅ V2 auto-detects versions from these YAML files
3. ✅ V2 processes latest N versions (configurable)
4. ✅ V2 generates content-addressed data
5. ✅ V2 copies to `frontend/public/data/`
6. ✅ Same PR workflow includes both V1 and V2 changes

## Version Auto-Detection

The V2 pipeline automatically discovers versions:

```typescript
// Scans for: instrumentation-list-*.yaml
// Found: 2.17, 2.18, 2.19, 2.20, 3.0
// Auto-detects latest: 2.20 (3.0 excluded by default)
```

**No manual configuration needed!** Just drop YAML files in the repo root.

## Integration Methods

### Method 1: Run V2 Alongside V1 (Recommended)

Update `.github/workflows/update-instrumentation-list.yml`:

```yaml
- name: Run V1 update script
  env:
    GITHUB_TOKEN: ${{ secrets.GH_PAT }}
  run: |
    python scripts/update-instrumentation-list.py

- name: Run V2 data processing
  run: |
    bash scripts/update-instrumentation-list-v2.sh
```

**Benefits:**
- Both V1 and V2 data updated in same PR
- Gradual migration path
- Fallback to V1 if V2 has issues

### Method 2: Run V2 Only

Replace the V1 processing step:

```yaml
- name: Download latest instrumentation data
  run: python scripts/update-instrumentation-list.py --download-only

- name: Run V2 data processing
  run: bash scripts/update-instrumentation-list-v2.sh
```

### Method 3: Use V2 npm Script

From repository root:

```yaml
- name: Run V2 data processing
  run: npm run process-data-v2:deploy
```

## Configuration Options

### Environment Variables

Control V2 behavior with environment variables:

```bash
# Process only latest version
V2_MODE=latest bash scripts/update-instrumentation-list-v2.sh

# Process all versions
V2_MODE=all bash scripts/update-instrumentation-list-v2.sh

# Process 3 most recent versions
V2_MODE=recent V2_COUNT=3 bash scripts/update-instrumentation-list-v2.sh
```

### GitHub Actions Examples

**Process latest only:**
```yaml
- name: Run V2 (latest only)
  env:
    V2_MODE: latest
  run: bash scripts/update-instrumentation-list-v2.sh
```

**Process all versions:**
```yaml
- name: Run V2 (all versions)
  env:
    V2_MODE: all
  run: bash scripts/update-instrumentation-list-v2.sh
```

**Include 3.0:**
```yaml
- name: Run V2 (with 3.0)
  run: |
    cd data-processing-v2
    npm run build
    node dist/src/index.js --all --include-3.0
    npm run copy-to-frontend
```

## Recommended Setup for Production

For the GitHub Actions workflow, we recommend:

```yaml
jobs:
  update-instrumentation-list:
    runs-on: ubuntu-latest
    steps:
      # ... existing checkout, setup steps ...

      # Step 1: Download latest YAML (existing)
      - name: Download and generate YAML files
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        run: python scripts/update-instrumentation-list.py

      # Step 2: Install V2 dependencies
      - name: Setup V2 pipeline
        run: |
          cd data-processing-v2
          npm install

      # Step 3: Run V2 processing
      - name: Generate V2 data
        env:
          V2_MODE: recent
          V2_COUNT: 2
        run: bash scripts/update-instrumentation-list-v2.sh

      # ... existing PR creation steps ...
```

**This setup:**
- ✅ Downloads latest YAML automatically
- ✅ Processes 2 most recent versions
- ✅ Creates one PR with both V1 and V2 changes
- ✅ Keeps YAML files cached in repo for backfills

## What Gets Committed?

When the workflow runs, the PR includes:

**From V1 (existing):**
- `instrumentation-list-{version}.yaml` (if new/changed)
- `instrumentation-list-3.0.yaml` (regenerated)
- `frontend/public/instrumentation-list-enriched.json` (V1 format)

**From V2 (new):**
- `frontend/public/data/index.json`
- `frontend/public/data/versions.json`
- `frontend/public/data/versions/*.json` (manifests)
- `frontend/public/data/instrumentations/*.json` (255+ files)

## Backfilling Historical Versions

If you need to regenerate data for historical versions:

```bash
# Process all historical versions
cd data-processing-v2
npm run generate -- --all
npm run copy-to-frontend

# Or specific versions
npm run generate -- --versions 2.17 2.18
npm run copy-to-frontend
```

The YAML files are already cached in the repo, so no network requests needed!

## Testing Locally

### Test the full workflow:

```bash
# 1. Download latest (simulates GitHub Actions step)
python scripts/update-instrumentation-list.py

# 2. Run V2 processing
bash scripts/update-instrumentation-list-v2.sh

# 3. Check output
ls -lh frontend/public/data/
```

### Test specific scenarios:

```bash
# Latest only
V2_MODE=latest bash scripts/update-instrumentation-list-v2.sh

# All versions
V2_MODE=all bash scripts/update-instrumentation-list-v2.sh

# With 3.0
cd data-processing-v2
npm run generate -- --all --include-3.0
npm run copy-to-frontend
```

## Migration Strategy

### Phase 1: Parallel (Current)
- Run both V1 and V2 pipelines
- Both datasets available in frontend
- Frontend uses V1, V2 data available for testing

### Phase 2: Frontend Migration
- Update frontend to consume V2 data
- V1 still running for backup
- Test thoroughly with V2 data

### Phase 3: V2 Only
- Remove V1 processing
- Keep YAML download logic
- V2 as primary data source

### Phase 4: Cleanup
- Remove V1 data files
- Remove V1 processing code
- Update documentation

## Monitoring

Key metrics to monitor:

- **Generation time**: Should complete in < 30 seconds for 2 versions
- **Deduplication ratio**: Should be 45-57% depending on version count
- **File count**: Should match expected instrumentation count
- **PR creation**: Should only trigger when YAML actually changes

## Troubleshooting

**No versions detected:**
```
❌ No versions found in repository
```
→ Ensure YAML files exist: `ls instrumentation-list-*.yaml`

**Build failures:**
```
Error: Cannot find module
```
→ Run `cd data-processing-v2 && npm install`

**Copy failures:**
```
Source directory does not exist
```
→ Run generation first: `npm run generate`

## Summary

The V2 pipeline integrates seamlessly with the existing workflow:

1. ✅ **Auto-detects** versions from cached YAML files
2. ✅ **Reuses** existing download infrastructure
3. ✅ **Parallel** with V1 for safe migration
4. ✅ **Configurable** via environment variables
5. ✅ **No manual** version configuration needed
6. ✅ **Backfill** support for historical data

**Result:** Zero-maintenance automation that just works! 🎉






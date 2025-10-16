# Automatic Version Detection - Implementation Summary

## ✅ What We Built

The V2 pipeline now **automatically detects versions** from YAML files in the repository, eliminating the need for manual configuration.

## How It Works

### 1. Version Detection

```typescript
// Scans repository for: instrumentation-list-*.yaml
// Found: 2.17, 2.18, 2.19, 2.20, 3.0

// Auto-detects:
// - Latest stable version (2.20)
// - Semantic version ordering
// - Excludes 3.0 by default (hypothetical)
```

### 2. Flexible Modes

```bash
# Latest version only (for daily updates)
npm run generate -- --latest

# 2 most recent versions (default)
npm run generate

# All versions (for backfills)
npm run generate -- --all

# Specific versions
npm run generate -- --versions 2.19 2.20

# Include 3.0
npm run generate -- --include-3.0
```

### 3. Zero Configuration

**Before (Manual):**
```typescript
const versions = [
  { version: '2.19.0', yamlPath: '...', releaseDate: '...', isLatest: false },
  { version: '2.20.0', yamlPath: '...', releaseDate: '...', isLatest: true },
];
```

**After (Auto):**
```bash
# Just drop YAML files in repo root
npm run generate  # Automatically finds and processes them!
```

## Integration with Existing Workflow

### Current V1 Workflow
```
update-instrumentation-list.py
  ↓
Downloads latest YAML from GitHub
  ↓
Saves as: instrumentation-list-{version}.yaml
  ↓
Generates: instrumentation-list-3.0.yaml
  ↓
Runs V1 data processing
  ↓
Creates PR if changes
```

### New V2 Integration
```
update-instrumentation-list.py  (unchanged)
  ↓
Downloads latest YAML from GitHub  ← Same as before
  ↓
Saves as: instrumentation-list-{version}.yaml  ← Reused by V2!
  ↓
V2 Auto-Detects Versions  ← NEW!
  ↓
V2 Generates Content-Addressed Data  ← NEW!
  ↓
Creates PR with both V1 and V2 changes
```

## Test Results

### All Tests Passing

```
✓ tests/versionDetector.test.ts  (13 tests)
✓ tests/contentHash.test.ts      (11 tests)
✓ tests/yamlParser.test.ts       (14 tests)
✓ tests/dataGenerator.test.ts    (6 tests)

Total: 44 tests passing
```

### Real-World Testing

**Latest version only:**
```bash
$ npm run generate -- --latest
📂 Found 1 version(s): 2.20 (latest)
📊 Generated 232 instrumentations
```

**All versions:**
```bash
$ npm run generate -- --all
📂 Found 4 version(s): 2.17, 2.18, 2.19, 2.20
📊 Generated 398 unique instrumentations (57% deduplication)
```

**Recent 2 versions:**
```bash
$ npm run generate
📂 Found 2 version(s): 2.19, 2.20
📊 Generated 255 unique instrumentations (45% deduplication)
```

## GitHub Actions Integration

### Recommended Setup

```yaml
# .github/workflows/update-instrumentation-list.yml
jobs:
  update-instrumentation-list:
    steps:
      # Existing: Download YAML
      - name: Run update script
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        run: python scripts/update-instrumentation-list.py
      
      # NEW: Setup V2
      - name: Setup V2 pipeline
        run: |
          cd data-processing-v2
          npm install
      
      # NEW: Run V2 (auto-detects versions!)
      - name: Generate V2 data
        env:
          V2_MODE: recent
          V2_COUNT: 2
        run: bash scripts/update-instrumentation-list-v2.sh
      
      # Existing: Create PR
      - name: Create Pull Request
        if: steps.git-check.outputs.changes == 'true'
        uses: peter-evans/create-pull-request@v5
        # ... PR config ...
```

### What Happens Daily

1. ✅ GitHub Actions downloads latest YAML (e.g., `instrumentation-list-2.21.yaml`)
2. ✅ V2 auto-detects: "Found versions: 2.20, 2.21"
3. ✅ V2 generates content-addressed data
4. ✅ PR created with changes (only if YAML actually changed)

**Zero manual updates needed!**

## Benefits

### 1. No Manual Configuration
- ❌ No hardcoded versions
- ❌ No release date maintenance
- ✅ Automatic discovery

### 2. Flexible Processing
- Latest only (fast, for daily updates)
- Recent N (balanced, for most use cases)
- All versions (comprehensive, for backfills)

### 3. Safe Backfills
- YAML files cached in repo
- Can regenerate any historical version
- No network dependencies for backfills

### 4. Easy Testing
```bash
# Test locally with any mode
V2_MODE=latest bash scripts/update-instrumentation-list-v2.sh
V2_MODE=all bash scripts/update-instrumentation-list-v2.sh
```

### 5. Gradual Migration
- V1 and V2 run in parallel
- Both datasets in same PR
- Frontend can migrate gradually

## Usage Examples

### For Daily Automation (Recommended)
```bash
# Process 2 most recent versions
npm run process-data-v2:deploy
```

### For Manual Backfills
```bash
# Process all historical versions
cd data-processing-v2
npm run generate -- --all
npm run copy-to-frontend
```

### For Testing
```bash
# Test with latest only
cd data-processing-v2
npm run generate -- --latest
ls -lh dist/output/
```

### For CI/CD
```bash
# Use wrapper script with env vars
V2_MODE=recent V2_COUNT=2 bash scripts/update-instrumentation-list-v2.sh
```

## File Structure

```
instrumentation-list-2.17.yaml  ← Auto-detected
instrumentation-list-2.18.yaml  ← Auto-detected
instrumentation-list-2.19.yaml  ← Auto-detected
instrumentation-list-2.20.yaml  ← Auto-detected (marked as latest)
instrumentation-list-3.0.yaml   ← Auto-detected (excluded by default)

data-processing-v2/
├── src/
│   ├── versionDetector.ts      ← NEW: Auto-detection logic
│   ├── index.ts                ← UPDATED: CLI with modes
│   └── ...
└── scripts/
    └── update-instrumentation-list-v2.sh  ← NEW: Wrapper script

scripts/
└── update-instrumentation-list-v2.sh  ← NEW: Integration script
```

## Commands Reference

| Command | Versions Processed |
|---------|-------------------|
| `npm run generate` | 2 most recent |
| `npm run generate -- --latest` | Latest only |
| `npm run generate -- --recent 3` | 3 most recent |
| `npm run generate -- --all` | All versions |
| `npm run generate -- --versions 2.20` | Specific version |
| `npm run generate -- --include-3.0` | Include hypothetical 3.0 |

## What's Next?

### Immediate (Ready Now)
1. ✅ Update GitHub Actions workflow
2. ✅ Test in staging
3. ✅ Deploy to production

### Future Enhancements
- [ ] Add release date detection from GitHub API
- [ ] Support pre-release/beta versions
- [ ] Add telemetry for pipeline metrics
- [ ] Cache improvements for faster builds

## Summary

🎉 **The V2 pipeline now requires ZERO manual configuration!**

- ✅ Auto-detects versions from YAML files
- ✅ Integrates with existing workflow
- ✅ Supports flexible processing modes
- ✅ Tested and ready for production
- ✅ 44 tests passing
- ✅ Documented for future maintainers

**Simply drop YAML files in the repo and run the pipeline!**






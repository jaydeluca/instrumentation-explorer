# V2 Data Architecture Migration - PR Summary

## Overview
This PR migrates the Instrumentation Explorer from V1 (single large JSON file) to V2 (content-addressed storage with multi-version support). This represents a complete modernization of the data architecture while maintaining full backward compatibility with the existing frontend.

## Key Improvements

### 📦 Data Storage
- **Before**: Single 3.2 MB `instrumentation-list-enriched.json` file
- **After**: Content-addressed storage with ~805 KB total (43.2% deduplication savings)
- **Multi-version support**: Can serve multiple agent versions simultaneously (currently 2.21 and 3.0-hypothetical)
- **Lazy loading**: Instrumentation details loaded on-demand, not upfront
- **3.0 Projection**: Includes hypothetical 3.0 version to demonstrate future breaking changes

### 🚀 Performance
- **Duplicate fetch prevention**: In-flight request caching eliminates duplicate network requests
- **CDN-friendly**: Content-addressed files are immutable and can be cached indefinitely
- **Faster initial load**: Only loads index and version manifest initially (~80 KB vs 3.2 MB)

### 🎨 User Experience  
- **Semantic convention grouping**: Raw names like `HTTP_CLIENT_SPANS`, `HTTP_SERVER_METRICS` now display as `HTTP`
- **Better organization**: Clear separation between versions, manifests, and content files

## Architecture Changes

### New V2 Data Pipeline (`data-processing-v2/`)
```
YAML Files → Parse → Content Hash → Deduplicate → Generate Files
  ↓
frontend/public/data/
  ├── index.json          (80 KB - search/browse)
  ├── versions.json       (2 KB - version list)
  ├── versions/
  │   ├── 2.20.json      (27 KB - manifest)
  │   └── 2.21.json      (27 KB - manifest)
  └── instrumentations/
      └── {hash}.json    (255 files - content-addressed)
```

###  Key Features
- **Automatic version detection** from YAML files
- **Content hashing** (SHA-256, 12 chars) for deduplication
- **Comprehensive test coverage** (44 tests passing)
- **TypeScript** with strict mode

## Frontend Changes

### New Utilities
- `frontend/src/utils/dataLoader.ts` - V2 data loading with caching
- `frontend/src/utils/dataAdapter.ts` - V2 → V1 compatibility layer
- `frontend/src/utils/semconvUtils.ts` - Semantic convention display names
- `frontend/src/types-v2.ts` - V2 type definitions

### Updated Components
- `App.tsx` - Uses V2 loader
- `LibraryDetail.tsx` - Loads individual libraries on-demand
- `TelemetryDiff.tsx` - Loads versions for comparison
- `JarAnalyzerPage.tsx` - Uses V2 loader
- `About.tsx` - Uses V2 version list

### Migration Strategy
Used an adapter pattern to convert V2 data → V1 Library format, allowing zero changes to display logic while completely replacing the data layer.

## GitHub Actions Updates

### Consolidated Workflow
- **Before**: Separate workflows for instrumentation list and library READMEs
- **After**: Single `update-instrumentation-data.yml` workflow that:
  1. Downloads latest instrumentation-list.yaml
  2. Generates V2 content-addressed data
  3. Downloads library README files
  4. Creates single PR with all updates

### CI/CD Improvements
- **ci-build.yml**: Now uses V2 pipeline, removed Python dependencies
- **deploy.yml**: Updated Node.js action versions
- **Unified automation**: All data updates in one workflow

## Files Changed

### Added
- `data-processing-v2/` (entire new pipeline)
  - src/: TypeScript source files
  - tests/: Comprehensive test suite
  - scripts/: Deployment scripts
- `frontend/src/utils/dataLoader.ts`
- `frontend/src/utils/dataAdapter.ts`
- `frontend/src/utils/semconvUtils.ts`
- `frontend/src/types-v2.ts`
- `frontend/public/data/` (V2 data structure)

### Modified
- `frontend/src/App.tsx`
- `frontend/src/LibraryDetail.tsx`
- `frontend/src/TelemetryDiff.tsx`
- `frontend/src/JarAnalyzerPage.tsx`
- `frontend/src/About.tsx`
- `frontend/package.json` (removed prebuild script)
- `package.json` (updated scripts for V2)
- `readme.md` (updated documentation)
- `.github/workflows/update-instrumentation-list.yml` (consolidated)
- `.github/workflows/ci-build.yml` (V2 pipeline)
- `.github/workflows/deploy.yml` (updated Node version)

### Removed
- `frontend/public/instrumentation-list-enriched.json` (3.2 MB)
- `frontend/src/instrumentation-list.json`
- `frontend/scripts/parse-yaml.mjs`
- `.github/workflows/update-library-readmes.yml` (consolidated)

## Testing

### Test Coverage
- ✅ 44 tests passing in data-processing-v2
- ✅ Frontend builds successfully
- ✅ All linting passes
- ✅ Dev server runs without errors

### Manual Testing
- ✅ Browse library list
- ✅ View individual library details
- ✅ Version comparison works
- ✅ JAR analyzer functions
- ✅ Search and filters work
- ✅ Semantic conventions display correctly
- ✅ No duplicate network requests

## Backward Compatibility

### Data Format
- V1 data processing script (`data-processing/`) kept as `process-data:legacy`
- Can still generate old format if needed

### Frontend
- Adapter layer ensures zero breaking changes to components
- All existing features work identically

## Deployment Notes

### Prerequisites
- Node.js 20+ required
- No Python dependencies needed for CI builds anymore

### Build Commands
```bash
# Generate V2 data
npm run process-data:deploy

# Build frontend
npm run build

# Run tests
npm run test:all
```

### GitHub Actions
- Workflow runs daily at 9 AM UTC
- Can be manually triggered with optional README version parameter
- Automatically creates PRs when changes detected

## Migration Benefits

| Metric | V1 | V2 | Improvement |
|--------|----|----|-------------|
| **Initial Load** | 3.2 MB | ~80 KB | 97.5% reduction |
| **Total Size (3 versions)** | 3.2 MB | 805 KB | 75% reduction |
| **Versions Supported** | 1 | Multiple (2.21 + 3.0) | ∞ scalable |
| **CDN Caching** | Version-based | Content-based | Better efficiency |
| **Duplicate Requests** | Yes | No | Fixed |
| **Tests** | 0 | 44 | Production-ready |

## Future Enhancements

- Add more historical versions (2.17, 2.18, 2.19)
- Implement search index for faster client-side search
- Add version 3.0 support
- Consider service worker for offline support

## Breaking Changes

**None.** This is a drop-in replacement that maintains 100% compatibility with the existing user experience while completely modernizing the underlying architecture.


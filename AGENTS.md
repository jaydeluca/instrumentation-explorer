# AGENTS.md

## Project Overview

Instrumentation Explorer is a web-based tool for exploring Java instrumentation libraries from OpenTelemetry. It helps developers understand library capabilities, telemetry data (metrics/spans), semantic convention adherence, and version differences.

**Architecture:**
- **TypeScript Data Pipeline** (`data-processing-v2/`) - Content-addressed data generation with deduplication
- **React Frontend** (`frontend/`) - TypeScript/Vite application with Material-UI components
- **Data Flow:** YAML → TypeScript processing → Content-addressed JSON → React lazy loading

**Key Features:**
- Library browsing with search/filter capabilities
- Detailed library views with telemetry analysis
- Version comparison tool showing telemetry differences
- JAR analyzer for multi-library analysis
- Semantic convention highlighting
- GitHub Pages compatible routing

## Development Environment Setup

### Prerequisites
- Python 3.x with pip (for YAML download scripts)
- Node.js 20.x with npm
- Internet access for GitHub API calls (optional, for updates)

### Bootstrap Process
**CRITICAL: Never cancel long-running commands. Use appropriate timeouts:**

1. **Install Node.js dependencies:**
   ```bash
   # From repository root
   npm install
   ```
   *Takes ~45 seconds. Uses npm workspaces.*

2. **Generate V2 data (optional - data is pre-generated):**
   ```bash
   cd data-processing-v2
   npm run generate
   npm run copy-to-frontend
   ```
   *Takes ~5 seconds. Creates content-addressed JSON in `frontend/public/data/`*

3. **Start development server:**
   ```bash
   cd frontend
   npm run dev
   ```
   *Available at http://localhost:5173/instrumentation-explorer/*

## Build and Test Commands

### Development
```bash
# Development server (from frontend/)
npm run dev

# Generate V2 data (from data-processing-v2/)
npm run generate
npm run copy-to-frontend

# Update instrumentation data from GitHub (from root)
python scripts/update-instrumentation-list.py
```

### Build
```bash
# Production build (from frontend/)
npm run build
# Builds React app with Vite

# Build data-processing-v2
cd data-processing-v2
npm run build
```

### Testing
```bash
# Lint (from frontend/)
npm run lint

# Unit tests with Vitest (from frontend/)
npm run test:run        # Run once
npm run test            # Watch mode

# E2E tests with Playwright (from frontend/)
npm run test:e2e        # Requires build first
npx playwright install chromium  # One-time setup

# All tests (from root)
npm run test:all        # Lint + unit + build + E2E
```

## Code Style Guidelines

### TypeScript/React
- React 19 with TypeScript 5.8
- Use Material-UI components and theming
- Follow existing component patterns in `frontend/src/`
- Key interfaces defined in `types.ts`
- Client-side routing with React Router

### TypeScript (Data Processing)
- Use content-addressed storage for deduplication
- Implement efficient multi-version support
- Output to `frontend/public/data/` directory structure
- Follow patterns in `data-processing-v2/src/`

### Python (Scripts)
- Use requests and pyyaml for YAML downloads
- Handle GitHub API rate limiting gracefully
- Minimal processing - just download and 3.0 generation

### File Structure
```
├── data-processing-v2/      # TypeScript data pipeline with content-addressing
├── frontend/                # React application
│   ├── src/                # Source code
│   ├── public/data/        # Content-addressed JSON files
│   └── dist/               # Build output
├── scripts/                # Python automation scripts (YAML downloads)
└── instrumentation-list-*.yaml  # Source YAML data
```

## Testing Instructions

### Test Types
- **Unit Tests (Vitest):** Component logic and utility functions
- **E2E Tests (Playwright):** Complete user workflows including routing
- **GitHub Pages Routing:** Special redirect handling for direct URLs

### Test Validation
Always run these before committing:
```bash
cd frontend
npm run lint
npm run test:run
npm run build
```

### End-to-End Scenarios
Test these workflows after changes:
1. Browse library list on home page
2. Search/filter libraries by name or semantic convention
3. Navigate to library detail view
4. Use version comparison tool
5. Test JAR analyzer functionality
6. Verify theme switching
7. Test direct URL access (GitHub Pages routing)

## Pull Request Guidelines

### Commit Requirements
- Run full test suite: `npm run test:all`
- Ensure build succeeds without TypeScript errors
- Verify data processing pipeline completes successfully
- Test key user workflows manually

### CI Pipeline
PRs automatically run:
- ESLint linting
- Unit tests (Vitest)
- Build verification
- E2E tests (Playwright)
- Screenshot generation

### Code Review Checklist
- Preserve existing functionality
- Test across different instrumentation versions
- Maintain semantic convention highlighting
- Ensure responsive design
- Verify GitHub Pages routing compatibility

## Security Considerations

### Data Processing
- Use GitHub API tokens via environment variables
- Implement rate limiting and caching
- Validate data sources and inputs
- Never commit tokens or sensitive data

### Frontend
- Sanitize user inputs in search/filter functionality
- Use secure routing practices
- Handle API responses safely
- Implement proper error boundaries

## Architecture Notes

### Data Pipeline
- Source: OpenTelemetry `instrumentation-list-*.yaml` files
- Processing: TypeScript pipeline generates content-addressed JSON
- Output: Multi-file structure with deduplication (~45% space savings)
- Versioning: Auto-detection and multi-version lazy loading (2.18+)

### Key Components
- `App.tsx`: Main router and application shell
- `SearchAndFilter.tsx`: Home page with library browsing
- `LibraryDetail.tsx`: Individual library information
- `TelemetryDiff.tsx`: Version comparison tool
- `JarAnalyzerPage.tsx`: Multi-library analysis
- `types.ts`: Core TypeScript interfaces

### Special Features
- **GitHub Pages Routing:** Client-side routing with 404.html redirect system
- **Semantic Convention Integration:** Real-time highlighting from OpenTelemetry specs
- **Version Diffing:** GitHub-style diffs showing telemetry changes
- **Theme System:** Default and Grafana themes with context provider

## Common Issues

### Build Problems
- Missing enriched JSON → Run data processing pipeline first
- TypeScript errors → Check type definitions and imports
- Build warnings about chunk size → Expected due to large data files

### Runtime Issues
- Direct URL 404s → Handled by GitHub Pages routing system
- GitHub API rate limiting → Expected during data processing, non-blocking
- Playwright failures → May fail in restricted environments

### Development
- Data processing warnings → GitHub API limits are expected
- Long installation times → Normal for npm workspaces and Playwright
- Test failures → Ensure build completed before running E2E tests

## Automation

### Data Updates
- GitHub Actions run daily to update instrumentation data
- Manual updates via `python scripts/update-instrumentation-list.py`
- Screenshot generation for PRs via Playwright automation

### Deployment
- Static site deployment via GitHub Pages
- Build artifacts in `frontend/dist/`
- Client-side routing compatibility ensured
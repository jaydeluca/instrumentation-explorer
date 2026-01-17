# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Primary Documentation

**📋 For complete development guidance, refer to `AGENTS.md` in the repository root.**

The `AGENTS.md` file contains comprehensive instructions following the industry standard [agents.md specification](https://agents.md/) including:

- Project architecture and setup procedures
- Development environment configuration
- Build and test commands with timing expectations
- Code style guidelines for TypeScript/React and Python
- Testing instructions (unit tests, E2E tests, validation)
- Pull request requirements and CI pipeline details
- Security considerations and common troubleshooting

## Quick Reference

### Essential Commands
```bash
# Bootstrap (run in order)
npm install                    # Install all workspace dependencies (~45 sec)
npm run process-data           # Generate content-addressed data (~5 sec)
npm run build                  # Build frontend

# Development Commands (from root)
npm run dev                    # Start dev server at localhost:5173/instrumentation-explorer/
npm run process-data           # Re-run TypeScript data processing pipeline
npm run update-instrumentation # Download latest instrumentation data from OTel repo

# Testing Commands (from root)
npm run lint                   # ESLint frontend code
npm run test:run              # Run unit tests once
npm run test                  # Run unit tests in watch mode
npm run test:e2e              # Run E2E tests (requires build first)
npm run test:all              # Run lint + unit tests + build + E2E tests

# Other Commands
npm run screenshots           # Generate screenshots with Playwright
npm run install-browsers      # Install Playwright browsers
```

### Architecture Overview
- **TypeScript Pipeline:** `data-processing-v2/` generates content-addressed data with ID-prefixed filenames
- **React Frontend:** TypeScript + Vite + Material-UI with lazy-loaded data
- **Storage Format:** ID-prefixed content-hashed files (e.g., `aws-sdk-1.11-48c8b39bee75.json`)
- **Data Flow:** OpenTelemetry YAML → TypeScript processing → Content-addressed JSON → React lazy loading
- **README Storage:** Shared directory with ID-prefixed READMEs (`data/library_readme/{id}-{hash}.md`)
- **Workspace Structure:** Uses npm workspaces with frontend as a workspace

### Key Technologies
- **Frontend:** React 19, TypeScript 5.8, Vite 7, Material-UI 7, React Router 6
- **Testing:** Vitest (unit), Playwright (E2E), Testing Library
- **Python:** requests, pyyaml for GitHub API processing
- **Deployment:** GitHub Pages with client-side routing support

### Critical Notes
- Never cancel long-running commands (data processing, npm install)
- GitHub API warnings during data processing are expected and non-blocking
- Data processing generates ID-prefixed files: `{id}-{hash}.json` for instrumentations, `{id}-{hash}.md` for READMEs
- READMEs stored in shared `data/library_readme/` directory (no version-specific duplication)
- Generated files in `frontend/public/data/` should never be manually edited
- Use GitHub Pages routing system with 404.html redirect for direct URLs

**⚠️ Always reference `AGENTS.md` for complete guidance - this file is a minimal bridge until agents.md is natively supported.**
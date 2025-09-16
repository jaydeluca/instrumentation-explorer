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
cd data-processing && pip install requests pyyaml
python3 main.py  # Creates enriched JSON (~10 sec)
npm install      # Install all workspace dependencies (~45 sec)
npm run build    # Build frontend

# Development Commands (from root)
npm run dev                    # Start dev server at localhost:5173/instrumentation-explorer/
npm run process-data           # Re-run Python data processing pipeline
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
- **Python Pipeline:** `data-processing/main.py` enriches YAML with semantic conventions
- **React Frontend:** TypeScript + Vite + Material-UI consuming enriched JSON
- **Key Output:** `frontend/public/instrumentation-list-enriched.json` (generated file)
- **Data Flow:** OpenTelemetry YAML → Python enrichment → JSON → React consumption
- **Workspace Structure:** Uses npm workspaces with frontend as a workspace

### Key Technologies
- **Frontend:** React 19, TypeScript 5.8, Vite 7, Material-UI 7, React Router 6
- **Testing:** Vitest (unit), Playwright (E2E), Testing Library
- **Python:** requests, pyyaml for GitHub API processing
- **Deployment:** GitHub Pages with client-side routing support

### Critical Notes
- Never cancel long-running commands (data processing, npm install)
- GitHub API warnings during data processing are expected and non-blocking
- Always run data processing before frontend build to generate enriched JSON
- Use GitHub Pages routing system with 404.html redirect for direct URLs
- Generated file `frontend/public/instrumentation-list-enriched.json` should never be manually edited

**⚠️ Always reference `AGENTS.md` for complete guidance - this file is a minimal bridge until agents.md is natively supported.**
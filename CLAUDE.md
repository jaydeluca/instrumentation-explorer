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
cd ../frontend && npm install  # (~45 sec)
npm run build

# Development  
npm run dev  # Available at localhost:5173/instrumentation-explorer/

# Testing
npm run lint && npm run test:run && npm run build
```

### Architecture Overview
- **Python Pipeline:** `data-processing/main.py` enriches YAML with semantic conventions
- **React Frontend:** TypeScript + Vite + Material-UI consuming enriched JSON
- **Key Output:** `frontend/public/instrumentation-list-enriched.json` (generated file)

### Critical Notes
- Never cancel long-running commands (data processing, npm install)  
- GitHub API warnings during data processing are expected and non-blocking
- Always run data processing before frontend build
- GitHub Pages routing uses special 404.html redirect system

**⚠️ Always reference `AGENTS.md` for complete guidance - this file is a minimal bridge until agents.md is natively supported.**
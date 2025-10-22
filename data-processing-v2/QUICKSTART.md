# Quick Start - Data Processing V2

## TL;DR

```bash
# One command to generate and deploy
npm run generate:deploy
```

That's it! Data is now in `frontend/public/data/`.

---

## Common Commands

### From `data-processing-v2/` directory:

| What you want to do | Command |
|---------------------|---------|
| Generate and deploy to frontend | `npm run generate:deploy` |
| Just generate (don't copy) | `npm run generate` |
| Just copy (after generating) | `npm run copy-to-frontend` |
| Run tests | `npm test` |
| Watch tests | `npm run test:watch` |

### From repository root:

| What you want to do | Command |
|---------------------|---------|
| Generate and deploy | `npm run process-data-v2:deploy` |
| Just generate | `npm run process-data-v2` |

---

## First Time Setup

```bash
# 1. Install dependencies
cd data-processing-v2
npm install

# 2. Generate and deploy
npm run generate:deploy

# 3. Verify it worked
ls -lh ../frontend/public/data/
```

You should see:
- `index.json` (~61 KB)
- `versions.json` (~327 B)  
- `versions/` directory
- `instrumentations/` directory (255 files)

---

## What Gets Generated?

```
dist/output/              Frontend gets copied to:
├── index.json     ────► frontend/public/data/index.json
├── versions.json  ────► frontend/public/data/versions.json
├── versions/      ────► frontend/public/data/versions/
└── instrumentations/ ─► frontend/public/data/instrumentations/
```

---

## Troubleshooting

**"Source directory does not exist"**  
→ Run `npm run generate` first

**"Required file missing"**  
→ Check generation output for errors

**Tests failing**  
→ Run `npm test` to see what's wrong

---

## Need More Help?

- **Detailed guide**: See [USAGE.md](./USAGE.md)
- **Full README**: See [README.md](./README.md)
- **Implementation details**: See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)


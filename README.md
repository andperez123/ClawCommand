# ClawCommand

**OpenClaw Control Dashboard** — configuration intelligence and compliance layer for OpenClaw environments.

## Overview

ClawCommand provides:

- **Phase 1 (MVP):** File-based scanner → inventory → validation → policy engine → patch generation. No runtime takeover.
- **Phase 2 (Optional):** Node Agent daemon for live orchestration, job execution, log streaming, restart control.

## Quick Start

1. **Build:** `npm run build`
2. **Start API:** `npm run api` (runs on port 4000)
3. **Start Dashboard:** `npm run dev:dashboard` (runs on port 3000)
4. **Run scanner:** `node packages/scanner/dist/cli.js --token dev` (or `--export snapshot.json` to save locally)

Or run a full scan and view in the dashboard:
```bash
# Terminal 1
npm run api

# Terminal 2
npm run dev:dashboard

# Terminal 3
node packages/scanner/dist/cli.js --token dev
```

## Repo Structure

```
packages/
  shared/      # Snapshot schema + types
  scanner/     # openclaw-scan CLI
  api/         # Control plane API
  dashboard/   # React/Next.js web app
docs/
  PROJECT_PLAN.md
  ARCHITECTURE.md
```

## Development Milestones

1. Scanner + Snapshot Upload ✓  
2. Config Parser + Normalizer ✓  
3. Validation Engine ✓  
4. Diff Engine ✓  
5. Policy Engine ✓  
6. Patch Generator  
7. Production Hardening (auth token validation in place; RBAC, audit, DB pending)  

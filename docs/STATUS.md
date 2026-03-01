# ClawCommand — Project Status & Live Testing Guide

> Last updated: 2026-02-28

---

## 1. What Is ClawCommand?

ClawCommand is a **configuration intelligence and compliance dashboard** for OpenClaw environments. It answers: *"What is actually deployed across my OpenClaw agents, and is it correct?"*

**Core workflow:**
```
Local machine (or remote host)          Control Plane              Dashboard
┌───────────────────────┐         ┌──────────────────┐     ┌──────────────────┐
│  openclaw-scan CLI    │──POST──▶│  Express API      │◀────│  Next.js UI      │
│  • discovers agents   │ /api/   │  • stores scans   │     │  • inventory     │
│  • parses configs     │ scans   │  • validates      │     │  • validation    │
│  • reads MCP servers  │         │  • diffs scans    │     │  • policy checks │
│  • reads skills       │         │  • policy engine  │     │  • diff view     │
│  • reads run history  │         │  • SQLite storage │     │  • run history   │
└───────────────────────┘         └──────────────────┘     └──────────────────┘
```

The scanner is **read-only** — no shell execution, no remote control, no secret extraction.

---

## 2. Monorepo Structure

```
packages/
  shared/      →  TypeScript types & snapshot schema     (COMPLETE)
  parser/      →  Config parsers + normalizer            (COMPLETE, full tests)
  scanner/     →  openclaw-scan CLI                      (FUNCTIONAL, no tests)
  api/         →  Express control-plane API               (FUNCTIONAL, tested)
  dashboard/   →  Next.js web UI                         (FUNCTIONAL, no tests)
```

---

## 3. Feature Completion Matrix

### Phase 1 — Scanner + Dashboard (MVP)

| Feature                      | Status      | Notes                                      |
|------------------------------|-------------|--------------------------------------------|
| Scanner CLI (`openclaw-scan`)| ✅ Done     | Discovers agents, skills, MCP, runs        |
| Snapshot upload (POST)       | ✅ Done     | Auth via Bearer token                      |
| Snapshot export (--export)   | ✅ Done     | Save JSON locally without API              |
| Config parser (agents)       | ✅ Done     | AGENTS.md, JSON, openclaw.config.json      |
| Config parser (skills)       | ✅ Done     | SKILL.md frontmatter parsing               |
| Config parser (MCP servers)  | ✅ Done     | openclaw.json, mcp.json, auth detection    |
| Config parser (runs/history) | ✅ Done     | Log line parsing, 5MB limit, max 100 runs  |
| Normalizer                   | ✅ Done     | ID generation, cross-refs, defaults        |
| Validation engine            | ✅ Done     | Required fields, duplicates, missing names  |
| Diff engine                  | ✅ Done     | Added/removed/modified across entities      |
| Policy engine                | ✅ Done     | Skill pinning, MCP auth, agent source rules |
| Compliance scoring           | ✅ Done     | Color-coded badge in dashboard             |
| Dashboard — Inventory view   | ✅ Done     | Agents, skills, MCP servers, runs          |
| Dashboard — Validation panel | ✅ Done     | Issues with severity, evidence, fixes      |
| Dashboard — Policy panel     | ✅ Done     | Violations with rule name and remediation  |
| Dashboard — Diff view        | ✅ Done     | Compare any two scans side-by-side         |
| Dashboard — Run history      | ✅ Done     | Success/failure badges, error signatures   |
| Remote scanning script       | ✅ Done     | SCP + SSH for headless nodes               |
| Patch generator              | ❌ Not started | Planned: one-click config fixes         |
| RBAC / multi-user            | ❌ Not started | Single-token auth only for now           |
| Audit log                    | ❌ Not started | No action logging yet                    |

### Phase 2 — Live Agent Daemon (Future)

| Feature                  | Status         |
|--------------------------|----------------|
| Node Agent daemon        | ❌ Not started |
| Live restart/control     | ❌ Not started |
| Job execution            | ❌ Not started |
| Log streaming            | ❌ Not started |

---

## 4. Deployment Readiness

| Area                 | Status      | Details                                             |
|----------------------|-------------|-----------------------------------------------------|
| Docker               | ✅ Ready    | Multi-stage build, Alpine, tini, health checks      |
| docker-compose       | ✅ Ready    | Persistent volume, env config, auto-restart          |
| Fly.io               | ✅ Ready    | fly.toml configured (LAX region, auto-stop)          |
| CI/CD                | ✅ Ready    | GitHub Actions: Node 18/20/22, build, test, Docker   |
| Auth                 | ✅ Basic    | Bearer token, dev mode fallback                      |
| CORS                 | ✅ Ready    | Configurable origins via env                         |
| Rate limiting        | ✅ Ready    | 120 req/min per IP (configurable)                    |
| Static dashboard     | ✅ Ready    | Next.js static export served by API in production    |
| SQLite persistence   | ✅ Ready    | WAL mode, volume-mounted, 500 scan cap               |
| HTTPS                | ✅ via Fly  | Fly.io forces HTTPS automatically                    |
| Secrets management   | ⚠️ Basic   | .env tokens, no vault/rotation                       |
| DB migrations        | ❌ Missing  | Schema created on startup, no versioned migrations    |

**Bottom line:** The app is deployable today for single-user / small-team use via Docker or Fly.io. Not yet hardened for multi-tenant SaaS.

---

## 5. Live Testing on an OpenClaw Agent

### Option A: One Command (30 seconds)

Scan your workspace with zero setup — the `./scan` script handles everything:

```bash
git clone <repo-url> && cd ClawCommand
./scan -p /path/to/your/workspace
```

The `./scan` script auto-installs dependencies and builds on first run. A snapshot JSON is saved to the current directory.

### Option B: Full Dashboard (5 minutes)

See scan results in a web UI with inventory, validation, policy checks, and diffs:

```bash
# 1. Clone and setup
git clone <repo-url> && cd ClawCommand
npm run setup

# 2. Start API (Terminal 1)
npm run api

# 3. Start Dashboard (Terminal 2)
npm run dev:dashboard

# 4. Scan and upload (Terminal 3)
npm run scan:upload
# or: ./scan -t dev

# 5. Open http://localhost:3000
```

The `dev` token works automatically in non-production mode.

### Option C: Docker (self-contained, persistent)

```bash
cp .env.example .env
# Edit CLAWCOMMAND_TOKENS in .env

docker compose up -d
# → API + Dashboard on http://localhost:4000

./scan -t <your-token>
```

### Option D: Remote Agent Scanning (Pi / server / VM)

```bash
# Build the standalone bundle
npm run bundle -w @clawcommand/scanner

# Scan a remote host (requires SSH + Node.js on remote)
./scripts/scan-remote.sh pi@192.168.1.50 /home/pi/my-project

# Upload the saved snapshot
curl -X POST http://localhost:4000/api/scans \
  -H "Authorization: Bearer dev" \
  -H "Content-Type: application/json" \
  -d @snapshot-*.json
```

### Option E: Deploy to Fly.io (public URL)

```bash
fly launch --copy-config --no-deploy
fly secrets set CLAWCOMMAND_TOKENS="your-secure-token"
fly deploy

# Scan from any machine
CLAWCOMMAND_API_URL=https://your-app.fly.dev ./scan -t your-secure-token
```

---

## 6. What the Scanner Actually Discovers

When you run `openclaw-scan`, it finds and reports:

| Entity       | Where it looks                                                       |
|--------------|----------------------------------------------------------------------|
| **Agents**   | `.cursor/AGENTS.md`, `~/.openclaw/agents/*.json`, `openclaw.config.json` |
| **Skills**   | `.cursor/skills-cursor/`, `~/.cursor/skills-cursor/`, `~/.openclaw/skills/`, `skills/` |
| **MCP Servers** | `openclaw.json`, `mcp.json` from `.cursor/`, `~/.openclaw/`, workspace root |
| **Runs**     | `~/.openclaw/logs/`, `.cursor/logs/` (JSON + text formats)           |

Secrets are automatically redacted (password, secret, apikey, token patterns replaced with `[REDACTED]`).

---

## 7. What You See in the Dashboard

Once a scan is uploaded:

1. **Inventory tab** — Full list of agents, skills, MCP servers with status badges
2. **Validation panel** — Issues found (missing names, duplicate IDs, empty configs)
3. **Policy panel** — Compliance violations (unpinned skills, unauthenticated MCP, missing agent source)
4. **Diff view** — Select two scans and see what changed (added/removed/modified)
5. **Run history** — Past agent runs with success/failure, error signatures
6. **Compliance badge** — Overall score (green/yellow/red)

Every issue links back to evidence (file path + entity) with a recommended fix.

---

## 8. Known Issues & Gaps

| Issue                               | Severity | Notes                                       |
|-------------------------------------|----------|---------------------------------------------|
| ~~Dashboard port mismatch~~         | ~~Bug~~  | **Fixed** — was pointing to 4001, now 4000  |
| No scanner tests                    | Medium   | Parser is tested; scanner orchestration is not |
| No dashboard tests                  | Medium   | Components are functional but untested       |
| No patch generator                  | Low      | Planned feature — not blocking MVP           |
| No DB migrations                    | Low      | Schema auto-creates; may matter for upgrades |
| 500 scan cap (in-memory store)      | Low      | SQLite store has no practical limit          |
| No error boundaries in dashboard    | Low      | Unhandled component errors could crash UI    |

---

## 9. Quick Reference — All Commands

```bash
# ─── One-command scan ────────────────────────────────
./scan                                 # Scan cwd, save snapshot
./scan -p /path/to/workspace           # Scan specific directory
./scan -t dev                          # Scan + upload to local API
./scan -e snapshot.json                # Scan + save to named file
./scan --include-runs                  # Include run history
./scan --json                          # Raw JSON to stdout (for piping)

# ─── npm scripts ─────────────────────────────────────
npm run setup                          # Install + build everything
npm run scan                           # Scan cwd
npm run scan:upload                    # Scan + upload (dev token)

# ─── Build & test ────────────────────────────────────
npm run build                          # Build all packages
npm run build:all                      # Build all + dashboard export
npm test                               # Run parser + API tests

# ─── Servers ─────────────────────────────────────────
npm run api                            # Start API (port 4000)
npm run dev:api                        # API in dev mode (auto-reload)
npm run dev:dashboard                  # Dashboard dev (port 3000)

# ─── Advanced ────────────────────────────────────────
npm run bundle -w @clawcommand/scanner # Build standalone bundle
./scripts/scan-remote.sh user@host     # Remote scan via SSH

# ─── Docker / Fly.io ────────────────────────────────
docker compose up -d
docker compose down
fly deploy
fly secrets set CLAWCOMMAND_TOKENS="token"
```

---

## 10. Environment Variables

| Variable                   | Default              | Description                              |
|----------------------------|----------------------|------------------------------------------|
| `PORT`                     | `4000`               | API server port                          |
| `LOG_LEVEL`                | `info`               | Logging level                            |
| `NODE_ENV`                 | —                    | `production` for prod deployments        |
| `CLAWCOMMAND_TOKENS`       | —                    | Comma-separated API tokens               |
| `CLAWCOMMAND_ALLOW_ANON`   | `0`                  | `1` to allow unauthenticated access      |
| `CLAWCOMMAND_DB_PATH`      | `./data/clawcommand.db` | SQLite database file path             |
| `CLAWCOMMAND_STORE`        | —                    | `memory` for in-memory (no persistence)  |
| `CLAWCOMMAND_CORS_ORIGINS`  | —                   | Comma-separated allowed origins          |
| `CLAWCOMMAND_RATE_LIMIT`   | `120`                | Max requests per IP per minute           |
| `CLAWCOMMAND_API_URL`      | `http://localhost:4000` | Scanner target API URL               |
| `NEXT_PUBLIC_API_URL`      | `http://localhost:4000` | Dashboard API URL                     |

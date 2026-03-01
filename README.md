# ClawCommand

**Configuration intelligence for OpenClaw.** Scan your agents, skills, and MCP servers. See what's deployed, what's misconfigured, and what drifted.

---

## One-Command Scan

```bash
git clone https://github.com/anthropics/ClawCommand.git /tmp/clawcommand && /tmp/clawcommand/scan -p .
```

That's it. The `scan` script auto-installs dependencies and builds on first run.

**Already cloned?** Just run:

```bash
./scan
```

**Already built?** Use npm directly:

```bash
npm run scan
```

The scanner auto-discovers your OpenClaw workspace — agents, skills, MCP servers, and run history. Output is a snapshot JSON file saved to your current directory.

---

## What You Get

```
────────────────────────────────────────────────────────
  ClawCommand Scan Results
────────────────────────────────────────────────────────

  Workspace   /home/user/my-project
  Scan ID     a1b2c3d4-...
  Timestamp   2026-03-01T12:00:00.000Z

  Discovered:
    ● 2 agents (default, code-reviewer)
    ● 4 skills (create-rule, create-skill, update-settings, deploy)
    ● 3 MCP servers (github, postgres, filesystem)

  Heads up:
    ⚠  2 unpinned skills
    ⚠  1 MCP server without auth

  ✓ Saved to clawcommand-scan-my-project-2026-03-01T12-00-00.json
────────────────────────────────────────────────────────
```

---

## Full Dashboard (Optional)

Want the web UI with inventory, validation, policy checks, and diff view?

```bash
# Terminal 1 — start the API + dashboard
npm run api

# Terminal 2 — start the dashboard dev server
npm run dev:dashboard

# Terminal 3 — scan and upload
npm run scan:upload
```

Then open **http://localhost:3000**.

The dashboard shows:
- **Inventory** — all agents, skills, MCP servers with status badges
- **Validation** — missing names, duplicate IDs, empty configs
- **Policy** — unpinned skills, unauthenticated MCP, missing agent source
- **Diff** — compare any two scans side-by-side
- **Run History** — past agent runs with success/failure and error signatures
- **Compliance Score** — color-coded badge (green/yellow/red)

---

## Scanner CLI Reference

```bash
# Scan current directory (auto-saves snapshot file)
./scan

# Scan a specific workspace
./scan -p /path/to/workspace

# Scan and upload to the dashboard API
./scan -t dev

# Save to a specific file
./scan -e my-snapshot.json

# Include run/job history from logs
./scan --include-runs

# Raw JSON to stdout (for piping)
./scan --json
./scan --json | jq '.mcpServers'

# Quiet mode (no summary, just save/upload)
./scan --quiet -e snapshot.json
```

---

## How It Works

```
Your Machine                    ClawCommand
┌───────────────────────┐       ┌──────────────────────┐
│  ./scan               │       │  API (Express)       │
│  • discovers agents   │─POST─▶│  • stores snapshots  │
│  • parses configs     │       │  • validates configs │
│  • reads MCP servers  │       │  • checks policies   │
│  • reads skills       │       │  • computes diffs    │
│  • reads run history  │       │                      │
│  (read-only, no       │       │  Dashboard (Next.js) │
│   secrets extracted)  │       │  • inventory view    │
└───────────────────────┘       │  • compliance panel  │
                                └──────────────────────┘
```

The scanner is **read-only** — no shell execution, no remote control, no secret extraction. Secrets are automatically redacted before any output.

---

## What Gets Scanned

| Entity         | Locations checked                                                      |
|----------------|------------------------------------------------------------------------|
| **Agents**     | `.cursor/AGENTS.md`, `~/.openclaw/agents/`, `openclaw.config.json`     |
| **Skills**     | `.cursor/skills-cursor/`, `~/.cursor/skills-cursor/`, `~/.openclaw/skills/`, `skills/` |
| **MCP Servers**| `~/.openclaw/openclaw.json`, `~/.cursor/mcp.json`, `.cursor/mcp.json`  |
| **Runs**       | `~/.cursor/logs/`, `.cursor/logs/` (JSON + text, 5MB limit, max 100)   |

---

## Remote Scanning

Scan a headless server, Raspberry Pi, or VM over SSH:

```bash
# Build the standalone bundle first
npm run bundle -w @clawcommand/scanner

# Scan a remote host (requires SSH access + Node.js on remote)
./scripts/scan-remote.sh user@192.168.1.50 /home/user/workspace
```

---

## Docker Deployment

```bash
cp .env.example .env
# Edit CLAWCOMMAND_TOKENS in .env

docker compose up -d
# → API + Dashboard on http://localhost:4000

# Scan from host and upload
./scan -t <your-token>
```

---

## Fly.io Deployment

```bash
fly launch --copy-config --no-deploy
fly secrets set CLAWCOMMAND_TOKENS="your-secure-token"
fly deploy

# Scan from any machine
CLAWCOMMAND_API_URL=https://your-app.fly.dev ./scan -t your-secure-token
```

---

## Project Structure

```
packages/
  shared/      # TypeScript types & snapshot schema
  parser/      # Config parsers + normalizer (tested)
  scanner/     # openclaw-scan CLI
  api/         # Express control-plane API (tested)
  dashboard/   # Next.js web UI
```

## Environment Variables

| Variable                    | Default                   | Description                        |
|-----------------------------|---------------------------|------------------------------------|
| `PORT`                      | `4000`                    | API server port                    |
| `CLAWCOMMAND_TOKENS`       | —                         | Comma-separated API tokens         |
| `CLAWCOMMAND_ALLOW_ANON`   | `0`                       | `1` to skip auth                   |
| `CLAWCOMMAND_API_URL`      | `http://localhost:4000`   | Scanner target API                 |
| `CLAWCOMMAND_DB_PATH`      | `./data/clawcommand.db`  | SQLite database path               |
| `NODE_ENV`                  | —                         | `production` for prod              |

## All Commands

```bash
npm run setup          # Install + build everything
npm run scan           # Scan current workspace
npm run scan:upload    # Scan + upload to local API (dev token)
npm run api            # Start API server (port 4000)
npm run dev:api        # Start API in dev mode (auto-reload)
npm run dev:dashboard  # Start dashboard (port 3000)
npm run build          # Build all packages
npm run build:all      # Build all packages + dashboard static export
npm test               # Run parser + API tests
```

---

## License

MIT

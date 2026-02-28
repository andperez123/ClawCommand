# ClawCommand Architecture

Quick reference for development.

## Monorepo Layout

```
ClawCommand/
├── packages/
│   ├── shared/           # Snapshot schema + types
│   ├── parser/           # Agent/MCP/skill/run parsers + normalizer
│   ├── scanner/          # openclaw-scan CLI (Node/TypeScript)
│   ├── api/              # Control plane API (Node)
│   └── dashboard/        # React/Next.js web app
├── docs/
├── .cursor/rules/
└── README.md
```

## Data Flow (Phase 1)

```
Local Machine                    Control Plane (SaaS)
┌─────────────────┐              ┌──────────────────────────────┐
│ openclaw-scan   │──snapshot──▶│ Ingestion API                 │
│ (read-only)     │   (JSON)     │   → Parser/Normalizer        │
└─────────────────┘              │   → Diff Engine              │
                                 │   → Policy Engine            │
                                 │   → Dashboard (React)        │
                                 └──────────────────────────────┘
```

## Key Paths to Scan (OpenClaw)

- `~/.openclaw/openclaw.json` — main config
- `.cursor/` — Cursor-specific (agents, rules)
- `~/.cursor/` — user-level Cursor settings
- Skills, MCP configs — locations from OpenClaw/Cursor conventions

## Entities (Core)

| Entity | Phase 1 | Phase 2 |
|--------|---------|---------|
| Workspace | ✓ inferred from path | ✓ |
| Node | inferred | ✓ explicit |
| Agent | ✓ | ✓ |
| Skill | ✓ | ✓ |
| MCP Server | ✓ | ✓ |
| Tool | ✓ | ✓ |
| Run | ✓ (from logs) | ✓ |
| Scan | ✓ | ✓ |
| Policy | ✓ | ✓ |
| Violation | ✓ | ✓ |
| PatchBundle | ✓ | ✓ |

## Scanner Output (Snapshot Schema)

```json
{
  "scanId": "uuid",
  "timestamp": "ISO8601",
  "workspacePath": "/path/to/workspace",
  "agents": [...],
  "skills": [...],
  "mcpServers": [...],
  "runs": [...]  // optional, --include-runs
}
```

Secrets are always masked (never uploaded).

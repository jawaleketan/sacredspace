# Project Documentation

This workspace (`01/`) contains the **SacredSpace** application plus supporting
agent-skill collections and the BMAD planning framework.

## Workspace Overview

| Folder | What it is |
|--------|-----------|
| [`sacredspace/`](../sacredspace) | **The app** — a TanStack Start directory of Hindu mantras & stotras with a Clerk-gated admin panel, TipTap editor, likes, saved collections, audio recitations, and dynamic OG images. Deploys to Vercel. |
| [`skills/`](../skills) | Unified collection of **74 Agent Skills** (Anthropic examples, Vercel Labs engineering skills, marketing skills) with a Claude Code marketplace manifest. |
| `_bmad/` | BMAD framework config. Writes planning/implementation artifacts into this `docs/` folder (see `_bmad/custom/config.toml`). |
| `docs/` | This folder — project documentation + BMAD artifacts. |

## Documentation Map

### Getting started
- **[SETUP.md](./SETUP.md)** — Quick start: install, env vars, run dev server. Links to the canonical [`sacredspace/SETUP.md`](../sacredspace/SETUP.md) for DB options, deployment, and troubleshooting.

### Understanding the system
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Tech stack, data model, server-function patterns, cold-start DB bootstrap, anonymous identity design, deployment topology, and known gaps.
- **[`planning/prds/`](./planning/prds)** — Product requirements (BMAD artifacts).
- **[`planning/architecture/`](./planning/architecture)** — Architecture spine from the planning phase.
- **[`planning/ux-designs/`](./planning/ux-designs)** — UX specifications.

### Tracking work
- **[`analysis-2026-08-31.md`](./analysis-2026-08-31.md)** — Archived improvement audit (Aug–Sep 2026); most items now resolved.
- **[`implementation/deferred-work.md`](./implementation/deferred-work.md)** — Feature backlog with split-out scopes and completion evidence.
- **[`implementation/spec-sacredspace-scaffold.md`](./implementation/spec-sacredspace-scaffold.md)** — The original scaffold spec (completed).
- **[`brainstorming/`](./brainstorming)** — Ideation session outputs.

## Quick Reference

```bash
# Run the app locally
cd sacredspace
npm install
npm run dev          # http://localhost:3000 (DB auto-seeds on first run)
```

Required env vars in `sacredspace/.env.local`: `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`. See [SETUP.md](./SETUP.md).

## Note on BMAD Output Location

BMAD previously wrote artifacts to `_bmad-output/` (now retired). The durable
override in `_bmad/custom/config.toml` points new planning artifacts to
`docs/planning/`, implementation artifacts to `docs/implementation/`, and
project knowledge to `docs/`.
<p align="center">
  <h1 align="center">🧠 claude-cortex</h1>
  <p align="center">
    <strong>Give Claude Code a long-term memory.</strong><br>
    <em>Persistent knowledge across sessions, projects, and devices — no database, no cloud, just files.</em>
  </p>
  <p align="center">
    <a href="#quick-start">Quick Start</a> &middot;
    <a href="#features">Features</a> &middot;
    <a href="#architecture">Architecture</a> &middot;
    <a href="docs/best-practices.md">Best Practices</a> &middot;
    <a href="CONTRIBUTING.md">Contributing</a>
  </p>
  <p align="center">
    <a href="https://github.com/renefichtmueller/claude-cortex/stargazers"><img src="https://img.shields.io/github/stars/renefichtmueller/claude-cortex?style=flat-square&color=yellow" alt="Stars"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"></a>
    <a href="https://github.com/renefichtmueller/claude-cortex/issues"><img src="https://img.shields.io/github/issues/renefichtmueller/claude-cortex?style=flat-square" alt="Issues"></a>
    <a href="https://github.com/renefichtmueller/claude-cortex/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome"></a>
  </p>
</p>

---

## The Problem

> **[🚀 Live Demo](https://claude-cortex-demo.pages.dev)** — Try it in your browser, no installation needed.

Every time you start a new Claude Code session, Claude starts from zero. It doesn't know:

- What you were working on yesterday
- Why you made that architecture decision three weeks ago
- That one obscure fix that took you four hours to find
- Your coding preferences, project conventions, or deployment quirks
- Which integrations are set up and how they work

You end up repeating yourself. Re-explaining context. Re-discovering solutions. Losing momentum.

## The Solution

**claude-cortex** is a structured, file-based persistent memory framework that gives Claude Code long-term memory across sessions, projects, and devices.

It uses a hierarchy of Markdown files that Claude reads at session start and updates at session end. No database. No server. No API keys. Just files that travel with your project.

> Built from a real production system managing 25+ knowledge files across multiple projects.

## Before & After

| Without Memory | With Memory |
|---|---|
| Re-explain project context every session | Claude reads `MEMORY.md` and is immediately caught up |
| Forget why a decision was made | Decision log captured in project files |
| Re-discover the same fix twice | Incident runbooks document every fix |
| Inconsistent code style across sessions | Feedback files encode your preferences |
| Lost research and useful links | Reference files archive discoveries |
| No idea what was done last session | Activity log tracks every session |
| Single-project tunnel vision | Cross-project knowledge sharing |
| Context lost when switching machines | Sync via Dropbox, iCloud, or Git |

## Architecture

```
MEMORY.md (Master Index)
    |
    +-- Activity Log
    |       Session timestamps, work done, next steps
    |
    +-- Project Files
    |       Per-project: stack, architecture, patterns, status
    |
    +-- Integration Docs
    |       API endpoints, auth flows, gotchas
    |
    +-- Incident Runbooks
    |       Bug -> root cause -> fix -> prevention
    |
    +-- Feedback / Preferences
    |       Code style, commit conventions, review patterns
    |
    +-- Reference Archive
    |       Papers, tools, libraries, research notes
    |
    +-- Cross-Project Patterns
            Shared solutions, reusable snippets
```

The `MEMORY.md` file is the entry point. It serves as a concise index (max 200 lines) that points to topic-specific files. Claude reads the index first, then loads relevant files based on the current task.

```
Session Start                          Session End
     |                                      |
     v                                      v
Read MEMORY.md -----> Work on tasks -----> Update activity log
     |                                      |
     v                                      v
Load relevant    <--- Claude has full ---> Record new patterns,
topic files           context               incidents, decisions
```

## Quick Start

### Option A: npx (fastest)

```bash
# From your project directory
npx claude-cortex init my-project
```

### Option B: Clone and set up

```bash
git clone https://github.com/renefichtmueller/claude-cortex.git
cd claude-cortex
chmod +x setup.sh
./setup.sh

# From your project directory
/path/to/claude-cortex/scripts/init.sh my-project
```

This creates a `.claude/memory/` directory in your project with all templates pre-configured.

### 3. Tell Claude to use it

Add this to your project's `.claude/CLAUDE.md`:

```markdown
## Memory System
At the START of every session, read `.claude/memory/MEMORY.md` and load relevant topic files.
At the END of every session, update the activity log with: what was done, decisions made, next steps.
When you learn something reusable (pattern, fix, gotcha), add it to the relevant topic file.
```

That's it. Claude now has persistent memory.

## How Files Get Updated (The Actual Process)

This is the most common question — here's exactly what happens:

### Session Start (Claude reads)
```
You: "Let's work on the auth system"

Claude (automatically):
  1. Reads .claude/memory/MEMORY.md (the index)
  2. Sees: project-api.md has auth docs, activity-log.md has last session
  3. Reads those files
  4. Now knows: "Last session we migrated from JWT to cookies. Next step: update middleware."
  5. Starts working — no context-rebuilding conversation needed
```

### During Work (Claude updates as it goes)
```
You fix a tricky Prisma bug together.

Claude (automatically):
  1. Creates .claude/memory/incident-prisma-null-filter.md
  2. Documents: the error, root cause, fix, prevention
  3. Updates project-api.md with the new pattern
  → Next time this bug appears in ANY project, Claude already knows the fix
```

### Session End (Claude writes summary)
```
You: "Let's wrap up"

Claude (automatically):
  1. Appends to activity-log.md:
     ## 2025-03-19 | Session 12
     **Done:** Fixed Prisma null filter bug, updated auth middleware
     **Decisions:** Using { field: { not: true } } pattern for nullable booleans
     **Next:** Test protected routes, deploy to staging
  2. Updates MEMORY.md index if new files were created
```

### What Triggers Updates?

| Event | What Claude Does |
|---|---|
| Session starts | Reads `MEMORY.md` + relevant topic files |
| Bug gets fixed | Creates/updates `incident-*.md` with root cause + fix |
| Architecture decision made | Updates `project-*.md` with the decision and reasoning |
| New integration added | Creates/updates `integration-*.md` with endpoints, auth, gotchas |
| New pattern discovered | Updates `feedback-*.md` or creates `reference-*.md` |
| Session ends | Appends to `activity-log.md` with done/decisions/next |
| New tool/library found | Creates `reference-*.md` with evaluation notes |

### Key Insight: It's Instruction-Driven

The files don't update themselves — Claude updates them because your `CLAUDE.md` **instructs** it to. The templates provide the structure, the instructions provide the behavior. You can customize both:

```markdown
# Minimal (just session tracking):
At session end, update the activity log.

# Standard (recommended):
At session start, read memory. At session end, update activity log.
When fixing bugs, document in incident files. When making decisions, update project files.

# Maximum (full knowledge capture):
At session start, read ALL memory files.
During work, update relevant files in real-time.
Document every decision, pattern, fix, and discovery.
At session end, write detailed activity log with blockers and next steps.
Cross-reference between files when patterns connect.
```

The more specific your instructions, the more consistently Claude maintains the memory.

## Features

### Session Continuity
Activity logs track what was done in each session, what decisions were made, and what comes next. No more "where were we?" conversations.

```markdown
## 2025-01-15 | Session 4
**Done:** Migrated auth from JWT to session cookies, updated all API routes
**Decisions:** Chose cookie-based auth for better SSR support
**Next:** Update middleware, test protected routes, deploy to staging
**Blockers:** None
```

### Cross-Project Knowledge
Patterns discovered in one project are available everywhere. Fix a tricky Prisma edge case in Project A? The knowledge is there when you hit the same issue in Project B.

### Incident Runbooks
Document every significant bug fix with root cause and solution. The same issue never costs you time twice.

### Integration Documentation
API endpoints, authentication flows, rate limits, known quirks. Everything needed to work with external services, written once and always available.

### Research Archive
Papers, tools, libraries, and patterns discovered during work. Build a knowledge base that grows with every session.

### Feedback Loop
Claude learns your preferences over time: code style, commit message format, review priorities, naming conventions. Encoded in files, not lost between sessions.

### Device Sync
Memory files are plain Markdown. Sync them with Dropbox, iCloud, Google Drive, or Git. Work on your desktop, continue on your laptop.

### Validation & Health Checks
Scripts to verify memory structure, find stale entries, and report statistics about your knowledge base.

```bash
./scripts/validate.sh    # Check memory structure health
./scripts/stats.sh       # Show memory statistics
```

## File Types

| Template | Purpose | Update Frequency |
|---|---|---|
| `MEMORY.md` | Master index, entry point for every session | When adding new files |
| `activity-log.md` | Session-by-session work log | Every session |
| `project-*.md` | Project-specific knowledge | As architecture evolves |
| `integration-*.md` | External service documentation | When integrations change |
| `incident-*.md` | Bug fix runbooks | After each significant fix |
| `feedback-*.md` | Preferences and patterns | As preferences solidify |
| `reference-*.md` | Research and discovery archive | When finding useful resources |

## Examples

This repo includes two complete example memory setups:

- **[`examples/fullstack-saas/`](examples/fullstack-saas/)** - A full-stack SaaS application with dashboard, API, infrastructure docs, and activity log
- **[`examples/mobile-app/`](examples/mobile-app/)** - A mobile app project with iOS frontend, backend API, and cross-platform patterns

Each example demonstrates realistic memory content that a team might build up over weeks of development.

## Scripts

| Script | Description |
|---|---|
| `scripts/init.sh` | Initialize memory structure in a project |
| `scripts/sync.sh` | Sync memory files across devices |
| `scripts/validate.sh` | Validate memory structure and find issues |
| `scripts/stats.sh` | Display memory statistics |

## Documentation

- **[Architecture](docs/architecture.md)** - How the memory system works internally
- **[Best Practices](docs/best-practices.md)** - Tips for building effective memory
- **[Patterns](docs/patterns.md)** - Common memory patterns and when to use them
- **[FAQ](docs/faq.md)** - Frequently asked questions

## How It Compares

| Approach | Persistence | Structure | Multi-Project | No Server | Portable |
|---|---|---|---|---|---|
| **claude-cortex** | File-based | Hierarchical templates | Yes | Yes | Yes |
| Pasting context manually | None | Ad-hoc | No | Yes | No |
| Custom MCP server | Database | Custom schema | Maybe | No | No |
| CLAUDE.md alone | Single file | Flat | No | Yes | Yes |
| Vector DB + embeddings | Database | Semantic | Maybe | No | No |

## Tips

1. **Keep MEMORY.md under 200 lines.** It's an index, not a dump. Point to topic files.
2. **Update the activity log every session.** This is the single most valuable habit.
3. **Be specific in incident runbooks.** Include the exact error message, root cause, and fix.
4. **Cross-reference between files.** Link project files to relevant incidents and patterns.
5. **Prune quarterly.** Archive stale entries. Memory should be current and relevant.
6. **Use the validation script.** Run `./scripts/validate.sh` weekly to catch structural issues.

## Related Projects

- **[claude-sync](https://github.com/renefichtmueller/claude-sync)** — Sync your cortex across all your devices. Desktop, laptop, work machine — one brain everywhere.
- **[slop-radar](https://github.com/renefichtmueller/slop-radar)** — Detect AI-generated slop in text. Drop it into Claude Code as a skill to check output quality.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Areas where help is especially appreciated:
- Additional templates for common project types
- Integration examples for popular tools and services
- Scripts for additional sync backends
- Translations of documentation

## License

[MIT](LICENSE) - Use it however you want.

---

<p align="center">
  If this helps your workflow, consider giving it a star.
  <br>
  <a href="https://github.com/renefichtmueller/claude-cortex">
    <img src="https://img.shields.io/github/stars/renefichtmueller/claude-cortex?style=social" alt="GitHub Stars">
  </a>
</p>

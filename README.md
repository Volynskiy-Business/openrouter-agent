# OpenRouter Multi-Agent Orchestrator

> **AI-оркестратор** с командой специализированных субагентов, config-driven маршрутизацией, policy guardrails, structured audit log и frontend track.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-Agent_SDK-orange)](https://openrouter.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                     CLI Layer                        │
│   /ask  /plan  /code  /review  /landing  /dashboard  │
├──────────────────────────────────────────────────────┤
│                  Orchestrator Layer                   │
│   Router Engine │ Escalation │ Dry-Run               │
├──────────────────────────────────────────────────────┤
│              Policy / Guardrails Layer                │
│   Allowlist Engine │ Approval Gate │ Budget Enforcer  │
├──────────────────────────────────────────────────────┤
│                  Sub-Agent Pool                       │
│   🧠 Planner  ⚡ Fast Coder  🏗️ Heavy Coder         │
│   ⚖️ Judge    🎨 Frontend Builder                    │
├──────────────────────────────────────────────────────┤
│              Action Ledger / Audit Log                │
│   Structured JSONL: who, why, model, cost, tokens    │
└──────────────────────────────────────────────────────┘
```

## Agents

| Agent | Role | Default Model |
|-------|------|---------------|
| 🧠 Planner | Task decomposition, multi-step workflow | `inclusionai/ring-2.6-1t:free` |
| ⚡ Fast Coder | Code, patches, tests, quick tasks | `deepseek/deepseek-v4-flash:free` |
| 🏗️ Heavy Coder | Architecture, refactoring, complex debug | `poolside/laguna-m.1:free` |
| ⚖️ Judge | Final review, quality gate | `openai/gpt-oss-120b:free` |
| 🎨 Frontend Builder | Plan/draft pages, dashboards | `deepseek/deepseek-v4-flash:free` |

> **Production Rule:** All customer-facing app/web/frontend builds are executed through Claude Code (Antigravity IDE). OpenRouter agents provide planning, comparison, and support.

## Budget Modes

| Mode | Behavior |
|------|----------|
| `strict` | Free models only. Zero cost. |
| `balanced` | Paid allowed for high-risk/high-complexity tasks only. |
| `max_quality` | Paid allowed per routing policy. Still cost-capped. |

## Quick Start

```bash
# Clone
git clone git@github.com:Volynskiy-Business/openrouter-agent.git
cd openrouter-agent

# Install
npm install

# Configure
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

# Run
npm start
```

## CLI Commands

| Command | Action |
|---------|--------|
| `/ask <prompt>` | Auto-route to best agent |
| `/plan <prompt>` | Force Planner agent |
| `/code <prompt>` | Force Coder agent |
| `/review <prompt>` | Force Judge agent |
| `/landing <brief>` | Landing page pipeline |
| `/dashboard <spec>` | Dashboard pipeline |
| `/dry-run <prompt>` | Show plan without executing |
| `/budget` | Show budget status |
| `/budget mode <m>` | Set budget mode |
| `/audit [n]` | Show last n audit entries |
| `/models` | Show agents and models |
| `/help` | Show help |
| `/exit` | Exit |

## Tools (14)

- **Filesystem:** `read_file`, `write_file`, `list_files`
- **Shell:** `run_command` (allowlist + HITL approval)
- **Git:** `git_status`, `git_diff` (read-only)
- **Validation:** `run_tests`, `run_linter`, `typecheck`, `run_build`
- **Frontend:** `read_preview_errors`
- **Governance:** `log_decision`, `show_budget`, `route_explain`

## Safety

- **Shell allowlist** — only approved commands can execute
- **Shell blocklist** — destructive commands (`rm -rf`, `sudo`, `curl`...) always blocked
- **HITL approval** — dangerous actions pause for human confirmation
- **Sandbox boundary** — validation tools run only inside project workspace
- **Budget caps** — per-call and daily spending limits

## Testing

```bash
npm test
```

## Project Structure

```
src/
├── types.ts                    # Core type definitions
├── config/
│   ├── models.ts               # Model registry + agent configs
│   ├── routing.ts              # Routing rules + task classifier
│   ├── policy.ts               # Allowlists, blocklists, safety levels
│   └── budget.ts               # Budget modes + limits
├── core/
│   ├── agent.ts                # Agent call execution
│   ├── orchestrator.ts         # Central orchestration hub
│   ├── router.ts               # Task→agent→model routing
│   ├── escalation.ts           # Rules-based escalation
│   └── dry-run.ts              # Dry-run mode
├── policy/
│   ├── guardrails.ts           # Pre-execution validation
│   ├── approval.ts             # HITL approval gate
│   └── budget-enforcer.ts      # Budget tracking + enforcement
├── audit/
│   ├── ledger.ts               # JSONL audit writer
│   └── reporter.ts             # Audit log querying
├── tools/
│   ├── index.ts                # Tool registry
│   ├── filesystem.ts           # read_file, write_file, list_files
│   ├── shell.ts                # run_command
│   ├── git.ts                  # git_status, git_diff
│   ├── validation.ts           # tests, linter, typecheck, build
│   ├── frontend.ts             # read_preview_errors
│   └── governance.ts           # log_decision, show_budget, route_explain
└── cli/
    ├── index.ts                # Entry point
    ├── commands.ts             # Command parser
    └── display.ts              # Colored output
```

## License

MIT — Volynskiy Business

# ADR-0025 — Interactive Explorer mode

## Context

FFVS 1.0–1.1 shipped a strong **command-mode** CLI (`ffvs status`, `ffvs inspect`, …) plus a presentation layer (`src/cli/ui`). Users still leave the tool after every verb. The product goal is continuous **exploration** of the semantic graph without becoming an IDE, Electron app, or heavy TUI framework.

## Decision

Add **Interactive Mode** (FFVS Explorer) as a second entry beside Command Mode:

| Entry                         | Behavior                                            |
| ----------------------------- | --------------------------------------------------- |
| `ffvs <command> …`            | One-shot Command Mode (unchanged contracts)         |
| `ffvs` / `ffvs explore` (TTY) | Continuous session: menus + `FFVS ›` prompt + stack |
| `ffvs` in CI / non-TTY        | Safe fallback help — never blocks pipelines         |

### Architecture

```text
CLI
 ├── Command Mode  → application → core
 └── Interactive Mode
       InteractiveSession + NavigationStack
            ↓
       same application / core APIs (load model once)
```

Presentation stays in `src/cli/interactive/` + existing `src/cli/ui`. No semantic/graph/QL changes.

### Guarantees

- `--json` never enters interactive presentation
- `NO_COLOR` / `FFVS_ASCII` respected via shared terminal caps
- Index loaded **once** per session
- Esc / `b` / Backspace pop navigation; `q` quits
- Errors surface as in-session message views; session continues

### Deliberately out

- Full TUI frameworks, web UI, Electron, code editing
- New query/graph semantics

## Alternatives

| Alternative                      | Why rejected                           |
| -------------------------------- | -------------------------------------- |
| Replace CLI with Ink/Blessed app | Heavy; fights CLI-first ADR-0002       |
| Only improve one-shot help       | Does not create continuous exploration |
| Always start interactive         | Breaks CI/pipes; violates non-TTY rule |

## Consequences

- Package minor bump (**1.2.0**): additive UX surface
- Docs document both modes; ADR linked from CLI guide
- Tests cover parse/nav/TTY gates without requiring a live TTY loop

## Status

Accepted — 2026-09-09

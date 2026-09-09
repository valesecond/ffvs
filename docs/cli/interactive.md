# Interactive Explorer

Continuous exploration mode for FFVS. Complements **Command Mode**; does not replace it.

## Start

```bash
ffvs              # TTY → Explorer session
ffvs explore      # explicit alias
```

Non-TTY or `CI=true` (or `FFVS_NO_INTERACTIVE=1`) prints a short fallback and Command Mode help — never hangs a pipeline.

## Keyboard

| Key       | Action           |
| --------- | ---------------- |
| ↑ / ↓     | Move selection   |
| Enter     | Select / open    |
| Esc / b   | Back             |
| Backspace | Back             |
| `/`       | Search           |
| `:`       | Command prompt   |
| `p`       | Command palette  |
| `?`       | Help             |
| `q`       | Quit session     |
| Ctrl+C    | Arm quit (twice) |

## In-session commands

At `FFVS ›` (press `:`):

```text
search UserService
inspect UserService
dependencies UserService
callers loadUser
impact repository.ts
path app.ts repository.ts
query select functions describe
functions
help
quit
```

## Navigation

The session keeps a **stack**: Home → list → entity → relation → …  
Back restores the previous frame. Breadcrumbs stay visible in the header.

Results (search, deps, impact, path, query) are **selectable** — Enter opens that entity and exploration continues.

## Model lifecycle

```text
ffvs → load project/index once → many operations → quit
```

Interactive Mode does not re-open `.ffvs/` on every menu action.

## Relation to Command Mode

| Mode        | Best for                             |
| ----------- | ------------------------------------ |
| Interactive | Human exploration, discovery         |
| Command     | Scripts, CI, `--json`, muscle memory |

Same application APIs; same semantics; no QL/graph changes.

See [ADR-0025](../design-decisions/ADR-0025-interactive-explorer.md).

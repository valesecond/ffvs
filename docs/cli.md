# FFVS CLI design

Human-facing terminal presentation for FFVS. Machine output (`--json`) is untouched.

## Modes

| Mode                     | Entry                         | Role                   |
| ------------------------ | ----------------------------- | ---------------------- |
| **Interactive Explorer** | `ffvs` / `ffvs explore` (TTY) | Continuous exploration |
| **Command Mode**         | `ffvs <command> …`            | One-shot, scripts, CI  |

Interactive details: [`cli/interactive.md`](./cli/interactive.md) · [ADR-0025](./design-decisions/ADR-0025-interactive-explorer.md).

## Principles

- Minimal, semantic, precise
- Color communicates meaning (resolution, errors) — never decoration spam
- Trees for relations / path / impact
- No banners on every command (except Explorer entry)
- Spinners only while work is in progress (TTY, not CI)

## Environment

| Variable / condition    | Effect                                          |
| ----------------------- | ----------------------------------------------- |
| `--json`                | Pure JSON on stdout; no colors, icons, spinners |
| `NO_COLOR`              | No ANSI colors; structure kept                  |
| `CI=true`               | Static output; no animation; no interactive     |
| non-TTY stdout          | No spinner; no interactive Explorer             |
| `FFVS_NO_INTERACTIVE=1` | Force Command Mode fallback for bare `ffvs`     |
| `FFVS_ASCII=1`          | ASCII icons instead of Unicode                  |

## Symbols

| Meaning    | Unicode | ASCII       |
| ---------- | ------- | ----------- |
| Section    | ◆       | `*`         |
| Entity     | ●       | `*`         |
| Resolved   | ✓       | `[ok]`      |
| Ambiguous  | ?       | `[?]`       |
| Unresolved | ×       | `[x]`       |
| External   | ○       | `[ext]`     |
| Out / in   | → / ←   | `->` / `<-` |

## Layout module

`src/cli/ui/` — theme, icons, terminal caps, and command renderers.  
`src/cli/interactive/` — Explorer session, navigation stack, keyboard.  
`src/cli/format.ts` adapts application results into the UI layer.

## Examples

See README and `examples/demo`.

# Language vision

FFVS Query Language is a **read-only**, compositional interface over the same Query Core used by the CLI.

## Why it exists

CLI verbs discovered the query model. Multi-step intents required copying entity ids between commands (EXP-DSL-0001). The language threads a ResultSet through stages instead.

## Problem it solves

- Durable, reviewable multi-step queries
- Shared vocabulary with the query algebra
- No duplicated graph logic

## Status

| Layer          | Status                                |
| -------------- | ------------------------------------- |
| Spec           | `docs/language/*`                     |
| Implementation | **v0.1 thin slice** in FFVS **0.6.0** |
| Command        | `ffvs query '…'`                      |

CLI explore commands remain fully supported.

## Architecture

```text
CLI commands ─┐
              ├→ Query Core → Graph
DSL query ────┘
```

# EXP-DESCRIBE-0001 — What should DESCRIBE include?

## Goal

Compare CLI `inspect` vs DSL `describe` and decide which fields earn a place in the language op.

## Side-by-side (typical function/module)

| Field / section | `inspect` | `describe` (v0.2) | Needed in pipelines? |
| --------------- | --------- | ----------------- | -------------------- |
| id | yes | yes | yes |
| kind | yes | yes | yes |
| name | yes | yes | yes |
| path | yes | yes | yes |
| file + line | yes | **no** | **yes** (jump-to-source) |
| owning module | implicit | **no** | **yes** (compose to deps) |
| exported | yes | no | nice |
| extends/implements | yes | no | rare in pipelines |
| methods list | yes | no | inspect territory |
| imports/exports lists | yes | edgeKinds count only | inspect territory |
| used-by | yes | no | use `traverse dependents` |
| relationCount / edgeKinds | no | yes | yes |

## Use cases observed

1. After SEARCH → DESCRIBE: need **where in source** (line) without leaving DSL.
2. After TRAVERSE → DESCRIBE: need **module** to continue with IMPORT questions.
3. Full import tables / method lists: already available via TRAVERSE / CLI inspect.

## Per-field decisions

| Field | Evidence | Cost | Decision |
| ----- | -------- | ---- | -------- |
| startLine / endLine | jump-to-source | low | **ADD** |
| module (id or path) | composition | low | **ADD** |
| exported | weak | low | skip |
| methods / imports lists | inspect overlap | high | **reject** (keep DESCRIBE ≠ INSPECT) |

## Decision for 0.8.0

```text
RICH DESCRIBE = minimal enrichment (location + module)
NOT a clone of inspect
```

Status: **JUSTIFIED (minimal)**.

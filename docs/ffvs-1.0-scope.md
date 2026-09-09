# FFVS 1.0 — Official product scope

## Product statement

> **FFVS turns a software project into a local semantic graph you can explore and query** — structure, dependencies, calls, paths, and impact — without sending code to the cloud.

## Version pairing

| Artifact       | Version   |
| -------------- | --------- |
| npm package    | **1.0.0** |
| Query Language | **1.0**   |

Query Language 1.0 is the **stabilized** surface formerly developed as v0.1–v0.3. No silent breaking of 0.8.x query pipelines.

## CORE (in scope)

### Lifecycle

`init` · `index` · `status` · `diagnostics` / `unresolved`

### Explore CLI

`inspect` · `files` · `functions` · `classes` · `imports` · `dependencies` / `deps` · `dependents` · `calls` · `callers` · `children` · `parents` · `search` · `path` · `impact` · `relations` · `graph`

### Query Language 1.0

`select` · `where` · `search` · `traverse` [direction] [resolution] · `path` · `impact` [along calls] · `describe`

Sequential composition of stages is **official**.

### Guarantees

- Local-first, read-only queries
- Deterministic ordering of ResultSet collections
- Explicit resolution states on IMPORTS / CALLS
- PATH uses **IMPORTS only** (documented)
- Default IMPACT uses **IMPORTS**; CALL impact only via `impact along calls`
- Cross-relation composition = sequential traverse (+ kind bridge `declares`); no JOIN (EXP-DSL-0006)

## Explicitly OUT of 1.0

| Item                                | Class                            |
| ----------------------------------- | -------------------------------- |
| AND / OR / PIPE / JOIN / aggregates | FUTURE / RESEARCH                |
| Query `scope` stage                 | REJECTED (index scope only)      |
| PATH along CALLS                    | FUTURE                           |
| Hybrid IMPORT+CALL impact           | FUTURE                           |
| Mutation / rewrite                  | REJECTED for 1.0                 |
| AI / cloud / UI / IDE extension     | REJECTED for 1.0                 |
| Non-JS/TS languages                 | FUTURE (adapter contract exists) |

## Success criterion

> Would I install FFVS on a real JS/TS project to understand structure, callers, and impact?

If yes → ship 1.0. If no → fix docs/UX/reliability first.

## Related

- [ADR-0024](./design-decisions/ADR-0024-ffvs-1-0.md)
- [Quick start](./quick-start.md)
- [Limitations](./limitations.md)
- Research remains under `research/` (not product surface)

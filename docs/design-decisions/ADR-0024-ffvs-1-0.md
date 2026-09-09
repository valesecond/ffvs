# ADR-0024 — FFVS 1.0 product release

## Context

FFVS evolved through research releases 0.1–0.8 with experiments EXP-0002 through EXP-DSL-0006. The semantic core (graph, resolution, CLI explore, Query Language) proved useful on real JS/TS corpora. Continuing indefinite experimentation without a usable product milestone would dilute the project.

## Decision

Ship **FFVS 1.0.0** with **Query Language 1.0** as a **usable, documented, installable, read-only** local CLI — not a “complete” comprehension platform.

### Stabilized

- Index + semantic graph for JS/TS
- Explore CLI verbs (structure, deps, calls, path, impact, search, diagnostics)
- Query Language stages validated through 0.8.x
- Resolution honesty (RESOLVED / AMBIGUOUS / UNRESOLVED / EXTERNAL)
- Deterministic ResultSet + JSON contract
- Sequential composition (including documented IMPORTS↔CALLS kind bridging)

### Deliberately out

- JOIN / PIPE / SQL clones / aggregates
- Query scope stage
- PATH along CALLS; hybrid IMPORT+CALL impact
- Mutation, AI, cloud, UI, IDE plugins
- Non-JS/TS languages (adapter hook exists)

### Guarantees

- Local-only; no mandatory telemetry
- Read-only queries
- Documented limitations preferred over false precision

## Alternatives

| Alternative             | Why rejected                                  |
| ----------------------- | --------------------------------------------- |
| Stay on 0.x forever     | Blocks adoption; confuses “research only”     |
| 1.0 = add AND/OR/JOIN   | Feature creep without evidence (EXP-DSL-0006) |
| Wait for multi-language | Couples release to unrelated work             |

## Consequences

- Package version `1.0.0`; language version `1.0`
- `docs/ffvs-1.0-scope.md` is the product contract
- Research continues under `research/` without blocking product docs
- Post-1.0 evolution: UNDERSTAND → REASON → OPERATE (not in this release)

## Message

> FFVS 1.0 does not mean the project is finished. It means the core is useful enough to install and use.

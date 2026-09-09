# Language semantics (implemented — v0.1)

Read-only FFVS Query Language. Executed by `src/core/language/executor.ts` over the indexed graph.

## Pipeline model

```text
ResultSet starts empty
→ select | search   seeds entities
→ where             filters entities
→ traverse          replaces entities with neighbors; keeps edges + resolution tallies
→ describe          attaches per-entity summaries
```

Each stage feeds the next. No manual entity id handoff.

## Stage semantics

| Stage | Effect |
| ----- | ------ |
| `select <kind>` | EntitySet ← all non-external/non-unresolved nodes of kind (`entities` = all) |
| `search "…"` | EntitySet ← `searchEntities` (optional `kind`, `path`) |
| `where field op "…"` | EntitySet ← filter via `matchesNode` / SelectPredicate |
| `traverse <rel> [dir]` | EntitySet ← neighbors; Relations ← traversed edges |
| `describe` | Descriptions ← incident edge summary per entity |

## WHERE operators

| Syntax | Core mode |
| ------ | --------- |
| `contains` | contains |
| `=` / `eq` | equals |
| `prefix` | prefix |

Fields: `name`, `path`. Multiple `where` stages apply sequentially (logical ∧ without an `and` keyword).

## TRAVERSE mapping

| DSL | Relation | Default direction | Module anchor |
| --- | -------- | ----------------- | ------------- |
| `imports` / `dependencies` / `deps` | IMPORTS | outbound | yes |
| `dependents` | IMPORTS | inbound | yes (resolved internal only) |
| `calls` | CALLS | outbound | no |
| `callers` | CALLS | inbound | no |
| `contains` / `children` | CONTAINS | outbound | no |
| `parents` | CONTAINS | inbound | no |
| `extends` / `implements` | EXTENDS / IMPLEMENTS | outbound | no |
| `exports` / `declares` | EXPORTS / DECLARES | outbound | yes |

Explicit `inbound` / `outbound` overrides the default direction.

## Uncertainty

CALLS/IMPORTS edge `resolution` values are **preserved**. Traverse results expose counts:

```text
RESOLVED / AMBIGUOUS / UNRESOLVED / EXTERNAL
```

Never coerced.

## Errors

| Kind | When |
| ---- | ---- |
| LEXICAL | bad char, bad string |
| PARSE | incomplete / unexpected tokens |
| SEMANTIC | unknown kind/relation; where/traverse/describe without seed |
| EXECUTION | reserved for runtime failures |

## Not in v0.1

`path`, `relations`, `impact`, `and`/`or`, aggregates, mutation.

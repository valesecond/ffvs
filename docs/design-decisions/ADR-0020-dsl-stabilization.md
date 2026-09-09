# ADR-0020: Query Language v0.1 semantic stabilization (FFVS 0.6.1)

## Status

Accepted

## Context

FFVS 0.6.0 shipped a working thin DSL. Several behaviors (duplicates, order, empty sets, relation retention across hops, SEARCH vs WHERE) were correct in code but under-specified. Expanding to PATH/IMPACT before freezing semantics risked locking in accidents.

## Decision

Ship **0.6.1** as a stabilization release:

- Formalize ResultSet, composition, dedup, ordering, empty results, SEARCH/WHERE, traverse defaults, CALLS uncertainty, JSON contract, errors, read-only.
- Make ordering/dedup/path-normalization explicitly deterministic in code where needed.
- Add EXP-DSL-0003 + stabilization tests.
- **Do not** add PATH, IMPACT, AND/OR, aggregates, or other 0.7 features.

### Concrete decisions

| Topic | Choice |
| ----- | ------ |
| ResultSet | entities + last-hop relations + optional descriptions + set-level diagnostics |
| Duplicates | unique by entity/edge id |
| Order | deterministic (`en` locale sorts) |
| Empty | success with `[]` |
| Traverse | replace set; defaults per `docs/language/traverse.md` |
| CALLS | preserve resolution; tally in diagnostics |
| JSON | documented contract; EntityRef/RelationRef compatible |
| Read-only | enforced by design; tested |

## Alternatives

1. Jump to 0.7 PATH/IMPACT — rejected (premature).
2. Keep expanding syntax — rejected.
3. Stabilize first — **accepted**.

## Consequences

### Positive

- Predictable CLI/JSON/tests.
- Clear basis to evaluate 0.7 candidates.

### Negative

- Coverage still below full CLI (PATH/IMPACT/…).
- describe remains thinner than inspect.

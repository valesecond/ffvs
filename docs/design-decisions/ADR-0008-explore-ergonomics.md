# ADR-0008 — Explore Command Ergonomics (Phase 1.5)

## Status

Accepted

## Context

After Phase 1, we need bidirectional graph exploration without a DSL. Candidate surfaces included:

1. Many explicit verbs (`dependencies`, `dependents`, `path`, …)
2. Flags on `inspect` (`inspect X --dependencies`)
3. Ultra-short aliases only (`deps`, `deps-of`)
4. A premature generic `query` command

## Decision

1. Prefer **explicit verbs** for distinct graph operations (discoverability + scripting).
2. Provide **one short alias** where highly likely: `deps` → `dependencies`.
3. Implement shared navigation in `src/core/graph/navigate.ts` (no per-command ad-hoc BFS).
4. Use **module anchoring** for IMPORTS-based questions about classes/functions.
5. Defer `callers` until `CALLS` extraction exists.
6. Standardize JSON around `EntityRef` / `RelationRef` view objects.
7. Document emerging primitives in `docs/query-model.md` instead of inventing syntax.

## Alternatives rejected

- **Only flags on inspect:** harder to script single-purpose pipelines; overloads inspect.
- **Generic query now:** freezes language design before usage evidence.
- **Duplicate reverse edges in storage:** unnecessary; compute `incoming`/`ancestors`.

## Consequences

- CLI surface grows, but each verb maps to a clear primitive.
- Future DSL can absorb verbs as keywords/functions.
- Some redundancy (`imports` vs `relations`) is accepted temporarily and noted for later consolidation.

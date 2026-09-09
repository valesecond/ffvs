# ADR-0012: FILTER model (selection predicates)

## Status

Accepted

## Context

Explore commands listed entire entity sets. Real use needs light restriction by name/path without inventing a filter language (that would anticipate the DSL).

## Decision

Expose **FILTER** as CLI flags on SELECT commands:

- `--name <substring>` (contains match)
- `--path <substring>` (contains match)

Core API: `SelectPredicate` in `src/core/query/select.ts`, used by application list helpers.

No `--where` expressions, no boolean operators, no regex mini-language in Phase 1.7.

## Alternatives

1. Full expression language — rejected (DSL premature).
2. Only JSON post-filtering — rejected (poor CLI UX).
3. Regex flags immediately — deferred until observed pressure.

## Consequences

- SELECT + FILTER compositions become natural.
- SEARCH remains a separate primitive (find candidates).
- Future DSL WHERE can map onto the same predicate core.

# ADR-0017: Query model classification

## Status

Accepted

## Context

Many CLI verbs overlap. Language design needs CORE vs DERIVED vs CONVENIENCE.

## Decision

Adopt the classification in `docs/query-model.md`:

- CORE: SELECT, FILTER, SEARCH, DESCRIBE, TRAVERSE, PATH, RELATIONS (+ index SCOPE)
- DERIVED: IMPACT
- CONVENIENCE: deps/dependents/imports/graph sugar
- EXPERIMENTAL: RANK (unimplemented)

CALLS traversals are CORE but **uncertain**.

## Alternatives

1. Treat every CLI verb as primitive — rejected (language would bloat).
2. Only graph-theoretic ops — rejected (SEARCH/FILTER are empirically CORE).

## Consequences

- Future grammar stays small.
- Convenience commands may remain forever beside the language.

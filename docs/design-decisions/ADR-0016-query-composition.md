# ADR-0016: Query composition without a DSL

## Status

Accepted

## Context

Users chain explore commands (EXP-DSL-0001). A pipe DSL is tempting but premature to code.

## Decision

1. Document composition as conceptual algebra (`docs/query-algebra.md`).
2. Keep composition as sequential CLI invocations for now.
3. Structure CORE so a future planner can call the same functions.
4. Do not implement pipeline syntax in this phase.

## Alternatives

1. Immediate `ffvs query` — rejected (no parser yet; readiness is documentation-first).
2. Shell pipes over `--json` only — useful externally; does not replace an eventual language.

## Consequences

- Research can quantify friction (id handoff).
- Implementation debt is avoided until readiness review.

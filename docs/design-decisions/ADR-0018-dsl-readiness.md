# ADR-0018: DSL readiness

## Status

Accepted

## Context

Phases 1.7–2.8 produced FILTER/SEARCH/SCOPE/CALLS, EXP-0003, EXP-DSL-0001, and a grammar draft.

## Decision

Record **`DSL IMPLEMENTATION READY`** for a thin future slice, while keeping:

```text
DSL = NOT IMPLEMENTED
```

in the product. No parser/AST/executor/`ffvs query` in this change set.

First future slice: select/where/search/traverse/describe → existing CORE.

## Alternatives

1. `DSL NOT YET JUSTIFIED` — rejected given quantified composition patterns.
2. Implement DSL immediately — rejected by project rule for this task.

## Consequences

- Spec lives under `docs/language/`.
- Next engineering milestone is explicitly scoped.

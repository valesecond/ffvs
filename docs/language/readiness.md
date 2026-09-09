# DSL readiness

## Current status (FFVS 0.6.0)

```text
DSL IMPLEMENTATION STARTED — thin slice SHIPPED
Query Language version: 0.1
```

The experimental implementation includes:

- lexer / parser / typed AST
- executor over Query Core
- `ffvs query` (+ `--json`, `--file`)
- SELECT / WHERE / SEARCH / TRAVERSE / DESCRIBE
- EXP-DSL-0002 evaluation

Still true:

```text
Full language = NOT COMPLETE
```

PATH, IMPACT, RELATIONS stages, boolean WHERE, aggregates remain deferred.

## Pre-implementation verdict (historical)

```text
DSL IMPLEMENTATION READY
```

Recorded after EXP-DSL-0001 / Phase 2.9. Preserved for research continuity.

## Post-0.6.0 checklist

| Criterion | Status |
| --------- | ------ |
| Lexer / parser / AST | done |
| Executor → Query Core | done |
| Composition without ID handoff | done |
| Semantic uncertainty preserved | done |
| CLI explore preserved | done |
| EXP-DSL-0002 | done |
| Broad CLI parity | not a goal yet |

## Next (0.7.0 candidates — not this release)

Only if EXP pressure remains:

1. `path` stage
2. `impact` sugar / transitive traverse
3. Optional `and` in WHERE
4. Better describe ≈ inspect depth

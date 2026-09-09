# ADR-0021: PATH and IMPACT in Query Language v0.2

## Status

Accepted

## Context

EXP-DSL-0001 left PATH (Q04/Q22) and IMPACT (Q03) unanswered in the DSL. CLI already implemented both. 0.6.1 stabilized v0.1 without adding stages. `docs/roadmap/ffvs-0.7.md` marked PATH and IMPACT **READY**.

## Evidence

EXP-DSL-0001/0002/0003; 0.7 proposal; EXP-DSL-0004 (+2 PASS on original 22).

## Decision

Ship Query Language **v0.2** in FFVS **0.7.0**:

- New AST stages: `PathStage`, `ImpactStage`
- Syntax: `path …`, `impact`
- Algorithms: shared `computePath` / `computeImpact` with CLI (`src/core/query/path-impact.ts`)
- PATH default relation: IMPORTS (resolved-internal); IMPACT: transitive inbound IMPORTS
- Ambiguous endpoints → SEMANTIC error; missing path → empty success

## Alternatives

1. Keep CLI-only — rejected (composition friction).
2. Encode PATH as multi-TRAVERSE sugar — rejected (different semantics).
3. Encode IMPACT as recursive TRAVERSE keyword — deferred; dedicated stage matches CLI.

## Consequences

### Positive

- Measurable expressiveness gain (14→16 PASS).
- Single algorithm shared with CLI.

### Negative

- Language surface grows; version bump 0.1→0.2.
- PATH still IMPORTS-only; IMPACT ignores CALLS.
- Q22 dual-seed composition still imperfect.

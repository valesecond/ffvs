# ADR-0015: CALLS representation

## Status

Accepted

## Context

Import-level navigation is insufficient for “who calls X?” questions observed in EXP-0002 follow-ups. JS/TS call resolution is inherently incomplete (dynamic dispatch, HOFs, aliases, etc.).

## Decision

Add relation kind `CALLS` (inverse observed as `callers` / CALLED_BY via incoming edges).

Extraction (best-effort):

- Identifier calls resolve same-file when a unique local FUNCTION/METHOD name matches → `RESOLVED`.
- Member / cross-file name binding may yield `RESOLVED` (unique project-wide callable), `AMBIGUOUS`, or `UNRESOLVED`.
- Dynamic callees → `UNRESOLVED` stub (`<dynamic>`).

Never promote uncertain inferences to absolute truth; preserve `resolution` on edge properties.

## Alternatives

1. Delay CALLS until sound analysis — rejected (blocks query model discovery).
2. Only module-level “calls” — too coarse for observed questions.
3. Type-aware resolution (TS checker) — deferred; high cost.

## Consequences

- `ffvs callers` / `ffvs calls` enable call-graph compositions.
- Limitations must appear in docs and experiments.
- Impact remains IMPORTS-based unless later redefined with evidence.

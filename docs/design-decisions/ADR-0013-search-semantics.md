# ADR-0013: SEARCH semantics

## Status

Accepted

## Context

Users need to find entities when they know a fragment of a name but not the kind or exact path. FILTER alone assumes a chosen set.

## Decision

Add `ffvs search <needle>` that:

- scans graph entities (excluding external/unresolved stubs);
- matches name / path / id with simple scoring (exact > prefix > contains);
- optionally restricts with `--kind` and `--path`;
- returns a candidate list (default limit 50).

Documented distinction:

```text
SEARCH → find candidates
FILTER → restrict an already chosen set
```

## Alternatives

1. Reuse `functions --name` only — insufficient for cross-kind discovery.
2. Full-text / fuzzy ranking — deferred.
3. Merge SEARCH into FILTER — rejected; different intent.

## Consequences

- Composition pattern: SEARCH → INSPECT / TRAVERSE.
- No claim of IR-quality ranking.

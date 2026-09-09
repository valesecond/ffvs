# ADR-0011 — Resolution Uncertainty Representation

## Status

Accepted

## Context

Phase 0–1 treated “not resolved internally” as `external: true`, conflating npm packages with failed relative resolution. EXP-0002 required distinguishing uncertainty.

## Decision

Persist on each `IMPORTS` edge:

```text
properties.resolution = RESOLVED | EXTERNAL | UNRESOLVED | AMBIGUOUS
properties.specifier
properties.candidatesChecked?  // for unresolved/ambiguous
properties.ambiguousPaths?     // for ambiguous
properties.reason?
```

Stub nodes:

- `external:<specifier>` for EXTERNAL
- `unresolved:<fromFile>::<specifier>` for UNRESOLVED / AMBIGUOUS (unique per import site)

Do not invent edges to guessed modules when AMBIGUOUS.

## Consequences

- Diagnostics and metrics can count statuses honestly.
- Impact/path only traverse RESOLVED internal module edges (plus optionally ignore stubs).

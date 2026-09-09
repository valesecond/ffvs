# IMPACT semantics (Query Language v0.3)

## Meaning

Two axes:

1. **Default `impact`** — entities that depend transitively on the seed(s) via resolved-internal **IMPORTS** (same as CLI `ffvs impact`).
2. **`impact along calls`** — entities that reach the seed via inbound **CALLS** (callers transitively). Explicit; never the silent default.

## Syntax

```text
impact
impact along imports          (* same as bare impact *)
impact along calls            (* implies resolution resolved *)
impact along calls resolution ambiguous
impact along calls resolution unresolved
```

Examples:

```text
select modules where name = "Database.js" impact describe
search "add" kind function impact along calls describe
```

## Composition

```text
SELECT/SEARCH/WHERE/PATH → IMPACT → DESCRIBE?
```

- Requires a prior seed set (may be empty → empty impact, success).
- Multiple seeds: union of impact cones; entities unique by id.
- IMPORT impact: seed modules are **not** included in `entities`.
- CALL impact: seed callables are **not** included (only inbound closure).

## ResultSet

| Field | Content |
| ----- | ------- |
| `entities` | Affected nodes, sorted |
| `relations` | `via` edges from closure |
| `impact` | `{ seedIds, affectedCount, relationKinds, along, resolution? }` |
| `diagnostics.resolutionCounts` | Tallied from those edges |

## Uncertainty

See [`uncertainty.md`](./uncertainty.md). Default CALL impact uses **RESOLVED** only. AMBIGUOUS/UNRESOLVED require an explicit `resolution` modifier.

## Core algorithms

- IMPORTS: `computeImpact` (unchanged)
- CALLS: `computeCallImpact` with optional resolution filter

## Ambiguity

LOOKUP uses the current ResultSet. IMPACT does not re-resolve names.

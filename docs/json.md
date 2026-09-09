# JSON output contract (FFVS 1.0)

Most explore commands and `ffvs query --json` emit deterministic JSON (stable key order where we control serialization; collections sorted).

## Query ResultSet (`ffvs query --json`)

```json
{
  "languageVersion": "1.0",
  "stagesApplied": ["select modules", "describe"],
  "entities": [{ "id": "...", "kind": "MODULE", "name": "...", "path": "..." }],
  "relations": [
    { "id": "...", "kind": "IMPORTS", "from": "...", "to": "...", "resolution": "RESOLVED" }
  ],
  "descriptions": [
    {
      "id": "...",
      "kind": "FUNCTION",
      "name": "...",
      "path": "...",
      "module": "module:...",
      "startLine": 1,
      "endLine": 10,
      "relationCount": 3,
      "edgeKinds": ["CALLS", "DECLARES"]
    }
  ],
  "paths": [
    {
      "found": true,
      "fromId": "...",
      "toId": "...",
      "nodeIds": [],
      "length": 2,
      "relationKinds": ["IMPORTS"]
    }
  ],
  "impact": {
    "seedIds": ["..."],
    "affectedCount": 3,
    "relationKinds": ["IMPORTS"],
    "along": "imports"
  },
  "diagnostics": {
    "messages": [],
    "resolutionCounts": {
      "RESOLVED": 0,
      "AMBIGUOUS": 0,
      "UNRESOLVED": 0,
      "EXTERNAL": 0,
      "unknown": 0
    }
  }
}
```

Notes:

- `descriptions` / `paths` / `impact` appear only after those stages.
- CALL impact includes `"along": "calls"` and usually `"resolution": "RESOLVED"`.
- Schema sketch: [`schemas/query-result.schema.json`](../schemas/query-result.schema.json)

## Explore commands

CLI explore verbs use operation-specific shapes (`operation`, `entity`, `affected`, …). Prefer `query --json` for a single ResultSet contract going forward.

## Determinism

Same index + same query → same JSON (entity/relation/description order fixed by Language 1.0 rules).

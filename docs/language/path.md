# PATH semantics (Query Language v0.2)

## Meaning

Find a **shortest directed path** between two entities on the semantic graph.

Distinct from `traverse` (neighborhood expansion of the current set).

## Syntax

```ebnf
path_stage = "path" , path_body , [ "along" , "imports" ] ;

path_body  = "from" , string , "to" , string
           | "to" , string
           | string , string
           | string ;
```

Examples:

```text
path "Controller.js" "Database.js"
path from "Controller.js" to "Database.js" along imports
select modules where name = "Controller.js" path "Database.js"
select modules where name = "Controller.js" path to "Database.js" describe
```

## Composition

| Form | Source | Target |
| ---- | ------ | ------ |
| `path "A" "B"` / `path from "A" to "B"` | lookup A | lookup B |
| `path "B"` / `path to "B"` | current ResultSet (exactly one module-anchored entity) | lookup B |

After PATH:

- `entities` = nodes on the path **in order** (empty if not found)
- `relations` = hop edges
- `paths` = `[{ found, fromId, toId, nodeIds, length, relationKinds }]`
- Downstream stages see the path node set (e.g. `describe`)

## Core algorithm

Reuses `computePath` → `findPath` (BFS), same as CLI `ffvs path`:

- Relation: **IMPORTS** only (`along imports`; other relations rejected in v0.2)
- Only **resolved internal** IMPORTS edges
- Module-anchored endpoints
- Max depth 64
- Cycles: visited set → terminates
- Deterministic: BFS first shortest path; stable JSON

## Empty / missing / ambiguous

| Case | Behavior |
| ---- | -------- |
| No path | `found=false`, `entities=[]`, success |
| Same source/target | `found=true`, `length=0` |
| Unknown name | SEMANTIC error |
| Ambiguous name | SEMANTIC error (lists candidates) |
| Multiple sources for `path "T"` | SEMANTIC error |

## Uncertainty

Path walk uses only resolved-internal IMPORTS; EXTERNAL/UNRESOLVED imports are not traversed (same as CLI). Edge resolution metadata on retained hops is preserved in `relations` / diagnostics.

# Language semantics (Query Language v0.1 — stabilized in FFVS 0.6.1)

Read-only. Executed by `src/core/language/executor.ts` over an already-loaded graph.

```text
Syntax → AST → Semantics → Query Core → ResultSet
```

## ResultSet

```text
ResultSet
├── entities        current working set (GraphNode[])
├── relations       edges from the most recent traverse only
├── descriptions?   present only after `describe`
├── diagnostics     ResultSet-level (not per-entity)
│   ├── messages[]
│   └── resolutionCounts { RESOLVED, AMBIGUOUS, UNRESOLVED, EXTERNAL, unknown }
└── stagesApplied[] human-readable stage log
```

### Field meanings

| Field          | Meaning                                                                              |
| -------------- | ------------------------------------------------------------------------------------ |
| `entities`     | Unique entities in the current set (by node `id`)                                    |
| `relations`    | Edges collected by the **last** `traverse`; cleared by `select` / `search` / `where` |
| `descriptions` | Summaries materialised by `describe` only; cleared if a later stage mutates the set  |
| `diagnostics`  | Whole-result metadata; `resolutionCounts` reflect current `relations`                |

### Stage effects

| Stage      | Transforms entities?                   | Relations                        | Descriptions |
| ---------- | -------------------------------------- | -------------------------------- | ------------ |
| `select`   | **Replace** (new seed)                 | cleared                          | cleared      |
| `search`   | **Replace** (new seed)                 | cleared                          | cleared      |
| `where`    | **Filter** (subset, order preserved)   | cleared                          | cleared      |
| `traverse` | **Replace** with unique neighbors      | set to last-hop edges            | cleared      |
| `path`     | **Replace** with path nodes (ordered)  | hop edges; `paths` metadata      | cleared      |
| `impact`   | **Replace** with transitive dependents | closure edges; `impact` metadata | cleared      |
| `describe` | unchanged                              | unchanged                        | materialised |

`traverse` does **not** union seeds with neighbors. Multi-hop: `traverse callers traverse calls` — second hop starts from first-hop results.

## Deduplication

Neighbors reached via multiple seeds collapse to one entity per `id`.

```text
A → C
B → C
traverse → {C}   (not {C,C})
```

Edges are unique by edge `id`. Multiplicity is not preserved (entity-set semantics, not bag/multiset).

## Ordering

**Guaranteed deterministic** for observable outputs on a fixed index:

| Collection                       | Order                                         |
| -------------------------------- | --------------------------------------------- |
| `entities` after select/traverse | `(name ?? id)`, then `id`, locale `en`        |
| `entities` after where           | relative order of prior list (already sorted) |
| `entities` after search          | score desc, then name/id (`en`)               |
| `relations`                      | edge `id` ascending (`en`)                    |
| `descriptions`                   | same order as `entities`                      |

Not undefined; not filesystem-dependent after the graph is loaded.

## Empty results

```text
select functions where name = "doesNotExist"
search "doesNotExist"
… traverse callers   # when no neighbors
```

→ **success**: `entities = []`, exit code 0 (CLI), not an error.

## SEARCH vs WHERE

|             | SEARCH                                                  | WHERE                            |
| ----------- | ------------------------------------------------------- | -------------------------------- |
| Role        | Find candidates (seed)                                  | Restrict current set             |
| Needle case | **Insensitive** (lowercased)                            | **Sensitive**                    |
| Matches     | name / path / id scoring                                | `name` or `path` only            |
| Ops         | implicit contains/prefix/eq scoring                     | `contains` / `eq`/`=` / `prefix` |
| Limit       | default 50                                              | none                             |
| Optional    | `kind`, `path` (path filter is case-sensitive contains) | —                                |

## WHERE details

| Predicate             | Meaning                                        |
| --------------------- | ---------------------------------------------- |
| `name = "foo"` / `eq` | exact, case-sensitive                          |
| `name contains "foo"` | substring, case-sensitive                      |
| `name prefix "foo"`   | prefix, case-sensitive                         |
| same for `path`       | path from `properties.path` or `location.file` |

Path matching normalizes `\` → `/` on both sides (Windows/Unix). Empty needle `contains ""` matches any non-null string (JS `includes` semantics). No `AND`/`OR` keywords; sequential `where` stages ∧.

## TRAVERSE

See [`traverse.md`](./traverse.md).

## CALLS uncertainty

Edge `properties.resolution` preserved (`RESOLVED` \| `AMBIGUOUS` \| `UNRESOLVED` \| `EXTERNAL`). Tallied in `diagnostics.resolutionCounts`. Never coerced AMBIGUOUS→RESOLVED or UNRESOLVED→EXTERNAL.

## DESCRIBE vs CLI INSPECT

|        | DSL `describe`                                 | CLI `inspect`                                    |
| ------ | ---------------------------------------------- | ------------------------------------------------ |
| Input  | entire EntitySet                               | one entity (or project)                          |
| Output | id, kind, name, path, relationCount, edgeKinds | full neighborhood (methods, imports, exports, …) |
| Role   | pipeline summary op                            | interactive deep dive                            |

`describe` is intentionally thinner. Richer describe is a **0.7 candidate**, not done here.

## JSON contract (`ffvs query --json`)

Stable fields:

```json
{
  "languageVersion": "0.1",
  "stagesApplied": ["select functions", "where name contains \"x\"", "describe"],
  "entities": [{ "id", "kind", "name", "path" }],
  "relations": [{ "id", "kind", "from", "to", "properties" }],
  "descriptions": [{ "id", "kind", "name", "path", "relationCount", "edgeKinds" }],
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

`descriptions` omitted unless `describe` ran. `EntityRef` / `RelationRef` shapes match explore CLI JSON.

## Errors

| Kind      | Examples                                                    |
| --------- | ----------------------------------------------------------- |
| LEXICAL   | bad char, bad escape, unterminated string                   |
| PARSE     | empty query, missing string, wrong keyword place            |
| SEMANTIC  | unknown kind/relation; where/traverse/describe without seed |
| EXECUTION | reserved                                                    |

Messages include `line` / `column`. No stack traces for these.

## Read-only

Query never writes `.ffvs/`, source files, or config. Only reads the loaded model.

## PATH and IMPACT (v0.2+)

See [`path.md`](./path.md) and [`impact.md`](./impact.md).

JSON may include `paths` and/or `impact` objects alongside entities/relations.

## Resolution & uncertainty (v0.3)

See [`uncertainty.md`](./uncertainty.md) and [`traverse.md`](./traverse.md).

- `traverse … resolution <state>` filters edges (opt-in).
- `impact along calls` is explicit CALL-axis impact (default RESOLVED).
- `describe` includes `module`, `startLine`, `endLine` (still ≠ inspect).

## Versioning

```text
FFVS package 1.0.0
Query Language 1.0
```

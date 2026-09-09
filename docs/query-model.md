# Query Model

Living document. **No DSL is implemented.** Operations below are realized as CLI verbs + `src/core/query/*` + `src/application/explore.ts`.

## SEARCH vs FILTER

```text
SEARCH  → find candidates in the graph (ffvs search)
FILTER  → restrict an already chosen set (e.g. functions --name / --path)
```

## Operation classification

| Operation                 | Class             | Realization                                                     | Notes                                  |
| ------------------------- | ----------------- | --------------------------------------------------------------- | -------------------------------------- |
| SELECT                    | CORE              | `files` / `functions` / `classes`                               | By kind                                |
| FILTER                    | CORE              | `--name`, `--path`                                              | Contains match; no expression language |
| SEARCH                    | CORE              | `search`                                                        | Cross-kind candidate find              |
| DESCRIBE                  | CORE              | `inspect`, `graph`                                              | Entity summary / neighborhood          |
| TRAVERSE                  | CORE              | `deps`, `dependents`, `children`, `parents`, `calls`, `callers` | Directional relation walk              |
| FIND PATH                 | CORE              | `path`                                                          | Shortest path (IMPORTS today)          |
| SELECT RELATIONS          | CORE              | `relations`                                                     | Edges as values                        |
| IMPACT                    | DERIVED           | `impact`                                                        | Transitive dependents via IMPORTS      |
| DEPENDENCIES / DEPENDENTS | CONVENIENCE       | aliases of TRAVERSE IMPORTS                                     |                                        |
| IMPORTS listing           | CONVENIENCE       | `imports`                                                       | Special-case SELECT RELATIONS          |
| GRAPH view                | CONVENIENCE       | `graph`                                                         | Human DESCRIBE neighborhood            |
| CALLS / CALLERS           | CORE (uncertain)  | `calls` / `callers`                                             | Best-effort; resolution on edges       |
| RANK                      | EXPERIMENTAL      | —                                                               | Not implemented                        |
| SCOPE                     | CORE (index-time) | `index --include/--exclude`                                     | Controls universe, not a query op      |

## Conceptual algebra

See [`query-algebra.md`](./query-algebra.md).

## Architecture for a future language

```text
CLI  →  application explore/search  →  core/query + graph navigate  →  GRAPH
```

Future:

```text
CLI or DSL parser → Query AST → planner → same CORE ops → GRAPH
```

Business logic must stay in CORE/application — not in a parser.

## Evidence trail

- Phase 1.5: SELECT / DESCRIBE / TRAVERSE / PATH emerged
- Phase 1.6: fidelity unlocked TRAVERSE
- Phase 1.7–1.8: FILTER + SEARCH
- Phase 2.0: CALLS
- EXP-0003 / EXP-DSL-0001: composition patterns quantified

## Language status

Query Language **1.0** in FFVS **1.0.0**:

```text
select | where | search | traverse [resolution] | path | impact [along calls] | describe
```

Spec: [`docs/language/`](./language/). Scope: [`ffvs-1.0-scope.md`](./ffvs-1.0-scope.md).

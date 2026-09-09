# Language query model (spec)

Mirrors `docs/query-model.md` for the future language surface.

## Core

| Keyword (proposed) | Maps to |
| ------------------ | ------- |
| `select` | SELECT kind |
| `where` | FILTER predicates (name/path contains|eq|prefix) |
| `search` | SEARCH |
| `describe` | DESCRIBE |
| `traverse` | TRAVERSE relation + direction |
| `path` | FIND PATH |
| `relations` | SELECT RELATIONS |

## Derived / convenience (optional sugar)

| Sugar | Expands to |
| ----- | ---------- |
| `callers` | `traverse calls inbound` |
| `calls` | `traverse calls outbound` |
| `dependents` | `traverse imports inbound` |
| `deps` | `traverse imports outbound` |
| `impact` | transitive dependents |

## Experimental (not in v0 grammar)

- `rank`
- temporal / history
- runtime

## Result identity

Pipelines thread an **EntitySet** (or singleton). Ambiguous names require disambiguation syntax (open question).

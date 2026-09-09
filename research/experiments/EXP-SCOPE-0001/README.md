# EXP-SCOPE-0001 — Index scope vs query scope

## Goal

Decide whether SCOPE is only an indexing concept or needs query-language syntax.

## Questions

| ID | Question | Finding |
| -- | -------- | ------- |
| S01 | Entities in current scope? | = entities in indexed graph after include/exclude |
| S02 | What was excluded? | Not stored as first-class “excluded set”; only skip list / config |
| S03 | Restrict query to path? | Already: `where path contains "src/core"` / search path opt |
| S04 | Index vs query scope? | Index defines universe; query filters within it |
| S05 | Separate query scope stage? | Would re-state path filters; no new expressiveness in corpus |

## Evidence pressure

- EXP-DSL-0001 Q21 is index-time (`--exclude`), not a query stage.
- No recurring “scope X then …” pattern that `where path` cannot express.
- Dual scopes (query ⊂ index) would add mental load without measured handoff pain.

## Decision for 0.8.0

```text
SCOPE = INDEXING CONCEPT
Query restriction = existing WHERE path / SEARCH path
NO `scope "…"` stage
```

Status: **NOT JUSTIFIED** as language feature.

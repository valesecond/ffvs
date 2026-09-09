# FFVS Query Language 1.0 — Overview

The Query Language is a **read-only**, compositional pipeline over an indexed semantic graph.

```text
Syntax → Lexer → Parser → AST → Executor → ResultSet → CLI / JSON
```

It is **not** SQL. Identity:

```text
software semantics + graph traversal + stage composition
```

## Stages (stable)

| Stage      | Role                                                |
| ---------- | --------------------------------------------------- |
| `select`   | Seed entities by kind                               |
| `where`    | Filter current set (`name` / `path`)                |
| `search`   | Seed by text needle                                 |
| `traverse` | One-hop neighbors (optional direction + resolution) |
| `path`     | Shortest IMPORTS path                               |
| `impact`   | Transitive dependents (IMPORTS or `along calls`)    |
| `describe` | Concise entity summaries                            |

## Composition

Stages form a left-to-right pipeline. Each stage transforms the **ResultSet**.

```text
select functions
where name contains "resolve"
traverse callers resolution resolved
describe
```

Cross-relation hops (IMPORTS ↔ CALLS) use sequential traverse; MODULE→CALLS usually needs `traverse declares` first. See [traverse.md](./traverse.md) and EXP-DSL-0006.

## Docs in this folder

| Doc                                             | Content                               |
| ----------------------------------------------- | ------------------------------------- |
| [syntax.md](./syntax.md)                        | Surface syntax + grammar pointer      |
| [semantics.md](./semantics.md)                  | ResultSet rules, ordering, empty sets |
| [errors.md](./errors.md)                        | Error kinds                           |
| [resolution.md](./resolution.md)                | Uncertainty model                     |
| [examples.md](./examples.md)                    | Runnable examples                     |
| [path.md](./path.md) / [impact.md](./impact.md) | PATH / IMPACT details                 |

Package **FFVS 1.0.0** ships Query Language **1.0**.

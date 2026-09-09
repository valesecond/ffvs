# Traverse semantics (Query Language v0.3)

`traverse <relation> [inbound|outbound] [resolution <state>]`

- Direction is **optional**.
- Omitted direction uses the default in the table below.
- Explicit `inbound` / `outbound` overrides the default.
- Optional `resolution` filters **edges** by resolution state (opt-in).
- Default traverse remains **inclusive** of all resolution states.
- Unknown relation → **SEMANTIC** error.
- After traverse, `entities` = unique neighbors; `relations` = unique edges of that hop only.

## Resolution modifier

```text
traverse callers resolution resolved
traverse calls resolution ambiguous
traverse dependencies resolution external
```

States: `resolved` | `ambiguous` | `unresolved` | `external`.

See [`uncertainty.md`](./uncertainty.md).

## Mapping table

| Syntax                      | Relation kind | Default direction | Module anchor | Notes                      |
| --------------------------- | ------------- | ----------------- | ------------- | -------------------------- |
| `traverse imports`          | IMPORTS       | outbound          | yes           | includes EXTERNAL targets  |
| `traverse imports outbound` | IMPORTS       | outbound          | yes           |                            |
| `traverse imports inbound`  | IMPORTS       | inbound           | yes           | all inbound IMPORTS edges  |
| `traverse dependencies`     | IMPORTS       | outbound          | yes           | alias of imports           |
| `traverse deps`             | IMPORTS       | outbound          | yes           | alias                      |
| `traverse dependents`       | IMPORTS       | inbound           | yes           | **resolved internal only** |
| `traverse calls`            | CALLS         | outbound          | no            | uncertainty preserved      |
| `traverse calls outbound`   | CALLS         | outbound          | no            |                            |
| `traverse calls inbound`    | CALLS         | inbound           | no            | same as callers            |
| `traverse callers`          | CALLS         | inbound           | no            | sugar                      |
| `traverse callers inbound`  | CALLS         | inbound           | no            |                            |
| `traverse callers outbound` | CALLS         | outbound          | no            | unusual; allowed           |
| `traverse contains`         | CONTAINS      | outbound          | no            |                            |
| `traverse children`         | CONTAINS      | outbound          | no            | sugar                      |
| `traverse parents`          | CONTAINS      | inbound           | no            | sugar                      |
| `traverse exports`          | EXPORTS       | outbound          | yes           |                            |
| `traverse declares`         | DECLARES      | outbound          | yes           |                            |
| `traverse extends`          | EXTENDS       | outbound          | no            |                            |
| `traverse implements`       | IMPLEMENTS    | outbound          | no            |                            |

## Module anchoring

For IMPORTS/EXPORTS/DECLARES sugars, non-module seeds (class/function/file) are mapped to their owning **MODULE** before walking edges (same idea as CLI `deps`/`dependents`).

## Dependents filter

`traverse dependents` only follows IMPORTS edges that are resolved internal (`resolution=RESOLVED` or legacy equivalent). External/unresolved inbound edges are excluded — matching CLI `dependents`. Additional `resolution` further intersects.

## Multi-hop / cross-relation

```text
traverse callers
traverse calls
```

Second stage walks from the first stage’s entity set. Prior-hop edges are **not** accumulated in `relations`.

Cross IMPORTS↔CALLS often needs a **kind bridge** (`traverse declares` / `children`) because MODULE nodes do not carry CALLS. See EXP-DSL-0006 (composition syntax **NOT JUSTIFIED**; sequential stages suffice when kinds align).

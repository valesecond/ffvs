# Uncertainty semantics (FFVS Query Language)

> The FFVS must preserve the difference between an observed fact, a resolved relation, an ambiguous relation, and an unresolved relation.

## Edge resolution states

Applicable primarily to **IMPORTS** and **CALLS** edges:

| State        | Meaning                                                 |
| ------------ | ------------------------------------------------------- |
| `RESOLVED`   | Target bound with confidence (single candidate)         |
| `AMBIGUOUS`  | Multiple plausible targets; FFVS refused to guess       |
| `UNRESOLVED` | No bindable target in the indexed graph                 |
| `EXTERNAL`   | Target outside the project / package boundary (imports) |

Resolution is a **relation** property. It is **not** an entity attribute. Queries such as `where resolution = …` on functions are rejected.

## Language rules (v0.3)

1. Default `traverse` is **inclusive**: all resolution states appear; diagnostics tally them.
2. Opt-in filter: `traverse <rel> [dir] resolution <state>`.
3. Default `impact` uses resolved-internal **IMPORTS** only (unchanged from CLI).
4. Explicit `impact along calls` defaults to **RESOLVED** CALL edges only — never silently.
5. The DSL must not convert uncertainty into false certainty (no auto-pick among AMBIGUOUS).

## Related docs

- [`semantics.md`](./semantics.md)
- [`impact.md`](./impact.md)
- [`traverse.md`](./traverse.md)
- EXP-RESOLUTION-0001, EXP-CALLS-IMPACT-0001

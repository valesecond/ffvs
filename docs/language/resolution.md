# Resolution — first-class uncertainty

FFVS does not pretend every edge is equally trustworthy.

## States (edge properties)

| State        | Meaning                                      |
| ------------ | -------------------------------------------- |
| `RESOLVED`   | Single confident binding                     |
| `AMBIGUOUS`  | Multiple candidates; FFVS refused to guess   |
| `UNRESOLVED` | No bindable target in the index              |
| `EXTERNAL`   | Outside project / package boundary (imports) |

Applies primarily to **IMPORTS** and **CALLS**. Not an entity attribute — do not write `where resolution = …` on functions.

## Language

- Default `traverse` includes all states; diagnostics tally them.
- Opt-in: `traverse callers resolution resolved`
- Default `impact` = resolved-internal IMPORTS
- `impact along calls` defaults to **resolved** CALL edges

## Philosophy

Prefer:

```text
CALLS: 10501 resolved · 12530 ambiguous · 21514 unresolved
```

over a single undifferentiated count.

See also [uncertainty.md](./uncertainty.md) and ADR-0011 / ADR-0022.

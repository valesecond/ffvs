# EXP-RESOLUTION-0001 — Do we need resolution-aware queries?

## Goal

Determine whether filtering graph relations by `RESOLVED` / `AMBIGUOUS` / `UNRESOLVED` / `EXTERNAL` is a recurring, useful need — before adding syntax.

## Evidence sources

- EXP-0003 zod CALLS: 10749 RESOLVED / 12766 AMBIGUOUS / 22071 UNRESOLVED
- EXP-DSL-0004 N10: “callers affected via CALLS” only PARTIAL with IMPORTS impact
- CLI `diagnostics` answers IMPORT unresolved listing, not CALLS filter in pipelines

## Questions (15)

| ID | Question | Class | Notes |
| -- | -------- | ----- | ----- |
| R01 | Which callers of X are RESOLVED? | **NEEDS FILTER** | Today: all callers + tally only |
| R02 | Which CALLS from X are AMBIGUOUS? | **NEEDS FILTER** | relations exist; no DSL filter |
| R03 | Which CALLS are UNRESOLVED? | **NEEDS FILTER** | |
| R04 | Show EXTERNAL imports of module X | **CAN BE ANSWERED ALREADY** | `traverse dependencies` includes EXTERNAL; filter still helpful |
| R05 | Unresolved imports project-wide? | **CAN BE ANSWERED ALREADY** | `ffvs diagnostics` |
| R06 | Impact using only RESOLVED deps? | **NOT RELEVANT** for IMPORTS impact | Impact already resolved-internal only |
| R07 | Callers ignoring AMBIGUOUS noise? | **NEEDS FILTER** | High pressure on zod-scale CALLS |
| R08 | Confident dependency edges only? | **NEEDS FILTER** on TRAVERSE IMPORTS | Optional; lower pressure than CALLS |
| R09 | `where resolution = RESOLVED` on functions? | **NOT RELEVANT** | Resolution is on **edges**, not entities |
| R10 | Ambiguous path hops? | **NOT RELEVANT** | PATH uses resolved IMPORTS only |
| R11 | Count AMBIGUOUS vs RESOLVED callers | **CAN BE ANSWERED ALREADY** | diagnostics tallies after traverse |
| R12 | Pipeline: search → resolved callers → describe | **NEEDS FILTER** | Composition gap |
| R13 | Exclude EXTERNAL from deps listing | **NEEDS FILTER** | Convenience |
| R14 | Treat AMBIGUOUS as RESOLVED? | **NOT RELEVANT** | Forbidden by honesty principle |
| R15 | Filter after IMPACT by resolution? | **NOT RELEVANT** for default IMPACT | Edges already filtered |

## Counts

| Class | n |
| ----- | - |
| NEEDS FILTER | **8** |
| CAN BE ANSWERED ALREADY | 3 |
| NOT RELEVANT | 4 |

## Architectural conclusion

- Resolution belongs on **relations** (IMPORTS/CALLS edges), not entity attributes.
- Prefer a **TRAVERSE modifier** over fake `where resolution` on entities.
- Default traverse must remain inclusive (all resolutions + tallies).
- Filter is opt-in.

## Decision for 0.8.0

```text
IMPLEMENT: traverse <rel> [direction] [resolution <state>]
DO NOT: where resolution on entities
DO NOT: silent filtering
```

Status: **JUSTIFIED**.

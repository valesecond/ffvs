# EXP-DSL-0002 — Final classification (post 0.6.1)

Re-states the 22 EXP-DSL-0001 questions against Query Language v0.1 after semantic stabilization. No new DSL stages were added in 0.6.1.

| ID  | Question                   | DSL query                                                                                           | Result  | Reason                              |
| --- | -------------------------- | --------------------------------------------------------------------------------------------------- | ------- | ----------------------------------- |
| Q01 | Who depends on module X?   | `select modules where name = "X" traverse dependents describe`                                      | PASS    |                                     |
| Q02 | What does X import?        | `select modules where path contains "X" traverse dependencies describe`                             | PASS    |                                     |
| Q03 | Impact of changing X?      | —                                                                                                   | N/A     | needs IMPACT / transitive           |
| Q04 | Path A→B?                  | —                                                                                                   | N/A     | needs PATH stage                    |
| Q05 | Functions named resolve?   | `select functions where name contains "resolve" describe`                                           | PASS    |                                     |
| Q06 | Functions under src/core?  | `select functions where path contains "src/core" describe`                                          | PASS    |                                     |
| Q07 | Find parse?                | `search "parse" describe`                                                                           | PASS    |                                     |
| Q08 | Functions parse in core?   | `search "parse" kind function path "src/core" describe`                                             | PASS    |                                     |
| Q09 | Inspect search hit         | `search "X" describe`                                                                               | PASS    | no ID handoff; thinner than inspect |
| Q10 | Who calls safeParse?       | `search "safeParse" kind function traverse callers describe`                                        | PASS    | uncertainty in diagnostics          |
| Q11 | What does total call?      | `select functions where name = "total" traverse calls describe`                                     | PASS    |                                     |
| Q12 | Classes in src?            | `select classes where path contains "src" describe`                                                 | PASS    |                                     |
| Q13 | Neighborhood of class      | `select classes where path contains "src" describe`                                                 | PARTIAL | describe ≠ graph/inspect            |
| Q14 | Children of module         | `select modules where path contains "…" traverse children describe`                                 | PASS    |                                     |
| Q15 | Unresolved imports?        | —                                                                                                   | N/A     | CLI `diagnostics`                   |
| Q16 | CALLS relations for X      | `select functions where name = "X" traverse calls`                                                  | PARTIAL | neighbors+edges, not relations UX   |
| Q17 | Files under path           | `select files where path contains "…" describe`                                                     | PASS    |                                     |
| Q18 | Core parse helpers callers | `select functions where path contains "core" where name contains "parse" traverse callers describe` | PASS    |                                     |
| Q19 | Dependents after search    | `search "common" kind module traverse dependents describe`                                          | PASS    |                                     |
| Q20 | Extends chain              | `select classes where name contains "User" traverse extends describe`                               | PASS    |                                     |
| Q21 | Exclude docs               | —                                                                                                   | N/A     | index SCOPE                         |
| Q22 | Path after two selects     | —                                                                                                   | N/A     | PATH                                |

## Totals (unchanged vs mid-0.6.0)

|             | Count |
| ----------- | ----- |
| Expressable | 16    |
| PASS        | 14    |
| PARTIAL     | 2     |
| N/A         | 6     |

Stabilization improved **predictability**, not coverage.

# FFVS 0.9 roadmap (evidence only — not implemented)

Evaluated after 0.8.0 experiments. Do not implement from this document alone.

| Feature                           | Evidence                                                | Observed pressure                                        | Proposed semantics                         | Proposed syntax                                 | Status                         |
| --------------------------------- | ------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------- | ------------------------------ |
| AND / OR / NOT                    | EXP-DSL-0001–0005 still answered via sequential filters | Low–medium for compound predicates                       | Conjunctive/disjunctive WHERE              | `where name contains "a" and path prefix "src"` | **NEEDS EVIDENCE**             |
| PIPE / multi-result fan-out       | Composition already linear stages                       | Occasional handoff                                       | Explicit result binding                    | deferred                                        | **NOT JUSTIFIED**              |
| RANK / ORDER BY                   | Deterministic sort already                              | Low                                                      | Presentational                             | deferred                                        | **NOT JUSTIFIED**              |
| AGGREGATE / COUNT                 | Diagnostics tallies cover resolution counts             | Medium for dashboards                                    | Read-only aggregates over ResultSet        | deferred                                        | **NEEDS EVIDENCE**             |
| PATH along CALLS                  | EXP-CALLS-IMPACT; PATH still IMPORTS                    | Medium                                                   | Shortest CALL path with resolution honesty | `path … along calls`                            | **NEEDS EVIDENCE**             |
| Combined IMPORT+CALL impact       | EXP-CALLS-IMPACT-0001; EXP-DSL-0006 Q03                 | High risk of false certainty                             | Explicit dual-axis only if labeled         | `impact along imports,calls`                    | **NEEDS EVIDENCE**             |
| Cross-relation composition syntax | EXP-DSL-0006                                            | Sequential traverse already composes; gaps are ∩ / kinds | —                                          | PIPE/JOIN/sugar                                 | **NOT JUSTIFIED**              |
| ResultSet intersect / dual-seed   | EXP-DSL-0006 Q01/Q04                                    | Medium — two-query handoff                               | Minimal set ∩ over entity ids              | TBD (EXP-DSL-0007)                              | **NEEDS EVIDENCE**             |
| Richer DESCRIBE (children/parent) | EXP-DESCRIBE-0001                                       | Low after module+loc                                     | Keep DESCRIBE ≠ INSPECT                    | optional fields                                 | **NOT JUSTIFIED** for bulk add |
| Query SCOPE stage                 | EXP-SCOPE-0001                                          | Low                                                      | Keep index scope                           | —                                               | **NOT JUSTIFIED**              |
| Variables / LET                   | none in corpus                                          | Low                                                      | —                                          | —                                               | **NOT JUSTIFIED**              |
| Mutation / write                  | forbidden                                               | —                                                        | —                                          | —                                               | **NOT JUSTIFIED**              |

## Guiding question for 0.9

> Does the next increment reduce manual handoffs on real questions, or only add syntax?

Prefer more **semantic honesty** and shared algorithms with CLI over boolean algebra until corpus pressure is clear.

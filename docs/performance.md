# Performance notes (FFVS 1.0)

Not a hard SLA. Observations from fixtures and EXP corpora:

| Phase                              | Typical dominance                               |
| ---------------------------------- | ----------------------------------------------- |
| Index / graph construction         | CPU + disk; scales with files and CALLS density |
| Query lex/parse                    | Negligible                                      |
| Query execution                    | Usually cheap vs I/O                            |
| Graph load from `.ffvs/graph.json` | Often dominates repeated CLI invocations        |

On zod-scale graphs (tens of thousands of CALLS edges), prefer focused seeds (`search` / `where`) and `resolution resolved` when exploring CALLS.

Reindex when sources change; avoid treating `.ffvs/` as hot-path cache across machines without reindex.

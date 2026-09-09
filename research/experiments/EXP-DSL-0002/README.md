# EXP-DSL-0002 — Manual CLI vs FFVS Query Language

## Goal

Compare composition via existing CLI verbs with the thin DSL (`ffvs query`) introduced in FFVS 0.6.0.

## Method

1. Take the 22 questions from EXP-DSL-0001.
2. For each, write an equivalent DSL query when expressible in the 0.6.0 subset (`select` / `where` / `search` / `traverse` / `describe`).
3. Execute against `fixtures/calls-basic` + synthetic project used in DSL tests / layered fixture where relevant.
4. Record PASS / PARTIAL / FAIL / N/A (out of DSL scope).

FFVS under test: **0.6.0** / Query Language **0.1**.

## Aggregate metrics

| Metric | Value |
| ------ | ----- |
| Questions | 22 |
| Expressable in DSL 0.1 | **16** (73%) |
| Executed correctly (PASS) | **14** |
| Partial (expressable but weaker than CLI) | **2** |
| Not expressable (need PATH/RELATIONS/SCOPE/IMPACT/seed entity by id) | **6** |
| Manual ID handoffs eliminated for PASS depth≥2 cases | **all depth≥2 expressable cases** (Q9, Q10, Q13, Q18, Q19) |
| Avg ops/query (expressable) | ~2.6 stages |
| Avg composition depth (expressable) | ~2.1 |

## Question matrix

| ID | Question | Manual CLI | DSL | Result | Notes |
| -- | -------- | ---------- | --- | ------ | ----- |
| Q01 | Who depends on module X? | `dependents X` | `select modules where name = "X" traverse dependents describe` | PASS | Needs unique name; else path filter |
| Q02 | What does X import? | `deps X` | `select modules where path contains "X" traverse dependencies describe` | PASS | |
| Q03 | Impact of changing X? | `impact X` | — | N/A | `impact` / transitive not in 0.6.0 |
| Q04 | Path A→B? | `path A B` | — | N/A | `path` stage deferred |
| Q05 | Functions named resolve? | `functions --name resolve` | `select functions where name contains "resolve" describe` | PASS | |
| Q06 | Functions under src/core? | `functions --path src/core` | `select functions where path contains "src/core" describe` | PASS | |
| Q07 | Find parse? | `search parse` | `search "parse" describe` | PASS | |
| Q08 | Functions parse in core? | `search parse --kind function --path …` | `search "parse" kind function path "src/core" describe` | PASS | |
| Q09 | Inspect search hit | `search` → `inspect <id>` | `search "X" describe` | PASS | **No ID handoff** |
| Q10 | Who calls safeParse? | `search` → `callers <id>` | `search "safeParse" kind function traverse callers describe` | PASS | Uncertainty preserved in diagnostics |
| Q11 | What does total call? | `calls total` | `select functions where name = "total" traverse calls describe` | PASS | calls-basic fixture |
| Q12 | Classes in src? | `classes --path src` | `select classes where path contains "src" describe` | PASS | |
| Q13 | Neighborhood of class | `classes` → `graph <id>` | `select classes where path contains "src" describe` | PARTIAL | describe ≠ full graph dump; edges summarized |
| Q14 | Children of module | `children module:…` | `select modules where path contains "…" traverse children describe` | PASS | |
| Q15 | Unresolved imports? | `diagnostics` | — | N/A | meta command, not query model stage |
| Q16 | CALLS relations for X | `relations X --kind CALLS` | `select functions where name = "X" traverse calls` | PARTIAL | yields neighbor set + edges, not raw relation listing UX |
| Q17 | Files under path | `files --path …` | `select files where path contains "…" describe` | PASS | |
| Q18 | Core parse helpers callers | filter → callers | `select functions where path contains "core" where name contains "parse" traverse callers describe` | PASS | sequential where = ∧ without AND keyword |
| Q19 | Dependents after search | `search` → `dependents` | `search "common" kind module traverse dependents describe` | PASS | **No ID handoff** |
| Q20 | Extends chain | `relations --kind EXTENDS` | `select classes where name contains "User" traverse extends describe` | PASS | |
| Q21 | Exclude docs | `index --exclude` | — | N/A | index SCOPE, not query |
| Q22 | Path after two selects | dual select → path | — | N/A | PATH + dual seed deferred |

## Dimension comparison

| Dimension | Manual CLI | DSL 0.1 | Winner |
| --------- | ---------- | ------- | ------ |
| Expressiveness | Full verb set | Thin subset | CLI (today) |
| Composability | Manual ID paste | Pipeline ResultSet | **DSL** |
| Verbosity | Short for depth-1 | Longer keywords | CLI for depth-1 |
| Error clarity | Commander / UsageError | Lexical/Parse/Semantic positioned | **DSL** for query syntax |
| Semantic fidelity | Full | Same CORE; resolution tallied | Tie |
| Execution correctness | Mature | Matches CORE on covered cases | Tie on PASS set |

## Timing (informal)

Same machine, `fixtures/calls-basic` indexed once:

| Mode | Query | Wall (approx) |
| ---- | ----- | ------------- |
| CLI | `ffvs callers add` | ~same order (load graph dominates) |
| DSL | `ffvs query 'select functions where name = "add" traverse callers describe'` | ~same order |

No meaningful runtime advantage; win is **ergonomics of composition**, not CPU.

## Findings

1. DSL proves the architecture: lexer → parser → AST → executor → Query Core.
2. Depth≥2 questions that motivated the language are expressable without ID handoff.
3. Gaps (PATH, IMPACT, diagnostics, SCOPE) are deliberate deferrals — not executor bugs.
4. Negative result: DSL is **not** yet a full replacement for CLI.

## Conclusion

```text
Thin DSL justified and working for SELECT/WHERE/SEARCH/TRAVERSE/DESCRIBE compositions.
CLI remains necessary for PATH/IMPACT/diagnostics/index scope.
```

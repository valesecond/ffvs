# EXP-DSL-0003 — Stability experiment

## Goal

Evaluate determinism, composition semantics, diagnostics propagation, empty results, invalid queries, and CALLS uncertainty for Query Language v0.1 (FFVS 0.6.1).

## Method

Automated tests in `tests/dsl-stabilization.test.ts` plus this record. Fixture: synthetic diamond call/import graph under temp dirs (not vendored).

## Results

### Deterministic runs (10×)

Query:

```text
select functions where name contains "a" traverse callers describe
```

Identical fingerprints for entities, relations, descriptions, and `resolutionCounts` across 10 runs. **PASS.**

### Composition cases (10)

Covered in tests / corpus:

1. `select functions`
2. `select … where …`
3. `… traverse callers`
4. `… traverse callers traverse calls`
5. `search … traverse callers traverse calls describe`
6. `select modules traverse dependencies`
7. `select modules traverse dependents`
8. `select classes traverse extends`
9. sequential dual `where`
10. `select files where path … describe`

Observations: traverse **replaces** entity set; relations = last hop only; describe always applies to final entities. **PASS.**

### Empty-result cases (5)

| Case | Outcome |
| ---- | ------- |
| `where name = "doesNotExist"` | `entities=[]`, success |
| `search "doesNotExistZz"` | `entities=[]`, success |
| traverse with no callers | `entities=[]`, success |
| `where name = "Shared"` (case) | empty (WHERE sensitive) |
| filter to empty then describe | `descriptions=[]` |

**PASS** — empty ≠ error.

### Invalid-query cases (5+)

Lexical / parse / semantic taxonomy covered (empty query, unknown kind, unknown relation, bad escape, unfinished string, missing contains operand, etc.). Messages include line/column. **PASS.**

### CALLS uncertainty (5)

| Check | Result |
| ------ | ------ |
| Edge `resolution` present | yes |
| AMBIGUOUS ≠ coerced to RESOLVED | yes |
| UNRESOLVED ≠ coerced to EXTERNAL | yes |
| Tallies sum to relation count | yes |
| Human + JSON expose counts | yes |

**PASS.**

### Read-only

`.ffvs/{graph,index,config}.json` byte-identical before/after multi-stage query. **PASS.**

## Performance baseline (informal)

On a small indexed fixture, wall time is dominated by **loading** `.ffvs/graph.json`, not lex/parse/execute. DSL vs equivalent CLI neighborhood ops: same order of magnitude. No optimization attempted.

## Conclusion

```text
Query Language v0.1 is semantically stable enough for 0.7.0 candidate evaluation.
Coverage gaps remain PATH / IMPACT / rich describe / resolution filter — not stability bugs.
```

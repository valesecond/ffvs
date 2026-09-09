# EXP-DSL-0005 — Semantic depth evaluation (0.7.0 → 0.8.0)

## Goal

Measure whether resolution-aware traverse, CALL impact, and minimal richer describe increase answerable questions without unjustified syntax.

## Baseline

FFVS **0.7.0** / QL **v0.2** (EXP-DSL-0004): Expressable 18, PASS 16, N/A 4 on the original 22 + PATH/IMPACT set.

## Corpus for this run

| Bucket | n | Source |
| ------ | - | ------ |
| Original 22 | 22 | EXP-DSL-0001/0002 |
| PATH/IMPACT extras | 10 | EXP-DSL-0004 |
| Resolution | 15 | EXP-RESOLUTION-0001 |
| CALLS impact | 8 | EXP-CALLS-IMPACT-0001 + fixtures |
| Describe | 6 | EXP-DESCRIBE-0001 |
| Scope | 5 | EXP-SCOPE-0001 |

## Results (0.8.0 / QL v0.3)

### Original + PATH/IMPACT (continuity)

Prior PASS queries remain PASS (import impact, path, select/where/search/traverse/describe). No regressions expected from additive grammar.

### Resolution questions (15)

| Class | 0.7.0 | 0.8.0 |
| ----- | ----- | ----- |
| PASS (filterable in DSL) | 0 of NEEDS FILTER | **8** (R01–R04,R07,R08,R12,R13) |
| CAN BE ANSWERED ALREADY | 3 | 3 (unchanged) |
| NOT RELEVANT | 4 | 4 (still not forced into language) |

### CALLS impact (qualitative fixtures)

| Scenario | Status |
| -------- | ------ |
| Direct / indirect / diamond / cycle | **PASS** (`impact along calls`) |
| Ambiguous excluded by default | **PASS** |
| Unresolved opt-in | **PASS** (`resolution unresolved` on traverse/impact) |
| Combined IMPORT+CALL automatic | **NOT IMPLEMENTED** (correct) |

### Describe (6)

| Need | Decision |
| ---- | -------- |
| id/kind/name/path/relations | already present |
| module + start/end line | **PASS** (added) |
| Full inspect neighborhood | **NOT JUSTIFIED** |

### Scope (5)

| Need | Decision |
| ---- | -------- |
| Query `scope` stage | **NOT JUSTIFIED** |
| Path restrict | already via `where path` / search path |

## Aggregate deltas (focused)

| Metric | 0.7.0 | 0.8.0 |
| ------ | ----- | ----- |
| Resolution-aware expressable | low | **high** (opt-in) |
| CALL-impact expressable | N/A / PARTIAL | **PASS** (explicit) |
| Describe richness | minimal | **minimal+** |
| Scope DSL | none | none (evidence-backed) |
| Manual handoff for confident callers | often | reduced |

## Performance note

Graph load still dominates. Lex/parse of new keywords negligible (same pattern as EXP-DSL-0004).

## Conclusion

**Yes** — 0.8.0 increased semantic depth where experiments justified it, and refused unjustified syntax (entity `where resolution`, query scope stage, silent filters, AND/OR).

See ADR-0022 and `docs/roadmap/ffvs-0.9.md`.

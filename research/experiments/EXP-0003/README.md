# EXP-0003 — Post Phase 2.1 experimental re-run

## Purpose

Re-measure the same corpus as EXP-0002 after Phases 1.7–2.1:

- FILTER / SEARCH
- include/exclude scope
- CALLS / callers / calls

**Does not replace** EXP-0002 artifacts. This is a new round.

## Corpus (unchanged commits)

| Repo  | Commit    | URL |
| ----- | --------- | --- |
| debug | `f405ade` | https://github.com/debug-js/debug |
| zod   | `c5b9bcb` | https://github.com/colinhacks/zod |

Ephemeral clone root: `%TEMP%/ffvs-exp0003/` (not vendored).

## FFVS under test

| Field | Value |
| ----- | ----- |
| Date | 2026-09-09 |
| Version | `0.5.0` (pre-DSL phases) |
| Scope (zod) | `--exclude packages/docs --exclude packages/bench --exclude packages/treeshake` |

## Metrics (this round)

### debug

| Metric | Phase 1.5 | Phase 1.6 | Phase 2.1 (EXP-0003) |
| ------ | --------- | --------- | -------------------- |
| Files | 13 | 13 | 13 |
| Nodes | ~47 | higher | **113** |
| Edges | ~72 | higher | **273** |
| Internal IMPORTS resolved | ~0 | 6 | **6** |
| External IMPORTS | many mislabeled | 8 | **8** |
| Unresolved IMPORTS | — | 0 | **0** |
| CALLS total | 0 | 0 | **195** |
| CALLS RESOLVED | — | — | **24** |
| CALLS AMBIGUOUS | — | — | **3** |
| CALLS UNRESOLVED | — | — | **168** |

### zod

| Metric | Phase 1.5 | Phase 1.6 | Phase 2.1 (EXP-0003)* |
| ------ | --------- | --------- | --------------------- |
| Files | ~725 | ~725 | **490** (docs/bench/treeshake excluded) |
| Nodes | ~4561 | ~same order | **3707** |
| Edges | ~9883 | higher | **53090** (CALLS dominate) |
| Internal IMPORTS resolved | ~2 | ~660 | **568** |
| External IMPORTS | ~1411 | lower | **499** |
| Unresolved IMPORTS | — | low | **0** |
| Internal resolution rate | ~0 | ~100% relative | **100%** of non-external |
| CALLS total | 0 | 0 | **45586** |
| CALLS RESOLVED | — | — | **10749** |
| CALLS AMBIGUOUS | — | — | **12766** |
| CALLS UNRESOLVED | — | — | **22071** |

\*Scope differs from Phase 1.6 full-tree index; import counts are not 1:1 comparable but order of magnitude of internal resolution remains high.

Raw JSON: `metrics-debug.json`, `metrics-zod.json`.

## Query answerability (same question classes)

| Class | Phase 1.5 | Phase 1.6 | Phase 2.1 |
| ----- | --------- | --------- | --------- |
| SELECT structure | yes | yes | yes + FILTER/SEARCH |
| TRAVERSE IMPORTS | mostly fail | yes | yes |
| PATH / IMPACT | fail | yes | yes |
| CALLERS / CALLS | impossible | impossible | **partial** (uncertainty preserved) |
| Scoped index | defaults only | defaults only | **include/exclude** |

### Sample compositions observed

```text
ffvs search common --kind module
→ ffvs dependents src/common.js

ffvs search safeParse --kind function
→ ffvs callers <id>

ffvs functions --path packages/zod/src/v4/core --name parse
→ ffvs inspect / callers / calls
```

## Findings

1. FILTER/SEARCH make large graphs operable without a DSL.
2. CALLS exist at scale but **majority are UNRESOLVED/AMBIGUOUS** on zod — honesty of uncertainty is mandatory.
3. Exclude patterns are part of experimental reproducibility (universe control).
4. Composition pressure is real: SEARCH→TRAVERSE and SELECT→FILTER→TRAVERSE recur.

## Negative results

- Identifier-only / member-call resolution cannot claim soundness.
- `createDebug`-style names may not resolve if extraction naming differs.
- tsconfig `paths` / package `exports` still not implemented (not forced by this re-run beyond existing `.js→.ts`).

## Conclusion

Model fidelity (IMPORTS) remains the foundation. CALLS unlocks new questions incompletely. Query composition via CLI is now the bottleneck toward a language — see EXP-DSL-0001.

# EXP-DSL-0006 — Cross-Relation Composition

## Hypothesis

> If users routinely need questions that chain **different** relation kinds (especially IMPORTS ↔ CALLS), then FFVS may need explicit cross-relation composition beyond today’s sequential stages.

Falsifiable if: (a) sequential `traverse` already answers those questions naturally, or (b) remaining gaps are set-intersection / entity-kind bridging / fidelity — not missing relation composition syntax.

## Research Questions

| ID  | Question                                                       | Axes                 |
| --- | -------------------------------------------------------------- | -------------------- |
| Q01 | Modules that import M — within them, functions that call F?    | IMPORTS → CALLS      |
| Q02 | Functions that call F — which modules do those callers import? | CALLS → IMPORTS      |
| Q03 | Hybrid impact: IMPORTS cone then CALLS (or union)?             | IMPORTS + CALLS      |
| Q04 | Callers of F whose modules lie in impact(M)?                   | CALLS ∩ IMPORTS      |
| Q05 | Dependencies of modules that contain callers of F?             | CALLS → IMPORTS      |
| Q06 | Functions within N CALL hops of F?                             | CALLS → CALLS        |
| Q07 | Dependencies after multiple IMPORT hops?                       | IMPORTS → IMPORTS    |
| Q08 | IMPORTS→CALLS composition with resolved-only CALLS?            | cross + resolution   |
| Q09 | select → where → traverse → traverse common?                   | composition + filter |
| Q10 | Same as Q01/Q02 starting from CALLS side?                      | inverse              |

## Corpus

Pinned clones under `%TEMP%/ffvs-exp-dsl-0006/` (not vendored into git).

| Corpus        | Repository                                                             | Commit                  | Files | Nodes | IMPORTS (R/E/U/A) | CALLS (R/A/U)     | Parse errors |
| ------------- | ---------------------------------------------------------------------- | ----------------------- | ----- | ----- | ----------------- | ----------------- | ------------ |
| **debug**     | [debug-js/debug](https://github.com/debug-js/debug)                    | `f405ade`               | 13    | 113   | 6/8/0/0           | 24/3/168          | 0            |
| **zod**       | [colinhacks/zod](https://github.com/colinhacks/zod) `packages/zod/src` | `c5b9bcb`               | 328   | 3284  | 556/397/0/0       | 10501/12530/21514 | 6            |
| **commander** | [tj/commander.js](https://github.com/tj/commander.js)                  | `e6f56c8` (v13.1.0 tag) | 219   | 1168  | 19/75/107/0       | 3862/297/5332     | 1            |
| **ffvs-self** | FFVS `src/` copy                                                       | `ec0c53d`               | 39    | 395   | 108/21/0/0        | 364/0/1027        | 0            |

Seeds (max inbound RESOLVED CALLS / IMPORTS dependents):

| Corpus    | Function seed        | Module seed          |
| --------- | -------------------- | -------------------- |
| debug     | `log` (6 callers)    | `common.js` (2 deps) |
| zod       | `toJSONSchema` (366) | `util.ts` (86)       |
| commander | `red` (46)           | `error.js` (4)       |
| ffvs-self | `printJson` (21)     | `types.ts` (22)      |

Raw numbers: [`results.json`](./results.json). Harness: [`measure.mjs`](./measure.mjs).

## Baseline

```text
FFVS version:           0.8.0
Query Language version: 0.3
Tests:                  106 passed
Build:                  ✓
Lint:                   ✓
```

No pre-existing breakage attributed to this experiment.

## Methodology

1. Index each corpus with FFVS CLI (zod scoped to `packages/zod/src`).
2. Attempt each question with **DSL v0.3 only** (and two-query + tiny script where needed for intersection measurement).
3. Classify PASS / PARTIAL / FAIL / N/A.
4. Attribute cause before proposing syntax.
5. **No new language features implemented.**

## Results

### PASS / PARTIAL / FAIL / N/A

Aggregated across corpora (worst-case class if mixed; see table below for detail).

| Q   | Verdict     | Best existing expression                                                                                                                                                                                                                              |
| --- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q01 | **PARTIAL** | Naive `dependents → callers` = empty (kind mismatch). Bridge `dependents → declares → calls` answers a _related_ question (callees from dependent modules), not exact “callers of F inside importers of M”. Exact Q01 needs intersection of two sets. |
| Q02 | **PASS**    | `search F traverse callers resolution resolved traverse dependencies` (module-anchor on deps)                                                                                                                                                         |
| Q03 | **PARTIAL** | `impact` and `impact along calls` each PASS alone; hybrid unlabeled merge unsupported (honesty)                                                                                                                                                       |
| Q04 | **PARTIAL** | Two queries + external ∩ (measured on ffvs-self: 1 caller module ∩ 30 impact modules → 1 hit). No DSL set ops.                                                                                                                                        |
| Q05 | **PASS**    | Same pipeline as Q02                                                                                                                                                                                                                                  |
| Q06 | **PASS**    | 1–2 hop: repeated `traverse callers resolution resolved`; transitive: `impact along calls`. Exact depth-N parameter absent (acceptable; not cross-relation).                                                                                          |
| Q07 | **PASS**    | Repeated `traverse dependencies` / `dependents`; or `impact` for transitive dependents                                                                                                                                                                |
| Q08 | **PASS**    | `… traverse declares traverse calls resolution resolved` — tallies preserved; zod all-res: R=963 A=198 U=465 on last hop                                                                                                                              |
| Q09 | **PASS**    | `select … where … traverse … traverse …` works on all corpora                                                                                                                                                                                         |
| Q10 | **PASS**    | CALLS→IMPORTS path (Q02) covers inverse pressure                                                                                                                                                                                                      |

### Per-corpus composition table

| Pergunta | Corpus            | Atual                      | Problema                                                  | Relações          |
| -------- | ----------------- | -------------------------- | --------------------------------------------------------- | ----------------- |
| Q01      | debug             | PARTIAL                    | kind + intersection                                       | IMPORTS → CALLS   |
| Q01      | zod               | PARTIAL                    | same (bridge yields 278 resolved callees; not F-filtered) | IMPORTS → CALLS   |
| Q01      | commander         | PARTIAL/empty bridge calls | fidelity/seed                                             | IMPORTS → CALLS   |
| Q01      | ffvs-self         | PARTIAL                    | intersection                                              | IMPORTS → CALLS   |
| Q02      | debug             | PASS                       | —                                                         | CALLS → IMPORTS   |
| Q02      | zod               | PASS                       | —                                                         | CALLS → IMPORTS   |
| Q02      | ffvs-self         | PASS                       | —                                                         | CALLS → IMPORTS   |
| Q02      | commander         | PARTIAL                    | weak IMPORTS resolution (15% internal)                    | CALLS → IMPORTS   |
| Q03      | all               | PARTIAL                    | hybrid semantics                                          | IMPORTS + CALLS   |
| Q04      | ffvs-self         | PARTIAL                    | no intersect                                              | CALLS ∩ IMPORTS   |
| Q05      | debug/zod/ffvs    | PASS                       | —                                                         | CALLS → IMPORTS   |
| Q06      | ffvs-self         | PASS                       | two-hop → `runCli`                                        | CALLS → CALLS     |
| Q06      | zod               | PASS                       | two-hop sparse but works                                  | CALLS → CALLS     |
| Q07      | zod               | PASS                       | 5→21 two-hop deps                                         | IMPORTS → IMPORTS |
| Q07      | debug             | PASS                       | impact / dependents×2                                     | IMPORTS → IMPORTS |
| Q08      | zod               | PASS                       | resolution filter                                         | IMPORTS → CALLS   |
| Q09      | all               | PASS                       | —                                                         | mixed             |
| Q10      | all strong graphs | PASS                       | —                                                         | CALLS → IMPORTS   |

Counts (10 questions × primary verdict): **PASS 6 · PARTIAL 4 · FAIL 0 · N/A 0**

## Failure Analysis

| Case                        | Class     | Cause category                         | Detail                                                    |
| --------------------------- | --------- | -------------------------------------- | --------------------------------------------------------- |
| Q01 naive                   | empty     | **semantic model / entity kind**       | MODULE seeds have no CALLS; not “missing JOIN syntax”     |
| Q01 exact                   | PARTIAL   | **language: no set intersection**      | Needs callers(F) ∩ declares(dependents(M))                |
| Q03 hybrid                  | PARTIAL   | **semantic honesty**                   | Auto IMPORT+CALL impact rejected in EXP-CALLS-IMPACT-0001 |
| Q04                         | PARTIAL   | **language: no intersect / variables** | Expressible as A∩B outside DSL                            |
| Q02 commander               | PARTIAL   | **index fidelity**                     | Many UNRESOLVED IMPORTS                                   |
| Relations dropped after hop | by design | **ResultSet**                          | Last-hop edges only (ADR-0020); not a bug                 |

## IMPORTS Composition

- Same-axis multi-hop **works** (`traverse dependencies` ×2; `impact`).
- Cross into CALLS needs **`traverse declares`** (or equivalent) as a kind bridge.
- No evidence that a dedicated IMPORTS→CALLS operator beats documented sequential pipelines.

## CALLS Composition

- Same-axis multi-hop **works**; transitive via `impact along calls`.
- Uncertainty preserved when filter omitted (zod Q08_all: large AMBIGUOUS/UNRESOLVED counts).
- `resolution resolved` does not coerce AMBIGUOUS→RESOLVED.

## Resolution Uncertainty

| Observation                           | Evidence                             |
| ------------------------------------- | ------------------------------------ |
| Filter is opt-in and edge-local       | Q08 zod resolved-only vs all         |
| Cross-composition must not hide noise | Inclusive last hop shows A/U tallies |
| CALLS remain non-ground-truth         | debug 168/195 UNRESOLVED             |

## Semantic Model Findings

1. **Traverse result → next traverse input is already natural** (entities replace; relations reset).
2. Composition failure mode is often **wrong entity kind**, not missing edge composition.
3. Hard questions need **set intersection across independently derived entity sets**, which is a different feature class than “compose relations”.
4. Prior-hop provenance is **not** retained (by design). Reintroducing it implies JOIN-like ResultSet — high cost, low evidence for this experiment’s hypothesis.

## Language Findings

- QL v0.3 sequential stages already implement **cross-relation composition** for aligned kinds.
- Documented recipe:

```text
# CALLS → IMPORTS
search "F" kind function
traverse callers resolution resolved
traverse dependencies

# IMPORTS → callables → CALLS (bridge)
search "M" kind module
traverse dependents
traverse declares
traverse calls resolution resolved
```

- Gaps that remain are **intersect / bind / depth-N**, not a new relation-composition keyword.

## Alternatives Considered

| Option                                      | Expressiveness  | Cost   | Verdict                    |
| ------------------------------------------- | --------------- | ------ | -------------------------- |
| **A** Multi-query + script                  | Full (Q01/Q04)  | Manual | Sufficient for rare cases  |
| **B** Sequential DSL (current)              | High for chains | Zero   | **Preferred default**      |
| **C** Specific sugar (`imports then calls`) | Low gain over B | Medium | Rejected                   |
| **D** Generic PIPE/JOIN                     | High            | High   | Unevidenced; feature creep |
| **E** Semantic model change (typed hops)    | Clarifies kinds | Medium | Optional docs, not code    |

## Decision

```text
NOT JUSTIFIED
```

**Cross-relation composition as a new language feature is NOT JUSTIFIED.**

Evidence shows sequential `traverse` already composes IMPORTS and CALLS when entity kinds are bridged. Remaining PARTIALs are intersection / hybrid-impact honesty / corpus fidelity — none warrant JOIN/PIPE/`path along calls`/`impact imports+calls` in this phase.

## Limitations

- Seeds auto-picked by degree; may not match human “interesting” questions.
- commander IMPORTS fidelity weak → some PARTIALs are corpus, not language.
- Intersection measured on one corpus (ffvs-self) in depth; pattern generalized qualitatively.
- No timed user study (expressiveness only).

## Reproducibility

```powershell
# After cloning corpora to %TEMP%\ffvs-exp-dsl-0006\{debug,zod,commander,ffvs-self}
# and indexing (see measure.mjs header / EXP-0002 pins):
node research/experiments/EXP-DSL-0006/measure.mjs
node research/experiments/EXP-DSL-0006/intersect-q04.mjs
```

## Next Step

Recommended **next experiment** (do not implement blindly):

```text
EXP-DSL-0007 — ResultSet intersection / dual-seed filters
```

Hypothesis: a minimal **intersect** (or binding of two named result sets) would convert Q01/Q04 from PARTIAL→PASS without introducing generic JOIN algebra.

Until that evidence exists: keep QL at **v0.3**, package **0.8.0**, teach kind-bridging recipes in docs.

See [ADR-0023](../../../docs/design-decisions/ADR-0023-cross-relation-composition.md).

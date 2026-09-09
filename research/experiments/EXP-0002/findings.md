# Findings (EXP-0002)

## What FFVS is actually good at (on this corpus)

1. **Inventory / STRUCTURE SELECT** — fast counts of files, modules, functions, classes, methods; works on small (`debug`) and medium (`zod`) repos.
2. **DESCRIBE entities** — `inspect` / `children` / `relations --kind EXTENDS` produced clear, useful answers for class structure and inheritance (zod).
3. **Honest local artifacts** — `.ffvs/graph.json` is inspectable; failures are visible (external stubs, parseErrors).
4. **Control fixtures still work** — when relative imports resolve with extensions, `path`/`impact`/`dependents` behave as designed (`fixtures/layered`).

## What failed on real software

### F1 — Import resolution is the blocker

| Pattern                   | Example                                                   | Effect                                    |
| ------------------------- | --------------------------------------------------------- | ----------------------------------------- |
| Extensionless CJS         | `require('./common')` in debug                            | No edge to `common.js`                    |
| TS ESM `.js`→`.ts`        | `import … from './schemas.js'` while file is `schemas.ts` | 1411/1413 zod IMPORTS marked **external** |
| Directory / package entry | `require('./src')`                                        | Unresolved                                |

Consequence: **TRAVERSE / FIND PATH / IMPACT on module IMPORTS are not trustworthy** on these repos.

### F2 — Entity lookup friction

Path-like names (`src/common.js`) are ambiguous between `FILE` and `MODULE` → Awkward UX; forces `module:` ids.

### F3 — Scale without FILTER

`ffvs classes` / `functions` on zod dumps hundreds/thousands of entities including bench/docs. SELECT without FILTER is painful.

### F4 — CALLS absence

“Who calls `safeParse`?” cannot be answered. Listing similarly named functions is a weak substitute.

### F5 — Centrality is premature

Out-degree rankings exist via script, but with mostly-external IMPORTS they do not measure architectural importance of real modules. In-degree on zod collapsed (~all zeros for internal modules). **Do not claim centrality value yet.**

### F6 — Cycles

No cycles found in sampled graph walk—but with broken edges this is **not** evidence the projects are acyclic.

## Composition pressure (observed)

Real multi-step intents:

1. SELECT functions → FILTER by name (`parse`) → (wanted) TRAVERSE callers — **blocked on CALLS + FILTER**
2. TRAVERSE dependencies of barrel → DESCRIBE each target — **blocked on resolution; wants composition**
3. SELECT classes → FILTER path prefix `packages/zod/src` → DESCRIBE hierarchy — **wants FILTER + maybe GROUP**
4. RANK modules by dependents → INSPECT top — **blocked on resolution + missing RANK**

Composition desire appeared **even when single commands existed**, especially for FILTER after SELECT.

## Redundancies (confirmed on real runs)

| Pair                                    | Observation                                                 |
| --------------------------------------- | ----------------------------------------------------------- |
| `imports` vs `relations --kind IMPORTS` | Same edges; formatting differs                              |
| `graph` vs `relations`                  | Human vs edge-first views of neighborhood                   |
| `dependents` ⊂ `impact`                 | Still true; irrelevant when both empty due to missing edges |
| `inspect` Used by ≈ `dependents`        | Still true when edges exist                                 |

No removals performed (document first).

## Candidate new primitives (not implemented)

| Candidate                     | Why                                  | Example question                       |
| ----------------------------- | ------------------------------------ | -------------------------------------- |
| **RESOLVE** (import fidelity) | Prerequisite for TRAVERSE usefulness | Map `./x.js`→`x.ts`, extensionless CJS |
| **FILTER**                    | Scale + composition                  | Classes under `packages/zod/src`       |
| **SEARCH**                    | Name/path lookup                     | Functions matching `/parse/i`          |
| **RANK / COUNT**              | Architecture questions               | Top dependents                         |
| **CYCLE**                     | Architecture smell                   | Detect import cycles                   |
| **CALLS**                     | Impact at function level             | Who calls `safeParse`?                 |
| **DISAMBIGUATE** policy       | UX                                   | Prefer MODULE for deps commands        |

## Evidence regarding a DSL

### For DSL

- Repeated SELECT→FILTER→TRAVERSE intents.
- Natural language questions map cleanly onto emerging primitives **when data exists**.
- Composition pressure is real.

### Against DSL (now)

- On real repos, **edge fidelity failed first**; a prettier language would still return empty impact.
- Many valuable questions were answered with simple verbs (`inspect`, `classes`, `relations --kind EXTENDS`).
- Operator confusion (file vs module) would get worse with a language before UX defaults improve.

### Conclusion on DSL

**Insufficient evidence to start Phase 2 DSL.** Sufficient evidence to prioritize **model correctness (import resolution)** and light **FILTER/SEARCH** before language design.

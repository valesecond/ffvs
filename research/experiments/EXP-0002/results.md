# Results (EXP-0002)

Numbers below are from the question catalog in [`questions.md`](./questions.md) (Q-001–Q-024). Control fixture Q-022 is included and marked; meta Q-024 included.

## By category

| Question category | Total | Answerable (YES) | Partial | Impossible (NO) |
|-------------------|------:|-----------------:|--------:|----------------:|
| STRUCTURE | 5 | 4 | 1 | 0 |
| DEPENDENCY | 5 | 0 | 2 | 3 |
| NAVIGATION | 4 | 0 | 1 | 3 |
| IMPACT | 3 | 1 | 0 | 2 |
| ARCHITECTURE | 3 | 1 | 2 | 0 |
| QUALITY | 2 | 1 | 0 | 0* |
| COMPOSITION (hyp.) | 1 | 0 | 0 | 1 |
| SEARCH (via compose) | 1 | 0 | 1 | 0 |
| **Total** | **24** | **7** | **7** | **9** |

\* Q-024 is tooling-meta YES and counted under QUALITY; Q-021 YES.

Notes:

- IMPACT YES is the **fixture control** (Q-022), not an OSS success.
- On OSS alone (excluding Q-022/Q-024): YES≈5, PARTIAL≈7, NO≈9 — STRUCTURE-heavy successes; DEPENDENCY/NAVIGATION/IMPACT dominated by NO/PARTIAL.

## Experience classification

| Experience | Count | Meaning |
|------------|------:|---------|
| Direct | 8 | One command, usable answer |
| Composed | 4 | Multiple steps / external filter |
| Missing | 9 | Model/relation insufficient |
| Awkward | 5 | Possible but painful UX (some overlap with Partial) |

(Overlap allowed: a question may be Partial + Awkward + Missing aspects; primary label used in catalog.)

## Primitive usage (approximate, from catalog operations)

| Primitive / family | Usage count (questions referencing) | Composition count |
|--------------------|------------------------------------:|------------------:|
| SELECT (files/functions/classes/status/inspect summary) | 7 | 2 |
| DESCRIBE (inspect/children/graph) | 4 | 1 |
| TRAVERSE (deps/dependents/impact) | 8 | 1 |
| FIND PATH | 3 | 0 |
| SELECT RELATIONS | 3 | 0 |
| Scripted RANK/CYCLE (analyze-graph) | 3 | 3 |
| Wanted FILTER/SEARCH/CALLS (missing) | 6 | 4 |

## Missing capability frequency

| Missing capability | # questions citing it |
|--------------------|----------------------:|
| Import resolution (extless / `.js`→`.ts`) | 9 |
| CALLS | 2 |
| FILTER / SEARCH | 5 |
| RANK / CYCLE CLI | 3 |
| Disambiguation (file vs module) | 1 |
| Composition / piping | 3 |

## Import graph health (measured)

| Repo | IMPORTS edges | Internal module→module | External / stub |
|------|--------------:|-----------------------:|----------------:|
| debug | 8 | low (extless locals missing) | many package + unresolved |
| zod | 1413 | **2** | **1411** |

## Index health

| Repo | Files | Parse errors | Nodes | Edges |
|------|------:|-------------:|------:|------:|
| debug | 13 | 0 | 47 | 72 |
| zod | 725 | 7 | 4561 | 9883 |

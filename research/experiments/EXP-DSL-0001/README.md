# EXP-DSL-0001 — DSL discovery (composition without a language)

## Goal

Determine whether recurring multi-step CLI compositions justify a future DSL.

**No DSL was implemented.** All sequences use existing commands only.

## Method

Collect ≥20 real questions FFVS should answer; record command sequence, primitives, limits, desired result, composition depth.

Corpus contexts: `fixtures/*`, EXP-0002/0003 (`debug`, `zod`).

## Questions (22)

| #   | Question                                | Command sequence                                           | Primitives              | Limits               | Desired        | Depth |
| --- | --------------------------------------- | ---------------------------------------------------------- | ----------------------- | -------------------- | -------------- | ----- |
| 1   | Who depends on module X?                | `dependents X`                                             | TRAVERSE in IMPORTS     | needs MODULE resolve | list modules   | 1     |
| 2   | What does module X import?              | `deps X`                                                   | TRAVERSE out IMPORTS    | external noise       | list           | 1     |
| 3   | Impact of changing X?                   | `impact X`                                                 | TRAVERSE* IMPORTS       | module-anchored      | transitive set | 1     |
| 4   | Path from A to B?                       | `path A B`                                                 | PATH IMPORTS            | only IMPORTS         | hop list       | 1     |
| 5   | Functions named like resolve?           | `functions --name resolve`                                 | SELECT+FILTER           | substring only       | list           | 1     |
| 6   | Functions under src/core?               | `functions --path src/core`                                | SELECT+FILTER           |                      | list           | 1     |
| 7   | Find anything named parse?              | `search parse`                                             | SEARCH                  | ranking shallow      | candidates     | 1     |
| 8   | Functions named parse in core?          | `search parse --kind function --path …/core`               | SEARCH+FILTER-ish       |                      | candidates     | 1     |
| 9   | Inspect a search hit                    | `search X` → `inspect <id>`                                | SEARCH→DESCRIBE         | manual handoff       | summary        | 2     |
| 10  | Who calls safeParse?                    | `search safeParse --kind function` → `callers <id>`        | SEARCH→TRAVERSE CALLS   | ambiguous calls      | callers        | 2     |
| 11  | What does total call?                   | `calls total`                                              | TRAVERSE out CALLS      | unresolved callees   | callees        | 1     |
| 12  | Classes in src?                         | `classes --path src`                                       | SELECT+FILTER           |                      | list           | 1     |
| 13  | Graph neighborhood of class             | `classes --path src` → `graph <id>`                        | SELECT+FILTER→DESCRIBE  |                      | edges          | 2     |
| 14  | Children of a module                    | `children module:…`                                        | TRAVERSE CONTAINS       |                      | decls          | 1     |
| 15  | Unresolved imports?                     | `diagnostics`                                              | SELECT relations (meta) | imports-focused      | list           | 1     |
| 16  | Relations of kind CALLS for X           | `relations X --kind CALLS`                                 | SELECT RELATIONS        |                      | edges          | 1     |
| 17  | Files under packages/zod/src            | `files --path packages/zod/src`                            | SELECT+FILTER           |                      | files          | 1     |
| 18  | Core functions calling parse helpers    | `functions --path …/core --name parse` → `callers`/`calls` | SELECT+FILTER→TRAVERSE  | multi-entity         | set            | 2–3   |
| 19  | Dependents of common after finding it   | `search common --kind module` → `dependents`               | SEARCH→TRAVERSE         |                      | modules        | 2     |
| 20  | Extends chain                           | `relations Class --kind EXTENDS`                           | SELECT RELATIONS        | sparse               | edges          | 1     |
| 21  | Exclude docs from universe              | `index . --exclude packages/docs`                          | SCOPE                   | not a query          | smaller graph  | 0     |
| 22  | Shortest path after selecting endpoints | `functions --name A` + `functions --name B` → `path`       | SELECT+FILTER→PATH      | two lookups          | path           | 3     |

## Pattern counts (from table)

| Pattern                                     | Count |
| ------------------------------------------- | ----- |
| SELECT + FILTER                             | 6     |
| SEARCH alone                                | 2     |
| SEARCH → DESCRIBE                           | 1     |
| SEARCH → TRAVERSE                           | 2     |
| SELECT + FILTER → DESCRIBE                  | 1     |
| SELECT + FILTER → TRAVERSE                  | 2     |
| SELECT + FILTER → PATH                      | 1     |
| TRAVERSE alone (deps/impact/calls/children) | 6     |
| PATH alone                                  | 1     |
| SELECT RELATIONS / diagnostics              | 2     |
| SCOPE (index)                               | 1     |

Depth ≥2 compositions: **7 / 22** (~32%).

## Grouped insights

1. **Single-verb TRAVERSE** remains the most common “magic” ask (deps/impact/callers).
2. **SEARCH → TRAVERSE** and **SELECT+FILTER → TRAVERSE** are the strongest multi-step patterns.
3. Depth-3 appears when endpoints must be discovered before PATH.
4. Users need **result identity** (stable ids) to pipe steps — CLI today forces copy/paste.

## Evidence for a language

**For**

- Recurring composition shapes with shared intermediates.
- Manual handoff of entity ids is frictional.
- Small set of primitives covers most questions.

**Against / caveats**

- Many questions are still depth-1 (CLI adequate).
- CALLS uncertainty would be easy to hide in fluent syntax — language must surface resolution.
- FILTER flags are already tolerable for depth-1 SELECT.

## Verdict input to Phase 2.9

Composition pressure is **sufficient to specify** a minimal language; implementation remains gated on readiness review. See `docs/language/` and ADR-0018.

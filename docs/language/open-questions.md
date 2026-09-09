# Open questions (post 0.8.0)

Resolved in 0.6–0.8:

- Pipeline maps over all entities in the set (no implicit `pick`).
- Default print = entity list; `describe` adds summaries (+ module/loc in 0.8).
- Traverse direction defaults + override (`traverse.md`).
- Opt-in `traverse … resolution <state>` (EXP-RESOLUTION-0001).
- Explicit `impact along calls` (EXP-CALLS-IMPACT-0001); default IMPACT stays IMPORTS.
- Query `scope` stage rejected (EXP-SCOPE-0001); index scope remains authority.
- Lower-case keywords; whitespace / newlines separate stages.
- Dedup by id; deterministic order; empty = success.
- Relations = last traverse hop only.
- SEARCH case-insensitive needle vs WHERE case-sensitive.

Still open (feed 0.9 evaluation — see `docs/roadmap/ffvs-0.9.md`):

1. PATH over CALLS / mixed relations?
2. Combined IMPORT+CALL impact (explicit dual-axis)?
3. Dual-seed / ResultSet intersection (EXP-DSL-0006 PARTIAL Q01/Q04)?
4. AND/OR / pipes / aggregates — still unevidenced for implementation?
5. Further DESCRIBE fields without collapsing into INSPECT?

Resolved by EXP-DSL-0006: **cross-relation composition syntax** — NOT JUSTIFIED (sequential traverse + kind bridge suffice).

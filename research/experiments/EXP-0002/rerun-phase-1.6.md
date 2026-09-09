# EXP-0002 re-run after Phase 1.6

**Date:** 2026-09-09  
**Corpus:** unchanged (`debug@f405ade`, `zod@c5b9bcb`)  
**Before:** FFVS `0.3.0` @ `da12caf`  
**After:** FFVS `0.4.0` (Phase 1.6 resolver + CJS require-site extraction)

## Metric definition

```text
internal_import_resolution_rate =
  resolved_internal
  ─────────────────────────────────────────────────
  resolved_internal + unresolved_relative + ambiguous
```

EXTERNAL (bare packages) excluded from the denominator.

## Aggregate comparison

| Metric                   |          debug BEFORE | debug AFTER |      zod BEFORE |                   zod AFTER |
| ------------------------ | --------------------: | ----------: | --------------: | --------------------------: |
| IMPORTS total (approx)   |                     8 |          14 |            1413 |                        1414 |
| Resolved internal        |                 ~0–2* |       **6** |           **2** |                     **660** |
| External                 |              majority |           8 |        **1411** |                     **754** |
| Unresolved               | conflated w/ external |       **0** |       conflated |                       **0** |
| Ambiguous                |                     — |           0 |               — |                           0 |
| Internal resolution rate |                ~0–low |    **100%** | ≈0.14% (2/1413) | **100%** (660/660 relative) |

\* Before Phase 1.6, failed relative imports were labeled EXTERNAL, so “resolved internal” was undercounted and rates were not trustworthy.

## Question outcomes (selected)

| ID          | Question                                       | BEFORE    | AFTER                                  |
| ----------- | ---------------------------------------------- | --------- | -------------------------------------- |
| Q-007       | Who depends on `common.js`?                    | NO (none) | **YES** — `browser.js`, `node.js`      |
| Q-008       | Impact of `common.js`                          | NO        | **YES** — 5 modules (incl. transitive) |
| Q-009       | Path `index.js` → `common.js`                  | NO        | **YES** (via browser.js)               |
| Q-012       | Who depends on core `schemas.ts`?              | NO        | **YES** — many core modules            |
| Q-013       | Impact of `schemas.ts`                         | NO (0)    | **YES** — **180** affected             |
| Q-014       | Path `classic/external.ts` → `core/schemas.ts` | NO        | **YES** (2 hops)                       |
| Q-003/Q-004 | Class inspect / EXTENDS                        | YES       | YES (unchanged)                        |
| Q-018       | Who calls `safeParse`?                         | NO        | NO (still needs CALLS)                 |

## Architectural changes that unlocked results

1. Dedicated `resolveModule` with `.js`→`.ts` and extensionless CJS candidates.
2. Relative failures classified as **UNRESOLVED**, not EXTERNAL.
3. Broader CJS `require("…")` extraction (not only `const x = require(...)`).
4. Lookup prefers **MODULE** over FILE for path queries.

## Still impossible / limited

- CALLS / callers
- FILTER/SEARCH at scale
- tsconfig path aliases / package `exports` maps
- Some Babel parse errors on advanced TS (7 files in zod)

## Conclusion

Phase 1.6 materially improved **graph fidelity** on the EXP-0002 corpus. Dependency/impact/path questions that were false negatives are now answerable. **DSL remains deferred**; next value is optional FILTER and eventually CALLS—not syntax.

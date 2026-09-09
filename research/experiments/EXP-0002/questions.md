# Question catalog (EXP-0002)

Legend:

- **Answerable:** YES / PARTIAL / NO
- **Experience:** Direct | Composed | Missing | Awkward
- **Confidence:** HIGH / MEDIUM / LOW

---

## Q-001

| Field        | Value                                                                     |
| ------------ | ------------------------------------------------------------------------- |
| Question     | How large is this project in FFVS’s model (files, entities, relations)?   |
| Category     | STRUCTURE                                                                 |
| Repository   | debug, zod                                                                |
| Operation(s) | `ffvs inspect` / `ffvs status --json`                                     |
| Answerable   | YES                                                                       |
| Experience   | Direct                                                                    |
| Confidence   | HIGH                                                                      |
| Missing      | —                                                                         |
| Notes        | debug: 13 files, 47 nodes; zod: 725 files, 4561 nodes. Instant inventory. |

## Q-002

| Field        | Value                                                            |
| ------------ | ---------------------------------------------------------------- |
| Question     | Which classes exist in the codebase?                             |
| Category     | STRUCTURE                                                        |
| Repository   | zod                                                              |
| Operation(s) | `ffvs classes`                                                   |
| Answerable   | YES                                                              |
| Experience   | Direct                                                           |
| Confidence   | HIGH                                                             |
| Missing      | FILTER (too many results; no `--path` / name filter)             |
| Notes        | 60+ classes listed; includes bench/docs noise. Awkward at scale. |

## Q-003

| Field        | Value                                                                            |
| ------------ | -------------------------------------------------------------------------------- |
| Question     | What methods does `$ZodAsyncError` contain, and what does it extend?             |
| Category     | STRUCTURE                                                                        |
| Repository   | zod                                                                              |
| Operation(s) | `ffvs inspect $ZodAsyncError`                                                    |
| Answerable   | YES                                                                              |
| Experience   | Direct                                                                           |
| Confidence   | HIGH                                                                             |
| Missing      | —                                                                                |
| Notes        | Showed Extends Error, constructor method, file location. Strong DESCRIBE moment. |

## Q-004

| Field        | Value                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| Question     | What inheritance relationships exist?                                  |
| Category     | ARCHITECTURE                                                           |
| Repository   | zod                                                                    |
| Operation(s) | `ffvs relations --kind EXTENDS --json`                                 |
| Answerable   | YES                                                                    |
| Experience   | Direct                                                                 |
| Confidence   | HIGH                                                                   |
| Missing      | FILTER / GROUP (e.g. only under `packages/zod/src`)                    |
| Notes        | 46 EXTENDS edges (ZodType hierarchy, Error subclasses, bench helpers). |

## Q-005

| Field        | Value                            |
| ------------ | -------------------------------- |
| Question     | What sits inside class `Cached`? |
| Category     | STRUCTURE                        |
| Repository   | zod                              |
| Operation(s) | `ffvs children Cached`           |
| Answerable   | YES                              |
| Experience   | Direct                           |
| Confidence   | HIGH                             |
| Missing      | —                                |
| Notes        | CONTAINS → constructor, value.   |

## Q-006

| Field        | Value                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Question     | What does `src/node.js` (debug) depend on?                                                                                            |
| Category     | DEPENDENCY                                                                                                                            |
| Repository   | debug                                                                                                                                 |
| Operation(s) | `ffvs dependencies module:src/node.js`                                                                                                |
| Answerable   | PARTIAL                                                                                                                               |
| Experience   | Awkward + Missing                                                                                                                     |
| Confidence   | HIGH                                                                                                                                  |
| Missing      | Reliable CJS resolution (extensionless `./common`); package edges are present (`tty`, `util`) but local `./common` missing from graph |
| Notes        | Only showed external `tty`/`util`. Source also `require('./common')` and `supports-color`—incomplete.                                 |

## Q-007

| Field        | Value                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------- |
| Question     | Who depends on `src/common.js`?                                                                |
| Category     | DEPENDENCY                                                                                     |
| Repository   | debug                                                                                          |
| Operation(s) | `ffvs dependents module:src/common.js`                                                         |
| Answerable   | NO                                                                                             |
| Experience   | Missing                                                                                        |
| Confidence   | HIGH                                                                                           |
| Missing      | Import resolution for extensionless relative requires                                          |
| Notes        | Returned (none). Manually: `browser.js` and `node.js` both require `./common`. False negative. |

## Q-008

| Field        | Value                                               |
| ------------ | --------------------------------------------------- |
| Question     | If `common.js` changes, what else may be affected?  |
| Category     | IMPACT                                              |
| Repository   | debug                                               |
| Operation(s) | `ffvs impact module:src/common.js`                  |
| Answerable   | NO                                                  |
| Experience   | Missing                                             |
| Confidence   | HIGH                                                |
| Missing      | Same as Q-007; also no CALLS                        |
| Notes        | “(no dependents)” — impact analysis false negative. |

## Q-009

| Field        | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| Question     | Is there an import path from `index.js` to `common.js`?    |
| Category     | NAVIGATION                                                 |
| Repository   | debug                                                      |
| Operation(s) | `ffvs path module:src/index.js module:src/common.js`       |
| Answerable   | NO                                                         |
| Experience   | Missing                                                    |
| Confidence   | HIGH                                                       |
| Missing      | Resolved IMPORTS chain (`index`→`node`/`browser`→`common`) |
| Notes        | “No path”. True architectural path exists in source.       |

## Q-010

| Field        | Value                                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| Question     | Explore `src/common.js` dependencies/path using the path string as entity name |
| Category     | NAVIGATION                                                                     |
| Repository   | debug                                                                          |
| Operation(s) | `ffvs dependencies src/common.js`                                              |
| Answerable   | PARTIAL                                                                        |
| Experience   | Awkward                                                                        |
| Confidence   | HIGH                                                                           |
| Missing      | Disambiguation policy (prefer MODULE over FILE)                                |
| Notes        | Ambiguous: `file:` vs `module:` candidates. Required explicit `module:` ids.   |

## Q-011

| Field        | Value                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| Question     | What does `packages/zod/src/v4/core/schemas.ts` import?                                                           |
| Category     | DEPENDENCY                                                                                                        |
| Repository   | zod                                                                                                               |
| Operation(s) | `ffvs dependencies module:packages/zod/src/v4/core/schemas.ts`                                                    |
| Answerable   | PARTIAL                                                                                                           |
| Experience   | Awkward                                                                                                           |
| Confidence   | HIGH                                                                                                              |
| Missing      | `.js` specifier → `.ts` file mapping                                                                              |
| Notes        | Listed many `./util.js`, `./checks.js`, etc. as **external**. Outgoing edges exist as stubs, not as real modules. |

## Q-012

| Field        | Value                                                                            |
| ------------ | -------------------------------------------------------------------------------- |
| Question     | Who depends on `schemas.ts` (core)?                                              |
| Category     | DEPENDENCY                                                                       |
| Repository   | zod                                                                              |
| Operation(s) | `ffvs dependents module:packages/zod/src/v4/core/schemas.ts`                     |
| Answerable   | NO                                                                               |
| Experience   | Missing                                                                          |
| Confidence   | HIGH                                                                             |
| Missing      | `.js`→`.ts` import resolution                                                    |
| Notes        | (none). Graph shows many importers of `./schemas.js` as `external:./schemas.js`. |

## Q-013

| Field        | Value                                                    |
| ------------ | -------------------------------------------------------- |
| Question     | Impact of changing core `schemas.ts`                     |
| Category     | IMPACT                                                   |
| Repository   | zod                                                      |
| Operation(s) | `ffvs impact module:packages/zod/src/v4/core/schemas.ts` |
| Answerable   | NO                                                       |
| Experience   | Missing                                                  |
| Confidence   | HIGH                                                     |
| Missing      | Resolved module graph                                    |
| Notes        | `affected count=0`.                                      |

## Q-014

| Field        | Value                                                             |
| ------------ | ----------------------------------------------------------------- |
| Question     | Path from classic `external.ts` to core `schemas.ts`              |
| Category     | NAVIGATION                                                        |
| Repository   | zod                                                               |
| Operation(s) | `ffvs path module:…/classic/external.ts module:…/core/schemas.ts` |
| Answerable   | NO                                                                |
| Experience   | Missing                                                           |
| Confidence   | HIGH                                                              |
| Missing      | Resolved IMPORTS                                                  |
| Notes        | No path. Only 2/1413 IMPORTS were internal module→module.         |

## Q-015

| Field        | Value                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| Question     | Which modules import the most targets (out-degree)?                                                    |
| Category     | ARCHITECTURE / QUALITY                                                                                 |
| Repository   | zod                                                                                                    |
| Operation(s) | `scripts/analyze-graph.mjs` on `.ffvs/graph.json`                                                      |
| Answerable   | PARTIAL                                                                                                |
| Experience   | Composed (CLI has no RANK)                                                                             |
| Confidence   | MEDIUM                                                                                                 |
| Missing      | RANK / COUNT primitive in CLI; also degree polluted by external stubs                                  |
| Notes        | Top out-degree: `v4/locales/index.ts` (62). Useful signal, but most “imports” are mislabeled external. |

## Q-016

| Field        | Value                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Question     | Which modules are isolated (no import edges)?                                                                                  |
| Category     | ARCHITECTURE                                                                                                                   |
| Repository   | debug, zod                                                                                                                     |
| Operation(s) | `analyze-graph.mjs`                                                                                                            |
| Answerable   | PARTIAL                                                                                                                        |
| Experience   | Composed + Missing                                                                                                             |
| Confidence   | LOW–MEDIUM                                                                                                                     |
| Missing      | Accurate IMPORTS; FILTER noise (docs/bench)                                                                                    |
| Notes        | debug: 3 “isolated” including `common.js`/`browser.js` (false). zod: 27 isolated—mix of true isolates and resolution failures. |

## Q-017

| Field        | Value                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------- |
| Question     | Are there import cycles?                                                                      |
| Category     | ARCHITECTURE                                                                                  |
| Repository   | debug, zod                                                                                    |
| Operation(s) | `analyze-graph.mjs` cycle scan                                                                |
| Answerable   | PARTIAL                                                                                       |
| Experience   | Missing (no `ffvs cycles`) + model gap                                                        |
| Confidence   | LOW                                                                                           |
| Missing      | CYCLE command; reliable edges                                                                 |
| Notes        | Sampled cycle count 0 on both—likely undercount due to broken edges, not proof of acyclicity. |

## Q-018

| Field        | Value                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------- |
| Question     | Who calls `parse` / `safeParse`?                                                                |
| Category     | IMPACT / NAVIGATION                                                                             |
| Repository   | zod                                                                                             |
| Operation(s) | `ffvs functions` then manual reasoning                                                          |
| Answerable   | NO                                                                                              |
| Experience   | Missing                                                                                         |
| Confidence   | HIGH                                                                                            |
| Missing      | **CALLS** relation                                                                              |
| Notes        | Can list functions named `*_parse` / `safeParse`, but not callers. Classic call-graph question. |

## Q-019

| Field        | Value                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| Question     | Which functions are named like parse helpers?                               |
| Category     | STRUCTURE / SEARCH                                                          |
| Repository   | zod                                                                         |
| Operation(s) | `ffvs functions --json` + external filter (PowerShell)                      |
| Answerable   | PARTIAL                                                                     |
| Experience   | Composed + Awkward                                                          |
| Confidence   | HIGH                                                                        |
| Missing      | FILTER / SEARCH in CLI                                                      |
| Notes        | Composition: SELECT functions → FILTER name. Evidence for FILTER primitive. |

## Q-020

| Field        | Value                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| Question     | Show imports for locales barrel, then inspect one locale module                                           |
| Category     | DEPENDENCY + STRUCTURE                                                                                    |
| Repository   | zod                                                                                                       |
| Operation(s) | `ffvs dependencies module:…/locales/index.ts` then manual follow-up                                       |
| Answerable   | PARTIAL                                                                                                   |
| Experience   | Composed                                                                                                  |
| Confidence   | MEDIUM                                                                                                    |
| Missing      | Piping / composition; `.js`→`.ts` for follow-through                                                      |
| Notes        | Barrel lists many `./en.js` style deps as external; natural next step is DESCRIBE each—needs composition. |

## Q-021

| Field        | Value                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Question     | Which files failed to parse?                                            |
| Category     | QUALITY                                                                 |
| Repository   | zod                                                                     |
| Operation(s) | `ffvs inspect --json` → `parseErrors`                                   |
| Answerable   | YES                                                                     |
| Experience   | Awkward                                                                 |
| Confidence   | HIGH                                                                    |
| Missing      | Dedicated `ffvs problems` / FILTER                                      |
| Notes        | 7 errors (advanced TS generics / JSX misparse). Buried in summary JSON. |

## Q-022

| Field        | Value                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| Question     | What would be affected if Database layer changes? (layered fixture sanity)   |
| Category     | IMPACT                                                                       |
| Repository   | fixtures/layered (control; not OSS)                                          |
| Operation(s) | `ffvs impact Database`                                                       |
| Answerable   | YES                                                                          |
| Experience   | Direct                                                                       |
| Confidence   | HIGH                                                                         |
| Missing      | —                                                                            |
| Notes        | Control: impact works when IMPORTS resolve. Contrasts with OSS failure mode. |

## Q-023

| Field        | Value                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Question     | Modules that depend on Database and also look like HTTP entrypoints      |
| Category     | COMPOSITION (hypothetical on OSS)                                        |
| Repository   | zod / debug                                                              |
| Operation(s) | Would need SELECT+FILTER+TRAVERSE                                        |
| Answerable   | NO                                                                       |
| Experience   | Missing                                                                  |
| Confidence   | HIGH                                                                     |
| Missing      | Composition + route/export semantics + resolved deps                     |
| Notes        | Natural composed question; not expressible; also no “HTTP route” entity. |

## Q-024

| Field        | Value                                                                             |
| ------------ | --------------------------------------------------------------------------------- |
| Question     | Is `imports` redundant with `relations --kind IMPORTS` on a real repo?            |
| Category     | QUALITY (tooling meta)                                                            |
| Repository   | debug                                                                             |
| Operation(s) | `ffvs imports` vs `ffvs relations --kind IMPORTS`                                 |
| Answerable   | YES (meta)                                                                        |
| Experience   | Direct                                                                            |
| Confidence   | HIGH                                                                              |
| Missing      | —                                                                                 |
| Notes        | Same underlying edges; `imports` is convenience formatting. Redundancy confirmed. |

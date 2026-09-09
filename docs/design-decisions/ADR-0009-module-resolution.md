# ADR-0009 — Module Resolution Strategy

## Status

Accepted

## Context

EXP-0002 showed that most IMPORTS on real TypeScript projects were mislabeled as external because:

- CommonJS extensionless requires (`require("./common")`) were not expanded;
- TypeScript ESM often writes `import … from "./file.js"` while the on-disk file is `file.ts`.

Without faithful resolution, TRAVERSE / PATH / IMPACT answers are not trustworthy.

## Decision

Introduce a dedicated **module resolver** (`src/core/resolver/`) between extraction and graph wiring.

### Statuses

| Status       | Meaning                                                                      |
| ------------ | ---------------------------------------------------------------------------- |
| `RESOLVED`   | Relative/absolute specifier maps to exactly one indexed file                 |
| `EXTERNAL`   | Bare specifier (package name) — not resolved into the project tree           |
| `UNRESOLVED` | Relative specifier with **no** matching indexed file after policy candidates |
| `AMBIGUOUS`  | Multiple files matched at the **same priority tier**                         |

Relative failures are **UNRESOLVED**, never silently EXTERNAL.

### Candidate policy (ordered tiers)

1. Exact path as written
2. Extension substitution: `.js`→`.ts`/`.tsx`/`.jsx`; `.mjs`→`.mts`/`.ts`; `.cjs`→`.cts`/`.js`
3. Extensionless append: `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`, `.mts`, `.cts`, `.json`
4. Directory index: `index.js`, `index.ts`, …

First tier with hits: if one hit → RESOLVED; if several → AMBIGUOUS; if none → next tier; if all fail → UNRESOLVED.

### Out of scope (Phase 1.6)

- Full Node `package.json` `exports` map
- TypeScript path aliases (`paths` in tsconfig)
- CALLS / symbol binding

## Consequences

- Graph IMPORTS edges carry `resolution` metadata.
- Diagnostics can explain failures.
- Metrics can measure internal resolution rate.

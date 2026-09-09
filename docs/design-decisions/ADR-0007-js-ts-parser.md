# ADR-0007 — JavaScript/TypeScript Parser Choice

## Status

Accepted

## Context

Phase 1 requires reliable structural extraction from JS/TS sources: modules, imports/exports, functions, classes, methods, and (optionally) top-level variables. The parser layer must stay independent of the CLI and feed a language-agnostic software graph.

Options considered:

| Option                      | Strengths                                                         | Weaknesses                                                             |
| --------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **@babel/parser**           | Mature; JS/TS/JSX; pure JS; no native bindings; familiar AST; MIT | Not a multi-language foundation; no type checker                       |
| **TypeScript compiler API** | Official TS; enables type-aware analysis later                    | Heavier; JS-only projects still pull `typescript`; slower cold start   |
| **tree-sitter**             | Excellent multi-language path; incremental parsing                | Native bindings; more ops complexity for Phase 1                       |
| **acorn (+ TS plugins)**    | Very small                                                        | Weaker first-class TS/TSX story                                        |
| **swc / oxc**               | Fast                                                              | Less conventional ASTs for analysis tooling; ecosystem maturity varies |

## Decision

Use **`@babel/parser`** (with TypeScript and JSX plugins as needed) for Phase 1 JS/TS structural extraction.

Keep a **`LanguageAdapter` / parse-extract contract** so another engine (tree-sitter, TS API) can replace or complement Babel later without rewriting the domain model.

Do **not** perform type-aware resolution in Phase 1.

## Alternatives rejected (for now)

- **TypeScript API as default:** deferred until type-aware queries justify the cost.
- **tree-sitter as default:** deferred to multi-language phases; revisit when adding Python/Go/etc.
- **Regex-only extraction:** insufficient reliability for classes/methods/exports.

## Consequences

- Solid structural understanding for JS/TS with a dependency that is pure JavaScript and easy to vendor in CI.
- Call graphs and precise symbol binding remain out of scope until a later ADR.
- Multi-language support will require additional adapters; Babel does not become an architectural ceiling.

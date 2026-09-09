# ADR-0019: FFVS Query Language thin slice (0.6.0)

## Status

Accepted

## Context

EXP-DSL-0001 showed recurring multi-step compositions and painful entity-id handoffs. Phase 2.9 recorded `DSL IMPLEMENTATION READY` without shipping a parser.

## Evidence

- EXP-DSL-0001 pattern counts (SEARCH→TRAVERSE, SELECT+FILTER→TRAVERSE).
- Readiness review in `docs/language/readiness.md` (pre-0.6.0).
- EXP-DSL-0002 confirms 14/22 questions PASS on the thin surface.

## Decision

Implement **FFVS Query Language v0.1** as a read-only thin slice:

```text
select | where | search | traverse | describe
```

Architecture:

```text
ffvs query → lexer → parser → AST → executor → core/query + navigate → graph
```

CLI explore commands remain first-class. Language version (`0.1`) is independent of package version (`0.6.0`).

## Alternatives

1. Continue CLI-only — rejected; composition friction measured.
2. Large SQL-like DSL — rejected; unevidenced.
3. Delay further — rejected; readiness criteria met.

## Consequences

### Positive

- Natural composition without ID paste.
- Single Query Core shared with CLI.
- Positioned errors (lexical/parse/semantic).

### Negative

- New maintenance surface (lexer/parser).
- Language versioning discipline required.
- Incomplete coverage vs CLI (PATH/IMPACT/…).

### Versioning rule

```text
FFVS package version ≠ Query Language version
```

Breaking language changes bump language version and are documented in `docs/language/`.

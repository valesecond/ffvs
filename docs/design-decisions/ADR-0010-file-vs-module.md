# ADR-0010 — FILE vs MODULE Identity

## Status

Accepted

## Context

EXP-0002 showed ambiguous lookups when users typed paths like `src/common.js`, matching both `file:…` and `module:…`.

## Decision

| Kind     | Meaning                                                                          |
| -------- | -------------------------------------------------------------------------------- |
| `FILE`   | Filesystem artifact indexed from disk (any extension)                            |
| `MODULE` | Language module for a parseable JS/TS source file (currently 1:1 with that file) |

Rules:

1. Every JS/TS source file yields both a `FILE` and a `MODULE` node linked by `CONTAINS`.
2. **`IMPORTS` always target `MODULE`** (or `external:` / `unresolved:` stubs), never `FILE`.
3. Entity lookup by path prefers **`MODULE` over `FILE`** when both match the same path.
4. Explicit ids (`file:…`, `module:…`) always win.

## Alternatives

- Collapse FILE and MODULE into one node: loses non-code files as first-class filesystem entities.
- Prefer FILE: wrong target for language-level imports.

## Consequences

- Dependency commands become less ambiguous for path queries.
- Docs must state that imports are module-to-module.

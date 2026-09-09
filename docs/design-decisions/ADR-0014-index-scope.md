# ADR-0014: Index include / exclude (semantic universe)

## Status

Accepted

## Context

Real projects contain `node_modules`, `dist`, fixtures, generated output, etc. Default directory skips existed; users also need explicit control of what enters the semantic graph.

## Decision

1. Keep built-in `DEFAULT_SKIP_DIRS`.
2. Allow `ffvs index . --exclude <pattern>` (repeatable) and `--include <pattern>`.
3. Persist `include` / `exclude` arrays on `.ffvs/config.json` (minimal config).
4. Patterns are path prefixes / substrings — not a full glob engine.

Goal: **control the semantic universe FFVS considers**, not a general project ignore system.

## Alternatives

1. Only `.gitignore` — deferred (coupling + surprises).
2. Complex glob/minimatch — deferred until needed.
3. Always index everything — rejected (noise dominates queries).

## Consequences

- Index results become comparable only when exclude/include are recorded.
- Experiments should document scope settings.

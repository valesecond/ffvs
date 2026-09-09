# ADR-0004 — Query Language Strategy

## Status

Accepted (provisional for Phase 2+)

## Context

Há várias formas de expor consulta: flags CLI, SQL-like, DSL própria, pipes, REPL. A linguagem é central à visão, mas implementá-la cedo demais congela decisões ruins.

## Decision

1. **Agora (Phase 0):** sem DSL; apenas comandos de ciclo de vida (`init`, `index`, `status`).
2. **Depois:** híbrido — comandos estáveis + DSL experimental em `query`/`find` + composição semântica gradual.
3. Documentar trade-offs em `docs/language.md` e revisar após experimentos de ergonomia.

## Alternatives

- Só flags para sempre: simples, mas limita a hipótese language-first.
- SQL completo: familiar, porém desalinhado a grafos/entidades ricas.
- DSL completa no MVP: alto risco de design prematuro.

## Consequences

- A linguagem evolui com evidência.
- Evita comandos `query` vazios no MVP.

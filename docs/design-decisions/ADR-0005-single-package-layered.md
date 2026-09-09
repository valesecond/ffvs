# ADR-0005 — Single Package Layered Architecture

## Status

Accepted

## Context

Precisamos de separação CLI / application / core / domain / adapters sem overhead de monorepo.

## Decision

- Um pacote npm TypeScript.
- Módulos internos por camada sob `src/`.
- Extrair packages apenas com evidência (múltiplos consumidores ou ciclos de release).

## Alternatives

- Monorepo multi-package: isolamento forte, custo alto cedo.
- Lógica na CLI: rejeitado; impede reuso futuro.

## Consequences

- Tooling simples (`tsc`, um `package.json`).
- Disciplina de imports necessária para não vazar camadas.

# ADR-0002 — CLI-First as Primary Interface

## Status

Accepted

## Context

Muitas ferramentas modernas são “UI-first” com CLI secundária. A visão do FFVS coloca CLI e linguagem no centro.

## Decision

- A CLI é interface de primeira classe.
- UI futura, se existir, é complementar (visualização/auxiliar), não o núcleo.
- O núcleo de domínio não depende da CLI.

## Alternatives

- Web UI como centro: rejeitado; acoplaria arquitetura e dificultaria automação.
- Apenas biblioteca sem CLI: rejeitado; prejudica a hipótese de linguagem operacional.

## Consequences

- Investimento em UX de terminal, códigos de saída e mensagens.
- Facilita scripting, CI e estudos reproduzíveis.

# ADR-0003 — Domain Model as a Graph

## Status

Accepted

## Context

Software pode ser modelado como árvores (AST), tabelas, ou grafos. O FFVS precisa representar entidades e relações ao longo do tempo (estático → histórico → runtime).

## Decision

- Adotar um **grafo dirigido rotulado** como modelo conceitual central (nós = entidades, arestas = relações).
- Phase 0: nós `PROJECT`, `FILE`, `MODULE`; arestas `CONTAINS` e `IMPORTS`.
- Phase 1: adicionar `FUNCTION`, `CLASS`, `METHOD`, `VARIABLE` e relações `DECLARES`, `EXPORTS`, `EXTENDS`, `IMPLEMENTS`.
- Expandir o vocabulário conforme fases e evidência. Ver `docs/software-model.md`.

## Alternatives

- Somente filesystem tree: insuficiente para relações cross-cutting.
- Somente banco relacional sem grafo explícito: possível internamente, mas o modelo mental permanece grafos; pode ser storage depois.
- CPG completo no dia 1: prematuro.

## Consequences

- APIs e serialização orientadas a nodes/edges.
- Facilita consultas relacionais futuras.
- Exige cuidado com tamanho e incrementalidade.

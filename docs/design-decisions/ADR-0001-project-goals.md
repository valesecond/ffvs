# ADR-0001 — Project Goals and Scope Discipline

## Status

Accepted

## Context

O FFVS tem uma visão ampla (consulta, análise, histórico, runtime, transformação, pesquisa). Sem disciplina, o risco de escopo invalida a fundação.

## Decision

1. Tratar a visão de longo prazo como norte, não como backlog imediato.
2. Avançar por fases documentadas em `docs/roadmap.md`.
3. Só implementar comandos com comportamento real, testes e documentação.
4. Registrar hipóteses e limitações; não inventar resultados.

## Alternatives

- Implementar logo DSL + impacto + Git: rejeitado por diluição.
- Reduzir a visão só a um linter/scanner: rejeitado; perderia a hipótese central.

## Consequences

- Progresso aparentemente mais lento no curto prazo.
- Base mais sustentável para open source e pesquisa.

# ADR-0006 — Local JSON Persistence in `.ffvs/`

## Status

Accepted (MVP)

## Context

O índice precisa ser local, inspecionável e independente de cloud. Opções: JSON, SQLite, embedded graph DB.

## Decision

- Persistir `config.json`, `index.json`, `graph.json` em `.ffvs/`.
- Reavaliar SQLite/outro store se tamanho/performance justificarem (novo ADR).

## Alternatives

- SQLite desde o início: melhor escala, menos diffável, dependência nativa/mais complexa.
- Apenas memória: não atende `status` e fluxos multi-comando.

## Consequences

- Fácil debug e testes.
- Pode não escalar a repositórios enormes — limitação aceita no MVP.

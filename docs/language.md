# Linguagem FFVS (proposta — não implementada)

A DSL **permanece deliberadamente fora do escopo** na Phase 1.

## Por que esperar?

Comandos explícitos (`inspect`, `functions`, `graph`, …) existem para aprender:

1. quais entidades são realmente consultadas;
2. quais relações importam;
3. quais filtros se repetem;
4. onde a composição ajuda ou atrapalha;
5. o que é difícil de expressar só com subcomandos.

A linguagem deve nascer dessas necessidades observadas — não de estética antecipada.

## Alternativas (resumo)

Ver trade-offs completos na versão anterior deste desenho:

| Abordagem                             | Status no FFVS             |
| ------------------------------------- | -------------------------- |
| Flags CLI                             | Usado agora para explore   |
| DSL declarativa estilo `find … where` | Proposta futura            |
| SQL-like                              | Alternativa documentada    |
| Pipes semânticos                      | Direção de longo prazo     |
| REPL                                  | Complementar, não primário |

## Decisão vigente

**Híbrido estável + experimental (ADR-0004):**

1. Comandos de ciclo de vida e exploração explícitos (Phase 1).
2. DSL experimental só quando houver padrões recorrentes suficientes.
3. `--json` desde já para composição externa via scripts.

## Exemplos-alvo (futuro — não implementados)

```text
find functions
where callers > 5
```

```text
impact UserService.create
```

```text
trace UserController.createUser
```

## Princípios de evolução

1. Poucas construções ortogonais.
2. Diagnósticos claros.
3. Cada construção nova exige exemplo, teste e limitações.
4. Ergonomia medida por uso, não por gosto estético.

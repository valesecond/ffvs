# Linguagem FFVS (proposta inicial)

A linguagem **ainda não está implementada**. Este documento registra a proposta experimental e os trade-offs para orientar a Phase 2.

## Objetivo

Explorar uma forma de expressar consultas e operações sobre o modelo semântico do projeto (entidades + relações), com boa ergonomia em terminal e potencial de composição.

## Alternativas de design

### A. Comandos tradicionais da CLI

```bash
ffvs find functions --complexity-gt 20 --callers-gt 5
```

| Prós                          | Contras                               |
| ----------------------------- | ------------------------------------- |
| Familiar; fácil de documentar | Flags proliferam; composição limitada |
| Bom para poucos filtros       | Expressões complexas ficam verbosas   |

### B. DSL declarativa (inspiração SQL / find)

```text
find functions
where complexity > 20
and callers > 5
and changed within 30d
```

| Prós                      | Contras                                   |
| ------------------------- | ----------------------------------------- |
| Legível; alinhada à visão | Exige parser e design de linguagem        |
| Boa para artigos / demos  | Curva de aprendizado; risco de overdesign |

### C. Sintaxe semelhante a SQL

```sql
SELECT name, path FROM functions
WHERE complexity > 20 AND callers > 5
```

| Prós                           | Contras                                           |
| ------------------------------ | ------------------------------------------------- |
| Familiar a muitos              | Semântica de software ≠ tabelas relacionais puras |
| Ferramentas mentais existentes | Pode induzir expectativas de SQL completo         |

### D. Composição estilo Unix (pipes semânticos)

```text
find functions | where complexity > 20 | where callers > 5
```

| Prós                      | Contras                                       |
| ------------------------- | --------------------------------------------- |
| Alinhada à filosofia Unix | Tipagem/stream de entidades precisa ser clara |
| Composição natural        | UX de erros e partial results é difícil       |

### E. REPL

Sessão interativa com a mesma linguagem.

| Prós              | Contras                      |
| ----------------- | ---------------------------- |
| Exploração rápida | Secundária à linguagem em si |
| Bom para demos    | Não substitui scripts e CI   |

## Decisão provisória (não implementada)

**Híbrido A + B + D:**

1. Comandos CLI estáveis para operações estruturais (`init`, `index`, `status`, …).
2. Uma DSL experimental embutida em `ffvs query` / `ffvs find` para consultas.
3. Composição por pipes **semânticos** como direção de longo prazo, começando por pipelines simples dentro da DSL.

Justificativa: separa o que deve ser estável (ciclo de vida do projeto) do que deve ser experimental (expressividade da consulta). Evita forçar toda interação em flags ou em uma DSL prematuramente completa.

Ver ADR-0004.

## Exemplos-alvo (futuro)

```text
find functions
where complexity > 20
```

```text
find functions
where callers > 5
```

```text
trace UserService.create
```

```text
impact UserService.create
```

## Princípios de evolução

1. Preferir poucas construções ortogonais.
2. Diagnósticos de erro claros.
3. Toda construção nova exige exemplo, teste e nota de limitação.
4. Ergonomia mede-se com uso real (mesmo que pequeno), não só com gosto estético.

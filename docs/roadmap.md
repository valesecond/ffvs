# Roadmap

Documento vivo. Datas não são compromissos; fases avançam quando critérios de qualidade forem atendidos.

## Phase 0 — Foundation

- [x] Repositório e identidade FFVS
- [x] Documentação base (visão, arquitetura, pesquisa, ADRs)
- [x] Esqueleto CLI + camadas
- [x] `ffvs init` / `ffvs index` / `ffvs status`
- [x] Testes automatizados
- [x] Lint / format / typecheck
- [x] CI básica

## Phase 1 — Software Understanding

- [x] Parser JS/TS (`@babel/parser`)
- [x] Extração de functions, classes, methods, variables, exports
- [x] Modelo de domínio enriquecido + grafo semântico
- [x] Relações `CONTAINS`, `DECLARES`, `IMPORTS`, `EXPORTS`, `EXTENDS`, `IMPLEMENTS`
- [x] Comandos explore: `inspect`, `files`, `functions`, `classes`, `imports`, `graph`
- [x] Saída `--json`
- [x] Fixtures + testes
- [x] `docs/software-model.md`
- [x] Scanner com includes/excludes configuráveis (Phase 1.9)
- [ ] Indexação incremental (quando justificada)
- [ ] Resolução de imports de packages / tsconfig paths (opcional; pressão observada limitada)

## Phase 1.5 — Discover the Query Model

- [x] API interna de navegação
- [x] Comandos: `dependencies`/`deps`, `dependents`, `children`, `parents`, `path`, `impact`, `relations`
- [x] `docs/query-model.md`, ADR-0008
- [x] EXP-0002

## Phase 1.6 — Model fidelity

- [x] Resolver de módulos + estados de resolução
- [x] `ffvs diagnostics` / métricas
- [x] Re-execução EXP-0002

## Phase 1.7 — Selection & filtering

- [x] `--name` / `--path` em `functions` / `classes` / `files`
- [x] `src/core/query/select.ts` + ADR-0012

## Phase 1.8 — Search

- [x] `ffvs search` + ADR-0013
- [x] Distinção SEARCH vs FILTER documentada

## Phase 1.9 — Includes / excludes

- [x] `ffvs index --exclude` / `--include` + config
- [x] ADR-0014

## Phase 2.0 — Call graph

- [x] Relação `CALLS` + `ffvs calls` / `ffvs callers`
- [x] Estados RESOLVED / AMBIGUOUS / UNRESOLVED
- [x] ADR-0015

## Phase 2.1 — Model fidelity II

- [x] Correções de escopo (exclude path-safe)
- [x] Pressão observada priorizada; tsconfig paths / package exports **adiados**
- [x] Limitações documentadas

## Phase 2.2–2.6 — Experiments & query formalization

- [x] EXP-0003 (re-run corpus)
- [x] Composição observada (CLI only)
- [x] `docs/query-model.md` + `docs/query-algebra.md`
- [x] EXP-DSL-0001 (≥20 perguntas)

## Phase 2.7–2.9 — Language specification

- [x] `docs/language/*`
- [x] Readiness → implementation in 0.6.0

## Phase 0.6.0 — Query Language v0.1

- [x] Lexer / parser / AST / executor
- [x] `ffvs query` + `--json` + `--file`
- [x] SELECT / WHERE / SEARCH / TRAVERSE / DESCRIBE
- [x] EXP-DSL-0002

## Phase 0.7.0 — PATH & IMPACT

- [x] `path` / `impact` DSL stages (QL v0.2)
- [x] Shared core with CLI
- [x] EXP-DSL-0004

## Phase 0.8.0 — Semantic depth

- [x] Resolution-aware `traverse` (QL v0.3)
- [x] Explicit `impact along calls` (default resolved)
- [x] Minimal richer `describe` (module + lines)
- [x] EXP-RESOLUTION / CALLS-IMPACT / DESCRIBE / SCOPE / DSL-0005
- [x] Query `scope` stage investigated → **NOT JUSTIFIED**
- [x] Roadmap [`docs/roadmap/ffvs-0.9.md`](./roadmap/ffvs-0.9.md)

```text
Query Language v0.3 = SHIPPED (0.8.0)
0.9.0 features = NOT IMPLEMENTED
```

## Princípios permanentes

1. Não adicionar feature sem hipótese ou evidência.
2. Preferir profundidade a amplitude.
3. Documentar limitações.
4. CLI e DSL compartilham CORE.

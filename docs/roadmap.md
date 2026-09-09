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
- [ ] Scanner com includes/excludes configuráveis
- [ ] Indexação incremental (quando justificada)
- [ ] Resolução de imports de packages (opcional/experimental)

## Phase 1.5 — Discover the Query Model (atual)

- [x] API interna de navegação (`neighbors`, `path`, `ancestors`, …)
- [x] Navegação reversa sem duplicar arestas
- [x] Comandos: `dependencies`/`deps`, `dependents`, `children`, `parents`, `path`, `impact`, `relations`
- [x] JSON consistente (`EntityRef` / `RelationRef`)
- [x] Fixtures: layered, diamond, cycle, isolated, inheritance
- [x] `docs/query-model.md`, ADR-0008
- [x] `research/related-work.md`, hipótese H5
- [ ] Uso em repo real + log de perguntas recorrentes (EXP-0002)

## Phase 2 — Query (ainda sem DSL formal completa)

Antes de uma linguagem rica, observar padrões de uso dos comandos explore (`docs/query-model.md`).

- [ ] Motor de consulta sobre o grafo
- [ ] Sintaxe experimental mínima (`find` / filtros), se ergonomia exigir
- [ ] Documentar consultas recorrentes observadas em uso real
- [ ] **Não** congelar DSL sem evidência de necessidade

## Phase 3 — Software Intelligence

- [ ] Análise de dependências mais profunda
- [ ] Callers / callees (best-effort)
- [ ] Impact analysis inicial
- [ ] Métricas simples
- [ ] Sinais arquiteturais básicos

## Phase 4 — History

- [ ] Integração Git
- [ ] Histórico / autoria por entidade
- [ ] Consultas com janelas temporais

## Phase 5 — Runtime

- [ ] Modelo para serviços / processos
- [ ] Ingestão opcional de traces
- [ ] Correlação estático ↔ runtime (experimental)

## Phase 6 — Transformation

- [ ] Transformações seguras / dry-run
- [ ] Validação e testes afetados

## Phase 7 — Research

- [ ] Benchmarks, experimentos, comparações, usabilidade, publicações (se houver evidência)

## Critério para avançar de fase

1. Funcionalidade testada;
2. Documentação atualizada;
3. Limitações explícitas;
4. Nenhum comando placeholder.

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

## Phase 1 — Software Understanding (atual)

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

## Phase 2 — Query (ainda sem DSL formal completa)

Antes de uma linguagem rica, observar padrões de uso dos comandos explore.

- [ ] Motor de consulta sobre o grafo
- [ ] Sintaxe experimental mínima (`find` / filtros), se ergonomia exigir
- [ ] Documentar consultas recorrentes observadas
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

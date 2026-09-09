# Roadmap

Documento vivo. Datas não são compromissos; fases avançam quando critérios de qualidade forem atendidos.

## Phase 0 — Foundation (atual)

- [x] Repositório e identidade FFVS
- [x] Documentação base (visão, arquitetura, pesquisa, ADRs)
- [x] Esqueleto CLI + camadas
- [x] `ffvs init` / `ffvs index` / `ffvs status`
- [x] Testes automatizados
- [x] Lint / format / typecheck
- [x] CI básica

## Phase 1 — Index

- [ ] Scanner robusto (includes/excludes configuráveis)
- [ ] Parser JavaScript/TypeScript (AST)
- [ ] Extração de funções, classes, exports
- [ ] Modelo de projeto enriquecido
- [ ] Grafo inicial com relações estruturais
- [ ] Indexação incremental (quando justificada)

## Phase 2 — Query

- [ ] Motor de consulta sobre o grafo
- [ ] Sintaxe experimental (`find`, `where`, …)
- [ ] `ffvs find` / `ffvs query` com comportamento real
- [ ] Seleção de campos e filtros simples
- [ ] Documentação de ergonomia e trade-offs

## Phase 3 — Software Intelligence

- [ ] Análise de dependências
- [ ] Callers / callees (best-effort)
- [ ] Impact analysis inicial
- [ ] Métricas simples (ex.: complexidade ciclomática aproximada)
- [ ] Sinais arquiteturais básicos

## Phase 4 — History

- [ ] Integração Git
- [ ] Histórico de mudanças por entidade
- [ ] Autoria agregada
- [ ] Consultas envolvendo janelas temporais

## Phase 5 — Runtime

- [ ] Modelo para serviços / processos
- [ ] Ingestão opcional de traces / metadados
- [ ] Correlação estática ↔ runtime (experimental)

## Phase 6 — Transformation

- [ ] Transformações seguras e validadas
- [ ] Preview / dry-run
- [ ] Ligação com testes afetados

## Phase 7 — Research

- [ ] Benchmarks e datasets
- [ ] Experimentos controlados
- [ ] Comparação com ferramentas existentes
- [ ] Estudos de usabilidade
- [ ] Avaliação de performance
- [ ] Materiais para publicação acadêmica (se houver evidência)

## Critério para avançar de fase

1. Funcionalidade testada;
2. Documentação atualizada;
3. Limitações explícitas;
4. Nenhum comando “placeholder” sem comportamento.

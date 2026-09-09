# Hypotheses

Hipóteses de trabalho. Status: **não avaliadas** até que experimentos sejam executados e registrados.

## H1 — Unificação consultável

**Hipótese:** Um modelo de domínio unificado (arquivos, módulos, relações; depois funções, histórico, runtime) persistido localmente permite consultas úteis que hoje exigem várias ferramentas.

**Falsificável se:** Desenvolvedores não conseguirem responder perguntas típicas de compreensão/impacto com o modelo, ou o custo de manutenção do modelo superar o benefício.

## H2 — CLI + linguagem como interface primária

**Hipótese:** Uma CLI com linguagem de consulta composicional é adequada como interface primária para exploração semântica de software, não apenas como wrapper.

**Falsificável se:** Usuários preferirem consistentemente UIs sem ganho de automação/reprodutibilidade, ou a linguagem for raramente usada frente a flags ad hoc.

## H3 — Extensibilidade por adapters

**Hipótese:** Um contrato de `LanguageAdapter` permite adicionar linguagens sem reescrever o núcleo de indexação/consulta.

**Falsificável se:** Cada linguagem exigir exceções profundas no core, invalidando o contrato.

## H4 — Composição semântica

**Hipótese:** Pipelines sobre entidades (não só texto) melhoram expressividade para análises multi-etapa versus flags monolíticas.

**Falsificável se:** A composição for pouco usada ou introduzir complexidade cognitiva sem ganho mensurável.

## H5 — Grafo semântico vs navegação por arquivos

**Hipótese:** A representation of software as a semantic graph may enable more expressive and composable exploration of software structure than file-oriented navigation alone.

**Status (EXP-0002, 2026-09-09):** partially tested — **not confirmed** at first run.

**Follow-up (Phase 1.6 re-run):** After improving import resolution, DEPENDENCY/PATH/IMPACT questions on the same corpus became largely answerable (zod internal resolution rate 100% of relative imports; debug `common.js` impact works). H5 remains not fully confirmed (no timed A/B vs editor+grep yet), but the prior falsifying factor (empty dependency graph) is largely addressed for IMPORTS.

**Evidence so far:**

- Supportive for STRUCTURE/DESCRIBE (inventory, `inspect`, EXTENDS).
- Weak/negative for DEPENDENCY/PATH/IMPACT on real repos until import resolution improves (zod: 2/1413 internal IMPORTS).
- Composition pressure exists, but missing edges dominate missing syntax.

**Falsificável se:** Em tarefas controladas de compreensão/impacto, desenvolvedores não reduzirem passos/tempo/erro frente a editor+grep (ou o grafo induzir confusão/imprecisão sistemáticas).

### Métricas candidatas

| Métrica                            | Ideia de medição                                                      |
| ---------------------------------- | --------------------------------------------------------------------- |
| Operações necessárias              | Contagem de comandos/passos até a resposta                            |
| Arquivos inspecionados manualmente | Quantos arquivos abertos na condição controle                         |
| Tempo até a informação             | Latência de tarefa                                                    |
| Precisão das relações              | Precision/recall vs oráculo em fixtures                               |
| Escalabilidade                     | Tempo/memória de index+traverse vs tamanho do repo                    |
| Usabilidade / satisfação           | Escala subjetiva pós-tarefa                                           |
| Import resolution recall           | % relative imports linked to internal modules (zod measured ≈ 2/1413) |

## Registro

Atualize o status de cada hipótese após experimentos (`experiments.md`). Não altere o enunciado original sem versionar a mudança.

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

## Registro

Atualize o status de cada hipótese após experimentos (`experiments.md`). Não altere o enunciado original sem versionar a mudança.

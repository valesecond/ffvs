# Análise Inicial do FFVS

Documento de análise crítica elaborado antes da implementação.
Atualizado em: 2026-09-09.

## 1. Problema que queremos explorar

Desenvolvedores precisam compreender, consultar e eventualmente operar sistemas de software sob várias perspectivas ao mesmo tempo: estrutura estática, relações entre entidades, histórico de mudanças e, no futuro, comportamento em execução.

Hoje essas perspectivas estão fragmentadas em ferramentas distintas (IDEs, linters, analisadores estáticos, `git log`, APM, etc.). A hipótese de trabalho do FFVS é que uma **abstração unificada e composicional** — acessível principalmente via CLI e uma linguagem própria — pode reduzir essa fragmentação sem substituir ferramentas especializadas.

Pergunta de pesquisa inicial:

> É possível construir uma abstração unificada e composicional para consultar e operar sobre código-fonte, arquitetura, histórico e comportamento de sistemas de software?

Essa pergunta pode ser refinada conforme evidências forem coletadas.

## 2. Pontos fortes da ideia

1. **CLI + linguagem como produto** — diferencia o projeto de wrappers de UI e alinha com fluxos reprodutíveis e automatizáveis.
2. **Modelo em grafo** — encaixa bem com relações entre arquivos, módulos, funções, commits e runtime.
3. **Local-first e open source** — favorece privacidade, reprodutibilidade e adoção experimental.
4. **Extensibilidade por linguagem** — evita aprisionamento a um único ecossistema.
5. **Potencial acadêmico** — programa querying, architecture recovery e DSLs são áreas com literatura e lacunas mensuráveis.
6. **Composabilidade** — pipelines semânticos (estilo Unix, mas sobre entidades) são uma direção de design clara e testável.

## 3. Riscos

### 3.1 Escopo

- A visão cobre indexação, consulta, impacto, Git, runtime e transformação. Sem disciplina de fases, o projeto dilui-se.
- Mitigação: roadmap por fases; MVP mínimo; ADRs para decisões; não implementar comandos vazios.

### 3.2 Técnicos

- Parsing multi-linguagem é caro e incompleto por natureza.
- Grafos de chamada e impacto são aproximados com análise estática; falsos positivos/negativos são esperados.
- Escala: repositórios grandes exigem indexação incremental e armazenamento eficiente.
- Ergonomia da linguagem: risco de criar uma DSL bonita e pouco usada.

### 3.3 Acadêmicos

- Afirmar “unificação” sem avaliação experimental é frágil.
- Sobreposição com CodeQL, Sourcegraph, Joern, Semgrep, etc. exige posicionamento cuidadoso.
- Mitigação: hipóteses explícitas, experimentos registrados, sem inventar resultados.

### 3.4 Comunidade / produto

- Nome deliberadamente pessoal (FFVS) pode dificultar descoberta; aceitável nesta fase.
- CLI-first exige excelente UX de terminal; erros obscuros afastam colaboradores.

## 4. Dificuldades técnicas previstas

| Área                  | Dificuldade                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| Extração semântica    | ASTs diferem por linguagem; precisamos de um modelo de domínio estável |
| Resolução de símbolos | Imports dinâmicos, aliases, monorepos                                  |
| Call graph            | Análise interprocedural é incompleta em JS dinâmico                    |
| Persistência          | JSON simples vs. banco/grafo embutido                                  |
| Linguagem de consulta | Parser, semântica, composição e diagnóstico de erros                   |
| Incrementalidade      | Reindexar só o que mudou                                               |
| Extensibilidade       | Contratos claros para adapters de linguagem                            |

## 5. Possíveis contribuições (hipóteses, não afirmações)

Contribuições _potenciais_ a avaliar empiricamente:

1. Modelo de domínio unificado (estático + histórico + runtime) consultável localmente.
2. Linguagem operacional composicional focada em entidades de software (não só padrões de texto).
3. Interface CLI-first como veículo primário de exploração e automação.
4. Artefatos e protocolos que permitam estudos de usabilidade e comparação com ferramentas existentes.

Nenhuma dessas contribuições é garantida. Dependem de implementação, experimentos e revisão.

## 6. Tecnologias e projetos relacionados (estudo obrigatório)

Ferramentas e trabalhos a estudar (não copiar):

| Projeto / área                                                            | Por que importa                           |
| ------------------------------------------------------------------------- | ----------------------------------------- |
| [CodeQL](https://codeql.github.com/)                                      | Querying semântico sobre bancos de código |
| [Semgrep](https://semgrep.dev/)                                           | Padrões e regras multi-linguagem          |
| [Joern / CPGs](https://joern.io/)                                         | Code Property Graphs                      |
| [Sourcegraph](https://sourcegraph.com/)                                   | Busca e navegação em escala               |
| [scip / LSIF](https://github.com/sourcegraph/scip)                        | Indexação de símbolos interoperável       |
| [tree-sitter](https://tree-sitter.github.io/tree-sitter/)                 | Parsing incremental multi-linguagem       |
| [Understand](https://scitools.com/), SciTools                             | Análise e métricas comerciais             |
| [Dependency Cruiser](https://github.com/sverweij/dependency-cruiser)      | Grafos de dependência JS/TS               |
| [madge](https://github.com/pahen/madge)                                   | Visualização de módulos                   |
| Git / blame / log                                                         | Evolução e autoria                        |
| OpenTelemetry                                                             | Observabilidade e traces                  |
| Literatura: program comprehension, architecture recovery, impact analysis | Base teórica                              |

Detalhes e bibliografia: `research/`.

## 7. Conclusão da análise

O FFVS é **viável como projeto experimental de longo prazo** se:

1. Mantiver escopo por fases;
2. Separar núcleo de interfaces;
3. Tratar a linguagem como experimento iterativo;
4. Registrar hipóteses e limitações;
5. Comparar-se honestamente com o estado da arte.

A fundação deste repositório prioriza documentação, arquitetura e um MVP CLI mínimo (`init`, `index`, `status`) sobre features ambiciosas.

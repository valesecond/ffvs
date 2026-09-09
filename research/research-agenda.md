# Research Agenda

Agenda de investigação do FFVS. Hipóteses e experimentos vivem em documentos irmãos; este arquivo organiza **áreas** e **perguntas**, não resultados.

## Pergunta norteadora (provisória)

É possível construir uma abstração unificada e composicional para consultar e operar sobre código-fonte, arquitetura, histórico e comportamento de sistemas de software?

## Foco imediato (pós-Phase 1)

Com um grafo estrutural JS/TS em mãos, as perguntas práticas passam a ser:

1. Quais entidades/relações bastam para program comprehension em CLI?
2. Onde AST-only falha e CPG / type-aware analysis se tornam necessários?
3. Como a exploração explícita informa o design de uma futura linguagem de consulta?
4. Qual a distância honestamente mensurável frente a CodeQL, Joern, Semgrep, etc.?

Ver também [`related-tools.md`](./related-tools.md).

## Áreas de investigação

| Área                       | Interesse para o FFVS                         |
| -------------------------- | --------------------------------------------- |
| AST-based program analysis | Extração estrutural confiável (Phase 1)       |
| Software graphs            | Modelo navegável de entidades/relações        |
| Code property graphs       | Evolução possível além de AST + imports       |
| Program comprehension      | Experiência `inspect` / explore               |
| Static analysis            | Limites sem execução / tipos                  |
| Dependency analysis        | IMPORTS resolvidos e externos                 |
| Architecture recovery      | Inferir estrutura a partir do grafo           |
| Software visualization     | CLI primeiro; visualizadores depois           |
| Program querying / DSLs    | Diferir até observar consultas recorrentes    |
| Developer tools            | Encaixe em fluxos locais e scripts (`--json`) |
| Observability              | Fase futura (runtime)                         |
| Software evolution         | Fase futura (Git)                             |

## Objetivos de pesquisa (não são claims)

1. Caracterizar o que uma abstração unificada consegue e **não** consegue cobrir.
2. Avaliar se CLI-first + grafo local melhora compreensão vs. ferramentas fragmentadas.
3. Medir custo/benefício de indexação local.
4. Comparar subsets de capacidade com metodologia explícita.

## Método (direção)

- Implementação incremental com artefatos reproduzíveis;
- Experimentos registrados em `experiments.md`;
- Fixtures controladas antes de corpora grandes;
- Distinguir demo de ferramenta de evidência empírica.

## Ética e honestidade científica

- Não inventar resultados;
- Declarar limitações e ameaças à validade;
- Não afirmar superioridade sem dados.

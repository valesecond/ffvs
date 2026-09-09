# Research Agenda

Agenda de investigação do FFVS. Hipóteses e experimentos vivem em documentos irmãos; este arquivo organiza **áreas** e **perguntas**, não resultados.

## Pergunta norteadora (provisória)

É possível construir uma abstração unificada e composicional para consultar e operar sobre código-fonte, arquitetura, histórico e comportamento de sistemas de software?

## Áreas de investigação

| Área                           | Interesse para o FFVS                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| Software visualization         | Como representar grafos semânticos de forma útil (CLI e, depois, visualizadores auxiliares) |
| Program analysis               | Limites da análise estática vs. necessidades de consulta                                    |
| Static analysis                | Extração confiável de entidades e relações                                                  |
| AST / CST                      | Camada de parsing e normalização cross-language                                             |
| Code property graphs           | Modelos ricos (AST + CFG + DFG + call graph)                                                |
| Software architecture recovery | Inferir estrutura a partir do código                                                        |
| Program comprehension          | Apoiar entendimento humano via consultas                                                    |
| Dependency analysis            | Módulos, pacotes, acoplamento                                                               |
| Impact analysis                | Estimar efeitos de mudanças                                                                 |
| Program querying               | Linguagens e motores de consulta sobre código                                               |
| Language design / DSLs         | Ergonomia da linguagem FFVS                                                                 |
| Developer tools                | Integração com fluxos reais de desenvolvimento                                              |
| Observability                  | Correlacionar estático e runtime                                                            |
| Software evolution             | Git, churn, autoria, drift arquitetural                                                     |

## Objetivos de pesquisa (não são claims)

1. Caracterizar o que uma abstração unificada consegue e **não** consegue cobrir.
2. Avaliar ergonomia de uma DSL operacional CLI-first.
3. Medir custo/benefício de indexação local e consulta sobre grafos de projeto.
4. Comparar, com metodologia explícita, subsets de capacidade frente a ferramentas existentes.

## Método (direção)

- Implementação incremental com artefatos reproduzíveis;
- Experimentos pequenos e registrados em `experiments.md`;
- Datasets e benchmarks públicos quando possível;
- Estudos de usabilidade apenas quando houver protótipo estável o suficiente;
- Revisão contínua da bibliografia em `bibliography.md`.

## Ética e honestidade científica

- Não inventar resultados;
- Declarar limitações e ameaças à validade;
- Distinguir demonstração de ferramenta de evidência empírica.

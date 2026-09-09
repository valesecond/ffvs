# Related Work — Technical Positioning

Technical comparison notes for FFVS research. Not marketing.

## Abstração central por ferramenta

| Sistema                        | Abstração central                                            | Modo de interação típico              |
| ------------------------------ | ------------------------------------------------------------ | ------------------------------------- |
| **CodeQL**                     | Banco de fatos/relações + linguagem de consulta declarativa  | Queries versionadas, CI, segurança    |
| **Joern**                      | Code Property Graph (AST+CFG+DFG+calls) + linguagem de grafo | Análise profunda, segurança, research |
| **Semgrep**                    | Padrões sobre sintaxe/AST                                    | Regras rápidas, lint-like             |
| **Sourcegraph**                | Índice de símbolos + busca em escala                         | Navegação org-wide                    |
| **IDEs**                       | ASTs locais + índices + UI                                   | Exploração interativa ponto-a-ponto   |
| **madge / dependency-cruiser** | Grafo de módulos                                             | Dependências JS/TS                    |
| **grep / Git**                 | Texto e histórico de arquivos                                | Busca lexical / evolução              |

## O que cada uma resolve bem

- **CodeQL / Joern:** precisão e expressividade analítica quando o custo de extratores/CPG se justifica.
- **Semgrep:** feedback rápido por padrão, baixa fricção para regras locais.
- **Sourcegraph / IDE:** navegação humana em escala ou no arquivo atual.
- **grep/Git:** universalidade; sem modelo semântico estável.

## O que o FFVS está tentando (hipótese)

FFVS investiga uma **abstração intermediária**:

```text
software → semantic graph (local) → CLI explore verbs → (maybe) operational language
```

Diferenças _pretendidas_ (a validar):

1. **Modelo unificado evolutivo** (estrutura → histórico → runtime) sob uma interface CLI-first.
2. **Design de linguagem atrasado de propósito**: comandos explícitos antes de DSL.
3. **Relações como valores** (`relations`, path, impact) sem exigir um dialecto completo no dia 1.
4. **Local-first / scriptável** (`--json`) para composição externa.

FFVS **não** pretende, nesta fase, substituir CodeQL, Joern, Semgrep ou IDEs.

## Lacuna que motivou Phase 1.5

Ferramentas poderosas existem, mas perguntas cotidianas de compreensão:

- “quem depende disto?”
- “qual o caminho até a infra?”
- “o que quebra se eu mudar este módulo?”

ainda exigem frequentemente **navegação manual fragmentada** entre arquivos. Phase 1.5 testa se verbos de grafo locais reduzem essa fragmentação.

## Learned hypothesis (Phase 1.6)

> Query expressiveness is constrained by semantic model fidelity.

```text
better graph fidelity
        ↓
more reliable queries
        ↓
more meaningful composition
```

EXP-0002 initially showed empty TRAVERSE/IMPACT on zod/debug; after Phase 1.6 resolution, the same verbs produced meaningful answers without a DSL.

## EXP-0002 note (2026-09-09)

On `debug` and `zod`, first-run FFVS matched IDE-like **structure inspection** more than dependency querying—because import edges were mostly unresolved. Phase 1.6 addressed local relative resolution; near-term work shifts toward FILTER/CALLS rather than competing with CodeQL/Joern.

## Métricas candidatas para avaliação futura

Ver `hypotheses.md` (H5) e `experiments/EXP-0002/`.

## Fontes

Mapa inicial em `bibliography.md` e `related-tools.md`. Atualizar com citações primárias em textos acadêmicos formais.

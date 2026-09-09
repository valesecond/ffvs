# Arquitetura do FFVS

## Objetivo deste documento

Definir a arquitetura atual (Phase 0–1) e os princípios que orientam evoluções futuras.

## Princípio de camadas

```text
CLI
 ↓
Application Layer   (init, index, status, explore)
 ↓
Core Engine         (indexer, graph helpers)
 ↓
Domain Model        (entidades e relações)
 ↓
Adapters            (filesystem, storage, language parsers)
```

A CLI **não** contém lógica de negócio. Ela traduz argumentos em chamadas à Application Layer e formata saída (humana ou `--json`).

## Fluxo Phase 1

```text
SOURCE CODE
    ↓
LanguageAdapter.extract()   (@babel/parser for JS/TS)
    ↓
FileExtraction (entities + relations + imports)
    ↓
Indexer → SemanticGraph + ProjectIndex
    ↓
Persist .ffvs/{config,index,graph}.json
    ↓
Explore commands (inspect, files, functions, …)
```

## Estrutura do repositório

```text
ffvs/
├── src/
│   ├── cli/                 # program + formatters
│   ├── application/         # init, index, status, explore
│   ├── core/
│   │   ├── domain/          # types, graph helpers, errors
│   │   ├── graph/           # navigation: path, ancestors, …
│   │   └── indexer/         # buildProjectIndex
│   ├── languages/
│   │   ├── types.ts         # LanguageAdapter contract
│   │   └── javascript/      # parse + extract (Babel)
│   └── adapters/
│       ├── filesystem/
│       └── storage/
├── fixtures/                # controlled sample projects
├── tests/
├── docs/
├── research/
├── examples/
└── .github/workflows/
```

Pacote único TypeScript (ADR-0005). Parser JS/TS: `@babel/parser` (ADR-0007).

## Modelo de domínio

Ver [`software-model.md`](./software-model.md).

Entidades Phase 1: `PROJECT`, `FILE`, `MODULE`, `FUNCTION`, `CLASS`, `METHOD`, `VARIABLE`.

Relações: `CONTAINS`, `DECLARES`, `IMPORTS`, `EXPORTS`, `EXTENDS`, `IMPLEMENTS`, `CALLS`.

Camada de consulta: `src/core/query` (FILTER/SEARCH) + `src/core/graph/navigate` + `src/application/explore`.

## Persistência local

```text
.ffvs/
├── config.json      # include/exclude opcionais
├── index.json       # v2: files, languages, entity stats, parse errors, resolution
└── graph.json       # v2: nodes + edges
```

JSON permanece a escolha do MVP (ADR-0006).

## Comandos CLI (até pré-DSL)

| Comando                                       | Papel                          |
| --------------------------------------------- | ------------------------------ |
| `init` / `index` / `status`                   | Ciclo de vida                  |
| `index --include` / `--exclude`               | Controle do universo indexado  |
| `inspect [entity]`                            | Resumo do projeto ou entidade  |
| `files` / `functions` / `classes`             | SELECT (+ `--name` / `--path`) |
| `search <needle>`                             | SEARCH candidatos              |
| `imports` / `graph`                           | Conveniências                  |
| `dependencies` / `deps` / `dependents`        | TRAVERSE IMPORTS               |
| `calls` / `callers`                           | TRAVERSE CALLS                 |
| `children` / `parents`                        | CONTAINS                       |
| `path` / `impact` / `relations`               | PATH / DERIVED / edges         |
| `diagnostics`                                 | Incerteza de IMPORTS           |
| `--json`                                      | Saída estruturada              |

## Query interfaces

Explore CLI verbs and `ffvs query` (Query Language v0.1) both call Query Core.

```text
ffvs query → language/{lexer,parser,executor} → query/* + graph/navigate → GRAPH
```

DSL is **read-only**.

## Extensibilidade de linguagem

```text
LanguageAdapter
  matches(path)
  detectLanguage(path)
  extract(source, path) → FileExtraction
```

O indexer depende do contrato, não de Babel.

## Limitações conscientes

Ver [`limitations.md`](./limitations.md).

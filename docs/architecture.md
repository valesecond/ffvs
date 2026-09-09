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

Relações Phase 1: `CONTAINS`, `DECLARES`, `IMPORTS`, `EXPORTS`, `EXTENDS`, `IMPLEMENTS`.

## Persistência local

```text
.ffvs/
├── config.json
├── index.json      # v2: files, languages, entity stats, parse errors
└── graph.json      # v2: nodes + edges
```

JSON permanece a escolha do MVP (ADR-0006).

## Comandos CLI (Phase 1 / 1.5)

| Comando                                       | Papel                          |
| --------------------------------------------- | ------------------------------ |
| `init` / `index` / `status`                   | Ciclo de vida                  |
| `inspect [entity]`                            | Resumo do projeto ou entidade  |
| `files` / `functions` / `classes` / `imports` | Listagens                      |
| `graph <entity>`                              | Relações incidentes            |
| `dependencies` / `deps`                       | IMPORTS de saída (módulo)      |
| `dependents`                                  | IMPORTS de entrada             |
| `children` / `parents`                        | CONTAINS estrutural            |
| `path <a> <b>`                                | Caminho mais curto via IMPORTS |
| `impact <entity>`                             | Dependentes transitivos        |
| `relations [entity]`                          | Arestas como objetos           |
| `--json`                                      | Saída estruturada estável      |

Não há DSL nesta fase (ADR-0004, ADR-0008).

## Extensibilidade de linguagem

```text
LanguageAdapter
  matches(path)
  detectLanguage(path)
  extract(source, path) → FileExtraction
```

O indexer depende do contrato, não de Babel.

## Limitações conscientes

- Sem call graph (`CALLS`) confiável.
- Imports de pacotes viram nós `external:*`, sem resolução de node_modules.
- `extends`/`implements` cross-file são best-effort por nome.
- Sem indexação incremental.
- Sem type-aware analysis.

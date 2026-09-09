# Arquitetura do FFVS (1.0)

## Objetivo

Separar claramente produto estável de pesquisa. O núcleo 1.0 é um grafo semântico local + consultas read-only.

## Pipeline

```text
SOURCE CODE
    ↓
PARSER (LanguageAdapter — JS/TS via Babel today)
    ↓
SYNTAX / EXTRACTION (entities + provisional relations)
    ↓
RESOLVER (module resolution; CALLS binding)
    ↓
SEMANTIC GRAPH  (.ffvs/graph.json)
    ↓
QUERY CORE      (select, search, navigate, path-impact)
    ↓
QUERY LANGUAGE  (lexer → parser → AST → executor)
    ↓
CLI             (format human / --json)
```

Separations that must hold:

```text
CLI ≠ Core
DSL ≠ Graph
Parser ≠ Resolver
research/ ≠ product docs for end users
```

## Camadas

```text
CLI
 ↓
Application     init, index, status, explore, query, diagnostics
 ↓
Core            domain, graph, indexer, resolver, query, language
 ↓
Adapters        filesystem, storage, languages/*
```

## Persistência

Ver [`storage.md`](./storage.md).

## CLI (1.0)

Lifecycle: `init` `index` `status` `diagnostics`

Explore: `inspect` `files` `functions` `classes` `imports` `dependencies`/`deps` `dependents` `calls` `callers` `children` `parents` `search` `path` `impact` `relations` `graph`

Query: `query` (Query Language **1.0**)

## Extensibilidade de linguagem (futuro)

```text
LanguageAdapter
  matches(path)
  detectLanguage(path)
  extract(source, path) → FileExtraction
```

O indexer depende do contrato — não de Babel. Plugins não existem no 1.0; o ponto de extensão já está isolado.

## Limitações

[`limitations.md`](./limitations.md) · [`ffvs-1.0-scope.md`](./ffvs-1.0-scope.md)

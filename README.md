# FFVS

**FFVS** is an experimental, local-first toolkit for treating a software project as a queryable semantic structure — a CLI and a thin compositional query language over a local semantic graph.

## Current status (0.8.0)

Semantic graph + Query Language **v0.3** (`select` / `where` / `search` / `traverse` / `path` / `impact` / `describe`), with **resolution-aware** traverse and explicit **CALL impact**.

```bash
ffvs init && ffvs index .
ffvs query 'search "add" traverse callers resolution resolved describe'
ffvs query 'select modules where name = "Database.js" impact describe'
ffvs query 'search "target" kind function impact along calls describe'
```

Docs: [`docs/language/`](docs/language/) · Uncertainty: [`uncertainty.md`](docs/language/uncertainty.md).  
Evidence: [`EXP-DSL-0005`](research/experiments/EXP-DSL-0005/).

## Quick start

Requirements: Node.js 20+

```bash
npm install
npm run build
npm link

ffvs init
ffvs index .
ffvs query 'select modules describe'
```

## Research

- [EXP-RESOLUTION-0001](research/experiments/EXP-RESOLUTION-0001/) — resolution filters
- [EXP-CALLS-IMPACT-0001](research/experiments/EXP-CALLS-IMPACT-0001/) — CALL vs IMPORT impact
- [EXP-DESCRIBE-0001](research/experiments/EXP-DESCRIBE-0001/) — describe depth
- [EXP-SCOPE-0001](research/experiments/EXP-SCOPE-0001/) — scope = indexing (not DSL)
- [EXP-DSL-0005](research/experiments/EXP-DSL-0005/) — 0.7 vs 0.8 evaluation

## License

MIT

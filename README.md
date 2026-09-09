# FFVS

**FFVS** is an experimental, local-first toolkit for treating a software project as a queryable semantic structure — a CLI and a thin compositional query language over a local semantic graph.

## Current status (0.6.0)

Indexes JavaScript/TypeScript into a semantic graph with selection, search, scoped indexing, import fidelity, best-effort CALLS, and **FFVS Query Language v0.1**.

```bash
ffvs init && ffvs index .
ffvs functions --path src --name resolve
ffvs search safeParse --kind function
ffvs query 'select functions where name contains "resolve" traverse callers describe'
ffvs query 'search "safeParse" kind function traverse callers describe' --json
```

Explore CLI and DSL share the same Query Core. The language is read-only and deliberately small.

Language docs: [`docs/language/`](docs/language/).  
Limitations: [`docs/limitations.md`](docs/limitations.md).

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

- [EXP-0003](research/experiments/EXP-0003/) — post FILTER/SEARCH/CALLS metrics  
- [EXP-DSL-0001](research/experiments/EXP-DSL-0001/) — composition discovery  
- [EXP-DSL-0002](research/experiments/EXP-DSL-0002/) — CLI vs DSL  

## License

MIT

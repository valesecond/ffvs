# FFVS

**FFVS** is an experimental, local-first toolkit for treating a software project as a queryable semantic structure — starting with a CLI and evolving toward an operational language for software.

It is **not** a claim of superiority over existing analyzers or search tools. It is a long-term open-source and research-oriented effort to test whether a unified, compositional abstraction over code structure, relationships, history, and (later) runtime behavior is feasible and useful.

## The problem we explore

Understanding a system usually means jumping between editors, static analyzers, dependency graphs, Git history, and observability tools. FFVS investigates a single local model and a CLI/language-oriented interface for consulting that model.

Critical analysis of strengths, risks, and related work: [`docs/analysis.md`](docs/analysis.md).

## Working hypothesis

> It is possible to build a unified, compositional abstraction to query and operate on source code, architecture, history, and behavior of software systems.

Hypotheses are recorded in [`research/hypotheses.md`](research/hypotheses.md). They are not proven.

## Conceptual model

Projects are modeled as a **graph**: entities (files, modules, …) and relationships (`CONTAINS`, `IMPORTS`, …). The CLI drives a core engine; the core does not depend on the CLI.

```text
CLI → Application → Core → Domain ← Adapters (fs, languages, storage)
```

## Current status (Phase 0)

Implemented:

```bash
ffvs --help
ffvs init
ffvs index .
ffvs status
```

Not implemented yet: query DSL, impact/trace, Git intelligence, runtime, transformations.

## Quick start

Requirements: Node.js 20+

```bash
npm install
npm run build
npm link

ffvs init
ffvs index .
ffvs status
```

See [Getting Started](docs/getting-started.md).

## Example session

```text
$ ffvs init
Initialized FFVS project in .ffvs/

$ ffvs index .
Indexed 42 files (3 languages detected)
Wrote .ffvs/index.json and .ffvs/graph.json

$ ffvs status
FFVS project: initialized
Last indexed: 2026-03-09T...
Files: 42
Graph nodes: 43
Graph edges: 42
```

## Architecture

See [`docs/architecture.md`](docs/architecture.md). Design decisions live in [`docs/design-decisions/`](docs/design-decisions/).

## Roadmap

Phased plan: [`docs/roadmap.md`](docs/roadmap.md).

## Language (proposal only)

Syntax experiments and trade-offs: [`docs/language.md`](docs/language.md).

## Research

- [`research/research-agenda.md`](research/research-agenda.md)
- [`research/hypotheses.md`](research/hypotheses.md)
- [`research/experiments.md`](research/experiments.md)
- [`research/bibliography.md`](research/bibliography.md)

## Contributing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

See [`SECURITY.md`](SECURITY.md).

## License

MIT — see [`LICENSE`](LICENSE).

## Name

The project name is **FFVS**. The acronym is intentional and personal. No artificial expansion is defined here.

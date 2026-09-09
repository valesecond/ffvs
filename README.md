# FFVS

**FFVS** is an experimental, local-first toolkit for treating a software project as a queryable semantic structure — starting with a CLI and evolving toward an operational language for software.

It is **not** a claim of superiority over existing analyzers or search tools. It is a long-term open-source and research-oriented effort to test whether a unified, compositional abstraction over code structure, relationships, history, and (later) runtime behavior is feasible and useful.

## The problem we explore

Understanding a system usually means jumping between editors, static analyzers, dependency graphs, Git history, and observability tools. FFVS investigates a single local model and a CLI/language-oriented interface for consulting that model.

Critical analysis: [`docs/analysis.md`](docs/analysis.md).  
Software model: [`docs/software-model.md`](docs/software-model.md).

## Working hypothesis

> It is possible to build a unified, compositional abstraction to query and operate on source code, architecture, history, and behavior of software systems.

Hypotheses: [`research/hypotheses.md`](research/hypotheses.md). They are not proven.

## Conceptual model

```text
SOURCE CODE → PARSER → SOFTWARE MODEL → GRAPH → CLI EXPLORE → (future DSL)
```

```text
CLI → Application → Core → Domain ← Adapters (fs, languages, storage)
```

## Current status (Phase 1.5)

FFVS indexes JavaScript/TypeScript into a semantic graph and supports bidirectional exploration — without a DSL yet.

```bash
ffvs init && ffvs index .
ffvs inspect UserService
ffvs dependencies Service
ffvs dependents Repository
ffvs path Controller Database
ffvs impact Database
ffvs children Controller
ffvs relations Service --kind IMPORTS --json
```

Query patterns emerging from these verbs are documented in [`docs/query-model.md`](docs/query-model.md).

## Quick start

Requirements: Node.js 20+

```bash
npm install
npm run build
npm link

ffvs init
ffvs index .
ffvs inspect
```

Try the fixture:

```bash
cd fixtures/basic-project
ffvs init
ffvs index .
ffvs inspect UserService
```

See [Getting Started](docs/getting-started.md).

## Example session

```text
$ ffvs index .
Indexed 4 files (javascript=4)
Entities: module=4, function=1, class=4, method=...

$ ffvs inspect UserService
UserService

Type: Class
File: UserService.js

Methods
├── constructor()
├── create()
├── update()
└── delete()

Imports
├── ./UserRepository.js
└── ./User.js

Used by
└── index.js
```

```bash
ffvs functions --json
ffvs classes --json
```

## Architecture

See [`docs/architecture.md`](docs/architecture.md). Design decisions: [`docs/design-decisions/`](docs/design-decisions/).

## Roadmap

[`docs/roadmap.md`](docs/roadmap.md)

## Language (proposal only)

[`docs/language.md`](docs/language.md) — DSL deferred until explore ergonomics are better understood.

## Research

- [`research/research-agenda.md`](research/research-agenda.md)
- [`research/hypotheses.md`](research/hypotheses.md)
- [`research/experiments.md`](research/experiments.md)
- [`research/bibliography.md`](research/bibliography.md)
- [`research/related-tools.md`](research/related-tools.md)

## Contributing

[`CONTRIBUTING.md`](CONTRIBUTING.md) · [Code of Conduct](CODE_OF_CONDUCT.md)

## Security

[`SECURITY.md`](SECURITY.md)

## License

MIT — [`LICENSE`](LICENSE)

## Name

The project name is **FFVS**. No artificial expansion is defined here.

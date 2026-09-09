# Contributing to FFVS

Thank you. Prefer small, evidence-backed changes over large speculative features.

## Setup

```bash
npm install
npm run build
npm test
npm run lint
npm run typecheck
npm run format:check
npm link
ffvs --help
```

## Architecture map

```text
CLI (src/cli) → Application → Core (graph, query, language, resolver, indexer)
                            ← Domain types
Adapters / languages (JS/TS parser) feed the indexer
```

Do not put business logic in the CLI. Do not couple Babel details into the query executor.

## How to change things

| Goal                 | Where                                           | Notes                            |
| -------------------- | ----------------------------------------------- | -------------------------------- |
| Add a CLI verb       | `src/cli/program.ts` + `application/`           | Must call existing core          |
| Add a relation       | indexer + domain types + tests                  | Document resolution if uncertain |
| Change DSL           | `src/core/language/*` + language docs + tests   | Prefer ADR if semantic           |
| Add a language       | `src/languages/` implementing `LanguageAdapter` | Keep graph model stable          |
| Architectural choice | `docs/design-decisions/ADR-NNNN-….md`           | Link from README index           |
| Research question    | `research/experiments/EXP-…/`                   | Do not silently productize       |

## Evidence before features

1. Problem / hypothesis
2. Experiment or corpus pressure
3. Decision (JUSTIFIED / NOT JUSTIFIED)
4. Minimal implementation
5. Tests + docs

See `docs/ffvs-1.0-scope.md` — only **REQUIRED FOR 1.0**-class work belongs in stable releases without discussion.

## Pull requests

- Focused diffs
- Tests for behavior changes
- Update docs when user-facing
- `npm test && npm run lint && npm run format:check`

## Code of Conduct / License

[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) · MIT

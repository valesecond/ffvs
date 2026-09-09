# Contributing to FFVS

Thank you for considering a contribution. FFVS is early: clarity and small, well-documented changes matter more than large feature dumps.

## Before you start

1. Read [`README.md`](README.md), [`docs/philosophy.md`](docs/philosophy.md), and [`docs/architecture.md`](docs/architecture.md).
2. Check [`docs/roadmap.md`](docs/roadmap.md) and open issues.
3. For architectural changes, prefer discussing an issue first and, when appropriate, draft an ADR under `docs/design-decisions/`.

## Development setup

```bash
npm install
npm run build
npm test
npm run lint
npm run typecheck
```

Link the CLI locally:

```bash
npm link
ffvs --help
```

## How we work on features

For non-trivial work:

1. State the problem.
2. Outline the approach and alternatives.
3. Choose one; document if it is architectural (ADR).
4. Implement.
5. Test.
6. Update docs.

Do not add placeholder commands. Do not expand scope beyond the relevant phase without discussion.

## Pull requests

- Keep PRs focused.
- Include tests for behavior changes.
- Update documentation when user-facing behavior changes.
- Follow existing code style (`npm run format`).

## Issues

When filing an issue, include:

- What you expected;
- What happened;
- FFVS version / commit;
- OS and Node.js version;
- Minimal reproduction if possible.

## Code of Conduct

Participation is governed by [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## License

Contributions are accepted under the MIT License.

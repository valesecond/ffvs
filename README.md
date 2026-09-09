# FFVS

**FFVS** (software as a queryable structure) is a **local-first CLI** that indexes a JavaScript/TypeScript project into a semantic graph — then lets you **explore and query** structure, dependencies, calls, paths, and impact.

No cloud. No accounts. Read-only analysis.

## Why it exists

Editors and grep show text. FFVS shows **relations**: who imports whom, who calls whom, what sits on the path between modules, and what may be affected if something changes — with explicit **uncertainty** when calls or imports cannot be resolved confidently.

## Install

Requires Node.js 20+.

```bash
npm install -g @valesecond/ffvs
ffvs --version    # FFVS 1.2.1
ffvs --help
```

From source:

```bash
git clone https://github.com/valesecond/ffvs.git
cd ffvs
npm install
npm run build
npm link
```

Two complementary modes:

```bash
ffvs                 # Interactive Explorer (TTY)
ffvs status          # Command Mode (one-shot)
```

CLI notes: [`docs/cli.md`](docs/cli.md) · Interactive: [`docs/cli/interactive.md`](docs/cli/interactive.md) (`NO_COLOR`, CI, `--json`).

## First five minutes

```bash
cd examples/demo
ffvs init
ffvs index .
ffvs                 # enter Explorer — or use one-shot commands:
ffvs status
ffvs callers loadUser
ffvs impact repository.ts
ffvs query 'search "loadUser" kind function traverse callers resolution resolved describe'
```

More: [`docs/quick-start.md`](docs/quick-start.md) · [`examples/demo/`](examples/demo/)

## What you can ask

| Intent                      | Example                                       |
| --------------------------- | --------------------------------------------- |
| Find a symbol               | `ffvs search "loadUser"`                      |
| Who calls this?             | `ffvs callers loadUser`                       |
| Who depends on this module? | `ffvs dependents repository.ts`               |
| Impact of a change          | `ffvs impact repository.ts`                   |
| Path between modules        | `ffvs path app.ts repository.ts`              |
| Composed query              | `ffvs query 'select modules impact describe'` |

## Query Language 1.0

```bash
ffvs query 'select functions where name contains "load" traverse callers describe'
ffvs query 'select modules where name = "repository.ts" impact describe'
ffvs query 'search "loadUser" impact along calls describe'
```

Docs: [`docs/language/overview.md`](docs/language/overview.md)

## Limitations (read these)

- **JS/TS only** in 1.0
- **PATH** uses resolved-internal **IMPORTS**, not CALLS
- **CALLS** are static approximations (`RESOLVED` / `AMBIGUOUS` / `UNRESOLVED`)
- No mutation, AI, cloud UI, or SQL-style joins

Full list: [`docs/limitations.md`](docs/limitations.md) · scope: [`docs/ffvs-1.0-scope.md`](docs/ffvs-1.0-scope.md)

## Architecture (one glance)

```text
SOURCE → PARSER → RESOLVER → SEMANTIC GRAPH → QUERY CORE → QUERY LANGUAGE → CLI
```

[`docs/architecture.md`](docs/architecture.md) · storage: [`docs/storage.md`](docs/storage.md) · JSON: [`docs/json.md`](docs/json.md)

## Privacy

Runs entirely on your machine. No mandatory telemetry. See [`SECURITY.md`](SECURITY.md).

## Contributing

[`CONTRIBUTING.md`](CONTRIBUTING.md) · ADRs in `docs/design-decisions/` · research evidence in `research/`

## License

MIT

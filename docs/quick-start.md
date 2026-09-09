# Quick start

Requirements: **Node.js 20+**

## Install (from source)

```bash
git clone <this-repo>
cd FFVS
npm install
npm run build
npm link
ffvs --version
```

## Five-minute demo

```bash
cd examples/demo
ffvs init
ffvs index .
ffvs                 # Interactive Explorer (TTY) — explore with ↑↓ Enter
# or Command Mode:
ffvs status
ffvs functions
ffvs callers loadUser
ffvs impact repository.ts
ffvs query 'search "loadUser" kind function traverse callers resolution resolved describe'
ffvs query 'select modules where name = "repository.ts" impact describe'
```

## Everyday loop

```bash
ffvs init                 # once per project → creates .ffvs/
ffvs index .              # re-run after code changes
ffvs                      # continuous Explorer session
ffvs status               # one-shot health + counts
ffvs search "MySymbol"
ffvs query 'select modules describe'
```

Add `.ffvs/` to your project `.gitignore` (FFVS already ignores it in this repo).

Terminal tips: set `NO_COLOR=1` for plain text; `--json` never prints colors or spinners. Interactive keys: see [`cli/interactive.md`](./cli/interactive.md). Also [`cli.md`](./cli.md).

## Next

- [Query Language overview](./language/overview.md)
- [JSON contract](./json.md)
- [Storage (`.ffvs/`)](./storage.md)
- [Limitations](./limitations.md)
- [1.0 scope](./ffvs-1.0-scope.md)

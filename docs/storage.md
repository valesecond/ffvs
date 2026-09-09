# Storage — `.ffvs/`

FFVS stores project state locally next to your code:

```text
.ffvs/
├── config.json    # project name, include/exclude
├── index.json     # file inventory, languages, stats, parse errors, import resolution stats
└── graph.json     # semantic graph (nodes + edges)
```

## What it is

| File          | Role                                                      |
| ------------- | --------------------------------------------------------- |
| `config.json` | Project settings (safe to edit include/exclude carefully) |
| `index.json`  | Index metadata — rebuild with `ffvs index`                |
| `graph.json`  | Queryable graph — rebuild with `ffvs index`               |

Treat the directory as a **local cache/index**, not source of truth. Source code is the truth.

## Git

**Recommend ignoring `.ffvs/`** in application repos (this repository already lists it in `.gitignore`).

Reindex after clone:

```bash
ffvs init   # if needed
ffvs index .
```

## When to reindex

- After meaningful code changes
- After changing `--include` / `--exclude`
- If status looks stale or queries miss new symbols

## Privacy

Everything stays on disk. FFVS 1.0 does not upload your code.

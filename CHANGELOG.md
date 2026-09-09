# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] — 2026-09-09

### Added

- **Interactive Explorer**: bare `ffvs` (TTY) starts a continuous exploration session (`ffvs explore` alias).
- Navigation stack, breadcrumbs, keyboard (↑↓ Enter Esc `/` `:` `p` `?` `q`), in-session `FFVS ›` commands, command palette.
- Non-TTY / `CI` / `FFVS_NO_INTERACTIVE=1` safe fallback (no interactive loop).
- Docs: `docs/cli/interactive.md`, ADR-0025; tests: `tests/interactive.test.ts`.
- Modern CLI splash logo (isometric cube wordmark) and redesigned panels (boxed status/inspect/path/impact, green index-complete).
- Shared premium table (`# / Name / Location`) for lists in **Command Mode and Interactive Mode** (functions, classes, files, search, relation results).

### Changed

- Package **1.2.0**, published as **`@valesecond/ffvs`** (`npm i -g @valesecond/ffvs`; CLI command remains `ffvs`).
- Command Mode and `--json` contracts unchanged.
- Human-readable CLI presentation aligned to a premium developer-tool aesthetic (cyan brand, kind icons, bordered panels).
- Interactive entity lists use the same table chrome with `›` selection.
## [1.1.0] — 2026-09-09

### Added

- CLI design system under `src/cli/ui/` (theme, icons, trees, status/path/impact/query panels).
- TTY / `NO_COLOR` / CI-aware presentation; spinner during `ffvs index` when appropriate.
- `docs/cli.md` and UI tests (`tests/cli-ui.test.ts`).

### Changed

- Human-readable CLI output redesigned for consistency; `--json` unchanged (pure JSON).
- `ffvs` (no args) shows a compact welcome; `--version` prints `FFVS 1.1.0`.

## [1.0.0] — 2026-09-09

### Added

- Product release: usable local CLI + **Query Language 1.0** (stabilized 0.8.x surface).
- Docs: `ffvs-1.0-scope`, quick-start, JSON contract, storage, language overview/syntax/errors/resolution, release notes, ADR-0024.
- `examples/demo` five-minute project.
- JSON schema sketch `schemas/query-result.schema.json`.
- CLI `--help` first-steps; `--version` reads `package.json`.

### Changed

- Package **1.0.0**; Query Language version string **1.0** (compatible pipelines from 0.8.x / former QL 0.3).
- Path/impact CLI descriptions clarify IMPORTS vs CALL impact.

### Not included (deliberate)

- JOIN/PIPE/SQL, query scope stage, PATH-along-CALLS, hybrid impact, mutation, AI/cloud/UI.

## [0.8.0]

- Query Language v0.3: resolution-aware traverse, `impact along calls`, richer describe; experiments EXP-RESOLUTION through EXP-DSL-0005; ADR-0022.

## [0.7.0]

- Query Language v0.2: `path` / `impact`; ADR-0021; EXP-DSL-0004.

## [0.6.x]

- Query Language v0.1 thin slice + semantic stabilization.

## [0.1.0] — Phase 0 foundation

- Project foundation, CLI init/index/status, local `.ffvs/`, JS/TS detection, tests and CI.

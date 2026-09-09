# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
once releases are cut.

## [Unreleased]

### Added

- Phase 1.5 graph navigation API (`src/core/graph/navigate.ts`).
- Explore commands: `dependencies`/`deps`, `dependents`, `children`, `parents`, `path`, `impact`, `relations`.
- Shared JSON views: `EntityRef`, `RelationRef`, neighborhood/path/impact payloads.
- Fixtures: `layered`, `diamond`, `cycle`, `isolated`, `inheritance`.
- Docs: `docs/query-model.md`, ADR-0008, `research/related-work.md`, hypothesis H5.
- EXP-0002 real-world exploration report under `research/experiments/EXP-0002/`.

### Added (Phase 1)

- Phase 1 software understanding for JavaScript/TypeScript via `@babel/parser`.
- Semantic graph entities: `FUNCTION`, `CLASS`, `METHOD`, `VARIABLE` (+ existing project/file/module).
- Relations: `DECLARES`, `EXPORTS`, `EXTENDS`, `IMPLEMENTS` (+ `CONTAINS`, `IMPORTS`).
- Explore CLI: `inspect`, `files`, `functions`, `classes`, `imports`, `graph` with `--json`.
- Controlled fixture `fixtures/basic-project/`.
- Docs: `docs/software-model.md`, ADR-0007, `research/related-tools.md`.

### Changed

- Index/graph schema bumped to version 2.
- Language adapter contract now returns structured `FileExtraction`.
- Package version `0.3.0`.

## [0.1.0] — Phase 0 foundation

### Added

- Project foundation: documentation, ADRs, research agenda.
- CLI commands: `ffvs init`, `ffvs index`, `ffvs status`, `--help`.
- Local persistence under `.ffvs/`.
- Initial JavaScript/TypeScript detection adapter.
- Automated tests and CI workflow.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
once releases are cut.

## [Unreleased]

### Added

- **0.8.0** Query Language v0.3: resolution-aware `traverse`, explicit `impact along calls`, minimal richer `describe` (module + lines); `uncertainty.md`; ADR-0022; EXP-RESOLUTION/CALLS-IMPACT/DESCRIBE/SCOPE/DSL-0005; CALL impact fixtures.
- **0.7.0** Query Language v0.2: `path` and `impact` stages; shared `computePath`/`computeImpact` with CLI; ADR-0021; EXP-DSL-0004; path/impact docs and corpus.
- Tests: `dsl-path-impact.test.ts`, `dsl-resolution-0.8.test.ts`.

- **0.6.1** semantic stabilization, EXP-DSL-0003, ADR-0020.
- **0.6.0** Query Language v0.1 thin slice.

### Changed

- Package version `0.8.0`; language version `0.3`.

### Not included

- Query `scope` stage, entity `where resolution`, AND/OR, pipes, aggregates, mutation, silent default CALL impact.

## [0.1.0] — Phase 0 foundation

### Added

- Project foundation: documentation, ADRs, research agenda.
- CLI commands: `ffvs init`, `ffvs index`, `ffvs status`, `--help`.
- Local persistence under `.ffvs/`.
- Initial JavaScript/TypeScript detection adapter.
- Automated tests and CI workflow.
- Local-first, read-only exploration posture for the MVP.

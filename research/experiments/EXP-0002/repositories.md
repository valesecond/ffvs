# Repositories analyzed (EXP-0002)

Repositories were cloned to a temporary machine path and **not** copied into the FFVS git tree.

## Common run metadata

| Field                  | Value                         |
| ---------------------- | ----------------------------- |
| Date                   | 2026-09-09                    |
| FFVS                   | `0.3.0` @ `da12caf`           |
| Node.js                | v22.22.0                      |
| OS                     | Windows 10 (win32 10.0.26200) |
| Clone root (ephemeral) | `%TEMP%/ffvs-exp0002/`        |

## R1 — debug (small)

| Field           | Value                                                                                |
| --------------- | ------------------------------------------------------------------------------------ |
| Name            | debug                                                                                |
| URL             | https://github.com/debug-js/debug                                                    |
| Commit          | `f405ade8a4b7a0dc353e0f7390c1be90060f3621` (`f405ade`)                               |
| Language        | JavaScript                                                                           |
| Approx. size    | 13 indexed files; 7 JS source modules; graph 47 nodes / 72 edges                     |
| Characteristics | Classic Node dual browser/node entry; CommonJS `require`; small surface              |
| Index notes     | 0 parse errors; 8 IMPORTS edges (mostly external or extensionless)                   |
| Limits found    | Extensionless `require('./common')` / `require('./src')` **not resolved** to modules |

## R2 — zod (medium / complex)

| Field           | Value                                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name            | zod                                                                                                                                                      |
| URL             | https://github.com/colinhacks/zod                                                                                                                        |
| Commit          | `c5b9bcb39b7953c6a984849c6527863acdae0af7` (`c5b9bcb`)                                                                                                   |
| Language        | TypeScript (+ some JS), monorepo                                                                                                                         |
| Approx. size    | 725 indexed files; 509 TS + 7 JS; graph 4561 nodes / 9883 edges                                                                                          |
| Characteristics | Packages (`zod`, docs, bench); classes + methods; ESM imports with `.js` suffixes pointing at `.ts` sources                                              |
| Index notes     | 7 parse errors (advanced TS syntax / JSX-ish misparse); entity counts: CLASS=62, FUNCTION=1184, METHOD=309, MODULE=792                                   |
| Limits found    | **1411 / 1413 IMPORTS classified as external** because `./foo.js` does not map to `foo.ts`; dependency/impact/path nearly useless for core package graph |

## Deliberate exclusions

- No proprietary services.
- No modification of cloned repositories (only local `.ffvs/` written beside them in temp).
- No vendoring of third-party source into FFVS.

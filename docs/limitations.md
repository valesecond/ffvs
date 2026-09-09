# Limitations

Honest constraints of the current model (Phase ≤ 2.1).

## Module resolution

- Supported: relative paths, extensionless CJS, `.js`→`.ts/.tsx`, `index.*`, bare → EXTERNAL.
- **Not** implemented: `tsconfig` paths, package `exports` maps, deep node_modules graph fidelity.
- Ambiguous candidates are not guessed away for IMPORTS.

## CALLS (call graph)

- Best-effort only.
- Identifier same-file binds when unique; member/cross-file often `AMBIGUOUS` or `UNRESOLVED`.
- Dynamic callees, HOFs, destructuring aliases, and metaprogramming are largely unresolved.
- On zod (EXP-0003): majority of CALLS edges are UNRESOLVED or AMBIGUOUS — treat RESOLVED subset as lower bound.

## Selection / search

- FILTER is substring contains (optional equals/prefix in CORE API; CLI uses contains).
- No boolean filter expressions (intentional — avoids premature DSL).
- SEARCH ranking is shallow (exact/prefix/contains heuristics).

## Index scope

- Default skip dirs + `--include` / `--exclude` prefixes.
- Not a full `.gitignore` engine.

## Query Language

- Thin DSL (`ffvs query`) covers SELECT/WHERE/SEARCH/TRAVERSE/DESCRIBE only.
- No PATH/IMPACT/RELATIONS stages yet; use CLI for those.
- Language does not mutate the filesystem or graph.

## Languages

- JS/TS via Babel only for semantic extraction.
- Other file types may appear as FILE nodes without deep entities.

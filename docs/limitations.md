# Limitations (FFVS 1.0)

Honest constraints. Prefer this list over marketing precision.

## Languages

- Semantic extraction: **JavaScript / TypeScript** only (Babel).
- Other files may appear as FILE nodes without deep entities.
- Adapter contract exists for future languages; not shipped.

## Module resolution

- Supported: relative paths, extensionless CJS, `.js`→`.ts/.tsx`, directory `index.*`, bare specifiers → EXTERNAL.
- **Not** implemented: full `tsconfig` paths, package `exports` maps, deep `node_modules` fidelity.
- Ambiguous IMPORTS are not guessed away.

## CALLS

- Static, best-effort call graph.
- States: `RESOLVED` · `AMBIGUOUS` · `UNRESOLVED`.
- Dynamic calls, heavy HOFs, and metaprogramming are often unresolved.
- Never treat raw CALL counts as ground truth.

## PATH

- Uses **resolved-internal IMPORTS only**.
- Does **not** walk CALLS in 1.0.

## IMPACT

- CLI `ffvs impact` = IMPORTS dependents.
- CALL impact only via `ffvs query '… impact along calls'` (default resolved).
- No unlabeled hybrid IMPORT+CALL impact.

## Query Language

- Stages: select / where / search / traverse / path / impact / describe.
- No AND/OR, JOIN, PIPE, aggregates, mutation.
- Cross-relation composition = sequential traverse (+ `declares` kind bridge). Set intersection is manual (EXP-DSL-0006).

## Index scope

- `--include` / `--exclude` + config; not a full `.gitignore` engine.

## Performance

- Loading large `graph.json` often dominates CLI latency. See `docs/performance.md`.

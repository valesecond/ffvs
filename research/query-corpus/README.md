# Query corpus

Real / experiment-derived FFVS Query Language snippets for regression and roadmap evidence.

```text
impact/         IMPACT queries (IMPORTS default)
architecture/   structure, inheritance, PATH examples
dependency/     IMPORTS / dependents / path seeds
calls/          CALLS / callers
resolution/     resolution filters + CALL impact
search/         SEARCH + FILTER
debugging/      multi-hop composition + describe
scope/          (index scope notes; no DSL stage — EXP-SCOPE-0001)
```

Run:

```bash
ffvs query --file research/query-corpus/calls/Q001.ffvs
```

Newline-separated stages are whitespace-equivalent to single-line pipelines.

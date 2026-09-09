# ADR-0023 — Cross-relation composition (EXP-DSL-0006)

## Context

After QL v0.3, IMPORTS and CALLS are queryable separately (including `impact along calls` and resolution filters). EXP-DSL-0006 asked whether **explicit** cross-relation composition syntax is required.

## Questions evaluated

Q01–Q10 covering IMPORTS→CALLS, CALLS→IMPORTS, same-axis multi-hop, hybrid impact, callers∩impact, and resolution-preserving cross hops. Corpora: debug, zod (`packages/zod/src`), commander, FFVS `src/`.

## Evidence

- Sequential `traverse` already feeds entities into the next hop (executor semantics).
- CALLS→IMPORTS: **PASS** via `traverse callers … traverse dependencies`.
- IMPORTS→CALLS: naive MODULE→CALLS empty (**entity kind**); bridge via `declares` works for related questions.
- Exact “callers of F inside importers of M” / “callers in impact cone”: **PARTIAL** — needs set ∩ outside DSL.
- Hybrid IMPORT+CALL impact remains honesty-bound (EXP-CALLS-IMPACT-0001).
- Resolution uncertainty preserved under inclusive vs filtered last hops (zod).

Full write-up: `research/experiments/EXP-DSL-0006/README.md`.

## Decision

```text
NOT JUSTIFIED
```

Do **not** add PIPE, JOIN, relation-pair sugar, `path along calls`, or combined `impact` in response to this experiment.

Package stays **0.8.0**; language stays **v0.3**.

## Why not implement

1. Composition of different relations is already expressible when kinds align.
2. New syntax would mostly alias documented pipelines.
3. Real gap (intersection) is a different feature class and still **NEEDS EVIDENCE** as its own experiment.
4. Auto hybrid impact would hide uncertainty.

## Alternatives

| Alternative                         | Outcome                 |
| ----------------------------------- | ----------------------- |
| Document recipes only               | **Accepted**            |
| Sugar `traverse imports then calls` | Rejected — low leverage |
| Generic JOIN/PIPE                   | Rejected — unevidenced  |
| Dual-seed intersect operator        | Deferred to future EXP  |

## Conditions to reopen

Reopen if corpus pressure shows recurring Q01/Q04-style questions where two-query handoff is systematically costly **and** a minimal intersect/bind proposal is evaluated under EXP-DSL-0007 (or successor) as **JUSTIFIED**.

## Consequences

- ADR-0022 surfaces unchanged.
- Roadmap 0.9: mark “cross-relation composition syntax” as **NOT JUSTIFIED**; keep intersect as **NEEDS EVIDENCE**.

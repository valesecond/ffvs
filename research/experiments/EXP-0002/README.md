# EXP-0002 — Real-World Software Exploration

**Status:** completed (exploratory study)  
**Date:** 2026-09-09  
**FFVS version:** `0.3.0` (`da12caf`)  
**Environment:** Windows 10, Node.js v22.22.0

## Hypothesis under test

> A representation of software as a semantic graph may enable more expressive and composable exploration of software structure than file-oriented navigation alone. (**H5**)

## Central question

> What do developers want to ask about software that is difficult, tedious, or fragmented to answer using traditional code navigation tools?

## Method (brief)

1. Select two public JS/TS repositories (small + medium).
2. Clone at a fixed commit into a **temporary** directory (code not vendored into FFVS).
3. Run `ffvs init` + `ffvs index .` using the built CLI.
4. Pose plausible developer questions; attempt answers with existing commands only.
5. Classify each question: Direct / Composed / Missing / Awkward; Answerable YES/PARTIAL/NO.
6. Analyze IMPORTS graph for centrality / isolation / cycles via `scripts/analyze-graph.mjs`.
7. Record results without inventing metrics.

## Corpus

See [`repositories.md`](./repositories.md).

## Artifacts

| File                                                       | Content                        |
| ---------------------------------------------------------- | ------------------------------ |
| [`repositories.md`](./repositories.md)                     | Corpus metadata                |
| [`questions.md`](./questions.md)                           | Question catalog               |
| [`findings.md`](./findings.md)                             | Qualitative findings           |
| [`results.md`](./results.md)                               | Aggregate tables               |
| [`limitations.md`](./limitations.md)                       | Limits & threats to validity   |
| [`scripts/analyze-graph.mjs`](./scripts/analyze-graph.mjs) | Read-only graph metrics helper |
| [`scripts/run-notes.md`](./scripts/run-notes.md)           | How to reproduce locally       |

## One-sentence result

FFVS is **already useful for inventory and structural DESCRIBE** (entities, class hierarchy, containment), but on these real repos **module TRAVERSE / PATH / IMPACT largely failed** because import path resolution does not handle extensionless CommonJS or TypeScript’s `.js`→`.ts` ESM rewrite—so the experiment **does not** yet justify a DSL; it **does** justify fixing the software model’s edge fidelity first.

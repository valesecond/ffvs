# Experiments

Registro de experimentos. Entradas devem ser adicionadas **somente** quando um experimento for planejado ou executado.

## Modelo de entrada

```text
### EXP-XXXX — Título
- Date:
- Status: planned | running | completed | abandoned
- Hypothesis:
- Method:
- Dataset:
- Metrics:
- Results: (somente após execução)
- Limitations:
- Artifacts:
```

## Experimentos

### EXP-0001 — Baseline de indexação local (planejado)

- Date: TBD
- Status: planned
- Hypothesis: H1 (parcial)
- Method: Medir tempo e tamanho de artefatos `.ffvs/`
- Dataset: fixtures + amostras
- Metrics: tempo de index, bytes, nós/arestas
- Results: —
- Limitations: —
- Artifacts: —

### EXP-0002 — Explore verbs vs file navigation / real-world exploration

- Date: 2026-09-09
- Status: **completed** (exploratory catalog; timed A/B vs editor+grep deferred)
- Hypothesis: H5
- Method: Index two public repos (debug, zod) at pinned commits; pose developer questions; classify answerability / experience; measure IMPORTS health; script degree/cycle samples
- Dataset: debug@`f405ade`, zod@`c5b9bcb` (temp clones); fixtures/layered as control
- Metrics: YES/PARTIAL/NO counts; missing-capability frequency; internal vs external IMPORTS ratio
- Results: STRUCTURE/DESCRIBE strong; TRAVERSE/PATH/IMPACT on OSS largely failed due to import resolution (zod: 2/1413 internal IMPORTS). Insufficient evidence for DSL; prioritize RESOLVE + FILTER. Full write-up under `research/experiments/EXP-0002/`.
- **Follow-up (Phase 1.6 re-run):** After resolver + require extraction, zod resolved internal IMPORTS **660** (rate 100% of relative); debug impact/path/dependents for `common.js` now work. See `research/experiments/EXP-0002/rerun-phase-1.6.md`.
- Limitations: n=2 repos; author-posed questions; no timed control condition in this run
- Artifacts: `research/experiments/EXP-0002/*`

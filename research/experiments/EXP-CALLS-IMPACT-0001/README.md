# EXP-CALLS-IMPACT-0001 — Should IMPACT walk CALLS?

## Goal

Compare IMPORT impact vs CALL-graph “impact” without claiming ground-truth precision.

## Method

Synthetic fixtures under `fixtures/calls-impact-*` + qualitative comparison on known graphs.

### Variants

| Variant | Walk | Edge filter |
| ------- | ---- | ----------- |
| IMPORT IMPACT | inbound IMPORTS | resolved-internal (current) |
| CALL IMPACT (all) | inbound CALLS | none |
| CALL IMPACT (resolved) | inbound CALLS | resolution=RESOLVED |
| Combined | union of both | as above |

## Fixture scenarios

| Fixture | Pattern |
| ------- | ------- |
| `calls-impact-direct` | A calls B |
| `calls-impact-indirect` | A→B→C |
| `calls-impact-ambiguous` | two functions named `target`; member/ambiguous call |
| `calls-impact-unresolved` | call to missing name |
| `calls-impact-diamond` | A,B → shared |
| `calls-impact-cycle` | A↔B calls |

## Observations (qualitative)

| Dimension | IMPORT IMPACT | CALL IMPACT (all) | CALL IMPACT (resolved) |
| --------- | ------------- | ----------------- | ---------------------- |
| Coverage of “who runs my code” | low | higher | medium |
| False positives | low | **high** (AMBIGUOUS/UNRESOLVED) | lower |
| Ambiguity surface | low | high | reduced |
| Alignment with CLI `impact` | exact | different meaning | different |
| Cost | BFS on modules | BFS on functions; denser | denser than imports |

## Findings

1. CALL IMPACT answers a **different question** (runtime call fan-in) than module dependency impact.
2. Using **all** CALLS as default would violate uncertainty honesty (zod-scale noise).
3. **Resolved-only CALL IMPACT** is the only ethically defensible default *if* CALL impact is offered.
4. Combining IMPORT+CALL without user intent conflates architecture layers.

## Decision for 0.8.0

```text
KEEP: impact                    → IMPORTS only (unchanged)
ADD:  impact along calls [resolution resolved]
DEFAULT for along calls:        resolution resolved (explicit opt-out later if needed)
DO NOT: change default impact
DO NOT: claim precision without ground truth
```

Status: **PARTIALLY JUSTIFIED** — explicit CALL impact variant only.

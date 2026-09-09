# EXP-DSL-0004 — PATH & IMPACT expressiveness

## Goal

Measure whether PATH and IMPACT increase DSL expressiveness on the EXP-DSL-0001 question set.

## Versions

|        |                      |
| ------ | -------------------- |
| Before | FFVS 0.6.1 / QL v0.1 |
| After  | FFVS 0.7.0 / QL v0.2 |

## Metrics (22 original questions)

| Metric      | 0.6.1 | 0.7.0  |
| ----------- | ----- | ------ |
| Expressable | 16    | **18** |
| PASS        | 14    | **16** |
| PARTIAL     | 2     | 2      |
| N/A         | 6     | **4**  |

Delta: **+2 PASS** (Q03 IMPACT, Q04 PATH). Q22 remains N/A (needs dual independent selects + path without shared seed — still awkward). Q15/Q16/Q21 unchanged.

```text
queries requiring PATH:     Q04 (PASS), Q22 (still hard)
queries requiring IMPACT:   Q03 (PASS)
queries requiring both:     0 in original 22
```

## Verdict

```text
SUPPORTED
```

PATH and IMPACT measurably close documented gaps without claiming full CLI parity.

## Original 22 — comparison

| Q     | Question               | 0.6.1   | 0.7.0    | Primitive      | Notes                                     |
| ----- | ---------------------- | ------- | -------- | -------------- | ----------------------------------------- |
| 01    | Who depends on X?      | PASS    | PASS     | TRAVERSE       |                                           |
| 02    | What does X import?    | PASS    | PASS     | TRAVERSE       |                                           |
| 03    | Impact of changing X?  | N/A     | **PASS** | IMPACT         | `… impact describe`                       |
| 04    | Path A→B?              | N/A     | **PASS** | PATH           | `path "A" "B"`                            |
| 05–12 | (filter/search/calls)  | PASS    | PASS     |                |                                           |
| 13    | Neighborhood           | PARTIAL | PARTIAL  | DESCRIBE       | still thin                                |
| 14    | Children               | PASS    | PASS     |                |                                           |
| 15    | Unresolved imports     | N/A     | N/A      |                | CLI diagnostics                           |
| 16    | Relations CALLS        | PARTIAL | PARTIAL  |                |                                           |
| 17–20 |                        | PASS    | PASS     |                |                                           |
| 21    | Exclude docs           | N/A     | N/A      | SCOPE          |                                           |
| 22    | Path after two selects | N/A     | N/A      | PATH+dual seed | still needs two lookups or `path "A" "B"` |

## New PATH/IMPACT questions (10)

See `questions.md`. Summary: 9/10 PASS on fixtures; 1 PARTIAL (CALLS impact not in model).

## Performance (informal)

On `fixtures/layered`, DSL path/impact wall time ≈ CLI (`load graph` dominates). Lex/parse overhead negligible.

## Conclusion

Adding PATH and IMPACT was justified by EXP-DSL-0001 gaps and improves pass rate 14→16 on the fixed corpus.

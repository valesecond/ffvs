# ADR-0022 — Resolution-aware traverse & CALL impact (QL v0.3 / FFVS 0.8.0)

## Context

CALLS and IMPORTS carry resolution states. Users need confident caller/callee neighborhoods without treating AMBIGUOUS/UNRESOLVED as facts. Default IMPACT remains IMPORTS; EXP-CALLS-IMPACT-0001 asked for an explicit CALL-axis variant.

## Evidence

- EXP-RESOLUTION-0001: 8/15 questions **NEEDS FILTER**; entity-level `where resolution` **NOT RELEVANT**
- EXP-CALLS-IMPACT-0001: keep default IMPORT impact; add `impact along calls` (resolved default)
- EXP-DESCRIBE-0001: add location + module; do not clone `inspect`
- EXP-SCOPE-0001: query `scope` stage **NOT JUSTIFIED**

## Decision

1. `traverse <relation> [inbound|outbound] [resolution <state>]` — edge filter, opt-in
2. `impact` unchanged (IMPORTS, resolved-internal)
3. `impact along calls [resolution <state>]` — default `resolved`
4. `describe` gains `module`, `startLine`, `endLine`
5. No DSL `scope` stage; indexing remains scope authority
6. Language version → **0.3**; package → **0.8.0**

## Alternatives

| Alternative | Why rejected |
| ----------- | ------------ |
| `where resolution` on entities | Wrong locus; invents entity attribute |
| Silent resolved-only traverse | Hides uncertainty |
| Change default `impact` to CALLS | Breaks CLI/DSL parity and prior experiments |
| Full inspect-as-describe | Violates DESCRIBE ≠ INSPECT |

## Consequences

- ResultSet `impact` gains `along` (+ optional `resolution`)
- Descriptions grow three fields (JSON contract change; additive)
- Tests cover resolution filters + CALL impact fixtures

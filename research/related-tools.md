# Related Tools — Positioning Notes

Study notes for Phase 1+. **Not** a claim that FFVS replaces these systems.

## What mature tools already solve well

| Tool                           | Strengths relevant to FFVS                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| **CodeQL**                     | Rich semantic queries, multi-language extractors, security/quality rules at scale               |
| **Joern / CPGs**               | Code Property Graphs combining syntax, control/data flow, and call relations; powerful querying |
| **Semgrep**                    | Fast pattern search, approachable rules, strong DX for lint-like findings                       |
| **tree-sitter**                | Incremental multi-language parsing; excellent substrate for editors and tools                   |
| **Sourcegraph / SCIP**         | Code navigation and symbol indexes across large orgs                                            |
| **Dependency Cruiser / madge** | Practical JS/TS module dependency graphs                                                        |

## Typical abstractions they use

- Databases of facts / relations (CodeQL)
- CPGs and graph query languages (Joern)
- Concrete syntax patterns over ASTs (Semgrep)
- Language-specific index formats (SCIP/LSIF)
- Module-level dependency graphs (JS tooling)

## Where FFVS is deliberately different (hypothesis, not proof)

1. **CLI + eventual operational language as the primary product surface**, not a rule pack or IDE feature alone.
2. **Local-first project graph** intended to grow from structure → history → runtime under one model.
3. **Explore-first language design**: explicit commands before freezing a DSL.
4. **Research-oriented honesty**: document limits; evaluate experimentally.

## What FFVS should not reinvent early

- Full interprocedural security analysis (CodeQL/Joern territory)
- Enterprise multi-repo search (Sourcegraph territory)
- Pattern-rule ecosystems overnight (Semgrep territory)

## Academic angles worth evaluating later

- Can a small, compositional entity-relation model + CLI match developer comprehension tasks on mid-size repos?
- What query shapes appear in explore logs that justify a DSL?
- How does AST-level FFVS compare to CPG-backed tools on dependency/impact tasks (precision/recall/effort)?

Update this file as readings deepen; cite primary sources in formal papers.

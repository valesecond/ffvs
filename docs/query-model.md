# Query Model (emerging)

Phase 1.5 observations. **No DSL is implemented.** This document records patterns that appear from explicit explore commands.

## Central question

> What do developers actually want to ask a semantic software model?

And:

> What questions are tedious or fragmented with only an editor, grep, Git, and traditional tools?

## Command families observed

### 1. Select entities

```text
ffvs files
ffvs functions
ffvs classes
```

Emerging primitive: **SELECT entities BY kind**

### 2. Inspect entity

```text
ffvs inspect UserService
ffvs graph UserService
ffvs children UserService
ffvs parents UserService
```

Emerging primitive: **DESCRIBE entity** / **NEIGHBORHOOD**

### 3. Traverse dependency edges

```text
ffvs dependencies UserService   # outgoing IMPORTS (alias: deps)
ffvs dependents UserRepository  # incoming IMPORTS
ffvs impact Database            # transitive dependents
```

Emerging primitive: **TRAVERSE relation [direction] [depth]**

### 4. Find paths

```text
ffvs path UserController UserRepository
```

Emerging primitive: **FIND PATH from → to OVER relation**

### 5. Treat relations as values

```text
ffvs relations
ffvs relations Service --kind IMPORTS
ffvs imports
```

Emerging primitive: **SELECT relations [WHERE incident(entity) AND kind=…]**

## Five concrete “magic” use cases (fixtures)

| #   | Question                                    | Command                         | Fixture                     |
| --- | ------------------------------------------- | ------------------------------- | --------------------------- |
| 1   | What does this service depend on?           | `ffvs dependencies Service`     | `layered`                   |
| 2   | Who depends on this repository?             | `ffvs dependents Repository`    | `layered`                   |
| 3   | How does the controller reach the database? | `ffvs path Controller Database` | `layered`                   |
| 4   | If Database changes, what else may break?   | `ffvs impact Database`          | `layered` / `diamond`       |
| 5   | What sits inside this class/module?         | `ffvs children Controller`      | `layered` / `basic-project` |

These are hard to answer reliably with grep alone without manually chasing imports.

## Ergonomics decisions

| Choice                                        | Rationale                                                                   |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| Full names `dependencies` / `dependents`      | Discoverable; alias `deps` for speed                                        |
| Separate commands vs `inspect --dependencies` | Keeps operations first-class and scriptable; `inspect` stays a summary      |
| No `callers` yet                              | Would be dishonest without a reliable `CALLS` relation                      |
| Module anchoring                              | Asking deps of a **class** resolves to its **module** for IMPORTS traversal |
| Reverse navigation without duplicating edges  | `incoming` / `ancestors` over the same directed graph                       |

See ADR-0008.

## JSON shape conventions

Explore navigation commands share reusable views:

- `EntityRef`: `{ id, kind, name, path }`
- `RelationRef`: `{ id, kind, from, to, properties }`
- `NeighborhoodResult`: entity + relations + nodes
- `PathExploreResult`: from/to + found + nodes + relations
- `ImpactResult`: entity + affected[{…EntityRef, depth}]

## Redundancies / overlaps noticed

| Overlap                                 | Notes                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `imports` vs `relations --kind IMPORTS` | `imports` is a convenience listing; `relations` is the general form    |
| `graph X` vs `relations X`              | `graph` is human neighborhood; `relations` emphasizes edges as objects |
| `dependents` vs `impact`                | dependents = depth 1; impact = transitive closure                      |
| `inspect` Used by vs `dependents`       | Same underlying reverse IMPORTS; inspect is summary                    |

Likely future consolidation: keep thin CLI verbs mapping to fewer graph primitives.

## Candidate language primitives (NOT implemented)

```text
SELECT <entity-kind> [WHERE …]
DESCRIBE <entity>
TRAVERSE <entity> ALONG <relation> DIRECTION in|out DEPTH n
FIND PATH <from> <to> OVER <relation>
SELECT RELATIONS [WHERE …]
```

Composition (pipes) remains a hypothesis (H4), not a design commitment.

## What this phase intentionally did not decide

- Concrete DSL syntax
- Whether SQL-like, find/where, or pipe-first wins
- Call-graph queries
- Ranking / metrics queries (“most connected modules”) beyond raw edge counts in `inspect`

## EXP-0002 update (real repositories)

Full report: [`research/experiments/EXP-0002/`](../research/experiments/EXP-0002/).  
Re-run after Phase 1.6: [`rerun-phase-1.6.md`](../research/experiments/EXP-0002/rerun-phase-1.6.md).

| Finding                                                   | Implication for query model           |
| --------------------------------------------------------- | ------------------------------------- |
| STRUCTURE/DESCRIBE worked on `debug` + `zod`              | SELECT/DESCRIBE primitives are real   |
| TRAVERSE/PATH/IMPACT failed on first run                  | Edge fidelity was the blocker         |
| After Phase 1.6, TRAVERSE/PATH/IMPACT work on same corpus | Model fidelity unlocks existing verbs |
| SELECT without FILTER still painful at zod scale          | FILTER/SEARCH still candidates        |
| CALL questions impossible                                 | CALLS still deferred                  |
| Composition intents appeared                              | Language later; FILTER/CALLS next     |

### Revised priority of primitives

```text
1. RESOLVE imports                         — done (Phase 1.6)
2. FILTER / SEARCH                         — scale + composition
3. TRAVERSE / PATH / IMPACT                — present; now trustworthy for IMPORTS
4. RANK / CYCLE                            — architecture questions
5. CALLS                                   — deeper impact
6. DSL syntax                              — only after repeated FILTER/compose pressure
```

## Next empirical steps

1. Optional timed A/B vs editor+grep now that edges are trustworthy.
2. Observe FILTER pressure on large listings.
3. Only then draft minimal query syntax for top repeated patterns.

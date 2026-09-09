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

## Next empirical steps

1. Use these commands on a real mid-size repo and log repeated question shapes.
2. Measure how often `impact`/`path` beat manual navigation (see research metrics).
3. Only then draft a minimal query syntax for the top 3 repeated patterns.

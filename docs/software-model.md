# Software Model

How FFVS represents software in Phase 1.

## Pipeline

```text
SOURCE CODE
    ↓
  PARSER (@babel/parser for JS/TS)
    ↓
 EXTRACTION (entities + relations)
    ↓
 SOFTWARE GRAPH
    ↓
 CLI EXPLORE (inspect / files / functions / …)
    ↓
 FUTURE DSL (not yet)
```

## Graph primitives

Every indexed project is a directed labeled graph persisted at `.ffvs/graph.json`.

### Node

| Field        | Meaning                                                    |
| ------------ | ---------------------------------------------------------- |
| `id`         | Stable identifier (`class:src/UserService.js:UserService`) |
| `kind`       | Entity kind (see below)                                    |
| `name`       | Human-facing name when applicable                          |
| `location`   | Optional file + line/column span                           |
| `properties` | Extra metadata (language, exported, …)                     |

### Edge

| Field         | Meaning                          |
| ------------- | -------------------------------- |
| `id`          | Stable edge id                   |
| `kind`        | Relation kind                    |
| `from` / `to` | Node ids                         |
| `properties`  | Optional (e.g. import specifier) |

## Entity kinds (Phase 1)

| Kind       | Description                                           |
| ---------- | ----------------------------------------------------- |
| `PROJECT`  | Root of an FFVS project                               |
| `FILE`     | Indexed source or text file                           |
| `MODULE`   | Language module (for JS/TS: one per source file)      |
| `FUNCTION` | Function declaration or module-level function binding |
| `CLASS`    | Class declaration                                     |
| `METHOD`   | Method / constructor inside a class                   |
| `VARIABLE` | Module-level variable binding                         |

## Relation kinds

| Kind         | Meaning                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------- |
| `CONTAINS`   | Structural nesting (project→file→module→members; class→method)                                |
| `DECLARES`   | Module declares a top-level entity                                                            |
| `IMPORTS`    | Module imports another module (resolved / external / unresolved / ambiguous)                  |
| `EXPORTS`    | Module exports a declared entity                                                              |
| `EXTENDS`    | Class extends another class (same-file best-effort; cross-file when resolvable by name)       |
| `IMPLEMENTS` | Class implements an interface (TypeScript; name recorded)                                     |
| `CALLS`      | Best-effort call edge (function/method/module → callee); see resolution on edge properties    |

`CALLS` is intentionally incomplete for dynamic JavaScript. See [`limitations.md`](./limitations.md).

## Identity rules

- Files/modules: path-based (`file:src/a.ts`, `module:src/a.ts`).
- Functions/classes/variables: `kind:filePath:name` (and line suffix when names collide).
- Methods: `method:filePath:ClassName.methodName`.

## Lookup

CLI entity lookup (`ffvs inspect UserService`) matches:

1. Exact node `name`;
2. Exact node `id`;
3. Unique id/name suffix / path segment.

Ambiguous matches produce an error listing candidates.

## Limits (honest)

- Dynamic imports with non-literal specifiers are ignored.
- Package imports (`lodash`) are recorded as unresolved import metadata, not module edges.
- `extends`/`implements` across files are best-effort.
- No type checking; overloaded/merged declarations may be incomplete.
- Generated or heavily macro-like code may parse but extract poorly.

## Why this model

It is intentionally close to what a future query language would traverse: entities and relations, not raw AST dumps. The CLI explore commands are experiments to learn which queries matter before designing a DSL.

# Query algebra (conceptual)

Not executable syntax. Describes how CLI compositions compose.

## Operators

```text
SELECT(kind)                         → EntitySet
FILTER(set, predicate)               → EntitySet
SEARCH(needle, opts?)                → EntitySet
DESCRIBE(entity)                     → Description
TRAVERSE(set|entity, rel, dir)       → EntitySet / EdgeSet
PATH(a, b, rel)                      → Path | empty
RELATIONS(entity?, kinds?)           → EdgeSet
```

Predicates (FILTER) today:

```text
name contains S
path contains S
```

## Example pipelines (conceptual)

```text
SELECT(Function)
→ FILTER(name contains "safeParse")
→ TRAVERSE(CALLS, inbound)
→ DESCRIBE
```

```text
SEARCH("resolve", kind=Function, path="src/core")
→ DESCRIBE
```

```text
SELECT(Module)
→ FILTER(path contains "src/core")
→ TRAVERSE(IMPORTS, outbound)
```

```text
SELECT(Class)
→ FILTER(name contains "User")
→ TRAVERSE(EXTENDS, outbound)
```

```text
SEARCH("common", kind=Module)
→ TRAVERSE(IMPORTS, inbound)   // dependents
```

## Result flow

1. SELECT/SEARCH/FILTER yield **EntitySet**.
2. TRAVERSE may yield EntitySet or EdgeSet depending on presentation.
3. DESCRIBE consumes a single entity (or iterates a set conceptually).
4. Ambiguous/unresolved edges remain labeled — algebra does not erase uncertainty.

## Non-goals

- No boolean expression language in FILTER.
- No implicit ranking beyond SEARCH’s simple score.
- No executable pipe operator in the product yet.

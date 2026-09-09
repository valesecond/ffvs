# Query Language 1.0 — Syntax

Keywords are lowercase. Strings use double quotes. Stages are whitespace-separated.

## Seed forms

```text
select <entity_kind>
search "<needle>" [kind <entity_kind>] [path "<prefix>"]
path from "<A>" to "<B>" [along imports]
path "<A>" "<B>" [along imports]
```

## Pipeline stages

```text
where name|path contains|eq|=|prefix "<value>"
traverse <relation> [inbound|outbound] [resolution resolved|ambiguous|unresolved|external]
path to "<B>" [along imports]          # source = current set (exactly one module-anchor)
impact                                  # along imports (resolved-internal)
impact along calls [resolution <state>] # default resolution resolved
describe
```

## Entity kinds

`functions` `classes` `modules` `files` `methods` `variables` `entities`  
(singular forms accepted: `function`, `class`, …)

## Relations (traverse)

`imports` `dependencies` `deps` `dependents` `calls` `callers` `contains` `children` `parents` `exports` `declares` `extends` `implements`

## Full grammar

See [grammar-draft.md](./grammar-draft.md) (EBNF for Language 1.0).

## Not in 1.0

`and` / `or` / `not` · pipes · join · aggregates · variables · mutation

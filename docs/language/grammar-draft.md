# Grammar draft (EBNF)

## Implemented in FFVS 0.6.0 (Query Language v0.1)

```ebnf
query          = pipeline ;

pipeline       = seed_stage , { stage } ;

seed_stage     = select_stage | search_stage ;

stage          = select_stage
               | search_stage
               | filter_stage
               | traverse_stage
               | describe_stage ;

select_stage   = "select" , entity_kind ;

search_stage   = "search" , string , { search_opt } ;

search_opt     = "kind" , entity_kind
               | "path" , string ;

filter_stage   = "where" , predicate ;

predicate      = field , matcher , string ;

field          = "name" | "path" ;

matcher        = "contains" | "eq" | "=" | "prefix" ;

traverse_stage = "traverse" , relation , [ direction ] ;

relation       = "imports" | "contains" | "calls" | "exports"
               | "extends" | "implements" | "declares"
               | "callers" | "dependents" | "dependencies" | "deps"
               | "children" | "parents" ;

direction      = "inbound" | "outbound" ;

describe_stage = "describe" ;

entity_kind    = "functions" | "classes" | "modules" | "files"
               | "methods" | "variables" | "entities"
               | "function" | "class" | "module" | "file"
               | "method" | "variable" ;

string         = '"' , { character } , '"' ;
```

### Spec vs earlier draft

| Draft item | 0.6.0 decision |
| ---------- | -------------- |
| `and` in WHERE | Deferred — sequential `where` stages instead |
| Required traverse direction | Made **optional** (defaults from relation sugar) |
| Sugar as separate stages (`callers` alone) | Sugar is **relation names** under `traverse` (matches examples) |
| `path` / `relations` stages | Deferred (not in 0.6.0 product scope) |
| `=` matcher | Added (alias of `eq`) — used in readiness examples |

See ADR-0019.

## Deferred (not implemented)

```ebnf
path_stage     = "path" , "to" , target , "along" , relation ;
relations_stage= "relations" , [ "kind" , relation , { "," , relation } ] ;
sugar_stage    = "callers" | "calls" | "dependents" | "deps" | "impact" ;
```

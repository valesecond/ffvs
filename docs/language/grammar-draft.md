# Grammar draft (EBNF) — Query Language v0.3

Implemented in FFVS **0.8.0**.

```ebnf
query          = pipeline ;

pipeline       = seed_stage , { stage } ;

seed_stage     = select_stage | search_stage | path_seed ;

stage          = select_stage
               | search_stage
               | filter_stage
               | traverse_stage
               | path_stage
               | impact_stage
               | describe_stage ;

select_stage   = "select" , entity_kind ;

search_stage   = "search" , string , { search_opt } ;

search_opt     = "kind" , entity_kind
               | "path" , string ;

filter_stage   = "where" , predicate ;

predicate      = field , matcher , string ;

field          = "name" | "path" ;

matcher        = "contains" | "eq" | "=" | "prefix" ;

traverse_stage = "traverse" , relation , [ direction ] , [ resolution_mod ] ;

resolution_mod = "resolution" , resolution_state ;

resolution_state = "resolved" | "ambiguous" | "unresolved" | "external" ;

path_seed      = path_stage ;

path_stage     = "path" , path_body , [ "along" , "imports" ] ;

path_body      = "from" , string , "to" , string
               | "to" , string
               | string , string
               | string ;

impact_stage   = "impact" , [ "along" , impact_along ] , [ resolution_mod ] ;

impact_along   = "imports" | "calls" ;

direction      = "inbound" | "outbound" ;

describe_stage = "describe" ;

relation       = "imports" | "contains" | "calls" | "exports"
               | "extends" | "implements" | "declares"
               | "callers" | "dependents" | "dependencies" | "deps"
               | "children" | "parents" ;

entity_kind    = "functions" | "classes" | "modules" | "files"
               | "methods" | "variables" | "entities"
               | "function" | "class" | "module" | "file"
               | "method" | "variable" ;

string         = '"' , { character } , '"' ;
```

## Notes

- `impact` alone ≡ `impact along imports` (no `resolution` allowed).
- `impact along calls` defaults to `resolution resolved` if omitted.
- Resolution filters apply to **edges**, never via `where` on entities.
- No `scope` stage (EXP-SCOPE-0001: NOT JUSTIFIED).

See ADR-0022.

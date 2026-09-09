# Query Language 1.0 — Errors

Errors are typed. CLI prints the message (and hint when present). Exit code `1` for language errors.

| Kind          | When                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------- |
| **LEXICAL**   | Illegal character, bad escape, unterminated string                                            |
| **PARSE**     | Wrong stage order / missing tokens                                                            |
| **SEMANTIC**  | Unknown kind/relation; stage without seed; ambiguous entity lookup; unsupported path relation |
| **EXECUTION** | Reserved                                                                                      |

## Shape

```text
Semantic error at line L, column C:
message
Hint: optional guidance
```

## Examples

| Input                           | Result                                              |
| ------------------------------- | --------------------------------------------------- |
| `select foobar`                 | SEMANTIC unknown entity kind                        |
| `traverse callers` (no seed)    | SEMANTIC traverse requires prior select/search/path |
| `where resolution = "RESOLVED"` | PARSE/SEMANTIC — resolution is not an entity field  |
| `impact resolution resolved`    | SEMANTIC — use `impact along calls`                 |
| Empty `where` match             | **Success** with empty entities (not an error)      |

Ambiguous name lookup lists candidates in the hint when available.

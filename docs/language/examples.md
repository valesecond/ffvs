# Language examples

Executable in FFVS 0.6.0:

```bash
ffvs query 'select functions where name contains "resolve" describe'

ffvs query 'select functions where name contains "resolve" traverse callers describe'

ffvs query 'search "safeParse" describe'

ffvs query 'search "safeParse" kind function traverse callers describe'

ffvs query 'select modules where path contains "src/core" traverse imports describe'

ffvs query 'select classes where name contains "User" traverse extends describe'

ffvs query 'select modules where path contains "src/core" traverse dependencies describe'

ffvs query 'select files where path contains "resolver" describe'
```

JSON:

```bash
ffvs query 'search "parse" describe' --json
```

File:

```bash
ffvs query --file analysis.ffvs
```

Semantics: [`semantics.md`](./semantics.md).  
Grammar: [`grammar-draft.md`](./grammar-draft.md).

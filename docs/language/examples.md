# Language examples (Query Language 1.0)

```bash
ffvs query 'select functions where name contains "resolve" traverse callers describe'

ffvs query 'search "add" kind function traverse callers resolution resolved describe'

ffvs query 'path "Controller.js" "Database.js" describe'

ffvs query 'select modules where name = "Controller.js" path to "Database.js" along imports'

ffvs query 'select modules where name = "Database.js" impact describe'

ffvs query 'search "target" kind function impact along calls describe'

ffvs query 'search "Database" kind module impact describe' --json

# Kind bridge IMPORTS → CALLS (see EXP-DSL-0006)
ffvs query 'search "types.ts" kind module traverse dependents traverse declares traverse calls resolution resolved describe'
```

See [overview.md](./overview.md), [path.md](./path.md), [impact.md](./impact.md), [resolution.md](./resolution.md).

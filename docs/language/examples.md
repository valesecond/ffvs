# Language examples (QL v0.3)

```bash
ffvs query 'select functions where name contains "resolve" traverse callers describe'

ffvs query 'search "add" kind function traverse callers resolution resolved describe'

ffvs query 'path "Controller.js" "Database.js" describe'

ffvs query 'select modules where name = "Controller.js" path to "Database.js" along imports'

ffvs query 'select modules where name = "Database.js" impact describe'

ffvs query 'search "target" kind function impact along calls describe'

ffvs query 'search "Database" kind module impact describe' --json

ffvs query --file research/query-corpus/resolution/Q001.ffvs
```

See [`path.md`](./path.md), [`impact.md`](./impact.md), [`uncertainty.md`](./uncertainty.md), [`semantics.md`](./semantics.md).

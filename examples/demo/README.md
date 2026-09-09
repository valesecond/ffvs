# FFVS demo (first 5 minutes)

Tiny layered TypeScript project:

```text
src/
  app.ts          → calls loadUser
  service.ts      → calls findById, formatName
  repository.ts   → data access
  utils.ts        → formatName
```

```bash
# from FFVS repo root after npm run build && npm link
cd examples/demo
ffvs init -n demo
ffvs index .
ffvs status
ffvs functions
ffvs callers loadUser
ffvs dependencies service.ts
ffvs impact repository.ts
ffvs path app.ts repository.ts
ffvs query 'search "loadUser" kind function traverse callers resolution resolved describe'
ffvs query 'select modules where name = "repository.ts" impact describe'
```

What you should see conceptually:

| Question                   | Command                                    |
| -------------------------- | ------------------------------------------ |
| Where is the function?     | `ffvs search loadUser` / `ffvs functions`  |
| Who calls it?              | `ffvs callers loadUser`                    |
| Who depends on the module? | `ffvs dependents repository.ts` / `impact` |
| Path between modules?      | `ffvs path app.ts repository.ts`           |
| Composed query             | `ffvs query '…'`                           |

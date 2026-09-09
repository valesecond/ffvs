# Reproduction notes

## Prerequisites

- Node.js 20+
- Built FFVS (`npm run build` in FFVS repo)

## Steps

```bash
# 1. Clone corpus (example paths)
export EXP_ROOT=/tmp/ffvs-exp0002   # or %TEMP%\ffvs-exp0002 on Windows
git clone https://github.com/debug-js/debug "$EXP_ROOT/debug"
git -C "$EXP_ROOT/debug" checkout f405ade8a4b7a0dc353e0f7390c1be90060f3621

git clone https://github.com/colinhacks/zod "$EXP_ROOT/zod"
git -C "$EXP_ROOT/zod" checkout c5b9bcb39b7953c6a984849c6527863acdae0af7

# 2. Index with FFVS
FFVS=/path/to/FFVS/dist/cli/index.js

cd "$EXP_ROOT/debug"
node "$FFVS" init --name debug
node "$FFVS" index .
node "$FFVS" status --json

cd "$EXP_ROOT/zod"
node "$FFVS" init --name zod
node "$FFVS" index .
node "$FFVS" inspect --json

# 3. Optional graph metrics
node /path/to/FFVS/research/experiments/EXP-0002/scripts/analyze-graph.mjs \
  "$EXP_ROOT/zod/.ffvs/graph.json" zod
```

## Do not

- Commit cloned repositories into FFVS.
- Modify upstream project files (`.ffvs/` beside them is fine in temp).

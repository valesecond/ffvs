/**
 * EXP-0002 helper: analyze a persisted .ffvs/graph.json for exploration metrics.
 * Usage: node analyze-graph.mjs <path-to-graph.json> [label]
 *
 * Does not modify analyzed repositories. Read-only.
 */
import fs from "node:fs";
import path from "node:path";

const graphPath = process.argv[2];
const label = process.argv[3] ?? path.basename(path.dirname(path.dirname(graphPath)));

if (!graphPath) {
  console.error("Usage: node analyze-graph.mjs <graph.json> [label]");
  process.exit(1);
}

const graph = JSON.parse(fs.readFileSync(graphPath, "utf8"));
const modules = graph.nodes.filter(
  (n) => n.kind === "MODULE" && n.properties?.external !== true && n.properties?.unresolved !== true,
);
const imports = graph.edges.filter((e) => e.kind === "IMPORTS");

const inDegree = new Map();
const outDegree = new Map();
for (const m of modules) {
  inDegree.set(m.id, 0);
  outDegree.set(m.id, 0);
}

for (const e of imports) {
  if (outDegree.has(e.from)) outDegree.set(e.from, (outDegree.get(e.from) ?? 0) + 1);
  if (inDegree.has(e.to)) inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
}

function top(map, n = 10) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([id, count]) => {
      const node = graph.nodes.find((x) => x.id === id);
      return { id, path: node?.properties?.path ?? null, name: node?.name ?? null, count };
    });
}

const isolated = modules.filter((m) => (inDegree.get(m.id) ?? 0) === 0 && (outDegree.get(m.id) ?? 0) === 0);

// Simple directed cycle detection among internal IMPORTS
const adj = new Map();
for (const m of modules) adj.set(m.id, []);
for (const e of imports) {
  if (adj.has(e.from) && adj.has(e.to)) adj.get(e.from).push(e.to);
}

const cycles = [];
const visited = new Set();
const stack = new Set();
const pathStack = [];

function dfs(u) {
  visited.add(u);
  stack.add(u);
  pathStack.push(u);
  for (const v of adj.get(u) ?? []) {
    if (!visited.has(v)) dfs(v);
    else if (stack.has(v) && cycles.length < 20) {
      const idx = pathStack.indexOf(v);
      cycles.push(pathStack.slice(idx).concat(v));
    }
  }
  pathStack.pop();
  stack.delete(u);
}

for (const m of modules) {
  if (!visited.has(m.id)) dfs(m.id);
}

const result = {
  label,
  nodes: graph.nodes.length,
  edges: graph.edges.length,
  modules: modules.length,
  importEdges: imports.length,
  externalImportTargets: graph.nodes.filter((n) => n.properties?.external === true).length,
  topInDegree: top(inDegree, 10),
  topOutDegree: top(outDegree, 10),
  isolatedModules: isolated.slice(0, 30).map((m) => m.properties?.path ?? m.id),
  isolatedCount: isolated.length,
  cyclesSample: cycles.slice(0, 10).map((c) =>
    c.map((id) => graph.nodes.find((n) => n.id === id)?.properties?.path ?? id),
  ),
  cycleCountSampled: cycles.length,
};

console.log(JSON.stringify(result, null, 2));

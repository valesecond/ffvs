/**
 * EXP-0003 metrics helper over .ffvs/graph.json + optional index.json
 * Usage: node metrics.mjs <project-root-with-.ffvs> [label]
 */
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2];
const label = process.argv[3] ?? path.basename(root ?? "");

if (!root) {
  console.error("Usage: node metrics.mjs <project-root> [label]");
  process.exit(1);
}

const graph = JSON.parse(fs.readFileSync(path.join(root, ".ffvs", "graph.json"), "utf8"));
const indexPath = path.join(root, ".ffvs", "index.json");
const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, "utf8")) : null;

const calls = graph.edges.filter((e) => e.kind === "CALLS");
const imports = graph.edges.filter((e) => e.kind === "IMPORTS");

function countBy(prop, edges) {
  const out = {};
  for (const e of edges) {
    const key = e.properties?.[prop] ?? "unknown";
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

const kindCounts = {};
for (const n of graph.nodes) {
  kindCounts[n.kind] = (kindCounts[n.kind] ?? 0) + 1;
}

const result = {
  label,
  nodes: graph.nodes.length,
  edges: graph.edges.length,
  kindCounts,
  imports: {
    total: imports.length,
    byResolution: countBy("resolution", imports),
    internalResolved: imports.filter(
      (e) => e.properties?.resolution === "RESOLVED" && e.properties?.external !== true,
    ).length,
    external: imports.filter((e) => e.properties?.external === true).length,
    unresolved: imports.filter((e) => e.properties?.unresolved === true).length,
  },
  calls: {
    total: calls.length,
    byResolution: countBy("resolution", calls),
    resolved: calls.filter((e) => e.properties?.resolution === "RESOLVED").length,
    ambiguous: calls.filter((e) => e.properties?.resolution === "AMBIGUOUS").length,
    unresolved: calls.filter((e) => e.properties?.resolution === "UNRESOLVED").length,
  },
  indexResolution: index?.resolution ?? null,
  files: index?.files?.length ?? null,
};

console.log(JSON.stringify(result, null, 2));

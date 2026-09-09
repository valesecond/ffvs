/**
 * EXP-DSL-0006 measurement harness (read-only; not part of product).
 * Run: node research/experiments/EXP-DSL-0006/measure.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const FFVS_ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")),
  "../../..",
);
const EXP = process.env.FFVS_EXP_ROOT || "C:\\Users\\HP\\AppData\\Local\\Temp\\ffvs-exp-dsl-0006";

const { runQuery } = await import(
  pathToFileURL(path.join(FFVS_ROOT, "dist/application/query.js")).href
);
const { loadModel } = await import(
  pathToFileURL(path.join(FFVS_ROOT, "dist/application/explore.js")).href
);

function tallyCalls(graph) {
  const counts = { RESOLVED: 0, AMBIGUOUS: 0, UNRESOLVED: 0, EXTERNAL: 0, unknown: 0, total: 0 };
  for (const e of graph.edges) {
    if (e.kind !== "CALLS") continue;
    counts.total += 1;
    const r = e.properties?.resolution;
    if (r === "RESOLVED" || r === "AMBIGUOUS" || r === "UNRESOLVED" || r === "EXTERNAL")
      counts[r] += 1;
    else if (e.properties?.ambiguous) counts.AMBIGUOUS += 1;
    else if (e.properties?.unresolved) counts.UNRESOLVED += 1;
    else counts.unknown += 1;
  }
  return counts;
}

function tallyImports(graph) {
  const counts = { RESOLVED: 0, AMBIGUOUS: 0, UNRESOLVED: 0, EXTERNAL: 0, unknown: 0, total: 0 };
  for (const e of graph.edges) {
    if (e.kind !== "IMPORTS") continue;
    counts.total += 1;
    const r = e.properties?.resolution;
    if (r === "RESOLVED" || r === "AMBIGUOUS" || r === "UNRESOLVED" || r === "EXTERNAL")
      counts[r] += 1;
    else if (e.properties?.external) counts.EXTERNAL += 1;
    else if (e.properties?.unresolved) counts.UNRESOLVED += 1;
    else counts.unknown += 1;
  }
  return counts;
}

async function corpusStats(name, root) {
  const model = await loadModel(root);
  const calls = tallyCalls(model.graph);
  const imports = tallyImports(model.graph);
  const index = model.index;
  return {
    name,
    root,
    files: index.files?.length ?? index.fileCount ?? "?",
    nodes: model.graph.nodes.length,
    edges: model.graph.edges.length,
    entities: Object.fromEntries(
      ["MODULE", "FUNCTION", "METHOD", "CLASS", "FILE"].map((k) => [
        k,
        model.graph.nodes.filter((n) => n.kind === k).length,
      ]),
    ),
    IMPORTS: imports,
    CALLS: calls,
    parseErrors: index.parseErrors?.length ?? index.diagnostics?.parseErrors?.length ?? null,
  };
}

async function q(root, source) {
  try {
    const ran = await runQuery(root, source);
    const rc = ran.result.diagnostics.resolutionCounts;
    return {
      ok: true,
      source,
      entities: ran.result.entities.length,
      relations: ran.result.relations.length,
      kinds: Object.fromEntries([
        ...ran.result.entities.reduce((m, e) => m.set(e.kind, (m.get(e.kind) || 0) + 1), new Map()),
      ]),
      names: ran.result.entities.slice(0, 12).map((e) => e.name ?? e.id),
      resolution: rc,
      impact: ran.result.impact ?? null,
      stages: ran.result.stagesApplied,
    };
  } catch (err) {
    return { ok: false, source, error: String(err?.message || err) };
  }
}

const corpora = [
  { name: "debug", root: path.join(EXP, "debug") },
  { name: "zod", root: path.join(EXP, "zod") },
  { name: "commander", root: path.join(EXP, "commander") },
  { name: "ffvs-self", root: path.join(EXP, "ffvs-self") },
];

const stats = [];
for (const c of corpora) {
  stats.push(await corpusStats(c.name, c.root));
}

// Discover good seeds per corpus
async function pickSeeds(root) {
  const model = await loadModel(root);
  const modules = model.graph.nodes.filter(
    (n) => n.kind === "MODULE" && n.properties?.external !== true && typeof n.name === "string",
  );
  const functions = model.graph.nodes.filter(
    (n) => n.kind === "FUNCTION" && n.properties?.unresolved !== true && typeof n.name === "string",
  );
  // Prefer function with inbound CALLS RESOLVED
  let bestFn = null;
  let bestScore = -1;
  for (const fn of functions) {
    const inbound = model.graph.edges.filter(
      (e) => e.kind === "CALLS" && e.to === fn.id && e.properties?.resolution === "RESOLVED",
    ).length;
    if (inbound > bestScore) {
      bestScore = inbound;
      bestFn = fn;
    }
  }
  // Prefer module with dependents
  let bestMod = modules[0] ?? null;
  let bestDeps = -1;
  for (const m of modules) {
    const inbound = model.graph.edges.filter(
      (e) => e.kind === "IMPORTS" && e.to === m.id && e.properties?.resolution === "RESOLVED",
    ).length;
    if (inbound > bestDeps) {
      bestDeps = inbound;
      bestMod = m;
    }
  }
  return {
    fn: bestFn ? { name: bestFn.name, id: bestFn.id, callersResolved: bestScore } : null,
    mod: bestMod ? { name: bestMod.name, id: bestMod.id, dependentsResolved: bestDeps } : null,
  };
}

const results = { stats, seeds: {}, queries: {} };

for (const c of corpora) {
  const seeds = await pickSeeds(c.root);
  results.seeds[c.name] = seeds;
  const fn = seeds.fn?.name;
  const mod = seeds.mod?.name;
  if (!fn || !mod) {
    results.queries[c.name] = { error: "no seeds" };
    continue;
  }

  const qs = {
    // Q01 IMPORTS→CALLS: modules that import mod, then functions declared there that call fn?
    // Natural attempt 1 (likely broken entity mismatch):
    Q01_naive: `search "${mod}" kind module traverse dependents traverse callers`,
    // Bridge via declares:
    Q01_bridge: `search "${mod}" kind module traverse dependents traverse declares`,
    Q01_bridge_then_calls: null, // filled after we know if declares yields functions that call fn — run separate
    // From dependents modules → declares → then filter calls to fn requires second query / external
    Q01b_callers_of_fn: `search "${fn}" kind function traverse callers resolution resolved`,
    Q01c_callers_modules: `search "${fn}" kind function traverse callers resolution resolved traverse parents`,

    // Q02 CALLS→IMPORTS
    Q02_callers_then_deps: `search "${fn}" kind function traverse callers resolution resolved`,
    // need module then deps — try parents/declares reverse
    Q02_via_module_deps: `search "${fn}" kind function traverse callers resolution resolved`,

    // Q03 hybrid impact
    Q03_import_impact: `search "${mod}" kind module impact describe`,
    Q03_call_impact: `search "${fn}" kind function impact along calls describe`,

    // Q04 callers inside import-impact cone — needs intersection (no AND)
    Q04_callers: `search "${fn}" kind function traverse callers resolution resolved`,
    Q04_impact: `search "${mod}" kind module impact`,

    // Q05 deps of modules containing callers
    Q05_callers: `search "${fn}" kind function traverse callers resolution resolved`,

    // Q06 CALLS→CALLS multi-hop
    Q06_one_hop: `search "${fn}" kind function traverse callers resolution resolved`,
    Q06_two_hop: `search "${fn}" kind function traverse callers resolution resolved traverse callers resolution resolved`,
    Q06_call_impact: `search "${fn}" kind function impact along calls`,

    // Q07 IMPORTS→IMPORTS
    Q07_deps: `search "${mod}" kind module traverse dependencies`,
    Q07_two_hop_deps: `search "${mod}" kind module traverse dependencies traverse dependencies`,
    Q07_impact: `search "${mod}" kind module impact`,
    Q07_dependents_two: `search "${mod}" kind module traverse dependents traverse dependents`,

    // Q08 cross + resolution
    Q08_deps_declares_calls_resolved: `search "${mod}" kind module traverse dependents traverse declares`,

    // Q09 select filter traverse traverse
    Q09_composition: `select functions where name contains "${fn.slice(0, Math.min(4, fn.length))}" traverse callers resolution resolved traverse calls resolution resolved`,

    // Q10 inverse of Q01 style
    Q10_callers_then_deps_attempt: `search "${fn}" kind function traverse callers resolution resolved`,
  };

  const out = {};
  for (const [k, source] of Object.entries(qs)) {
    if (!source) continue;
    out[k] = await q(c.root, source);
  }

  // Follow-ups that need module anchors from callers
  // After callers, try traverse dependencies (moduleAnchor on seed function → owning module)
  out.Q02_callers_dependencies = await q(
    c.root,
    `search "${fn}" kind function traverse callers resolution resolved traverse dependencies`,
  );
  out.Q05_callers_dependencies = await q(
    c.root,
    `search "${fn}" kind function traverse callers resolution resolved traverse dependencies`,
  );
  out.Q01_dependents_declares_calls = await q(
    c.root,
    `search "${mod}" kind module traverse dependents traverse declares traverse calls resolution resolved`,
  );
  out.Q01_dependents_calls_direct = await q(
    c.root,
    `search "${mod}" kind module traverse dependents traverse calls resolution resolved`,
  );
  out.Q08_cross_resolved = await q(
    c.root,
    `search "${mod}" kind module traverse dependents traverse declares traverse calls resolution resolved`,
  );
  out.Q08_cross_all = await q(
    c.root,
    `search "${mod}" kind module traverse dependents traverse declares traverse calls`,
  );

  results.queries[c.name] = { seeds: { fn, mod }, ...out };
}

const outPath = path.join(FFVS_ROOT, "research/experiments/EXP-DSL-0006/results.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log("wrote", outPath);
console.log(JSON.stringify({ stats: results.stats, seeds: results.seeds }, null, 2));

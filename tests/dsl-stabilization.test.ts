import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { indexProject } from "../src/application/index-project.js";
import { initProject } from "../src/application/init.js";
import { runQuery } from "../src/application/query.js";
import { LanguageError, parse, resolveTraverse } from "../src/core/language/index.js";

const tempDirs: string[] = [];

async function makeGraphProject(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ffvs-stab-"));
  tempDirs.push(dir);
  await fs.mkdir(path.join(dir, "src"), { recursive: true });
  // Diamond to C: A→C, B→C via calls to shared helper
  await fs.writeFile(
    path.join(dir, "src", "graph.js"),
    `
export function shared() { return 1; }
export function a() { return shared(); }
export function b() { return shared(); }
export function mid() { return a(); }
export function deep() { return mid(); }
`,
  );
  await fs.writeFile(
    path.join(dir, "src", "mod-a.js"),
    `import { shared } from './graph.js';\nexport function useA() { return shared(); }\n`,
  );
  await fs.writeFile(
    path.join(dir, "src", "mod-b.js"),
    `import { shared } from './graph.js';\nexport function useB() { return shared(); }\n`,
  );
  await initProject(dir);
  await indexProject(dir, ".");
  return dir;
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }
});

describe("0.6.1 ResultSet semantics", () => {
  it("deduplicates neighbors reached from multiple seeds (A→C, B→C → one C)", async () => {
    const root = await makeGraphProject();
    // callers of shared include both a and b; traversing calls back yields unique shared
    const diamond = await runQuery(
      root,
      'select functions where name = "shared" traverse callers traverse calls',
    );
    const sharedHits = diamond.result.entities.filter((e) => e.name === "shared");
    expect(sharedHits).toHaveLength(1);
    const edgeIds = diamond.result.relations.map((e) => e.id);
    expect(new Set(edgeIds).size).toBe(edgeIds.length);
  });

  it("entity order is deterministic across repeated runs", async () => {
    const root = await makeGraphProject();
    const q = 'select functions where name contains "a" traverse callers describe';
    const runs = [];
    for (let i = 0; i < 10; i++) {
      runs.push(await runQuery(root, q));
    }
    const fingerprint = (r: (typeof runs)[0]) =>
      JSON.stringify({
        entities: r.json.entities.map((e) => e.id),
        relations: r.json.relations.map((rel) => rel.id),
        descriptions: r.json.descriptions?.map((d) => d.id),
        diagnostics: r.json.diagnostics.resolutionCounts,
      });
    const first = fingerprint(runs[0]!);
    for (const run of runs) {
      expect(fingerprint(run)).toBe(first);
    }
  });

  it("empty results succeed with empty entities", async () => {
    const root = await makeGraphProject();
    const missing = await runQuery(
      root,
      'select functions where name = "doesNotExist" describe',
    );
    expect(missing.result.entities).toEqual([]);
    expect(missing.result.descriptions).toEqual([]);

    const searchMiss = await runQuery(root, 'search "doesNotExistZz" describe');
    expect(searchMiss.result.entities).toEqual([]);

    const noCallers = await runQuery(
      root,
      'select functions where name = "deep" traverse callers describe',
    );
    // deep may have no callers
    expect(Array.isArray(noCallers.result.entities)).toBe(true);
  });

  it("composition depth: traverse replaces set and keeps last-hop relations", async () => {
    const root = await makeGraphProject();
    const d1 = await runQuery(root, "select functions");
    expect(d1.result.entities.length).toBeGreaterThan(0);
    expect(d1.result.relations).toEqual([]);

    const d2 = await runQuery(root, 'select functions where name contains "mid"');
    expect(d2.result.entities.every((e) => (e.name ?? "").includes("mid"))).toBe(true);

    const d3 = await runQuery(
      root,
      'select functions where name = "shared" traverse callers',
    );
    expect(d3.result.relations.every((e) => e.kind === "CALLS")).toBe(true);
    expect(d3.result.diagnostics.resolutionCounts.RESOLVED + d3.result.diagnostics.resolutionCounts.AMBIGUOUS + d3.result.diagnostics.resolutionCounts.UNRESOLVED).toBeGreaterThan(0);

    const d4 = await runQuery(
      root,
      'select functions where name = "shared" traverse callers traverse calls',
    );
    expect(d4.result.entities.some((e) => e.name === "shared")).toBe(true);
    // relations are only from the *last* traverse (calls), not accumulated
    expect(d4.result.relations.every((e) => e.kind === "CALLS")).toBe(true);

    const d5 = await runQuery(
      root,
      'search "shared" traverse callers traverse calls describe',
    );
    expect(d5.result.descriptions?.length).toBe(d5.result.entities.length);
  });

  it("WHERE is case-sensitive; SEARCH needle is case-insensitive", async () => {
    const root = await makeGraphProject();
    const whereUpper = await runQuery(
      root,
      'select functions where name = "Shared"',
    );
    expect(whereUpper.result.entities).toHaveLength(0);

    const searchUpper = await runQuery(root, 'search "SHARED" kind function');
    expect(searchUpper.result.entities.some((e) => e.name === "shared")).toBe(true);
  });

  it("path matching normalizes backslashes", async () => {
    const root = await makeGraphProject();
    const posix = await runQuery(
      root,
      'select files where path contains "src/graph"',
    );
    // In DSL strings, \\ is one backslash — normalized to / for matching.
    const win = await runQuery(
      root,
      'select files where path contains "src\\\\graph"',
    );
    expect(win.result.entities.map((e) => e.id)).toEqual(posix.result.entities.map((e) => e.id));
  });

  it("CALLS resolution states are preserved on edges and tallied", async () => {
    const root = await makeGraphProject();
    const ran = await runQuery(
      root,
      'select functions where name = "a" traverse calls describe',
    );
    for (const edge of ran.result.relations) {
      const res = edge.properties?.["resolution"];
      expect(["RESOLVED", "AMBIGUOUS", "UNRESOLVED", "EXTERNAL"]).toContain(res);
      if (res === "AMBIGUOUS") {
        expect(res).not.toBe("RESOLVED");
      }
    }
    const counts = ran.result.diagnostics.resolutionCounts;
    const sum =
      counts.RESOLVED + counts.AMBIGUOUS + counts.UNRESOLVED + counts.EXTERNAL + counts.unknown;
    expect(sum).toBe(ran.result.relations.length);
  });

  it("is read-only: does not mutate .ffvs artifacts", async () => {
    const root = await makeGraphProject();
    const graphPath = path.join(root, ".ffvs", "graph.json");
    const indexPath = path.join(root, ".ffvs", "index.json");
    const configPath = path.join(root, ".ffvs", "config.json");
    const before = {
      graph: await fs.readFile(graphPath, "utf8"),
      index: await fs.readFile(indexPath, "utf8"),
      config: await fs.readFile(configPath, "utf8"),
    };
    await runQuery(
      root,
      'select functions where name contains "a" traverse callers traverse calls describe',
    );
    const after = {
      graph: await fs.readFile(graphPath, "utf8"),
      index: await fs.readFile(indexPath, "utf8"),
      config: await fs.readFile(configPath, "utf8"),
    };
    expect(after).toEqual(before);
  });
});

describe("0.6.1 traverse defaults", () => {
  it("documents default directions", () => {
    expect(resolveTraverse("imports").direction).toBe("outbound");
    expect(resolveTraverse("dependents").direction).toBe("inbound");
    expect(resolveTraverse("callers").direction).toBe("inbound");
    expect(resolveTraverse("calls").direction).toBe("outbound");
    expect(resolveTraverse("calls", "inbound").direction).toBe("inbound");
  });
});

describe("0.6.1 error taxonomy", () => {
  const cases: Array<{ q: string; kind: "LEXICAL" | "PARSE" | "SEMANTIC" }> = [
    { q: "", kind: "PARSE" },
    { q: "florb functions", kind: "PARSE" },
    { q: "select foobar", kind: "SEMANTIC" },
    { q: "select functions where foo contains \"x\"", kind: "PARSE" },
    { q: "select functions where name like \"x\"", kind: "PARSE" },
    { q: "select functions where name contains", kind: "PARSE" },
    { q: "select functions traverse", kind: "PARSE" },
    { q: "select functions traverse nonexistent", kind: "SEMANTIC" },
    { q: "select functions @", kind: "LEXICAL" },
    { q: 'search "oops', kind: "LEXICAL" },
    { q: "where name contains \"x\"", kind: "PARSE" },
  ];

  for (const c of cases) {
    it(`${c.kind}: ${c.q || "(empty)"}`, () => {
      try {
        parse(c.q);
        expect.fail("expected throw");
      } catch (error) {
        expect(error).toBeInstanceOf(LanguageError);
        expect((error as LanguageError).kind).toBe(c.kind);
        expect((error as LanguageError).message).toMatch(/error at line/i);
      }
    });
  }
});

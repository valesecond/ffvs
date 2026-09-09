import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { indexProject } from "../src/application/index-project.js";
import { initProject } from "../src/application/init.js";
import {
  exploreCallers,
  exploreCalls,
  listEntities,
  listFiles,
  loadModel,
  searchModel,
} from "../src/application/explore.js";
import { selectNodes } from "../src/core/query/select.js";
import { searchEntities } from "../src/core/query/search.js";

const tempDirs: string[] = [];

async function makeTempProject(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ffvs-query-"));
  tempDirs.push(dir);
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

describe("Phase 1.7 FILTER", () => {
  it("filters functions by name and path", async () => {
    const root = await makeTempProject();
    await fs.mkdir(path.join(root, "src", "core"), { recursive: true });
    await fs.writeFile(
      path.join(root, "src", "core", "resolve.js"),
      `export function resolve() {}\nexport function other() {}\n`,
    );
    await fs.writeFile(path.join(root, "src", "util.js"), `export function resolveHelper() {}\n`);
    await initProject(root);
    await indexProject(root, ".");
    const model = await loadModel(root);

    const byName = listEntities(model.graph, "FUNCTION", { name: "resolve" });
    expect(byName.map((n) => n.name).sort()).toEqual(["resolve", "resolveHelper"]);

    const byPath = listEntities(model.graph, "FUNCTION", { path: "src/core" });
    expect(byPath.map((n) => n.name).sort()).toEqual(["other", "resolve"]);

    const files = listFiles(model.index, { path: "src/core" });
    expect(files.map((f) => f.path)).toEqual(["src/core/resolve.js"]);
  });
});

describe("Phase 1.8 SEARCH", () => {
  it("finds candidates without requiring prior selection kind", async () => {
    const root = await makeTempProject();
    await fs.writeFile(
      path.join(root, "a.js"),
      `export function safeParse() {}\nexport class Parser {}\n`,
    );
    await initProject(root);
    await indexProject(root, ".");
    const model = await loadModel(root);

    const hits = searchModel(model.graph, { needle: "parse" });
    expect(hits.some((n) => n.name === "safeParse")).toBe(true);
    expect(hits.some((n) => n.name === "Parser")).toBe(true);

    const funcs = searchEntities(model.graph, { needle: "parse", kind: "FUNCTION" });
    expect(funcs.every((n) => n.kind === "FUNCTION")).toBe(true);
  });

  it("select vs search are distinct primitives", () => {
    const nodes = [
      {
        id: "function:a:foo",
        kind: "FUNCTION" as const,
        name: "foo",
        location: null,
        properties: { path: "a.js" },
      },
      {
        id: "function:b:bar",
        kind: "FUNCTION" as const,
        name: "bar",
        location: null,
        properties: { path: "b.js" },
      },
    ];
    const filtered = selectNodes(nodes, { name: "foo" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("foo");
  });
});

describe("Phase 1.9 includes/excludes", () => {
  it("excludes directories from the indexed universe", async () => {
    const root = await makeTempProject();
    await fs.mkdir(path.join(root, "src"), { recursive: true });
    await fs.mkdir(path.join(root, "fixtures"), { recursive: true });
    await fs.writeFile(path.join(root, "src", "app.js"), `export const a = 1;\n`);
    await fs.writeFile(path.join(root, "fixtures", "sample.js"), `export const f = 1;\n`);
    await initProject(root);
    const indexed = await indexProject(root, ".", { exclude: ["fixtures"] });
    expect(indexed.index.files.map((f) => f.path)).toEqual(["src/app.js"]);
  });

  it("include restricts to matching prefixes", async () => {
    const root = await makeTempProject();
    await fs.mkdir(path.join(root, "src"), { recursive: true });
    await fs.mkdir(path.join(root, "tests"), { recursive: true });
    await fs.writeFile(path.join(root, "src", "app.js"), `export const a = 1;\n`);
    await fs.writeFile(path.join(root, "tests", "app.test.js"), `export const t = 1;\n`);
    await initProject(root);
    const indexed = await indexProject(root, ".", { include: ["src"] });
    expect(indexed.index.files.map((f) => f.path)).toEqual(["src/app.js"]);
  });

  it("exclude packages/docs does not skip packages/zod", async () => {
    const root = await makeTempProject();
    await fs.mkdir(path.join(root, "packages", "docs"), { recursive: true });
    await fs.mkdir(path.join(root, "packages", "zod", "src"), { recursive: true });
    await fs.writeFile(path.join(root, "packages", "docs", "x.js"), `export const d = 1;\n`);
    await fs.writeFile(path.join(root, "packages", "zod", "src", "a.js"), `export const a = 1;\n`);
    await initProject(root);
    const indexed = await indexProject(root, ".", { exclude: ["packages/docs"] });
    expect(indexed.index.files.map((f) => f.path).sort()).toEqual(["packages/zod/src/a.js"]);
  });
});

describe("Phase 2.0 CALLS", () => {
  it("records same-file CALLS and supports callers/calls", async () => {
    const root = await makeTempProject();
    await fs.writeFile(
      path.join(root, "calc.js"),
      `
export function add(a, b) { return a + b; }
export function total(xs) {
  let s = 0;
  for (const x of xs) s = add(s, x);
  return s;
}
`,
    );
    await initProject(root);
    await indexProject(root, ".");
    const model = await loadModel(root);

    const callEdges = model.graph.edges.filter(
      (e) => e.kind === "CALLS" && e.properties?.["resolution"] === "RESOLVED",
    );
    expect(callEdges.length).toBeGreaterThanOrEqual(1);

    const callers = exploreCallers(model.graph, "add");
    expect(callers.nodes.some((n) => n.name === "total")).toBe(true);

    const calls = exploreCalls(model.graph, "total");
    expect(calls.nodes.some((n) => n.name === "add")).toBe(true);
  });
});

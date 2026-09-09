import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  exploreChildren,
  exploreDependencies,
  exploreDependents,
  exploreImpact,
  explorePath,
  exploreRelations,
} from "../src/application/explore.js";
import { indexProject } from "../src/application/index-project.js";
import { initProject } from "../src/application/init.js";
import { runCli } from "../src/cli/program.js";

const tempDirs: string[] = [];
const fixturesRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "fixtures");

async function makeTempCopy(fixtureName: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `ffvs-${fixtureName}-`));
  tempDirs.push(dir);
  const source = path.join(fixturesRoot, fixtureName);
  const entries = await fs.readdir(source);
  for (const entry of entries) {
    await fs.copyFile(path.join(source, entry), path.join(dir, entry));
  }
  await initProject(dir, { name: fixtureName });
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

describe("phase 1.5 layered fixture", () => {
  it("supports dependencies, dependents, path, and impact", async () => {
    const root = await makeTempCopy("layered");
    const { readGraph } = await import("../src/adapters/storage/ffvs-store.js");
    const graph = (await readGraph(root))!;

    const deps = exploreDependencies(graph, "Service");
    expect(deps.nodes.some((n) => n.name === "Repository.js" || n.path === "Repository.js")).toBe(
      true,
    );

    const dependents = exploreDependents(graph, "Repository");
    expect(dependents.nodes.some((n) => n.name === "Service.js" || n.path === "Service.js")).toBe(
      true,
    );

    const pathResult = explorePath(graph, "Controller", "Database");
    expect(pathResult.found).toBe(true);
    expect(pathResult.nodes.length).toBeGreaterThanOrEqual(3);

    const impact = exploreImpact(graph, "Database");
    expect(impact.affected.length).toBeGreaterThanOrEqual(3);
    expect(impact.affected.some((a) => a.path === "Controller.js")).toBe(true);

    const children = exploreChildren(graph, "Controller");
    expect(children.nodes.some((n) => n.kind === "METHOD")).toBe(true);

    const relations = exploreRelations(graph, "Service", ["IMPORTS"]);
    expect(relations.relations.length).toBeGreaterThan(0);
    expect(relations.relations.every((r) => r.from && r.to && r.kind)).toBe(true);
  });
});

describe("phase 1.5 topologies", () => {
  it("handles diamond imports", async () => {
    const root = await makeTempCopy("diamond");
    const { readGraph } = await import("../src/adapters/storage/ffvs-store.js");
    const graph = (await readGraph(root))!;
    const pathResult = explorePath(graph, "d", "a");
    expect(pathResult.found).toBe(true);
    const impact = exploreImpact(graph, "a");
    expect(impact.affected.map((a) => a.path).sort()).toEqual(["b.js", "c.js", "d.js"]);
  });

  it("handles cycles without hanging", async () => {
    const root = await makeTempCopy("cycle");
    const { readGraph } = await import("../src/adapters/storage/ffvs-store.js");
    const graph = (await readGraph(root))!;
    const deps = exploreDependencies(graph, "alpha");
    expect(deps.nodes.some((n) => n.path === "beta.js")).toBe(true);
    const impact = exploreImpact(graph, "alpha");
    expect(impact.affected.some((a) => a.path === "beta.js")).toBe(true);
  });

  it("handles isolated modules", async () => {
    const root = await makeTempCopy("isolated");
    const { readGraph } = await import("../src/adapters/storage/ffvs-store.js");
    const graph = (await readGraph(root))!;
    expect(exploreDependents(graph, "lonely").relations).toHaveLength(0);
    expect(exploreImpact(graph, "lonely").affected).toHaveLength(0);
  });

  it("captures inheritance edges", async () => {
    const root = await makeTempCopy("inheritance");
    const { readGraph } = await import("../src/adapters/storage/ffvs-store.js");
    const graph = (await readGraph(root))!;
    const rels = exploreRelations(graph, "Dog", ["EXTENDS"]);
    expect(rels.relations.some((r) => r.kind === "EXTENDS")).toBe(true);
  });
});

describe("phase 1.5 CLI", () => {
  it("emits consistent JSON for navigation commands", async () => {
    const root = await makeTempCopy("layered");
    const previous = process.cwd();
    process.chdir(root);
    const logs: string[] = [];
    const original = console.log;
    console.log = (message?: unknown) => {
      logs.push(String(message ?? ""));
    };
    try {
      expect(await runCli(["node", "ffvs", "dependencies", "Controller", "--json"])).toBe(0);
      const deps = JSON.parse(logs.join("\n")) as {
        operation: string;
        entity: { id: string };
        relations: unknown[];
      };
      expect(deps.operation).toBe("dependencies");
      expect(deps.entity.id).toContain("module:");

      logs.length = 0;
      expect(await runCli(["node", "ffvs", "path", "Controller", "Database", "--json"])).toBe(0);
      const pathJson = JSON.parse(logs.join("\n")) as { operation: string; found: boolean };
      expect(pathJson.operation).toBe("path");
      expect(pathJson.found).toBe(true);

      logs.length = 0;
      expect(await runCli(["node", "ffvs", "impact", "Database", "--json"])).toBe(0);
      const impact = JSON.parse(logs.join("\n")) as {
        operation: string;
        affected: unknown[];
      };
      expect(impact.operation).toBe("impact");
      expect(impact.affected.length).toBeGreaterThan(0);

      logs.length = 0;
      expect(await runCli(["node", "ffvs", "deps", "Service"])).toBe(0);
      expect(logs.join("\n").toLowerCase()).toContain("dependencies");
    } finally {
      console.log = original;
      process.chdir(previous);
    }
  });
});

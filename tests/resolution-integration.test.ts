import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { getDiagnostics } from "../src/application/diagnostics.js";
import {
  exploreDependents,
  exploreImpact,
  explorePath,
  resolveEntity,
} from "../src/application/explore.js";
import { indexProject } from "../src/application/index-project.js";
import { initProject } from "../src/application/init.js";
import { getStatus } from "../src/application/status.js";
import { readGraph } from "../src/adapters/storage/ffvs-store.js";

const tempDirs: string[] = [];
const fixturesRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "fixtures");

async function makeTempCopy(fixtureName: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `ffvs-res-${fixtureName}-`));
  tempDirs.push(dir);
  await copyRecursive(path.join(fixturesRoot, fixtureName), dir);
  await initProject(dir, { name: fixtureName });
  await indexProject(dir, ".");
  return dir;
}

async function copyRecursive(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyRecursive(from, to);
    } else {
      await fs.copyFile(from, to);
    }
  }
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }
});

describe("Phase 1.6 resolution fixtures", () => {
  it("resolves extensionless CJS and supports path→module preference", async () => {
    const root = await makeTempCopy("resolution-cjs");
    const graph = (await readGraph(root))!;
    const edge = graph.edges.find(
      (e) => e.kind === "IMPORTS" && e.properties?.["specifier"] === "./common",
    );
    expect(edge?.properties?.["resolution"]).toBe("RESOLVED");
    expect(edge?.to).toBe("module:common.js");

    const entity = resolveEntity(graph, "common.js");
    expect(entity.kind).toBe("MODULE");

    const dependents = exploreDependents(graph, "common.js");
    expect(dependents.nodes.some((n) => n.path === "entry.js")).toBe(true);
  });

  it("resolves TS ESM .js→.ts and directory index", async () => {
    const root = await makeTempCopy("resolution-ts-esm");
    const graph = (await readGraph(root))!;
    const schemas = graph.edges.find(
      (e) => e.kind === "IMPORTS" && e.properties?.["specifier"] === "./schemas.js",
    );
    expect(schemas?.properties?.["resolution"]).toBe("RESOLVED");
    expect(schemas?.to).toBe("module:schemas.ts");

    const lib = graph.edges.find(
      (e) => e.kind === "IMPORTS" && e.properties?.["specifier"] === "./lib/index.js",
    );
    expect(lib?.properties?.["resolution"]).toBe("RESOLVED");
    expect(lib?.to).toBe("module:lib/index.ts");

    const pathResult = explorePath(graph, "main.ts", "schemas.ts");
    expect(pathResult.found).toBe(true);

    const impact = exploreImpact(graph, "schemas.ts");
    expect(impact.affected.some((a) => a.path === "main.ts")).toBe(true);

    const status = await getStatus(root);
    expect(status.resolution?.resolvedInternal).toBeGreaterThanOrEqual(2);
    expect(status.resolution?.internalResolutionRate).toBe(1);
  });

  it("separates EXTERNAL and UNRESOLVED", async () => {
    const root = await makeTempCopy("resolution-mixed");
    const graph = (await readGraph(root))!;
    const missing = graph.edges.find(
      (e) => e.kind === "IMPORTS" && e.properties?.["specifier"] === "./nope.js",
    );
    expect(missing?.properties?.["resolution"]).toBe("UNRESOLVED");
    expect(missing?.properties?.["external"]).not.toBe(true);

    const fsEdge = graph.edges.find(
      (e) => e.kind === "IMPORTS" && e.properties?.["specifier"] === "fs",
    );
    expect(fsEdge?.properties?.["resolution"]).toBe("EXTERNAL");

    const diag = await getDiagnostics(root);
    expect(diag.counts.unresolved).toBeGreaterThanOrEqual(1);
    expect(diag.unresolved.some((u) => u.specifier === "./nope.js")).toBe(true);
  });
});

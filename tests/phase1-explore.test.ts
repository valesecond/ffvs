import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { indexProject } from "../src/application/index-project.js";
import { initProject } from "../src/application/init.js";
import {
  inspectEntity,
  listEntities,
  listImports,
  loadModel,
  summarizeProject,
} from "../src/application/explore.js";
import { runCli } from "../src/cli/program.js";
import { extractFromJavaScript } from "../src/languages/javascript/extract.js";

const tempDirs: string[] = [];
const fixturesRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "basic-project",
);

async function makeTempProject(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ffvs-phase1-"));
  tempDirs.push(dir);
  return dir;
}

async function copyFixture(target: string): Promise<void> {
  const entries = await fs.readdir(fixturesRoot);
  for (const entry of entries) {
    await fs.copyFile(path.join(fixturesRoot, entry), path.join(target, entry));
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

describe("extractFromJavaScript", () => {
  it("extracts class, methods, and imports", () => {
    const source = `
      import { Repo } from './Repo.js';
      export class UserService {
        create() {}
        delete() {}
      }
      export function helper() {}
    `;
    const result = extractFromJavaScript(source, "UserService.js");
    expect(result.parseError).toBeUndefined();
    expect(result.entities.some((e) => e.kind === "CLASS" && e.name === "UserService")).toBe(true);
    expect(
      result.entities
        .filter((e) => e.kind === "METHOD")
        .map((e) => e.name)
        .sort(),
    ).toEqual(["create", "delete"]);
    expect(result.entities.some((e) => e.kind === "FUNCTION" && e.name === "helper")).toBe(true);
    expect(result.imports[0]?.specifier).toBe("./Repo.js");
    expect(result.relations.some((r) => r.kind === "EXPORTS")).toBe(true);
  });
});

describe("phase1 indexing and inspect", () => {
  it("builds a semantic graph for the basic fixture", async () => {
    const root = await makeTempProject();
    await copyFixture(root);
    await initProject(root, { name: "basic" });
    const indexed = await indexProject(root, ".");

    expect(indexed.index.version).toBe(2);
    expect(indexed.graph.version).toBe(2);
    expect(indexed.index.entities.some((e) => e.kind === "CLASS" && e.count >= 3)).toBe(true);
    expect(indexed.graph.edges.some((e) => e.kind === "IMPORTS")).toBe(true);
    expect(indexed.graph.nodes.some((n) => n.kind === "METHOD" && n.name === "create")).toBe(true);

    const model = await loadModel(root);
    const classes = listEntities(model.graph, "CLASS").map((c) => c.name);
    expect(classes).toContain("UserService");
    expect(classes).toContain("UserController");

    const view = inspectEntity(model.graph, "UserService");
    expect(view.entity.kind).toBe("CLASS");
    expect(view.methods.map((m) => m.name).sort()).toEqual([
      "constructor",
      "create",
      "delete",
      "update",
    ]);
    expect(view.imports.some((i) => String(i.specifier).includes("UserRepository"))).toBe(true);
    expect(view.usedBy.some((n) => (n.properties["path"] as string)?.includes("index.js"))).toBe(
      true,
    );

    const imports = listImports(model.graph);
    expect(imports.some((i) => i.specifier === "./UserService.js")).toBe(true);

    const summary = await summarizeProject(root);
    expect(summary.files).toBe(5);
  });
});

describe("CLI explore commands", () => {
  it("supports inspect and --json", async () => {
    const root = await makeTempProject();
    await copyFixture(root);
    const previous = process.cwd();
    process.chdir(root);

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (message?: unknown) => {
      logs.push(String(message ?? ""));
    };

    try {
      expect(await runCli(["node", "ffvs", "init", "--name", "cli-basic"])).toBe(0);
      expect(await runCli(["node", "ffvs", "index", "."])).toBe(0);
      logs.length = 0;
      expect(await runCli(["node", "ffvs", "inspect", "UserService"])).toBe(0);
      const text = logs.join("\n");
      expect(text).toContain("UserService");
      expect(text).toContain("Type: Class");
      expect(text).toContain("Methods");
      expect(text).toContain("create()");
      expect(text).toContain("Used by");

      logs.length = 0;
      expect(await runCli(["node", "ffvs", "functions", "--json"])).toBe(0);
      const parsed = JSON.parse(logs.join("\n")) as unknown[];
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.some((item) => (item as { name?: string }).name === "boot")).toBe(true);

      expect(await runCli(["node", "ffvs", "classes"])).toBe(0);
      expect(await runCli(["node", "ffvs", "files"])).toBe(0);
      expect(await runCli(["node", "ffvs", "imports"])).toBe(0);
      expect(await runCli(["node", "ffvs", "graph", "UserService"])).toBe(0);
      expect(await runCli(["node", "ffvs", "inspect"])).toBe(0);
    } finally {
      console.log = originalLog;
      process.chdir(previous);
    }
  });
});

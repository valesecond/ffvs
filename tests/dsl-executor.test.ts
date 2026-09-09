import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { indexProject } from "../src/application/index-project.js";
import { initProject } from "../src/application/init.js";
import { formatQueryResult, runQuery } from "../src/application/query.js";
import { runCli } from "../src/cli/program.js";
import { LanguageError } from "../src/core/language/index.js";

const tempDirs: string[] = [];

async function makeProject(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ffvs-dsl-"));
  tempDirs.push(dir);
  await fs.mkdir(path.join(dir, "src", "core"), { recursive: true });
  await fs.writeFile(
    path.join(dir, "src", "core", "resolve.js"),
    `
export function resolve(x) { return x; }
export function helper() { return resolve(1); }
export class UserService {}
export class UserAdmin extends UserService {}
`,
  );
  await fs.writeFile(
    path.join(dir, "src", "app.js"),
    `import { resolve } from './core/resolve.js';\nexport function run() { return resolve(2); }\n`,
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

describe("DSL executor", () => {
  it("select + where + describe", async () => {
    const root = await makeProject();
    const ran = await runQuery(
      root,
      'select functions where name contains "resolve" describe',
    );
    expect(ran.result.entities.some((e) => e.name === "resolve")).toBe(true);
    expect(ran.result.descriptions?.length).toBeGreaterThan(0);
    expect(ran.json.languageVersion).toBe("0.1");
  });

  it("select + where + traverse callers", async () => {
    const root = await makeProject();
    const ran = await runQuery(
      root,
      'select functions where name = "resolve" traverse callers describe',
    );
    expect(ran.result.entities.some((e) => e.name === "helper" || e.name === "run")).toBe(true);
    expect(ran.result.relations.every((e) => e.kind === "CALLS")).toBe(true);
    expect(ran.result.diagnostics.resolutionCounts).toBeDefined();
  });

  it("search + describe", async () => {
    const root = await makeProject();
    const ran = await runQuery(root, 'search "User" kind class describe');
    expect(ran.result.entities.every((e) => e.kind === "CLASS")).toBe(true);
    expect(ran.result.entities.length).toBeGreaterThan(0);
  });

  it("traverse extends", async () => {
    const root = await makeProject();
    const ran = await runQuery(
      root,
      'select classes where name contains "UserAdmin" traverse extends describe',
    );
    expect(ran.result.entities.some((e) => e.name === "UserService")).toBe(true);
  });

  it("traverse dependencies on modules", async () => {
    const root = await makeProject();
    const ran = await runQuery(
      root,
      'select modules where path contains "src/app" traverse dependencies describe',
    );
    expect(ran.result.entities.some((e) => String(e.properties["path"]).includes("resolve"))).toBe(
      true,
    );
  });

  it("preserves CALLS resolution metadata", async () => {
    const root = await makeProject();
    const ran = await runQuery(root, 'select functions where name = "helper" traverse calls');
    expect(ran.result.relations.length).toBeGreaterThan(0);
    for (const edge of ran.result.relations) {
      expect(edge.properties?.["resolution"]).toBeTruthy();
    }
  });

  it("semantic error when where without select", async () => {
    const root = await makeProject();
    await expect(runQuery(root, 'where name contains "x"')).rejects.toBeInstanceOf(LanguageError);
  });
});

describe("DSL CLI", () => {
  it("ffvs query works with --json", async () => {
    const root = await makeProject();
    const cwd = process.cwd();
    process.chdir(root);
    const chunks: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      chunks.push(args.map(String).join(" "));
    };

    try {
      const code = await runCli([
        "node",
        "ffvs",
        "query",
        'select files where path contains "resolve" describe',
        "--json",
      ]);
      expect(code).toBe(0);
      const payload = JSON.parse(chunks.join("\n")) as { entities: unknown[] };
      expect(payload.entities.length).toBeGreaterThan(0);
    } finally {
      console.log = originalLog;
      process.chdir(cwd);
    }
  });

  it("formatQueryResult is readable", async () => {
    const root = await makeProject();
    const ran = await runQuery(root, 'search "resolve" describe');
    const text = formatQueryResult(ran.result);
    expect(text).toContain("FFVS Query Language");
    expect(text).toContain("Describe");
  });
});

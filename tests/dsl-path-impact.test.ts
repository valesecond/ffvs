import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { indexProject } from "../src/application/index-project.js";
import { initProject } from "../src/application/init.js";
import { runQuery } from "../src/application/query.js";
import { LanguageError, parse } from "../src/core/language/index.js";

const tempDirs: string[] = [];

async function copyFixture(name: string): Promise<string> {
  const src = path.join(process.cwd(), "fixtures", name);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `ffvs-${name}-`));
  tempDirs.push(dir);
  await fs.cp(src, dir, { recursive: true });
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

describe("DSL PATH", () => {
  it("parses path forms", () => {
    expect(parse('path "A" "B"').stages[0]).toMatchObject({
      type: "path",
      from: "A",
      to: "B",
      along: "imports",
    });
    expect(
      parse('select modules path to "B" along imports').stages.some((s) => s.type === "path"),
    ).toBe(true);
    expect(parse('select modules where name = "A" path "B"').stages.map((s) => s.type)).toEqual([
      "select",
      "where",
      "path",
    ]);
  });

  it("select → path finds layered Controller → Database", async () => {
    const root = await copyFixture("layered");
    const ran = await runQuery(
      root,
      'select modules where name = "Controller.js" path "Database.js" describe',
    );
    expect(ran.result.paths?.[0]?.found).toBe(true);
    expect(ran.result.entities.length).toBeGreaterThan(1);
    expect(ran.result.entities[0]?.name).toBe("Controller.js");
    expect(ran.result.entities.at(-1)?.name).toBe("Database.js");
    expect(ran.json.paths?.[0]?.found).toBe(true);
  });

  it("path seed form works", async () => {
    const root = await copyFixture("layered");
    const ran = await runQuery(root, 'path "Controller.js" "Database.js"');
    expect(ran.result.paths?.[0]?.found).toBe(true);
    expect(ran.result.paths?.[0]?.length).toBeGreaterThan(0);
  });

  it("no path yields empty entities with found=false", async () => {
    const root = await copyFixture("isolated");
    const ran = await runQuery(root, 'path "lonely.js" "lonely.js"');
    // same node is found with length 0
    expect(ran.result.paths?.[0]?.found).toBe(true);
    expect(ran.result.paths?.[0]?.length).toBe(0);

    const root2 = await copyFixture("layered");
    const miss = await runQuery(root2, 'path "Database.js" "Controller.js"');
    // reverse may or may not exist depending on edge direction — IMPORTS are directed
    expect(miss.result.paths?.[0]?.found).toBe(false);
    expect(miss.result.entities).toEqual([]);
  });

  it("ambiguous source is a semantic error", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ffvs-amb-"));
    tempDirs.push(dir);
    await fs.writeFile(path.join(dir, "a.js"), `export function twin() {}\n`);
    await fs.writeFile(path.join(dir, "b.js"), `export function twin() {}\n`);
    await initProject(dir);
    await indexProject(dir, ".");
    await expect(runQuery(dir, 'path "twin" "a.js"')).rejects.toBeInstanceOf(LanguageError);
  });

  it("cycles terminate for path", async () => {
    const root = await copyFixture("cycle");
    const ran = await runQuery(root, 'path "alpha.js" "beta.js"');
    expect(ran.result.paths?.[0]?.found).toBe(true);
    const again = await runQuery(root, 'path "alpha.js" "beta.js"');
    expect(again.json).toEqual(ran.json);
  });

  it("path is deterministic across 10 runs", async () => {
    const root = await copyFixture("layered");
    const q = 'select modules where name = "Controller.js" path to "Database.js" describe';
    const first = JSON.stringify((await runQuery(root, q)).json);
    for (let i = 0; i < 9; i++) {
      expect(JSON.stringify((await runQuery(root, q)).json)).toBe(first);
    }
  });
});

describe("DSL IMPACT", () => {
  it("parses impact", () => {
    expect(parse("select modules impact describe").stages.map((s) => s.type)).toEqual([
      "select",
      "impact",
      "describe",
    ]);
  });

  it("select → impact on Database includes upstream modules", async () => {
    const root = await copyFixture("layered");
    const ran = await runQuery(root, 'select modules where name = "Database.js" impact describe');
    expect(ran.result.impact?.affectedCount).toBeGreaterThan(0);
    expect(ran.result.entities.some((e) => e.name === "Database.js")).toBe(false);
    expect(
      ran.result.entities.some(
        (e) =>
          String(e.name).includes("Repository") ||
          String(e.name).includes("Service") ||
          String(e.name).includes("Controller"),
      ),
    ).toBe(true);
  });

  it("diamond impact dedupes", async () => {
    const root = await copyFixture("diamond");
    const ran = await runQuery(root, 'select modules where name = "d.js" impact');
    const ids = ran.result.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cycle impact terminates and is deterministic", async () => {
    const root = await copyFixture("cycle");
    const q = 'select modules where name = "alpha.js" impact describe';
    const a = await runQuery(root, q);
    const b = await runQuery(root, q);
    expect(a.json).toEqual(b.json);
  });

  it("impact on empty set yields empty", async () => {
    const root = await copyFixture("layered");
    const ran = await runQuery(root, 'select modules where name = "doesNotExist" impact describe');
    expect(ran.result.entities).toEqual([]);
    expect(ran.result.impact?.affectedCount).toBe(0);
  });
});

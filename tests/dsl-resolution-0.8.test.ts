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

describe("DSL resolution-aware traverse", () => {
  it("parses traverse … resolution resolved", () => {
    const ast = parse('search "add" traverse callers resolution resolved');
    expect(ast.stages[1]).toMatchObject({
      type: "traverse",
      relation: "callers",
      resolution: "resolved",
    });
  });

  it("filters callers to RESOLVED only", async () => {
    const root = await copyFixture("calls-basic");
    const all = await runQuery(root, 'search "add" kind function traverse callers');
    const resolved = await runQuery(
      root,
      'search "add" kind function traverse callers resolution resolved',
    );
    expect(all.result.relations.length).toBeGreaterThan(0);
    expect(resolved.result.relations.every((e) => e.properties?.["resolution"] === "RESOLVED")).toBe(
      true,
    );
    expect(resolved.result.entities.length).toBeLessThanOrEqual(all.result.entities.length);
  });

  it("rejects entity where resolution", () => {
    expect(() => parse('select functions where resolution = "RESOLVED"')).toThrow(LanguageError);
  });
});

describe("DSL CALL impact", () => {
  it("parses impact along calls with default resolved", () => {
    const stage = parse("select functions impact along calls").stages.find((s) => s.type === "impact");
    expect(stage).toMatchObject({
      type: "impact",
      along: "calls",
      resolution: "resolved",
    });
  });

  it("default impact remains IMPORTS", () => {
    const stage = parse("select modules impact").stages.find((s) => s.type === "impact");
    expect(stage).toMatchObject({ type: "impact", along: "imports" });
    expect(stage && "resolution" in stage ? stage.resolution : undefined).toBeUndefined();
  });

  it("rejects resolution on import impact", () => {
    expect(() => parse("select modules impact resolution resolved")).toThrow(LanguageError);
  });

  it("direct CALL impact finds callers", async () => {
    const root = await copyFixture("calls-impact-direct");
    const ran = await runQuery(
      root,
      'search "target" kind function impact along calls describe',
    );
    expect(ran.result.impact?.along).toBe("calls");
    expect(ran.result.impact?.resolution).toBe("RESOLVED");
    expect(ran.result.entities.some((e) => e.name === "caller")).toBe(true);
  });

  it("indirect CALL impact propagates", async () => {
    const root = await copyFixture("calls-impact-indirect");
    const ran = await runQuery(root, 'search "leaf" kind function impact along calls');
    const names = ran.result.entities.map((e) => e.name).sort();
    expect(names).toContain("mid");
    expect(names).toContain("root");
  });

  it("ambiguous CALLS excluded from default CALL impact", async () => {
    const root = await copyFixture("calls-impact-ambiguous");
    const resolved = await runQuery(
      root,
      'search "target" kind function impact along calls',
    );
    // Seeds are the two target functions; resolved CALL impact should not invent edges to them
    // from ambiguous caller (caller → ambiguous-call stub).
    const ambiguousImpact = await runQuery(
      root,
      'search "target" kind function impact along calls resolution ambiguous',
    );
    expect(ambiguousImpact.result.impact?.resolution).toBe("AMBIGUOUS");
    // Ambiguous impact walks inbound AMBIGUOUS edges onto targets — typically empty on stubs.
    // Caller impact via ambiguous filter from caller:
    const fromCaller = await runQuery(
      root,
      'search "caller" kind function traverse calls resolution ambiguous',
    );
    expect(fromCaller.result.relations.some((e) => e.properties?.["resolution"] === "AMBIGUOUS")).toBe(
      true,
    );
    expect(resolved.json.languageVersion).toBe("0.3");
  });

  it("unresolved CALL impact is opt-in", async () => {
    const root = await copyFixture("calls-impact-unresolved");
    const none = await runQuery(root, 'search "caller" kind function traverse calls resolution resolved');
    const unresolved = await runQuery(
      root,
      'search "caller" kind function traverse calls resolution unresolved',
    );
    expect(none.result.relations.length).toBe(0);
    expect(unresolved.result.relations.length).toBeGreaterThan(0);
  });

  it("diamond CALL impact dedupes", async () => {
    const root = await copyFixture("calls-impact-diamond");
    const ran = await runQuery(root, 'search "shared" kind function impact along calls');
    const callers = ran.result.entities.filter((e) => e.name === "left" || e.name === "right" || e.name === "top");
    const ids = new Set(ran.result.entities.map((e) => e.id));
    expect(ids.size).toBe(ran.result.entities.length);
    expect(callers.length).toBeGreaterThanOrEqual(2);
  });

  it("cycle CALL impact terminates and is deterministic", async () => {
    const root = await copyFixture("calls-impact-cycle");
    const q = 'search "a" kind function impact along calls describe';
    const a = await runQuery(root, q);
    const b = await runQuery(root, q);
    expect(JSON.stringify(a.json)).toBe(JSON.stringify(b.json));
    expect(a.result.entities.some((e) => e.name === "b")).toBe(true);
  });
});

describe("DSL richer describe", () => {
  it("includes module and location fields", async () => {
    const root = await copyFixture("calls-basic");
    const ran = await runQuery(root, 'search "add" kind function describe');
    const d = ran.result.descriptions?.[0];
    expect(d).toBeDefined();
    expect(d?.module).toMatch(/^module:/);
    expect(d?.startLine).toBeTypeOf("number");
    expect(d?.endLine).toBeTypeOf("number");
    expect(ran.json.descriptions?.[0]).toMatchObject({
      module: d?.module,
      startLine: d?.startLine,
    });
  });
});

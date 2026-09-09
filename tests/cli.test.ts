import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { indexProject } from "../src/application/index-project.js";
import { initProject } from "../src/application/init.js";
import { getStatus } from "../src/application/status.js";
import { runCli } from "../src/cli/program.js";
import { StateError } from "../src/core/domain/errors.js";

const tempDirs: string[] = [];

async function makeTempProject(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ffvs-test-"));
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

describe("initProject", () => {
  it("creates .ffvs/config.json", async () => {
    const root = await makeTempProject();
    const result = await initProject(root, { name: "demo" });

    expect(result.config.name).toBe("demo");
    const raw = await fs.readFile(path.join(root, ".ffvs", "config.json"), "utf8");
    const config = JSON.parse(raw) as { version: number; name: string };
    expect(config.version).toBe(1);
    expect(config.name).toBe("demo");
  });

  it("fails if already initialized without force", async () => {
    const root = await makeTempProject();
    await initProject(root);
    await expect(initProject(root)).rejects.toBeInstanceOf(StateError);
  });

  it("allows reinit with force", async () => {
    const root = await makeTempProject();
    await initProject(root, { name: "a" });
    const again = await initProject(root, { force: true, name: "b" });
    expect(again.config.name).toBe("b");
  });
});

describe("indexProject + getStatus", () => {
  it("indexes files and builds graph relations", async () => {
    const root = await makeTempProject();
    await fs.writeFile(
      path.join(root, "a.js"),
      `import { b } from './b.js';\nexport const a = b;\n`,
      "utf8",
    );
    await fs.writeFile(path.join(root, "b.js"), `export const b = 1;\n`, "utf8");
    await fs.writeFile(path.join(root, "readme.md"), "# demo\n", "utf8");
    await fs.mkdir(path.join(root, "node_modules", "pkg"), { recursive: true });
    await fs.writeFile(path.join(root, "node_modules", "pkg", "index.js"), "module.exports=1\n");

    await initProject(root);
    const indexed = await indexProject(root, ".");

    expect(indexed.index.files.map((f) => f.path).sort()).toEqual(["a.js", "b.js", "readme.md"]);
    expect(indexed.index.languages.some((l) => l.language === "javascript")).toBe(true);

    const importEdges = indexed.graph.edges.filter(
      (e) => e.kind === "IMPORTS" && e.properties?.["external"] !== true,
    );
    expect(importEdges.length).toBe(1);
    expect(importEdges[0]?.from).toBe("module:a.js");
    expect(importEdges[0]?.to).toBe("module:b.js");

    const status = await getStatus(root);
    expect(status.config.lastIndexedAt).toBeTruthy();
    expect(status.index?.files.length).toBe(3);
    expect(status.importEdgeCount).toBe(1);
  });

  it("requires init before index", async () => {
    const root = await makeTempProject();
    await expect(indexProject(root, ".")).rejects.toBeInstanceOf(StateError);
  });
});

describe("CLI", () => {
  it("prints help", async () => {
    const chunks: string[] = [];
    const originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((
      chunk: string | Uint8Array,
      encoding?: BufferEncoding | ((err?: Error | null) => void),
      cb?: (err?: Error | null) => void,
    ) => {
      chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
      if (typeof encoding === "function") {
        encoding(null);
        return true;
      }
      if (cb) {
        cb(null);
      }
      return true;
    }) as typeof process.stdout.write;

    try {
      const code = await runCli(["node", "ffvs", "--help"]);
      expect(code).toBe(0);
      const text = chunks.join("");
      expect(text).toContain("init");
      expect(text).toContain("index");
      expect(text).toContain("status");
      expect(text).toContain("inspect");
      expect(text).toContain("functions");
    } finally {
      process.stdout.write = originalWrite;
    }
  });

  it("runs init/index/status end-to-end via application layer paths", async () => {
    const root = await makeTempProject();
    await fs.writeFile(path.join(root, "main.ts"), `export const x = 1;\n`, "utf8");
    const previous = process.cwd();
    process.chdir(root);
    try {
      expect(await runCli(["node", "ffvs", "init", "--name", "cli-demo"])).toBe(0);
      expect(await runCli(["node", "ffvs", "index", "."])).toBe(0);
      expect(await runCli(["node", "ffvs", "status"])).toBe(0);
    } finally {
      process.chdir(previous);
    }
  });
});

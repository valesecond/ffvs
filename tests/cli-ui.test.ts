import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { renderStatus } from "../src/cli/ui/status.js";
import { renderPath } from "../src/cli/ui/path.js";
import { renderNeighborhood } from "../src/cli/ui/neighborhood.js";
import { renderSplashBrand } from "../src/cli/ui/logo.js";
import { renderEntityList } from "../src/cli/ui/entity.js";
import { printJson } from "../src/cli/ui/json.js";
import { setCapsForTests, detectTerminal } from "../src/cli/ui/terminal.js";
import { theme } from "../src/cli/ui/theme.js";
import type { StatusResult } from "../src/application/status.js";
import type { NeighborhoodResult, PathExploreResult } from "../src/application/views.js";
import type { GraphNode } from "../src/core/domain/types.js";

const baseCaps = detectTerminal();
const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
function hasAnsi(text: string): boolean {
  ANSI_RE.lastIndex = 0;
  return ANSI_RE.test(text);
}

beforeEach(() => {
  setCapsForTests({
    ...baseCaps,
    color: false,
    unicode: false,
    animate: false,
    isTty: false,
    ci: true,
    columns: 80,
  });
});

afterEach(() => {
  setCapsForTests(null);
});

describe("CLI UI", () => {
  it("printJson emits pure JSON without decoration", () => {
    const lines: string[] = [];
    const original = console.log;
    console.log = (msg?: unknown) => {
      lines.push(String(msg));
    };
    try {
      printJson({ ok: true, n: 1 });
    } finally {
      console.log = original;
    }
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('{\n  "ok": true,\n  "n": 1\n}');
    expect(hasAnsi(lines[0]!)).toBe(false);
  });

  it("theme emits no ANSI when color disabled", () => {
    expect(theme.title("FFVS")).toBe("FFVS");
    expect(hasAnsi(theme.title("FFVS"))).toBe(false);
  });

  it("status panel is structured without color codes", () => {
    const status: StatusResult = {
      projectRoot: "/tmp/demo",
      initialized: true,
      config: {
        version: 1,
        name: "demo",
        createdAt: "2026-01-01T00:00:00.000Z",
        lastIndexedAt: "2026-01-02T00:00:00.000Z",
        indexRoot: ".",
      },
      index: {
        version: 2,
        root: ".",
        indexedAt: "2026-01-02T00:00:00.000Z",
        files: [],
        languages: [],
        entities: [],
        skippedDirectoryNames: [],
        parseErrors: [],
        resolution: {
          importsTotal: 4,
          resolvedInternal: 3,
          external: 1,
          unresolved: 0,
          ambiguous: 0,
          internalResolutionRate: 1,
        },
      },
      graph: { version: 2, nodes: [], edges: [] },
      nodeCounts: { FILE: 2, MODULE: 2, FUNCTION: 5, CLASS: 1 },
      edgeCount: 10,
      importEdgeCount: 4,
      resolution: {
        importsTotal: 4,
        resolvedInternal: 3,
        external: 1,
        unresolved: 0,
        ambiguous: 0,
        internalResolutionRate: 1,
      },
    };
    const text = renderStatus(status);
    expect(text).toContain("STATUS");
    expect(text).toContain("demo");
    expect(text).toContain("Entities");
    expect(text).toContain("Resolution");
    expect(hasAnsi(text)).toBe(false);
  });

  it("splash brand includes FFVS mark", () => {
    const text = renderSplashBrand("1.2.0", "A semantic view of your software");
    expect(text).toContain("FFVS");
    expect(text).toContain("1.2.0");
    expect(text).toContain("semantic");
  });

  it("path not-found is explicit", () => {
    const result: PathExploreResult = {
      operation: "path",
      from: { id: "a", kind: "MODULE", name: "app", path: "app.ts" },
      to: { id: "b", kind: "MODULE", name: "db", path: "db.ts" },
      found: false,
      relationKinds: ["IMPORTS"],
      nodes: [],
      relations: [],
    };
    const text = renderPath(result);
    expect(text.toLowerCase()).toContain("no path");
    expect(text).toContain("app");
    expect(text).toContain("db");
  });

  it("neighborhood shows resolution marks for calls", () => {
    const result: NeighborhoodResult = {
      entity: { id: "f1", kind: "FUNCTION", name: "createUser", path: "a.ts" },
      operation: "calls",
      relationKinds: ["CALLS"],
      relations: [
        {
          id: "e1",
          kind: "CALLS",
          from: { id: "f1", kind: "FUNCTION", name: "createUser", path: "a.ts" },
          to: { id: "f2", kind: "FUNCTION", name: "save", path: "a.ts" },
          properties: { resolution: "RESOLVED" },
        },
        {
          id: "e2",
          kind: "CALLS",
          from: { id: "f1", kind: "FUNCTION", name: "createUser", path: "a.ts" },
          to: { id: "f3", kind: "FUNCTION", name: "emit", path: "a.ts" },
          properties: { resolution: "AMBIGUOUS" },
        },
      ],
      nodes: [],
    };
    const text = renderNeighborhood(result, "Calls");
    expect(text).toContain("CALLS");
    expect(text).toContain("save");
    expect(text).toContain("emit");
    expect(text).toMatch(/resolved/i);
  });

  it("entity list renders premium table columns", () => {
    const nodes: GraphNode[] = [
      {
        id: "function:a:getUser",
        kind: "FUNCTION",
        name: "getUser",
        location: {
          file: "src/services/user.ts",
          startLine: 12,
          startColumn: 1,
          endLine: 20,
          endColumn: 1,
        },
        properties: { path: "src/services/user.ts" },
      },
      {
        id: "function:a:createUser",
        kind: "FUNCTION",
        name: "createUser",
        location: {
          file: "src/services/user.ts",
          startLine: 24,
          startColumn: 1,
          endLine: 40,
          endColumn: 1,
        },
        properties: { path: "src/services/user.ts" },
      },
    ];
    const text = renderEntityList(nodes, "Functions");
    expect(text).toContain("Name");
    expect(text).toContain("Location");
    expect(text).toContain("getUser");
    expect(text).toContain("src/services/user.ts:12");
    expect(text).toContain("2 functions");
    expect(text).toContain("--json");
    expect(text).not.toMatch(/\bf getUser\b/);
  });
});

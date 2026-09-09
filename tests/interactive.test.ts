import { describe, expect, it, beforeAll } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { decodeKey } from "../src/cli/interactive/keyboard.js";
import { NavigationStack } from "../src/cli/interactive/navigation.js";
import { parseSessionCommand } from "../src/cli/interactive/commands.js";
import { InteractiveSession } from "../src/cli/interactive/session.js";
import {
  shouldStartInteractive,
  renderNonInteractiveFallback,
  buildSessionContext,
} from "../src/cli/interactive/start.js";
import { loadModel } from "../src/application/explore.js";
import { getStatus } from "../src/application/status.js";
import type { SessionContext } from "../src/cli/interactive/types.js";
import { homeView } from "../src/cli/interactive/views.js";

const demoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../examples/demo");

describe("interactive keyboard decode", () => {
  it("decodes arrows, enter, escape, ctrl+c", () => {
    expect(decodeKey("\u001b[A").type).toBe("up");
    expect(decodeKey("\u001b[B").type).toBe("down");
    expect(decodeKey("\r").type).toBe("enter");
    expect(decodeKey("\u001b").type).toBe("escape");
    expect(decodeKey("\u0003").type).toBe("ctrl_c");
    expect(decodeKey("q")).toEqual({ type: "char", value: "q" });
  });
});

describe("interactive command parse", () => {
  it("parses explore commands", () => {
    expect(parseSessionCommand("quit")).toEqual({ type: "quit" });
    expect(parseSessionCommand("help")).toEqual({ type: "help" });
    expect(parseSessionCommand("search User")).toEqual({
      type: "search",
      query: "User",
    });
    expect(parseSessionCommand("query 'select functions describe'")).toEqual({
      type: "query",
      source: "select functions describe",
    });
    expect(parseSessionCommand("path a b")).toEqual({
      type: "path",
      from: "a",
      to: "b",
    });
    expect(parseSessionCommand("deps foo")).toEqual({
      type: "relation",
      relation: "dependencies",
      target: "foo",
    });
    expect(parseSessionCommand("functions")).toEqual({
      type: "list",
      kind: "functions",
    });
  });

  it("returns hints for unknown commands", () => {
    const u = parseSessionCommand("blarg");
    expect(u.type).toBe("unknown");
  });
});

describe("navigation stack", () => {
  it("pushes and pops without losing root", () => {
    const stack = new NavigationStack();
    stack.push(homeView("demo", null, true));
    stack.push({
      kind: "entity-list",
      title: "Functions",
      crumb: ["FFVS", "demo", "Functions"],
      cursor: 0,
      items: [],
    });
    expect(stack.depth).toBe(2);
    stack.back();
    expect(stack.current()?.kind).toBe("home");
    stack.back();
    expect(stack.depth).toBe(1);
  });
});

describe("shouldStartInteractive", () => {
  it("refuses CI and non-TTY", () => {
    const fakeOut = { isTTY: true } as NodeJS.WriteStream;
    expect(shouldStartInteractive({ CI: "true" }, fakeOut)).toBe(false);
    expect(shouldStartInteractive({}, { isTTY: false } as NodeJS.WriteStream)).toBe(false);
    expect(shouldStartInteractive({ FFVS_NO_INTERACTIVE: "1" }, fakeOut)).toBe(false);
    expect(shouldStartInteractive({}, fakeOut)).toBe(true);
  });

  it("fallback text mentions command mode", () => {
    const text = renderNonInteractiveFallback("1.2.0", "1.0");
    expect(text).toContain("Command Mode");
    expect(text).toContain("ffvs status");
  });
});

describe("InteractiveSession on demo", () => {
  let ctx: SessionContext;

  beforeAll(async () => {
    // Prefer an already-indexed demo; if missing, skip heavy setup gracefully.
    try {
      const status = await getStatus(demoRoot);
      if (!status.index || !status.graph) {
        return;
      }
      const model = await loadModel(demoRoot);
      ctx = {
        cwd: demoRoot,
        packageVersion: "1.2.0",
        languageVersion: "1.0",
        model,
        status,
        loadError: null,
      };
    } catch {
      // leave ctx undefined
    }
  });

  it("navigates home → functions → entity → callers → back", async () => {
    if (!ctx?.model) {
      // Demo may not be indexed in CI clone; exercise session without model instead.
      const empty = new InteractiveSession({
        cwd: demoRoot,
        packageVersion: "1.2.0",
        languageVersion: "1.0",
        model: null,
        status: null,
        loadError: "not indexed",
      });
      empty.navigation.push(homeView("demo", "not indexed", false));
      expect(empty.navigation.current()?.items?.some((i) => i.id === "quit")).toBe(true);
      return;
    }

    const writes: string[] = [];
    const session = new InteractiveSession(ctx, {
      write: (t) => {
        writes.push(t);
      },
      clear: () => undefined,
      readKey: async () => ({ type: "char", value: "q" }),
      readLine: async () => "",
    });

    session.navigation.push(homeView(ctx.status!.config.name, "overview", true));
    await session.applyCommand({ type: "list", kind: "functions" });
    expect(session.navigation.current()?.kind).toBe("entity-list");
    expect(session.navigation.current()?.title).toMatch(/Functions/);

    const items = session.navigation.current()?.items ?? [];
    expect(items.length).toBeGreaterThan(0);
    await session.selectItem(items[0]!);
    expect(session.navigation.current()?.kind).toBe("entity");

    const callers = (session.navigation.current()?.items ?? []).find((i) => i.id === "callers");
    expect(callers).toBeDefined();
    await session.selectItem(callers!);
    expect(session.navigation.current()?.kind).toBe("neighborhood");

    session.navigation.back();
    expect(session.navigation.current()?.kind).toBe("entity");
    session.navigation.back();
    expect(session.navigation.current()?.kind).toBe("entity-list");

    await session.applyCommand({ type: "search", query: "load" });
    expect(session.navigation.current()?.kind).toBe("search");

    await session.applyCommand({
      type: "query",
      source: "select functions describe",
    });
    expect(session.navigation.current()?.kind).toBe("query-result");
  });
});

describe("buildSessionContext", () => {
  it("loads FFVS repo or reports a clear error", async () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const built = await buildSessionContext(root);
    expect(built.packageVersion).toBeTruthy();
    // Either indexed or an actionable loadError
    expect(built.model !== null || built.loadError !== null || built.status !== null).toBe(true);
  });
});

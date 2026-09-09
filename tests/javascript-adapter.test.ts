import { describe, expect, it } from "vitest";

import { javascriptAdapter } from "../src/languages/javascript/adapter.js";

describe("javascriptAdapter", () => {
  it("matches JS and TS extensions", () => {
    expect(javascriptAdapter.matches("src/a.ts")).toBe(true);
    expect(javascriptAdapter.matches("src/a.js")).toBe(true);
    expect(javascriptAdapter.matches("src/a.py")).toBe(false);
  });

  it("extracts relative imports", () => {
    const source = `
      import x from './x.js';
      const y = require('../y');
      export { z } from "./z.ts";
    `;
    const result = javascriptAdapter.extract!(source, "mod.js");
    const specifiers = result.imports.map((i) => i.specifier).sort();
    expect(specifiers).toEqual(["../y", "./x.js", "./z.ts"]);
  });
});

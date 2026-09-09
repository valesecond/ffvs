import { describe, expect, it } from "vitest";

import {
  internalImportResolutionRate,
  resolveModule,
} from "../src/core/resolver/module-resolver.js";

describe("resolveModule", () => {
  it("resolves CJS extensionless requires", () => {
    const files = new Set(["src/entry.js", "src/common.js"]);
    const result = resolveModule("src/entry.js", "./common", { files });
    expect(result.status).toBe("RESOLVED");
    expect(result.resolvedPath).toBe("src/common.js");
  });

  it("resolves TS ESM .js → .ts substitution", () => {
    const files = new Set(["src/main.ts", "src/schemas.ts"]);
    const result = resolveModule("src/main.ts", "./schemas.js", { files });
    expect(result.status).toBe("RESOLVED");
    expect(result.resolvedPath).toBe("src/schemas.ts");
  });

  it("resolves directory index imports via .js specifier", () => {
    const files = new Set(["src/main.ts", "src/lib/index.ts"]);
    const result = resolveModule("src/main.ts", "./lib/index.js", { files });
    expect(result.status).toBe("RESOLVED");
    expect(result.resolvedPath).toBe("src/lib/index.ts");
  });

  it("resolves extensionless directory to index.ts", () => {
    const files = new Set(["src/main.ts", "src/lib/index.ts"]);
    const result = resolveModule("src/main.ts", "./lib", { files });
    expect(result.status).toBe("RESOLVED");
    expect(result.resolvedPath).toBe("src/lib/index.ts");
  });

  it("marks bare specifiers as EXTERNAL", () => {
    const result = resolveModule("src/main.ts", "fs", { files: new Set(["src/main.ts"]) });
    expect(result.status).toBe("EXTERNAL");
  });

  it("marks missing relative imports as UNRESOLVED (not external)", () => {
    const result = resolveModule("src/main.ts", "./missing.js", {
      files: new Set(["src/main.ts"]),
    });
    expect(result.status).toBe("UNRESOLVED");
    expect(result.candidatesChecked.length).toBeGreaterThan(0);
  });

  it("marks ambiguous same-tier matches", () => {
    const files = new Set(["src/a.ts", "src/foo.ts", "src/foo.tsx"]);
    // After .js substitution tier: both .ts and .tsx are same tier
    const result = resolveModule("src/a.ts", "./foo.js", { files });
    expect(result.status).toBe("AMBIGUOUS");
    expect(result.ambiguousPaths.sort()).toEqual(["src/foo.ts", "src/foo.tsx"]);
  });

  it("computes internal resolution rate excluding EXTERNAL", () => {
    expect(internalImportResolutionRate({ resolved: 8, unresolved: 2, ambiguous: 0 })).toBeCloseTo(
      0.8,
    );
    expect(internalImportResolutionRate({ resolved: 0, unresolved: 0, ambiguous: 0 })).toBeNull();
  });
});

import path from "node:path";

import type { ExtractionResult, LanguageAdapter } from "../types.js";

const EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".mts", ".cts"]);

const IMPORT_FROM =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+|from\s+)['"]([^'"]+)['"]/g;
const DYNAMIC_OR_REQUIRE =
  /(?:import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;

function languageForExtension(ext: string): string {
  if (ext === ".ts" || ext === ".tsx" || ext === ".mts" || ext === ".cts") {
    return "typescript";
  }
  return "javascript";
}

export const javascriptAdapter: LanguageAdapter = {
  id: "javascript",
  displayName: "JavaScript/TypeScript",

  matches(filePath: string): boolean {
    return EXTENSIONS.has(path.extname(filePath).toLowerCase());
  },

  detectLanguage(filePath: string): string {
    return languageForExtension(path.extname(filePath).toLowerCase());
  },

  extract(source: string, _filePath: string): ExtractionResult {
    const imports: ExtractionResult["imports"] = [];
    const seen = new Set<string>();

    for (const match of source.matchAll(IMPORT_FROM)) {
      const specifier = match[1];
      if (!specifier || seen.has(specifier)) {
        continue;
      }
      seen.add(specifier);
      imports.push({ specifier, kind: "esm" });
    }

    for (const match of source.matchAll(DYNAMIC_OR_REQUIRE)) {
      const specifier = match[1] ?? match[2];
      if (!specifier || seen.has(specifier)) {
        continue;
      }
      seen.add(specifier);
      imports.push({ specifier, kind: specifier.startsWith(".") ? "esm" : "cjs" });
    }

    return { imports };
  },
};

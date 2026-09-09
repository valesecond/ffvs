import path from "node:path";

import type { FileExtraction, LanguageAdapter } from "../types.js";
import { extractFromJavaScript } from "./extract.js";

const EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".mts", ".cts"]);

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

  extract(source: string, filePath: string): FileExtraction {
    return extractFromJavaScript(source, filePath);
  },
};

import { parse, type ParserPlugin } from "@babel/parser";
import type { File as BabelFile } from "@babel/types";
import path from "node:path";

export function parseJavaScriptSource(source: string, filePath: string): BabelFile {
  const ext = path.extname(filePath).toLowerCase();
  const isTs = ext === ".ts" || ext === ".tsx" || ext === ".mts" || ext === ".cts";

  const plugins: ParserPlugin[] = ["jsx", "decorators-legacy", "exportDefaultFrom"];

  if (isTs) {
    plugins.push("typescript");
  }

  return parse(source, {
    sourceType: "module",
    sourceFilename: filePath,
    allowAwaitOutsideFunction: true,
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    errorRecovery: false,
    plugins,
  });
}

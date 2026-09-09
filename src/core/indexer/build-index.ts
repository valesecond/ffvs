import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { scanDirectory } from "../../adapters/filesystem/scanner.js";
import { detectLanguage, findAdapter } from "../../languages/registry.js";
import { addEdge, addNode, createGraph } from "../domain/graph.js";
import {
  DEFAULT_SKIP_DIRS,
  type IndexedFile,
  type LanguageStats,
  type ProjectIndex,
  type SemanticGraph,
} from "../domain/types.js";

const TEXT_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".jsx",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".json",
  ".md",
  ".txt",
  ".yml",
  ".yaml",
  ".toml",
  ".css",
  ".html",
  ".py",
  ".rs",
  ".go",
  ".java",
  ".c",
  ".h",
  ".cpp",
  ".hpp",
]);

export interface IndexBuildResult {
  index: ProjectIndex;
  graph: SemanticGraph;
}

export async function buildProjectIndex(rootDir: string): Promise<IndexBuildResult> {
  const resolvedRoot = path.resolve(rootDir);
  const scanned = await scanDirectory({
    rootDir: resolvedRoot,
    skipDirectoryNames: DEFAULT_SKIP_DIRS,
  });

  const files: IndexedFile[] = [];
  const languageCounts = new Map<string, number>();
  const graph = createGraph();
  const projectId = "project:root";

  addNode(graph, {
    id: projectId,
    kind: "project",
    properties: { root: toPosix(resolvedRoot) },
  });

  const fileIds = new Map<string, string>();

  for (const entry of scanned) {
    const language = detectLanguage(entry.relativePath);
    const hash = await hashFile(entry.absolutePath);
    const indexed: IndexedFile = {
      path: entry.relativePath,
      absolutePath: entry.absolutePath,
      language,
      sizeBytes: entry.sizeBytes,
      hash,
      extension: entry.extension,
    };
    files.push(indexed);

    if (language) {
      languageCounts.set(language, (languageCounts.get(language) ?? 0) + 1);
    }

    const fileId = `file:${entry.relativePath}`;
    fileIds.set(entry.relativePath, fileId);
    addNode(graph, {
      id: fileId,
      kind: "file",
      properties: {
        path: entry.relativePath,
        language,
        sizeBytes: entry.sizeBytes,
        hash,
      },
    });
    addEdge(graph, "CONTAINS", projectId, fileId);

    if (language === "javascript" || language === "typescript") {
      const moduleId = `module:${entry.relativePath}`;
      addNode(graph, {
        id: moduleId,
        kind: "module",
        properties: {
          path: entry.relativePath,
          language,
        },
      });
      addEdge(graph, "CONTAINS", fileId, moduleId);
    }
  }

  for (const file of files) {
    if (file.language !== "javascript" && file.language !== "typescript") {
      continue;
    }
    const adapter = findAdapter(file.path);
    if (!adapter?.extract) {
      continue;
    }

    let source: string;
    try {
      source = await fs.readFile(file.absolutePath, "utf8");
    } catch {
      continue;
    }

    const extraction = adapter.extract(source, file.path);
    const fromModule = `module:${file.path}`;

    for (const item of extraction.imports) {
      if (!item.specifier.startsWith(".") && !item.specifier.startsWith("/")) {
        continue;
      }
      const resolved = resolveImportPath(file.path, item.specifier, fileIds);
      if (!resolved) {
        continue;
      }
      addEdge(graph, "IMPORTS", fromModule, `module:${resolved}`, {
        specifier: item.specifier,
      });
    }
  }

  const languages: LanguageStats[] = [...languageCounts.entries()]
    .map(([language, fileCount]) => ({ language, fileCount }))
    .sort((a, b) => a.language.localeCompare(b.language));

  const index: ProjectIndex = {
    version: 1,
    root: toPosix(resolvedRoot),
    indexedAt: new Date().toISOString(),
    files: files.map((file) => ({
      ...file,
      absolutePath: toPosix(file.absolutePath),
    })),
    languages,
    skippedDirectoryNames: [...DEFAULT_SKIP_DIRS].sort(),
  };

  return { index, graph };
}

async function hashFile(absolutePath: string): Promise<string> {
  const ext = path.extname(absolutePath).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) {
    const stat = await fs.stat(absolutePath);
    return crypto.createHash("sha256").update(`bin:${stat.size}:${stat.mtimeMs}`).digest("hex");
  }
  try {
    const content = await fs.readFile(absolutePath);
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch {
    return crypto.createHash("sha256").update(`unreadable:${absolutePath}`).digest("hex");
  }
}

function resolveImportPath(
  fromFile: string,
  specifier: string,
  fileIds: Map<string, string>,
): string | null {
  const fromDir = path.posix.dirname(fromFile);
  const joined = path.posix.normalize(path.posix.join(fromDir, specifier));
  const candidates = [
    joined,
    `${joined}.js`,
    `${joined}.ts`,
    `${joined}.jsx`,
    `${joined}.tsx`,
    `${joined}.mjs`,
    `${joined}.cjs`,
    `${joined}/index.js`,
    `${joined}/index.ts`,
  ];

  for (const candidate of candidates) {
    if (fileIds.has(candidate)) {
      return candidate;
    }
  }
  return null;
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

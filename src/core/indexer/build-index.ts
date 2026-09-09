import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { scanDirectory } from "../../adapters/filesystem/scanner.js";
import { detectLanguage, findAdapter } from "../../languages/registry.js";
import { addEdge, addNode, countByKind, createGraph } from "../domain/graph.js";
import {
  DEFAULT_SKIP_DIRS,
  type EntityKind,
  type EntityStats,
  type IndexedFile,
  type LanguageStats,
  type ProjectIndex,
  type RelationKind,
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
  const parseErrors: Array<{ path: string; message: string }> = [];
  const graph = createGraph();
  const projectId = "project:root";

  addNode(graph, {
    id: projectId,
    kind: "PROJECT",
    name: path.basename(resolvedRoot),
    location: null,
    properties: { root: toPosix(resolvedRoot) },
  });

  const fileIds = new Map<string, string>();
  const moduleIds = new Map<string, string>();
  const pendingNamed: Array<{
    kind: RelationKind;
    from: string;
    toName: string;
    properties?: Record<string, unknown>;
  }> = [];

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
      kind: "FILE",
      name: path.posix.basename(entry.relativePath),
      location: {
        file: entry.relativePath,
        startLine: 1,
        startColumn: 0,
        endLine: 1,
        endColumn: 0,
      },
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
      moduleIds.set(entry.relativePath, moduleId);
      addNode(graph, {
        id: moduleId,
        kind: "MODULE",
        name: path.posix.basename(entry.relativePath),
        location: {
          file: entry.relativePath,
          startLine: 1,
          startColumn: 0,
          endLine: 1,
          endColumn: 0,
        },
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
    if (!adapter) {
      continue;
    }

    let source: string;
    try {
      source = await fs.readFile(file.absolutePath, "utf8");
    } catch {
      continue;
    }

    const extraction = adapter.extract(source, file.path);

    if (extraction.parseError) {
      parseErrors.push({ path: file.path, message: extraction.parseError });
      continue;
    }

    const moduleId = moduleIds.get(file.path);
    if (!moduleId) {
      continue;
    }

    const localToGlobal = new Map<string, string>();
    localToGlobal.set("module:self", moduleId);

    for (const entity of extraction.entities) {
      const globalId = toGlobalId(entity.kind, file.path, entity.localId, entity.name);
      localToGlobal.set(entity.localId, globalId);

      const location = entity.location
        ? { ...entity.location, file: file.path }
        : {
            file: file.path,
            startLine: 1,
            startColumn: 0,
            endLine: 1,
            endColumn: 0,
          };

      addNode(graph, {
        id: globalId,
        kind: entity.kind,
        name: entity.name,
        location,
        properties: {
          ...(entity.properties ?? {}),
          path: file.path,
          exported: entity.exported === true,
          ...(entity.exportNames ? { exportNames: entity.exportNames } : {}),
          ...(entity.parentLocalId ? { parentLocalId: entity.parentLocalId } : {}),
        },
      });
    }

    for (const rel of extraction.relations) {
      const from = localToGlobal.get(rel.fromLocalId);
      if (!from) {
        continue;
      }
      const to = rel.toLocalId ? localToGlobal.get(rel.toLocalId) : undefined;
      if (to) {
        addEdge(graph, rel.kind, from, to, rel.properties);
        continue;
      }
      if (rel.toName) {
        pendingNamed.push({
          kind: rel.kind,
          from,
          toName: rel.toName,
          ...(rel.properties !== undefined ? { properties: rel.properties } : {}),
        });
      }
    }

    for (const item of extraction.imports) {
      const resolved = resolveImportPath(file.path, item.specifier, fileIds);
      if (resolved) {
        const targetModule = moduleIds.get(resolved);
        if (targetModule) {
          addEdge(graph, "IMPORTS", moduleId, targetModule, {
            specifier: item.specifier,
            importKind: item.kind,
            namedImports: item.namedImports,
            ...(item.defaultImport ? { defaultImport: item.defaultImport } : {}),
          });
        }
      } else {
        const externalId = `external:${item.specifier}`;
        if (!graph.nodes.some((n) => n.id === externalId)) {
          addNode(graph, {
            id: externalId,
            kind: "MODULE",
            name: item.specifier,
            location: null,
            properties: { external: true, specifier: item.specifier },
          });
        }
        addEdge(graph, "IMPORTS", moduleId, externalId, {
          specifier: item.specifier,
          importKind: item.kind,
          unresolved: true,
          external: true,
          namedImports: item.namedImports,
        });
      }
    }
  }

  resolveNamedRelations(graph, pendingNamed);

  const languages: LanguageStats[] = [...languageCounts.entries()]
    .map(([language, fileCount]) => ({ language, fileCount }))
    .sort((a, b) => a.language.localeCompare(b.language));

  const kindCounts = countByKind(graph);
  const entities: EntityStats[] = (Object.keys(kindCounts) as EntityKind[])
    .map((kind) => ({ kind, count: kindCounts[kind] ?? 0 }))
    .sort((a, b) => a.kind.localeCompare(b.kind));

  const index: ProjectIndex = {
    version: 2,
    root: toPosix(resolvedRoot),
    indexedAt: new Date().toISOString(),
    files: files.map((file) => ({
      ...file,
      absolutePath: toPosix(file.absolutePath),
    })),
    languages,
    entities,
    skippedDirectoryNames: [...DEFAULT_SKIP_DIRS].sort(),
    parseErrors,
  };

  return { index, graph };
}

function resolveNamedRelations(
  graph: SemanticGraph,
  pending: Array<{
    kind: RelationKind;
    from: string;
    toName: string;
    properties?: Record<string, unknown>;
  }>,
): void {
  const byName = new Map<string, string[]>();
  for (const node of graph.nodes) {
    if (!node.name) {
      continue;
    }
    const list = byName.get(node.name) ?? [];
    list.push(node.id);
    byName.set(node.name, list);
  }

  for (const rel of pending) {
    const candidates = byName.get(rel.toName) ?? [];
    if (candidates.length === 1) {
      const to = candidates[0]!;
      addEdge(graph, rel.kind, rel.from, to, {
        ...(rel.properties ?? {}),
        unresolved: false,
      });
    } else if (candidates.length === 0) {
      // Keep a placeholder external-ish node for visibility of extends/implements names.
      const stubId = `unresolved:${rel.toName}`;
      if (!graph.nodes.some((n) => n.id === stubId)) {
        addNode(graph, {
          id: stubId,
          kind: "CLASS",
          name: rel.toName,
          location: null,
          properties: { unresolved: true },
        });
      }
      addEdge(graph, rel.kind, rel.from, stubId, {
        ...(rel.properties ?? {}),
        unresolved: true,
      });
    }
    // If ambiguous, skip rather than guess.
  }
}

function toGlobalId(
  kind: EntityKind,
  filePath: string,
  localId: string,
  name: string | null,
): string {
  // localId examples: function:createUser, class:UserService, method:UserService.create
  const stripped = localId.replace(/^(function|class|method|variable):/, "");
  if (kind === "METHOD") {
    return `method:${filePath}:${stripped}`;
  }
  if (kind === "FUNCTION") {
    return `function:${filePath}:${stripped}`;
  }
  if (kind === "CLASS") {
    return `class:${filePath}:${stripped}`;
  }
  if (kind === "VARIABLE") {
    return `variable:${filePath}:${stripped}`;
  }
  return `${kind.toLowerCase()}:${filePath}:${name ?? stripped}`;
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
  if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
    return null;
  }
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

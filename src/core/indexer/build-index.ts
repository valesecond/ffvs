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
  type ResolutionStats,
  type SemanticGraph,
} from "../domain/types.js";
import { internalImportResolutionRate, resolveModule } from "../resolver/module-resolver.js";
import type { ModuleResolutionResult } from "../resolver/types.js";

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

export async function buildProjectIndex(
  rootDir: string,
  options: {
    include?: string[];
    exclude?: string[];
  } = {},
): Promise<IndexBuildResult> {
  const resolvedRoot = path.resolve(rootDir);
  const skip = new Set(DEFAULT_SKIP_DIRS);
  for (const name of options.exclude ?? []) {
    const normalized = name.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
    // Only bare directory names go into the directory-name skip set.
    if (normalized && !normalized.includes("/") && !normalized.includes("*")) {
      skip.add(normalized);
    }
  }

  const scanned = await scanDirectory({
    rootDir: resolvedRoot,
    skipDirectoryNames: skip,
    ...(options.exclude !== undefined ? { excludePatterns: options.exclude } : {}),
    ...(options.include !== undefined ? { includePatterns: options.include } : {}),
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
  const filePathSet = new Set<string>();
  const pendingNamed: Array<{
    kind: RelationKind;
    from: string;
    toName: string;
    properties?: Record<string, unknown>;
  }> = [];
  const resolutionCounts = {
    resolved: 0,
    external: 0,
    unresolved: 0,
    ambiguous: 0,
  };

  for (const entry of scanned) {
    filePathSet.add(entry.relativePath);
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
      const resolution = resolveModule(file.path, item.specifier, { files: filePathSet });
      wireImportEdge(graph, moduleId, moduleIds, item, resolution, resolutionCounts);
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

  const resolution: ResolutionStats = {
    importsTotal:
      resolutionCounts.resolved +
      resolutionCounts.external +
      resolutionCounts.unresolved +
      resolutionCounts.ambiguous,
    resolvedInternal: resolutionCounts.resolved,
    external: resolutionCounts.external,
    unresolved: resolutionCounts.unresolved,
    ambiguous: resolutionCounts.ambiguous,
    internalResolutionRate: internalImportResolutionRate(resolutionCounts),
  };

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
    skippedDirectoryNames: [...skip].sort(),
    parseErrors,
    resolution,
  };

  return { index, graph };
}

function wireImportEdge(
  graph: SemanticGraph,
  fromModuleId: string,
  moduleIds: Map<string, string>,
  item: {
    specifier: string;
    kind: "esm" | "cjs";
    namedImports: string[];
    defaultImport?: string;
  },
  resolution: ModuleResolutionResult,
  counts: { resolved: number; external: number; unresolved: number; ambiguous: number },
): void {
  const baseProps: Record<string, unknown> = {
    specifier: item.specifier,
    importKind: item.kind,
    namedImports: item.namedImports,
    resolution: resolution.status,
    candidatesChecked: resolution.candidatesChecked,
    ...(item.defaultImport ? { defaultImport: item.defaultImport } : {}),
    ...(resolution.reason ? { reason: resolution.reason } : {}),
  };

  if (resolution.status === "RESOLVED" && resolution.resolvedPath) {
    counts.resolved += 1;
    const targetModule = moduleIds.get(resolution.resolvedPath);
    if (!targetModule) {
      // File exists but is not a JS/TS module (e.g. .json) — still record resolved path.
      const stubId = `file-target:${resolution.resolvedPath}`;
      if (!graph.nodes.some((n) => n.id === stubId)) {
        addNode(graph, {
          id: stubId,
          kind: "FILE",
          name: resolution.resolvedPath,
          location: null,
          properties: { path: resolution.resolvedPath, resolvedImportTarget: true },
        });
      }
      addEdge(graph, "IMPORTS", fromModuleId, stubId, {
        ...baseProps,
        resolvedPath: resolution.resolvedPath,
      });
      return;
    }
    addEdge(graph, "IMPORTS", fromModuleId, targetModule, {
      ...baseProps,
      resolvedPath: resolution.resolvedPath,
      external: false,
      unresolved: false,
    });
    return;
  }

  if (resolution.status === "EXTERNAL") {
    counts.external += 1;
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
    addEdge(graph, "IMPORTS", fromModuleId, externalId, {
      ...baseProps,
      external: true,
      unresolved: false,
    });
    return;
  }

  if (resolution.status === "AMBIGUOUS") {
    counts.ambiguous += 1;
  } else {
    counts.unresolved += 1;
  }

  const stubId = `unresolved:${resolution.fromFile}::${item.specifier}`;
  if (!graph.nodes.some((n) => n.id === stubId)) {
    addNode(graph, {
      id: stubId,
      kind: "MODULE",
      name: item.specifier,
      location: null,
      properties: {
        unresolved: true,
        ambiguous: resolution.status === "AMBIGUOUS",
        specifier: item.specifier,
        fromFile: resolution.fromFile,
        ...(resolution.ambiguousPaths.length > 0
          ? { ambiguousPaths: resolution.ambiguousPaths }
          : {}),
      },
    });
  }
  addEdge(graph, "IMPORTS", fromModuleId, stubId, {
    ...baseProps,
    external: false,
    unresolved: true,
    ...(resolution.ambiguousPaths.length > 0 ? { ambiguousPaths: resolution.ambiguousPaths } : {}),
  });
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
    if (node.properties["external"] === true || node.properties["unresolved"] === true) {
      continue;
    }
    const list = byName.get(node.name) ?? [];
    list.push(node.id);
    byName.set(node.name, list);
  }

  for (const rel of pending) {
    let candidates = byName.get(rel.toName) ?? [];

    // Prefer callable entities for CALLS.
    if (rel.kind === "CALLS") {
      const callable = candidates.filter(
        (id) => id.startsWith("function:") || id.startsWith("method:"),
      );
      if (callable.length > 0) {
        candidates = callable;
      }
      if (rel.toName === "<dynamic>") {
        const stubId = `unresolved-call:dynamic:${rel.from}`;
        if (!graph.nodes.some((n) => n.id === stubId)) {
          addNode(graph, {
            id: stubId,
            kind: "FUNCTION",
            name: "<dynamic>",
            location: null,
            properties: { unresolved: true, callTarget: true },
          });
        }
        addEdge(graph, "CALLS", rel.from, stubId, {
          ...(rel.properties ?? {}),
          resolution: "UNRESOLVED",
          unresolved: true,
        });
        continue;
      }
    }

    if (candidates.length === 1) {
      const to = candidates[0]!;
      addEdge(graph, rel.kind, rel.from, to, {
        ...(rel.properties ?? {}),
        unresolved: false,
        ...(rel.kind === "CALLS" ? { resolution: "RESOLVED" } : {}),
      });
    } else if (candidates.length === 0) {
      const stubKind = rel.kind === "CALLS" ? "FUNCTION" : "CLASS";
      const stubId =
        rel.kind === "CALLS" ? `unresolved-call:${rel.toName}` : `unresolved:${rel.toName}`;
      if (!graph.nodes.some((n) => n.id === stubId)) {
        addNode(graph, {
          id: stubId,
          kind: stubKind,
          name: rel.toName,
          location: null,
          properties: {
            unresolved: true,
            ...(rel.kind === "CALLS" ? { callTarget: true } : {}),
          },
        });
      }
      addEdge(graph, rel.kind, rel.from, stubId, {
        ...(rel.properties ?? {}),
        unresolved: true,
        ...(rel.kind === "CALLS" ? { resolution: "UNRESOLVED" } : {}),
      });
    } else if (rel.kind === "CALLS") {
      // Preserve ambiguity instead of guessing.
      const stubId = `ambiguous-call:${rel.toName}`;
      if (!graph.nodes.some((n) => n.id === stubId)) {
        addNode(graph, {
          id: stubId,
          kind: "FUNCTION",
          name: rel.toName,
          location: null,
          properties: {
            unresolved: true,
            ambiguous: true,
            callTarget: true,
            candidateIds: candidates,
          },
        });
      }
      addEdge(graph, "CALLS", rel.from, stubId, {
        ...(rel.properties ?? {}),
        resolution: "AMBIGUOUS",
        unresolved: true,
        ambiguous: true,
        candidateIds: candidates,
      });
    }
    // Non-CALLS ambiguous: skip rather than guess (legacy EXTENDS/IMPLEMENTS behavior).
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

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

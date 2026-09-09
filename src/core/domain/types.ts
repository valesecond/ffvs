export type EntityKind =
  "PROJECT" | "FILE" | "MODULE" | "FUNCTION" | "CLASS" | "METHOD" | "VARIABLE";

export type RelationKind =
  "CONTAINS" | "IMPORTS" | "EXPORTS" | "DECLARES" | "EXTENDS" | "IMPLEMENTS" | "CALLS";

export interface SourceLocation {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface GraphNode {
  id: string;
  kind: EntityKind;
  name: string | null;
  location: SourceLocation | null;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  kind: RelationKind;
  from: string;
  to: string;
  properties?: Record<string, unknown>;
}

export interface SemanticGraph {
  version: 2;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface IndexedFile {
  path: string;
  absolutePath: string;
  language: string | null;
  sizeBytes: number;
  hash: string;
  extension: string;
}

export interface LanguageStats {
  language: string;
  fileCount: number;
}

export interface EntityStats {
  kind: EntityKind;
  count: number;
}

export interface ResolutionStats {
  importsTotal: number;
  resolvedInternal: number;
  external: number;
  unresolved: number;
  ambiguous: number;
  /**
   * resolvedInternal / (resolvedInternal + unresolved + ambiguous).
   * EXTERNAL excluded. null when denominator is 0.
   */
  internalResolutionRate: number | null;
}

export interface ProjectIndex {
  version: 2;
  root: string;
  indexedAt: string;
  files: IndexedFile[];
  languages: LanguageStats[];
  entities: EntityStats[];
  skippedDirectoryNames: string[];
  parseErrors: Array<{ path: string; message: string }>;
  resolution?: ResolutionStats;
}

export interface FfvsConfig {
  version: 1;
  name: string;
  createdAt: string;
  lastIndexedAt: string | null;
  indexRoot: string;
  /** Path prefixes to include (empty/absent = all). Posix relative paths. */
  include?: string[];
  /** Extra directory names or path substrings to exclude beyond defaults. */
  exclude?: string[];
}

export const FFVS_DIR = ".ffvs";
export const CONFIG_FILE = "config.json";
export const INDEX_FILE = "index.json";
export const GRAPH_FILE = "graph.json";

export const DEFAULT_SKIP_DIRS = new Set([
  ".git",
  ".ffvs",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
  "target",
]);

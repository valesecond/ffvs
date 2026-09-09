export type EntityKind = "project" | "file" | "module";

export type RelationKind = "CONTAINS" | "IMPORTS";

export interface GraphNode {
  id: string;
  kind: EntityKind;
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

export interface ProjectIndex {
  version: 1;
  root: string;
  indexedAt: string;
  files: IndexedFile[];
  languages: LanguageStats[];
  skippedDirectoryNames: string[];
}

export interface FfvsConfig {
  version: 1;
  name: string;
  createdAt: string;
  lastIndexedAt: string | null;
  indexRoot: string;
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

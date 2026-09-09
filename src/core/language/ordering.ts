import type { GraphEdge, GraphNode } from "../domain/types.js";

/** Stable entity ordering for DSL ResultSets (name, then id). Locale fixed to `en`. */
export function compareEntities(a: GraphNode, b: GraphNode): number {
  const an = a.name ?? a.id;
  const bn = b.name ?? b.id;
  return an.localeCompare(bn, "en") || a.id.localeCompare(b.id, "en");
}

/** Stable edge ordering by edge id. */
export function compareEdges(a: GraphEdge, b: GraphEdge): number {
  return a.id.localeCompare(b.id, "en");
}

/** Normalize stored / query paths to POSIX separators for matching. */
export function normalizePathKey(pathValue: string): string {
  return pathValue.replace(/\\/g, "/");
}

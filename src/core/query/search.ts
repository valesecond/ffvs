import type { EntityKind, GraphNode, SemanticGraph } from "../domain/types.js";
import { matchesNode, type SelectPredicate } from "./select.js";

/**
 * SEARCH finds candidate entities by a free-text needle (Phase 1.8).
 * FILTER (select.ts) restricts an already chosen set.
 */
export interface SearchOptions {
  needle: string;
  kind?: EntityKind;
  path?: string;
  limit?: number;
}

export function searchEntities(graph: SemanticGraph, options: SearchOptions): GraphNode[] {
  const needle = options.needle.toLowerCase();
  const predicate: SelectPredicate = {
    ...(options.kind !== undefined ? { kind: options.kind } : {}),
    ...(options.path !== undefined ? { path: options.path, pathMode: "contains" } : {}),
  };

  const scored: Array<{ node: GraphNode; score: number }> = [];

  for (const node of graph.nodes) {
    if (node.properties["external"] === true || node.properties["unresolved"] === true) {
      continue;
    }
    if (!matchesNode(node, predicate)) {
      continue;
    }

    const name = (node.name ?? "").toLowerCase();
    const pathValue =
      typeof node.properties["path"] === "string"
        ? node.properties["path"].toLowerCase()
        : (node.location?.file?.toLowerCase() ?? "");
    const id = node.id.toLowerCase();

    let score = 0;
    if (name === needle) score += 100;
    else if (name.startsWith(needle)) score += 60;
    else if (name.includes(needle)) score += 40;
    if (pathValue.includes(needle)) score += 20;
    if (id.includes(needle)) score += 10;

    if (score > 0) {
      scored.push({ node, score });
    }
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (a.node.name ?? a.node.id).localeCompare(b.node.name ?? b.node.id, "en") ||
      a.node.id.localeCompare(b.node.id, "en"),
  );

  const limit = options.limit ?? 50;
  return scored.slice(0, limit).map((s) => s.node);
}

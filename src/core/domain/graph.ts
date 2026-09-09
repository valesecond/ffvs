import type { GraphEdge, GraphNode, RelationKind, SemanticGraph } from "./types.js";

export function createGraph(): SemanticGraph {
  return { nodes: [], edges: [] };
}

export function addNode(graph: SemanticGraph, node: GraphNode): void {
  graph.nodes.push(node);
}

export function addEdge(
  graph: SemanticGraph,
  kind: RelationKind,
  from: string,
  to: string,
  properties?: Record<string, unknown>,
): void {
  const edge: GraphEdge = {
    id: `edge:${kind}:${from}->${to}`,
    kind,
    from,
    to,
  };
  if (properties !== undefined) {
    edge.properties = properties;
  }
  graph.edges.push(edge);
}

export function countByKind(graph: SemanticGraph): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const node of graph.nodes) {
    counts[node.kind] = (counts[node.kind] ?? 0) + 1;
  }
  return counts;
}

import type { GraphEdge, GraphNode, RelationKind, SemanticGraph } from "./types.js";

export function createGraph(): SemanticGraph {
  return { version: 2, nodes: [], edges: [] };
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

export function findNodesByKind(graph: SemanticGraph, kind: GraphNode["kind"]): GraphNode[] {
  return graph.nodes.filter((node) => node.kind === kind);
}

export function getNode(graph: SemanticGraph, id: string): GraphNode | undefined {
  return graph.nodes.find((node) => node.id === id);
}

export function outgoing(graph: SemanticGraph, from: string, kind?: RelationKind): GraphEdge[] {
  return graph.edges.filter(
    (edge) => edge.from === from && (kind === undefined || edge.kind === kind),
  );
}

export function incoming(graph: SemanticGraph, to: string, kind?: RelationKind): GraphEdge[] {
  return graph.edges.filter((edge) => edge.to === to && (kind === undefined || edge.kind === kind));
}

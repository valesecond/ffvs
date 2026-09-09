import { getNode, incoming, outgoing } from "../domain/graph.js";
import type { GraphEdge, GraphNode, RelationKind, SemanticGraph } from "../domain/types.js";

export interface NavigateOptions {
  kinds?: readonly RelationKind[];
  /** When true, treat edges as undirected for traversal. */
  undirected?: boolean;
  maxDepth?: number;
}

export interface PathHop {
  edge: GraphEdge;
  from: string;
  to: string;
}

export interface PathResult {
  found: boolean;
  nodeIds: string[];
  hops: PathHop[];
}

function matchesKind(edge: GraphEdge, kinds?: readonly RelationKind[]): boolean {
  return kinds === undefined || kinds.length === 0 || kinds.includes(edge.kind);
}

export function outgoingNeighbors(
  graph: SemanticGraph,
  nodeId: string,
  options: NavigateOptions = {},
): GraphEdge[] {
  return outgoing(graph, nodeId).filter((edge) => matchesKind(edge, options.kinds));
}

export function incomingNeighbors(
  graph: SemanticGraph,
  nodeId: string,
  options: NavigateOptions = {},
): GraphEdge[] {
  return incoming(graph, nodeId).filter((edge) => matchesKind(edge, options.kinds));
}

export function neighbors(
  graph: SemanticGraph,
  nodeId: string,
  options: NavigateOptions = {},
): GraphEdge[] {
  const seen = new Set<string>();
  const edges: GraphEdge[] = [];
  for (const edge of [
    ...outgoingNeighbors(graph, nodeId, options),
    ...incomingNeighbors(graph, nodeId, options),
  ]) {
    if (seen.has(edge.id)) {
      continue;
    }
    seen.add(edge.id);
    edges.push(edge);
  }
  return edges;
}

/** Structural children: outgoing CONTAINS (default). */
export function children(
  graph: SemanticGraph,
  nodeId: string,
  kinds: readonly RelationKind[] = ["CONTAINS"],
): GraphNode[] {
  return uniqueNodes(
    graph,
    outgoingNeighbors(graph, nodeId, { kinds }).map((edge) => edge.to),
  );
}

/** Structural parents: incoming CONTAINS (default). */
export function parents(
  graph: SemanticGraph,
  nodeId: string,
  kinds: readonly RelationKind[] = ["CONTAINS"],
): GraphNode[] {
  return uniqueNodes(
    graph,
    incomingNeighbors(graph, nodeId, { kinds }).map((edge) => edge.from),
  );
}

/**
 * Directed BFS path from source to target over selected relation kinds.
 * Returns the shortest path by hop count.
 */
export function findPath(
  graph: SemanticGraph,
  sourceId: string,
  targetId: string,
  options: NavigateOptions = {},
): PathResult {
  if (sourceId === targetId) {
    return { found: true, nodeIds: [sourceId], hops: [] };
  }

  const maxDepth = options.maxDepth ?? 64;
  const queue: string[] = [sourceId];
  const visited = new Set<string>([sourceId]);
  const prev = new Map<string, { nodeId: string; edge: GraphEdge }>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    const depth = reconstructDepth(prev, sourceId, current);
    if (depth >= maxDepth) {
      continue;
    }

    const edges = options.undirected
      ? neighbors(graph, current, options)
      : outgoingNeighbors(graph, current, options);

    for (const edge of edges) {
      const next = edge.from === current ? edge.to : edge.from;
      if (visited.has(next)) {
        continue;
      }
      visited.add(next);
      prev.set(next, { nodeId: current, edge });
      if (next === targetId) {
        return buildPath(sourceId, targetId, prev);
      }
      queue.push(next);
    }
  }

  return { found: false, nodeIds: [], hops: [] };
}

/**
 * Transitive closure walking reverse edges (incoming) — e.g. impact via IMPORTS.
 */
export function ancestors(
  graph: SemanticGraph,
  nodeId: string,
  options: NavigateOptions = {},
): Array<{ node: GraphNode; depth: number; via: GraphEdge }> {
  return walkClosure(graph, nodeId, "incoming", options);
}

/**
 * Transitive closure walking forward edges (outgoing) — e.g. deep dependencies.
 */
export function descendants(
  graph: SemanticGraph,
  nodeId: string,
  options: NavigateOptions = {},
): Array<{ node: GraphNode; depth: number; via: GraphEdge }> {
  return walkClosure(graph, nodeId, "outgoing", options);
}

function walkClosure(
  graph: SemanticGraph,
  startId: string,
  direction: "incoming" | "outgoing",
  options: NavigateOptions,
): Array<{ node: GraphNode; depth: number; via: GraphEdge }> {
  const maxDepth = options.maxDepth ?? 64;
  const results: Array<{ node: GraphNode; depth: number; via: GraphEdge }> = [];
  const visited = new Set<string>([startId]);
  const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.depth >= maxDepth) {
      continue;
    }

    const edges =
      direction === "incoming"
        ? incomingNeighbors(graph, current.id, options)
        : outgoingNeighbors(graph, current.id, options);

    for (const edge of edges) {
      const nextId = direction === "incoming" ? edge.from : edge.to;
      if (visited.has(nextId)) {
        continue;
      }
      visited.add(nextId);
      const node = getNode(graph, nextId);
      if (!node) {
        continue;
      }
      const depth = current.depth + 1;
      results.push({ node, depth, via: edge });
      queue.push({ id: nextId, depth });
    }
  }

  return results.sort(
    (a, b) =>
      a.depth - b.depth || (a.node.name ?? a.node.id).localeCompare(b.node.name ?? b.node.id),
  );
}

function uniqueNodes(graph: SemanticGraph, ids: string[]): GraphNode[] {
  const seen = new Set<string>();
  const nodes: GraphNode[] = [];
  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    const node = getNode(graph, id);
    if (node) {
      nodes.push(node);
    }
  }
  return nodes.sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));
}

function reconstructDepth(
  prev: Map<string, { nodeId: string; edge: GraphEdge }>,
  sourceId: string,
  nodeId: string,
): number {
  let depth = 0;
  let current = nodeId;
  while (current !== sourceId) {
    const step = prev.get(current);
    if (!step) {
      break;
    }
    depth += 1;
    current = step.nodeId;
  }
  return depth;
}

function buildPath(
  sourceId: string,
  targetId: string,
  prev: Map<string, { nodeId: string; edge: GraphEdge }>,
): PathResult {
  const nodeIds: string[] = [targetId];
  const hops: PathHop[] = [];
  let current = targetId;
  while (current !== sourceId) {
    const step = prev.get(current);
    if (!step) {
      return { found: false, nodeIds: [], hops: [] };
    }
    hops.unshift({
      edge: step.edge,
      from: step.nodeId,
      to: current,
    });
    nodeIds.unshift(step.nodeId);
    current = step.nodeId;
  }
  return { found: true, nodeIds, hops };
}

import { getNode, incoming } from "../domain/graph.js";
import type { GraphEdge, GraphNode, RelationKind, SemanticGraph } from "../domain/types.js";
import { ancestors, findPath, type PathResult } from "../graph/navigate.js";

export function isResolvedInternalImport(edge: GraphEdge): boolean {
  if (edge.kind !== "IMPORTS") {
    return false;
  }
  if (edge.properties?.["resolution"] === "RESOLVED") {
    return true;
  }
  return (
    edge.properties?.["resolution"] === undefined &&
    edge.properties?.["external"] !== true &&
    edge.properties?.["unresolved"] !== true &&
    edge.to.startsWith("module:")
  );
}

/** Map class/function/file to owning MODULE for IMPORTS-oriented queries. */
export function resolveModuleAnchor(graph: SemanticGraph, entity: GraphNode): GraphNode {
  if (entity.kind === "MODULE") {
    return entity;
  }
  if (entity.kind === "FILE") {
    const module = graph.nodes.find(
      (node) =>
        node.kind === "MODULE" &&
        node.properties["path"] === entity.properties["path"] &&
        node.properties["external"] !== true,
    );
    if (module) {
      return module;
    }
  }
  const declared = incoming(graph, entity.id, "DECLARES")[0];
  if (declared) {
    const module = getNode(graph, declared.from);
    if (module) {
      return module;
    }
  }
  const contained = incoming(graph, entity.id, "CONTAINS")[0];
  if (contained?.from.startsWith("module:")) {
    const module = getNode(graph, contained.from);
    if (module) {
      return module;
    }
  }
  return entity;
}

export interface CorePathResult {
  found: boolean;
  from: GraphNode;
  to: GraphNode;
  nodes: GraphNode[];
  edges: GraphEdge[];
  relationKinds: RelationKind[];
  /** Hop count (nodes.length - 1 when found, else 0). */
  length: number;
}

/**
 * Shortest directed path over resolved-internal IMPORTS (same as CLI `ffvs path`).
 * Uses BFS; cycles terminate via visited set; deterministic first-found shortest path.
 */
export function computePath(
  graph: SemanticGraph,
  fromEntity: GraphNode,
  toEntity: GraphNode,
  kinds: RelationKind[] = ["IMPORTS"],
): CorePathResult {
  const from = resolveModuleAnchor(graph, fromEntity);
  const to = resolveModuleAnchor(graph, toEntity);
  const filtered: SemanticGraph = {
    version: graph.version,
    nodes: graph.nodes,
    edges: graph.edges.filter((edge) => edge.kind !== "IMPORTS" || isResolvedInternalImport(edge)),
  };
  const path: PathResult = findPath(filtered, from.id, to.id, { kinds });
  const nodes = path.nodeIds
    .map((id) => getNode(graph, id))
    .filter((node): node is GraphNode => !!node);
  const edges = path.hops.map((hop) => hop.edge);
  return {
    found: path.found,
    from,
    to,
    nodes,
    edges,
    relationKinds: kinds,
    length: path.found ? Math.max(0, path.nodeIds.length - 1) : 0,
  };
}

export interface CoreImpactHit {
  node: GraphNode;
  depth: number;
  via: GraphEdge;
}

/**
 * Transitive dependents via resolved-internal IMPORTS (same as CLI `ffvs impact`).
 * Seed module is not included in the result set. Cycles handled via visited set.
 */
export function computeImpact(
  graph: SemanticGraph,
  seedEntity: GraphNode,
  kinds: RelationKind[] = ["IMPORTS"],
): { anchor: GraphNode; affected: CoreImpactHit[]; relationKinds: RelationKind[] } {
  const anchor = resolveModuleAnchor(graph, seedEntity);
  const filtered: SemanticGraph = {
    version: graph.version,
    nodes: graph.nodes,
    edges: graph.edges.filter((edge) => edge.kind !== "IMPORTS" || isResolvedInternalImport(edge)),
  };
  const closure = ancestors(filtered, anchor.id, { kinds });
  return {
    anchor,
    affected: closure,
    relationKinds: kinds,
  };
}

/**
 * Transitive inbound CALLS closure (explicit CALL impact).
 * Does not module-anchor: walks from the seed callable/entity itself.
 * Optional resolution filter (default for DSL: RESOLVED-only when requested by caller).
 */
export function computeCallImpact(
  graph: SemanticGraph,
  seedEntity: GraphNode,
  options: { resolution?: "RESOLVED" | "AMBIGUOUS" | "UNRESOLVED" | "EXTERNAL" } = {},
): { anchor: GraphNode; affected: CoreImpactHit[]; relationKinds: RelationKind[] } {
  const edges = graph.edges.filter((edge) => {
    if (edge.kind !== "CALLS") {
      return false;
    }
    if (!options.resolution) {
      return true;
    }
    const res = edge.properties?.["resolution"];
    if (res === options.resolution) {
      return true;
    }
    if (options.resolution === "EXTERNAL" && edge.properties?.["external"] === true) {
      return true;
    }
    if (options.resolution === "AMBIGUOUS" && edge.properties?.["ambiguous"] === true) {
      return true;
    }
    if (
      options.resolution === "UNRESOLVED" &&
      edge.properties?.["unresolved"] === true &&
      edge.properties?.["ambiguous"] !== true
    ) {
      return true;
    }
    return false;
  });
  const filtered: SemanticGraph = {
    version: graph.version,
    nodes: graph.nodes,
    edges,
  };
  const closure = ancestors(filtered, seedEntity.id, { kinds: ["CALLS"] });
  return {
    anchor: seedEntity,
    affected: closure,
    relationKinds: ["CALLS"],
  };
}

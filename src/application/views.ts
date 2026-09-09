import type { GraphEdge, GraphNode, RelationKind } from "../core/domain/types.js";

/** Stable entity reference used across explore JSON payloads. */
export interface EntityRef {
  id: string;
  kind: GraphNode["kind"];
  name: string | null;
  path: string | null;
}

/** First-class relation view: source → relationship → target. */
export interface RelationRef {
  id: string;
  kind: RelationKind;
  from: EntityRef;
  to: EntityRef;
  properties: Record<string, unknown>;
}

export interface NeighborhoodResult {
  entity: EntityRef;
  operation: string;
  relationKinds: RelationKind[];
  relations: RelationRef[];
  nodes: EntityRef[];
}

export interface PathExploreResult {
  operation: "path";
  from: EntityRef;
  to: EntityRef;
  found: boolean;
  relationKinds: RelationKind[];
  nodes: EntityRef[];
  relations: RelationRef[];
}

export interface ImpactResult {
  operation: "impact";
  entity: EntityRef;
  relationKinds: RelationKind[];
  affected: Array<EntityRef & { depth: number }>;
}

export function toEntityRef(node: GraphNode): EntityRef {
  return {
    id: node.id,
    kind: node.kind,
    name: node.name,
    path: typeof node.properties["path"] === "string" ? node.properties["path"] : null,
  };
}

export function toRelationRef(edge: GraphEdge, from: GraphNode, to: GraphNode): RelationRef {
  return {
    id: edge.id,
    kind: edge.kind,
    from: toEntityRef(from),
    to: toEntityRef(to),
    properties: edge.properties ?? {},
  };
}

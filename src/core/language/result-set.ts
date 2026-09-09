import type { GraphEdge, GraphNode } from "../domain/types.js";

export interface QueryDiagnostics {
  messages: string[];
  resolutionCounts: {
    RESOLVED: number;
    EXTERNAL: number;
    UNRESOLVED: number;
    AMBIGUOUS: number;
    unknown: number;
  };
}

export interface EntityDescription {
  id: string;
  kind: GraphNode["kind"];
  name: string | null;
  path: string | null;
  relationCount: number;
  edgeKinds: string[];
}

export interface QueryResultSet {
  entities: GraphNode[];
  relations: GraphEdge[];
  descriptions?: EntityDescription[];
  diagnostics: QueryDiagnostics;
  stagesApplied: string[];
}

export function emptyResultSet(): QueryResultSet {
  return {
    entities: [],
    relations: [],
    diagnostics: {
      messages: [],
      resolutionCounts: {
        RESOLVED: 0,
        EXTERNAL: 0,
        UNRESOLVED: 0,
        AMBIGUOUS: 0,
        unknown: 0,
      },
    },
    stagesApplied: [],
  };
}

export function tallyResolutions(relations: GraphEdge[]): QueryDiagnostics["resolutionCounts"] {
  const counts = {
    RESOLVED: 0,
    EXTERNAL: 0,
    UNRESOLVED: 0,
    AMBIGUOUS: 0,
    unknown: 0,
  };
  for (const edge of relations) {
    const res = edge.properties?.["resolution"];
    if (res === "RESOLVED" || res === "EXTERNAL" || res === "UNRESOLVED" || res === "AMBIGUOUS") {
      counts[res] += 1;
    } else if (edge.properties?.["external"] === true) {
      counts.EXTERNAL += 1;
    } else if (edge.properties?.["unresolved"] === true) {
      if (edge.properties?.["ambiguous"] === true) {
        counts.AMBIGUOUS += 1;
      } else {
        counts.UNRESOLVED += 1;
      }
    } else {
      counts.unknown += 1;
    }
  }
  return counts;
}

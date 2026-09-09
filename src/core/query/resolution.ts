/**
 * Shared resolution helpers for relation edges (IMPORTS / CALLS).
 * Resolution is an edge property — not an entity attribute.
 */
export type ResolutionState = "RESOLVED" | "AMBIGUOUS" | "UNRESOLVED" | "EXTERNAL";

export function edgeResolution(edge: {
  properties?: Record<string, unknown>;
}): ResolutionState | "unknown" {
  const res = edge.properties?.["resolution"];
  if (res === "RESOLVED" || res === "AMBIGUOUS" || res === "UNRESOLVED" || res === "EXTERNAL") {
    return res;
  }
  if (edge.properties?.["external"] === true) {
    return "EXTERNAL";
  }
  if (edge.properties?.["ambiguous"] === true) {
    return "AMBIGUOUS";
  }
  if (edge.properties?.["unresolved"] === true) {
    return "UNRESOLVED";
  }
  return "unknown";
}

export function matchesResolution(
  edge: { properties?: Record<string, unknown> },
  wanted: ResolutionState,
): boolean {
  return edgeResolution(edge) === wanted;
}

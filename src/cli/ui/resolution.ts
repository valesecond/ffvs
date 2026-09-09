import type { ResolutionVisual } from "./icons.js";
import { resolutionIcon } from "./icons.js";

export function edgeResolution(properties?: Record<string, unknown>): ResolutionVisual {
  const res = properties?.["resolution"];
  if (res === "RESOLVED" || res === "AMBIGUOUS" || res === "UNRESOLVED" || res === "EXTERNAL") {
    return res;
  }
  if (properties?.["external"] === true) {
    return "EXTERNAL";
  }
  if (properties?.["ambiguous"] === true) {
    return "AMBIGUOUS";
  }
  if (properties?.["unresolved"] === true) {
    return "UNRESOLVED";
  }
  return "unknown";
}

export function resolutionSuffix(properties?: Record<string, unknown>): string | undefined {
  const state = edgeResolution(properties);
  if (state === "unknown") {
    return undefined;
  }
  return resolutionIcon(state);
}

export function tallyResolutions(propertiesList: Array<Record<string, unknown> | undefined>): {
  RESOLVED: number;
  AMBIGUOUS: number;
  UNRESOLVED: number;
  EXTERNAL: number;
} {
  const counts = { RESOLVED: 0, AMBIGUOUS: 0, UNRESOLVED: 0, EXTERNAL: 0 };
  for (const props of propertiesList) {
    const state = edgeResolution(props);
    if (state !== "unknown") {
      counts[state] += 1;
    }
  }
  return counts;
}

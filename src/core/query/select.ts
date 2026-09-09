import type { EntityKind, GraphNode, IndexedFile } from "../domain/types.js";

/**
 * Lightweight selection predicates (Phase 1.7).
 * Not a filter language — CLI flags only map to these fields.
 */
export interface SelectPredicate {
  name?: string;
  path?: string;
  kind?: EntityKind;
  /** name match mode */
  nameMode?: "contains" | "equals" | "prefix";
  pathMode?: "contains" | "equals" | "prefix";
}

function matchText(
  value: string | null | undefined,
  needle: string,
  mode: "contains" | "equals" | "prefix",
): boolean {
  if (value == null) {
    return false;
  }
  switch (mode) {
    case "equals":
      return value === needle;
    case "prefix":
      return value.startsWith(needle);
    case "contains":
    default:
      return value.includes(needle);
  }
}

export function matchesNode(node: GraphNode, predicate: SelectPredicate): boolean {
  if (predicate.kind !== undefined && node.kind !== predicate.kind) {
    return false;
  }
  if (predicate.name !== undefined) {
    const mode = predicate.nameMode ?? "contains";
    if (!matchText(node.name, predicate.name, mode)) {
      return false;
    }
  }
  if (predicate.path !== undefined) {
    const mode = predicate.pathMode ?? "contains";
    const pathValue =
      typeof node.properties["path"] === "string"
        ? node.properties["path"]
        : (node.location?.file ?? null);
    if (!matchText(pathValue, predicate.path, mode)) {
      return false;
    }
  }
  return true;
}

export function selectNodes(nodes: GraphNode[], predicate: SelectPredicate): GraphNode[] {
  return nodes.filter((node) => matchesNode(node, predicate));
}

export function selectFiles(files: IndexedFile[], predicate: SelectPredicate): IndexedFile[] {
  return files.filter((file) => {
    if (predicate.path !== undefined) {
      const mode = predicate.pathMode ?? "contains";
      if (!matchText(file.path, predicate.path, mode)) {
        return false;
      }
    }
    if (predicate.name !== undefined) {
      const mode = predicate.nameMode ?? "contains";
      const base = file.path.split("/").pop() ?? file.path;
      if (!matchText(base, predicate.name, mode)) {
        return false;
      }
    }
    return true;
  });
}

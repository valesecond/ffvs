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

function nodePath(node: GraphNode): string | null {
  if (typeof node.properties["path"] === "string") {
    return normalizePathSeparators(node.properties["path"]);
  }
  if (node.location?.file) {
    return normalizePathSeparators(node.location.file);
  }
  return null;
}

function normalizePathSeparators(pathValue: string): string {
  return pathValue.replace(/\\/g, "/");
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
    const pathValue = nodePath(node);
    const needle = normalizePathSeparators(predicate.path);
    if (!matchText(pathValue, needle, mode)) {
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
      const filePath = file.path.replace(/\\/g, "/");
      const needle = predicate.path.replace(/\\/g, "/");
      if (!matchText(filePath, needle, mode)) {
        return false;
      }
    }
    if (predicate.name !== undefined) {
      const mode = predicate.nameMode ?? "contains";
      const base = file.path.replace(/\\/g, "/").split("/").pop() ?? file.path;
      if (!matchText(base, predicate.name, mode)) {
        return false;
      }
    }
    return true;
  });
}

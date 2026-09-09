import type { RelationKind } from "../domain/types.js";
import type { TraverseDirection, TraverseRelationName } from "./ast.js";

export interface ResolvedTraverse {
  relationKind: RelationKind;
  direction: TraverseDirection;
  /** When true, use module anchor (IMPORTS-style questions). */
  moduleAnchor: boolean;
  /** When true, only follow resolved internal IMPORTS (dependents semantics). */
  resolvedImportsOnly: boolean;
  sugar: string;
}

/**
 * Map DSL traverse relation (+ optional direction) onto graph navigation.
 * Sugar names set default direction; explicit inbound/outbound overrides when valid.
 */
export function resolveTraverse(
  relation: TraverseRelationName,
  direction?: TraverseDirection,
): ResolvedTraverse {
  const presets: Record<
    TraverseRelationName,
    Omit<ResolvedTraverse, "direction"> & { direction: TraverseDirection }
  > = {
    imports: {
      relationKind: "IMPORTS",
      direction: "outbound",
      moduleAnchor: true,
      resolvedImportsOnly: false,
      sugar: "imports",
    },
    dependencies: {
      relationKind: "IMPORTS",
      direction: "outbound",
      moduleAnchor: true,
      resolvedImportsOnly: false,
      sugar: "dependencies",
    },
    deps: {
      relationKind: "IMPORTS",
      direction: "outbound",
      moduleAnchor: true,
      resolvedImportsOnly: false,
      sugar: "deps",
    },
    dependents: {
      relationKind: "IMPORTS",
      direction: "inbound",
      moduleAnchor: true,
      resolvedImportsOnly: true,
      sugar: "dependents",
    },
    calls: {
      relationKind: "CALLS",
      direction: "outbound",
      moduleAnchor: false,
      resolvedImportsOnly: false,
      sugar: "calls",
    },
    callers: {
      relationKind: "CALLS",
      direction: "inbound",
      moduleAnchor: false,
      resolvedImportsOnly: false,
      sugar: "callers",
    },
    contains: {
      relationKind: "CONTAINS",
      direction: "outbound",
      moduleAnchor: false,
      resolvedImportsOnly: false,
      sugar: "contains",
    },
    children: {
      relationKind: "CONTAINS",
      direction: "outbound",
      moduleAnchor: false,
      resolvedImportsOnly: false,
      sugar: "children",
    },
    parents: {
      relationKind: "CONTAINS",
      direction: "inbound",
      moduleAnchor: false,
      resolvedImportsOnly: false,
      sugar: "parents",
    },
    exports: {
      relationKind: "EXPORTS",
      direction: "outbound",
      moduleAnchor: true,
      resolvedImportsOnly: false,
      sugar: "exports",
    },
    declares: {
      relationKind: "DECLARES",
      direction: "outbound",
      moduleAnchor: true,
      resolvedImportsOnly: false,
      sugar: "declares",
    },
    extends: {
      relationKind: "EXTENDS",
      direction: "outbound",
      moduleAnchor: false,
      resolvedImportsOnly: false,
      sugar: "extends",
    },
    implements: {
      relationKind: "IMPLEMENTS",
      direction: "outbound",
      moduleAnchor: false,
      resolvedImportsOnly: false,
      sugar: "implements",
    },
  };

  const base = presets[relation];
  return {
    ...base,
    direction: direction ?? base.direction,
  };
}

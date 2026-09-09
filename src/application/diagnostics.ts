import path from "node:path";

import * as store from "../adapters/storage/ffvs-store.js";
import { StateError } from "../core/domain/errors.js";
import type { ResolutionStatus } from "../core/resolver/types.js";
import { loadModel } from "./explore.js";

export interface UnresolvedImportDiagnostic {
  fromModule: string;
  fromPath: string | null;
  specifier: string;
  status: "UNRESOLVED" | "AMBIGUOUS";
  reason: string | null;
  candidatesChecked: string[];
  ambiguousPaths: string[];
}

export interface DiagnosticsResult {
  projectRoot: string;
  unresolved: UnresolvedImportDiagnostic[];
  ambiguous: UnresolvedImportDiagnostic[];
  counts: {
    unresolved: number;
    ambiguous: number;
    resolvedInternal: number;
    external: number;
    importsTotal: number;
    internalResolutionRate: number | null;
  };
}

export async function getDiagnostics(startDir: string): Promise<DiagnosticsResult> {
  const model = await loadModel(startDir);
  const unresolved: UnresolvedImportDiagnostic[] = [];
  const ambiguous: UnresolvedImportDiagnostic[] = [];

  for (const edge of model.graph.edges) {
    if (edge.kind !== "IMPORTS") {
      continue;
    }
    const status = edge.properties?.["resolution"] as ResolutionStatus | undefined;
    if (status !== "UNRESOLVED" && status !== "AMBIGUOUS") {
      continue;
    }
    const fromNode = model.graph.nodes.find((n) => n.id === edge.from);
    const entry: UnresolvedImportDiagnostic = {
      fromModule: edge.from,
      fromPath:
        typeof fromNode?.properties["path"] === "string" ? fromNode.properties["path"] : null,
      specifier: String(edge.properties?.["specifier"] ?? ""),
      status,
      reason: typeof edge.properties?.["reason"] === "string" ? edge.properties["reason"] : null,
      candidatesChecked: Array.isArray(edge.properties?.["candidatesChecked"])
        ? (edge.properties["candidatesChecked"] as string[])
        : [],
      ambiguousPaths: Array.isArray(edge.properties?.["ambiguousPaths"])
        ? (edge.properties["ambiguousPaths"] as string[])
        : [],
    };
    if (status === "AMBIGUOUS") {
      ambiguous.push(entry);
    } else {
      unresolved.push(entry);
    }
  }

  const resolution = model.index.resolution ?? {
    importsTotal: 0,
    resolvedInternal: 0,
    external: 0,
    unresolved: 0,
    ambiguous: 0,
    internalResolutionRate: null,
  };

  return {
    projectRoot: model.projectRoot,
    unresolved: unresolved.sort((a, b) => String(a.fromPath).localeCompare(String(b.fromPath))),
    ambiguous: ambiguous.sort((a, b) => String(a.fromPath).localeCompare(String(b.fromPath))),
    counts: {
      unresolved: resolution.unresolved,
      ambiguous: resolution.ambiguous,
      resolvedInternal: resolution.resolvedInternal,
      external: resolution.external,
      importsTotal: resolution.importsTotal,
      internalResolutionRate: resolution.internalResolutionRate,
    },
  };
}

/** Alias command name support. */
export async function getUnresolved(startDir: string): Promise<DiagnosticsResult> {
  return getDiagnostics(path.resolve(startDir));
}

export async function requireIndexed(startDir: string): Promise<void> {
  const root = await store.findProjectRoot(path.resolve(startDir));
  if (!root) {
    throw new StateError(`No FFVS project found. Run \`ffvs init\` and \`ffvs index .\`.`);
  }
}

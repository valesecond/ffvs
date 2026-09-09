import path from "node:path";

import * as store from "../adapters/storage/ffvs-store.js";
import { countByKind } from "../core/domain/graph.js";
import { StateError } from "../core/domain/errors.js";
import type {
  FfvsConfig,
  ProjectIndex,
  ResolutionStats,
  SemanticGraph,
} from "../core/domain/types.js";

export interface StatusResult {
  projectRoot: string;
  initialized: true;
  config: FfvsConfig;
  index: ProjectIndex | null;
  graph: SemanticGraph | null;
  nodeCounts: Record<string, number>;
  edgeCount: number;
  importEdgeCount: number;
  resolution: ResolutionStats | null;
}

export async function getStatus(startDir: string): Promise<StatusResult> {
  const absoluteStart = path.resolve(startDir);
  const projectRoot = await store.findProjectRoot(absoluteStart);

  if (!projectRoot) {
    throw new StateError(`No FFVS project found near ${absoluteStart}. Run \`ffvs init\` first.`);
  }

  const config = await store.readConfig(projectRoot);
  const index = await store.readIndex(projectRoot);
  const graph = await store.readGraph(projectRoot);

  const nodeCounts = graph ? countByKind(graph) : {};
  const edgeCount = graph?.edges.length ?? 0;
  const importEdgeCount = graph?.edges.filter((e) => e.kind === "IMPORTS").length ?? 0;

  return {
    projectRoot,
    initialized: true,
    config,
    index,
    graph,
    nodeCounts,
    edgeCount,
    importEdgeCount,
    resolution: index?.resolution ?? null,
  };
}

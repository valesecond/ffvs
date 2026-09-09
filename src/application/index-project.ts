import path from "node:path";

import * as store from "../adapters/storage/ffvs-store.js";
import { StateError } from "../core/domain/errors.js";
import { buildProjectIndex } from "../core/indexer/build-index.js";
import type { ProjectIndex, SemanticGraph } from "../core/domain/types.js";

export interface IndexResult {
  projectRoot: string;
  scanRoot: string;
  index: ProjectIndex;
  graph: SemanticGraph;
}

export async function indexProject(startDir: string, scanPath = "."): Promise<IndexResult> {
  const absoluteStart = path.resolve(startDir);
  const projectRoot = (await store.findProjectRoot(absoluteStart)) ?? absoluteStart;

  if (!(await store.isInitialized(projectRoot))) {
    throw new StateError(`No FFVS project found near ${absoluteStart}. Run \`ffvs init\` first.`);
  }

  const scanRoot = path.resolve(projectRoot, scanPath);
  const { index, graph } = await buildProjectIndex(scanRoot);

  const config = await store.readConfig(projectRoot);
  config.lastIndexedAt = index.indexedAt;
  config.indexRoot = toPosix(path.relative(projectRoot, scanRoot) || ".");

  await store.writeIndex(projectRoot, index);
  await store.writeGraph(projectRoot, graph);
  await store.writeConfig(projectRoot, config);

  return { projectRoot, scanRoot, index, graph };
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

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

export interface IndexOptions {
  exclude?: string[];
  include?: string[];
}

export async function indexProject(
  startDir: string,
  scanPath = ".",
  options: IndexOptions = {},
): Promise<IndexResult> {
  const absoluteStart = path.resolve(startDir);
  const projectRoot = (await store.findProjectRoot(absoluteStart)) ?? absoluteStart;

  if (!(await store.isInitialized(projectRoot))) {
    throw new StateError(`No FFVS project found near ${absoluteStart}. Run \`ffvs init\` first.`);
  }

  const scanRoot = path.resolve(projectRoot, scanPath);
  const config = await store.readConfig(projectRoot);

  const exclude = mergeUnique(config.exclude ?? [], options.exclude ?? []);
  const include = options.include?.length
    ? options.include
    : (config.include ?? []);

  const { index, graph } = await buildProjectIndex(scanRoot, {
    ...(exclude.length > 0 ? { exclude } : {}),
    ...(include.length > 0 ? { include } : {}),
  });

  config.lastIndexedAt = index.indexedAt;
  config.indexRoot = toPosix(path.relative(projectRoot, scanRoot) || ".");
  if (options.exclude?.length) {
    config.exclude = mergeUnique(config.exclude ?? [], options.exclude);
  }
  if (options.include?.length) {
    config.include = options.include;
  }

  await store.writeIndex(projectRoot, index);
  await store.writeGraph(projectRoot, graph);
  await store.writeConfig(projectRoot, config);

  return { projectRoot, scanRoot, index, graph };
}

function mergeUnique(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

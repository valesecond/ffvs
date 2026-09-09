import fs from "node:fs/promises";
import path from "node:path";

import {
  CONFIG_FILE,
  FFVS_DIR,
  GRAPH_FILE,
  INDEX_FILE,
  type FfvsConfig,
  type ProjectIndex,
  type SemanticGraph,
} from "../../core/domain/types.js";
import { StateError } from "../../core/domain/errors.js";

export function ffvsDir(projectRoot: string): string {
  return path.join(projectRoot, FFVS_DIR);
}

export function configPath(projectRoot: string): string {
  return path.join(ffvsDir(projectRoot), CONFIG_FILE);
}

export function indexPath(projectRoot: string): string {
  return path.join(ffvsDir(projectRoot), INDEX_FILE);
}

export function graphPath(projectRoot: string): string {
  return path.join(ffvsDir(projectRoot), GRAPH_FILE);
}

export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function isInitialized(projectRoot: string): Promise<boolean> {
  return exists(configPath(projectRoot));
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeConfig(projectRoot: string, config: FfvsConfig): Promise<void> {
  await writeJson(configPath(projectRoot), config);
}

export async function readConfig(projectRoot: string): Promise<FfvsConfig> {
  if (!(await isInitialized(projectRoot))) {
    throw new StateError(`No FFVS project found in ${projectRoot}. Run \`ffvs init\` first.`);
  }
  return readJson<FfvsConfig>(configPath(projectRoot));
}

export async function writeIndex(projectRoot: string, index: ProjectIndex): Promise<void> {
  await writeJson(indexPath(projectRoot), index);
}

export async function readIndex(projectRoot: string): Promise<ProjectIndex | null> {
  if (!(await exists(indexPath(projectRoot)))) {
    return null;
  }
  return readJson<ProjectIndex>(indexPath(projectRoot));
}

export async function writeGraph(projectRoot: string, graph: SemanticGraph): Promise<void> {
  await writeJson(graphPath(projectRoot), graph);
}

export async function readGraph(projectRoot: string): Promise<SemanticGraph | null> {
  if (!(await exists(graphPath(projectRoot)))) {
    return null;
  }
  return readJson<SemanticGraph>(graphPath(projectRoot));
}

/**
 * Resolve the FFVS project root by walking up from `startDir` until `.ffvs/config.json` is found.
 */
export async function findProjectRoot(startDir: string): Promise<string | null> {
  let current = path.resolve(startDir);
  for (;;) {
    if (await isInitialized(current)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

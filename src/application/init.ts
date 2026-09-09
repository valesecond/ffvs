import path from "node:path";

import * as store from "../adapters/storage/ffvs-store.js";
import { StateError } from "../core/domain/errors.js";
import type { FfvsConfig } from "../core/domain/types.js";

export interface InitResult {
  projectRoot: string;
  config: FfvsConfig;
  created: boolean;
}

export async function initProject(
  targetDir: string,
  options: { force?: boolean; name?: string } = {},
): Promise<InitResult> {
  const projectRoot = path.resolve(targetDir);

  if (await store.isInitialized(projectRoot)) {
    if (!options.force) {
      throw new StateError(
        `FFVS is already initialized in ${path.join(projectRoot, ".ffvs")}. Use --force to reinitialize.`,
      );
    }
  }

  const now = new Date().toISOString();
  const config: FfvsConfig = {
    version: 1,
    name: options.name ?? path.basename(projectRoot),
    createdAt: now,
    lastIndexedAt: null,
    indexRoot: ".",
    include: [],
    exclude: [],
  };

  await store.writeConfig(projectRoot, config);

  return { projectRoot, config, created: true };
}

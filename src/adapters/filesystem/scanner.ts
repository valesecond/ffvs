import fs from "node:fs/promises";
import path from "node:path";

import { DEFAULT_SKIP_DIRS } from "../../core/domain/types.js";

export interface ScannedFile {
  absolutePath: string;
  relativePath: string;
  extension: string;
  sizeBytes: number;
}

export interface ScanOptions {
  rootDir: string;
  skipDirectoryNames?: Set<string>;
}

export async function scanDirectory(options: ScanOptions): Promise<ScannedFile[]> {
  const skip = options.skipDirectoryNames ?? DEFAULT_SKIP_DIRS;
  const rootDir = path.resolve(options.rootDir);
  const results: ScannedFile[] = [];

  async function walk(current: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (skip.has(entry.name)) {
          continue;
        }
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const stat = await fs.stat(absolutePath);
      results.push({
        absolutePath,
        relativePath: toPosix(path.relative(rootDir, absolutePath)),
        extension: path.extname(entry.name).toLowerCase(),
        sizeBytes: stat.size,
      });
    }
  }

  await walk(rootDir);
  results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return results;
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

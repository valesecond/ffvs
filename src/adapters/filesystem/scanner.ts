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
  /** Extra directory names or path substrings to skip. */
  excludePatterns?: string[];
  /** If non-empty, only keep relative paths that match at least one prefix/substring. */
  includePatterns?: string[];
}

export async function scanDirectory(options: ScanOptions): Promise<ScannedFile[]> {
  const skip = options.skipDirectoryNames ?? DEFAULT_SKIP_DIRS;
  const excludePatterns = options.excludePatterns ?? [];
  const includePatterns = options.includePatterns ?? [];
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
        if (skip.has(entry.name) || shouldExcludeDir(entry.name, absolutePath, rootDir, excludePatterns)) {
          continue;
        }
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const relativePath = toPosix(path.relative(rootDir, absolutePath));
      if (isExcludedPath(relativePath, excludePatterns)) {
        continue;
      }
      if (includePatterns.length > 0 && !matchesAny(relativePath, includePatterns)) {
        continue;
      }

      const stat = await fs.stat(absolutePath);
      results.push({
        absolutePath,
        relativePath,
        extension: path.extname(entry.name).toLowerCase(),
        sizeBytes: stat.size,
      });
    }
  }

  await walk(rootDir);
  results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return results;
}

function shouldExcludeDir(
  name: string,
  absolutePath: string,
  rootDir: string,
  patterns: string[],
): boolean {
  const relative = toPosix(path.relative(rootDir, absolutePath));
  return patterns.some((pattern) => {
    const p = normalizePattern(pattern);
    return name === p || relative === p || relative.startsWith(`${p}/`);
  });
}

function isExcludedPath(relativePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const p = normalizePattern(pattern);
    return relativePath === p || relativePath.startsWith(`${p}/`) || relativePath.includes(`/${p}/`);
  });
}

function matchesAny(relativePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const p = normalizePattern(pattern);
    return relativePath === p || relativePath.startsWith(`${p}/`) || relativePath.includes(`/${p}`);
  });
}

function normalizePattern(pattern: string): string {
  return pattern
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/\/\*\*$/, "")
    .replace(/\*\*/g, "")
    .replace(/\/\*$/, "")
    .replace(/\/+$/, "");
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

import path from "node:path";

import type { ModuleResolutionResult, ModuleResolverContext } from "./types.js";

const SOURCE_EXTS = [
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".json",
] as const;

/**
 * Resolve a module specifier relative to an importing file.
 *
 * Policy (ADR-0009):
 * - Bare specifiers (not starting with `.` or `/`) → EXTERNAL.
 * - Relative/absolute-in-project: try ordered candidates; first existing file wins.
 * - Extensionless: append common source extensions + index variants.
 * - `.js` / `.mjs` / `.cjs` suffixes also try TypeScript counterparts (.ts/.tsx/.mts/.cts).
 * - Directory imports: look for index.* inside the directory.
 * - If no candidate exists → UNRESOLVED (not EXTERNAL).
 * - If multiple candidates share the same priority tier → AMBIGUOUS.
 */
export function resolveModule(
  fromFile: string,
  specifier: string,
  context: ModuleResolverContext,
): ModuleResolutionResult {
  const from = toPosix(fromFile);
  const base: Omit<
    ModuleResolutionResult,
    "status" | "resolvedPath" | "ambiguousPaths" | "reason" | "candidatesChecked"
  > = {
    specifier,
    fromFile: from,
  };

  if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
    return {
      ...base,
      status: "EXTERNAL",
      resolvedPath: null,
      candidatesChecked: [],
      ambiguousPaths: [],
      reason: "Bare specifier treated as external package/module",
    };
  }

  const fromDir = path.posix.dirname(from);
  const joined = path.posix.normalize(path.posix.join(fromDir, specifier));
  const tiers = buildCandidateTiers(joined, specifier);
  const candidatesChecked: string[] = [];
  const matchedByTier: string[][] = [];

  for (const tier of tiers) {
    const hits: string[] = [];
    for (const candidate of tier) {
      candidatesChecked.push(candidate);
      if (context.files.has(candidate)) {
        hits.push(candidate);
      }
    }
    if (hits.length === 1) {
      return {
        ...base,
        status: "RESOLVED",
        resolvedPath: hits[0]!,
        candidatesChecked,
        ambiguousPaths: [],
        reason: null,
      };
    }
    if (hits.length > 1) {
      matchedByTier.push(hits);
      return {
        ...base,
        status: "AMBIGUOUS",
        resolvedPath: null,
        candidatesChecked,
        ambiguousPaths: hits,
        reason: `Multiple files matched at the same priority: ${hits.join(", ")}`,
      };
    }
  }

  return {
    ...base,
    status: "UNRESOLVED",
    resolvedPath: null,
    candidatesChecked,
    ambiguousPaths: [],
    reason: `No file matched specifier "${specifier}" from "${from}"`,
  };
}

function buildCandidateTiers(joined: string, specifier: string): string[][] {
  const ext = path.posix.extname(joined).toLowerCase();
  const tiers: string[][] = [];

  // Tier 0: exact path as written.
  tiers.push([joined]);

  // Tier 1: TypeScript ESM extension substitution for .js/.mjs/.cjs
  if (ext === ".js") {
    const stem = joined.slice(0, -3);
    tiers.push([`${stem}.ts`, `${stem}.tsx`, `${stem}.jsx`]);
  } else if (ext === ".mjs") {
    const stem = joined.slice(0, -4);
    tiers.push([`${stem}.mts`, `${stem}.ts`]);
  } else if (ext === ".cjs") {
    const stem = joined.slice(0, -4);
    tiers.push([`${stem}.cts`, `${stem}.js`]);
  }

  // Tier 2: extensionless file (CJS / bare relative)
  if (ext === "") {
    tiers.push(SOURCE_EXTS.map((e) => `${joined}${e}`));
  }

  // Tier 3: directory index (extensionless or explicit directory-like)
  if (ext === "") {
    tiers.push([
      `${joined}/index.js`,
      `${joined}/index.ts`,
      `${joined}/index.tsx`,
      `${joined}/index.mjs`,
      `${joined}/index.mts`,
      `${joined}/index.cjs`,
      `${joined}/index.cts`,
      `${joined}/index.jsx`,
    ]);
  }

  // Tier 4: if specifier ends with slash-like intent already covered; also try
  // stripping a trailing slash (normalize usually removes it).
  void specifier;

  return tiers;
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

/**
 * Formal metric used by EXP-0002 / status:
 *
 *   internal_import_resolution_rate =
 *     resolved_relative / (resolved_relative + unresolved_relative + ambiguous_relative)
 *
 * EXTERNAL (bare packages) are excluded from the denominator.
 */
export function internalImportResolutionRate(counts: {
  resolved: number;
  unresolved: number;
  ambiguous: number;
}): number | null {
  const denom = counts.resolved + counts.unresolved + counts.ambiguous;
  if (denom === 0) {
    return null;
  }
  return counts.resolved / denom;
}

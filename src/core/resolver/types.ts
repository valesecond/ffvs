export type ResolutionStatus = "RESOLVED" | "EXTERNAL" | "UNRESOLVED" | "AMBIGUOUS";

export interface ModuleResolutionResult {
  status: ResolutionStatus;
  /** Specifier as written in source. */
  specifier: string;
  /** File that contained the import (posix project-relative). */
  fromFile: string;
  /** Resolved project-relative file path when status is RESOLVED. */
  resolvedPath: string | null;
  /** Candidates inspected during resolution (posix). */
  candidatesChecked: string[];
  /** When AMBIGUOUS, the equally ranked matches. */
  ambiguousPaths: string[];
  /** Human-readable reason for non-RESOLVED outcomes. */
  reason: string | null;
}

export interface ModuleResolverContext {
  /** Set of project-relative posix file paths present in the index. */
  files: ReadonlySet<string>;
}

/** FFVS Query Language AST (v1.0). Execution-free. */

export type EntityKindName =
  | "functions"
  | "classes"
  | "files"
  | "modules"
  | "methods"
  | "variables"
  | "entities"
  | "function"
  | "class"
  | "file"
  | "module"
  | "method"
  | "variable";

export type MatcherOp = "contains" | "eq" | "prefix";

export type TraverseRelationName =
  | "imports"
  | "exports"
  | "contains"
  | "declares"
  | "calls"
  | "extends"
  | "implements"
  | "callers"
  | "dependents"
  | "dependencies"
  | "deps"
  | "children"
  | "parents";

export type TraverseDirection = "inbound" | "outbound";

/** Relations allowed for PATH `along` (v0.2: IMPORTS only, matching CLI). */
export type PathAlongRelation = "imports";

/** IMPACT along: default imports; calls is explicit CALL-graph impact (v0.3). */
export type ImpactAlongRelation = "imports" | "calls";

export type ResolutionStateName = "resolved" | "ambiguous" | "unresolved" | "external";

export interface SourceSpan {
  line: number;
  column: number;
}

export interface SelectStage {
  type: "select";
  kind: EntityKindName;
  span: SourceSpan;
}

export interface WhereStage {
  type: "where";
  field: "name" | "path";
  op: MatcherOp;
  value: string;
  span: SourceSpan;
}

export interface SearchStage {
  type: "search";
  needle: string;
  kind?: EntityKindName;
  path?: string;
  span: SourceSpan;
}

export interface TraverseStage {
  type: "traverse";
  relation: TraverseRelationName;
  direction?: TraverseDirection;
  /** Opt-in edge resolution filter (relation property — not entity). */
  resolution?: ResolutionStateName;
  span: SourceSpan;
}

export interface DescribeStage {
  type: "describe";
  span: SourceSpan;
}

export interface PathStage {
  type: "path";
  from?: string;
  to: string;
  along: PathAlongRelation;
  span: SourceSpan;
}

export interface ImpactStage {
  type: "impact";
  along: ImpactAlongRelation;
  /** For along calls: defaults to resolved when omitted. Ignored for imports (already resolved-internal). */
  resolution?: ResolutionStateName;
  span: SourceSpan;
}

export type QueryStage =
  SelectStage | WhereStage | SearchStage | TraverseStage | DescribeStage | PathStage | ImpactStage;

export interface QueryAst {
  languageVersion: "1.0";
  stages: QueryStage[];
}

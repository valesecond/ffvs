/** FFVS Query Language AST (v0.1). Execution-free. */

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
  span: SourceSpan;
}

export interface DescribeStage {
  type: "describe";
  span: SourceSpan;
}

export type QueryStage = SelectStage | WhereStage | SearchStage | TraverseStage | DescribeStage;

export interface QueryAst {
  languageVersion: "0.1";
  stages: QueryStage[];
}

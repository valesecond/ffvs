/** FFVS Query Language (DSL) — version 1.0 (product-stable surface). */

export const LANGUAGE_VERSION = "1.0" as const;

export type {
  QueryAst,
  QueryStage,
  SelectStage,
  WhereStage,
  SearchStage,
  TraverseStage,
  DescribeStage,
  PathStage,
  ImpactStage,
  EntityKindName,
  MatcherOp,
  TraverseRelationName,
  TraverseDirection,
  PathAlongRelation,
  ImpactAlongRelation,
  ResolutionStateName,
} from "./ast.js";

export { lex, type Token, type TokenKind } from "./lexer.js";
export { parse, parseQuery } from "./parser.js";
export { executeQuery, type ExecuteContext } from "./executor.js";
export {
  emptyResultSet,
  tallyResolutions,
  type QueryResultSet,
  type QueryDiagnostics,
  type EntityDescription,
  type PathRecord,
  type ImpactRecord,
} from "./result-set.js";
export { LanguageError, type LanguageErrorKind } from "./errors.js";
export { resolveTraverse } from "./traverse-map.js";
export { compareEntities, compareEdges, normalizePathKey } from "./ordering.js";

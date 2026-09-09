/** FFVS Query Language (DSL) — version 0.3 (resolution-aware traverse + CALL impact). */

export const LANGUAGE_VERSION = "0.3" as const;

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

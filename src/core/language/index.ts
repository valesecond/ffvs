/** FFVS Query Language (DSL) — version 0.1 thin slice. */

export const LANGUAGE_VERSION = "0.1" as const;

export type {
  QueryAst,
  QueryStage,
  SelectStage,
  WhereStage,
  SearchStage,
  TraverseStage,
  DescribeStage,
  EntityKindName,
  MatcherOp,
  TraverseRelationName,
  TraverseDirection,
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
} from "./result-set.js";
export { LanguageError, type LanguageErrorKind } from "./errors.js";
export { resolveTraverse } from "./traverse-map.js";

import type {
  EntityKindName,
  ImpactAlongRelation,
  MatcherOp,
  PathAlongRelation,
  QueryAst,
  QueryStage,
  ResolutionStateName,
  TraverseDirection,
  TraverseRelationName,
} from "./ast.js";
import { LanguageError } from "./errors.js";
import { lex, type Token, type TokenKind } from "./lexer.js";

const ENTITY_KINDS = new Set<string>([
  "functions",
  "classes",
  "files",
  "modules",
  "methods",
  "variables",
  "entities",
  "function",
  "class",
  "file",
  "module",
  "method",
  "variable",
]);

const RELATIONS = new Set<string>([
  "imports",
  "exports",
  "contains",
  "declares",
  "calls",
  "extends",
  "implements",
  "callers",
  "dependents",
  "dependencies",
  "deps",
  "children",
  "parents",
]);

const PATH_ALONG = new Set<string>(["imports"]);
const IMPACT_ALONG = new Set<string>(["imports", "calls"]);
const RESOLUTION_STATES = new Set<string>(["resolved", "ambiguous", "unresolved", "external"]);

export function parseQuery(source: string): QueryAst {
  const tokens = lex(source);
  let pos = 0;

  const current = (): Token => tokens[pos]!;
  const at = (kind: TokenKind): boolean => current().kind === kind;
  const consume = (kind: TokenKind, message: string): Token => {
    if (!at(kind)) {
      throw new LanguageError("PARSE", message, { line: current().line, column: current().column });
    }
    const token = current();
    pos += 1;
    return token;
  };
  const advance = (): Token => {
    const token = current();
    pos += 1;
    return token;
  };
  const takeWord = (): Token => {
    if (current().kind === "EOF") {
      throw new LanguageError("PARSE", "unexpected end of query", {
        line: current().line,
        column: current().column,
      });
    }
    return advance();
  };

  const stages: QueryStage[] = [];

  if (!at("SELECT") && !at("SEARCH") && !at("PATH")) {
    throw new LanguageError(
      "PARSE",
      `expected select, search, or path, got ${describeToken(current())}`,
      { line: current().line, column: current().column },
      'queries must start with select <kind>, search "…", or path "A" "B"',
    );
  }

  while (!at("EOF")) {
    if (at("SELECT")) {
      stages.push(parseSelect());
      continue;
    }
    if (at("SEARCH")) {
      stages.push(parseSearch());
      continue;
    }
    if (at("WHERE")) {
      stages.push(parseWhere());
      continue;
    }
    if (at("TRAVERSE")) {
      stages.push(parseTraverse());
      continue;
    }
    if (at("PATH")) {
      stages.push(parsePath());
      continue;
    }
    if (at("IMPACT")) {
      stages.push(parseImpact());
      continue;
    }
    if (at("DESCRIBE")) {
      const tok = advance();
      stages.push({ type: "describe", span: { line: tok.line, column: tok.column } });
      continue;
    }
    throw new LanguageError(
      "PARSE",
      `unexpected token '${describeToken(current())}'`,
      { line: current().line, column: current().column },
      "expected where, traverse, path, impact, describe, select, or search",
    );
  }

  return { languageVersion: "0.3", stages };

  function parseSelect(): QueryStage {
    const tok = consume("SELECT", 'expected "select"');
    const kindTok = takeWord();
    const kindValue = kindTok.value.toLowerCase();
    if (!ENTITY_KINDS.has(kindValue)) {
      throw new LanguageError(
        "SEMANTIC",
        `unknown entity kind "${kindTok.value}"`,
        { line: kindTok.line, column: kindTok.column },
        "supported: functions, classes, files, modules, methods, variables, entities",
      );
    }
    return {
      type: "select",
      kind: kindValue as EntityKindName,
      span: { line: tok.line, column: tok.column },
    };
  }

  function parseSearch(): QueryStage {
    const tok = consume("SEARCH", 'expected "search"');
    const needle = consume("STRING", 'expected string after "search"').value;
    let kind: EntityKindName | undefined;
    let path: string | undefined;
    while (at("KIND") || at("PATH")) {
      if (at("KIND")) {
        advance();
        const kindTok = takeWord();
        const kindValue = kindTok.value.toLowerCase();
        if (!ENTITY_KINDS.has(kindValue)) {
          throw new LanguageError("SEMANTIC", `unknown entity kind "${kindTok.value}"`, {
            line: kindTok.line,
            column: kindTok.column,
          });
        }
        kind = kindValue as EntityKindName;
        continue;
      }
      // search … path "…"
      advance();
      path = consume("STRING", 'expected string after "path"').value;
    }
    return {
      type: "search",
      needle,
      ...(kind !== undefined ? { kind } : {}),
      ...(path !== undefined ? { path } : {}),
      span: { line: tok.line, column: tok.column },
    };
  }

  function parseWhere(): QueryStage {
    const tok = consume("WHERE", 'expected "where"');
    let field: "name" | "path";
    if (at("NAME")) {
      advance();
      field = "name";
    } else if (at("PATH")) {
      advance();
      field = "path";
    } else {
      throw new LanguageError("PARSE", 'expected "name" or "path" after where', {
        line: current().line,
        column: current().column,
      });
    }

    let op: MatcherOp;
    if (at("CONTAINS")) {
      advance();
      op = "contains";
    } else if (at("EQ") || at("EQUALS")) {
      advance();
      op = "eq";
    } else if (at("PREFIX")) {
      advance();
      op = "prefix";
    } else {
      throw new LanguageError("PARSE", "expected contains, eq/=, or prefix", {
        line: current().line,
        column: current().column,
      });
    }

    const value = consume(
      "STRING",
      `expected string after "${op === "eq" ? "=" : op}"`,
    ).value;
    return {
      type: "where",
      field,
      op,
      value,
      span: { line: tok.line, column: tok.column },
    };
  }

  function parseTraverse(): QueryStage {
    const tok = consume("TRAVERSE", 'expected "traverse"');
    const relTok = takeWord();
    const relValue = relTok.value.toLowerCase();
    if (!RELATIONS.has(relValue)) {
      throw new LanguageError(
        "SEMANTIC",
        `unknown relation "${relTok.value}"`,
        { line: relTok.line, column: relTok.column },
        `supported: ${[...RELATIONS].join(", ")}`,
      );
    }

    let direction: TraverseDirection | undefined;
    if (at("INBOUND") || at("OUTBOUND")) {
      direction = advance().value as TraverseDirection;
    }

    const resolution = parseOptionalResolution();

    return {
      type: "traverse",
      relation: relValue as TraverseRelationName,
      ...(direction !== undefined ? { direction } : {}),
      ...(resolution !== undefined ? { resolution } : {}),
      span: { line: tok.line, column: tok.column },
    };
  }

  function parseOptionalResolution(): ResolutionStateName | undefined {
    if (!at("RESOLUTION")) {
      return undefined;
    }
    advance();
    const stateTok = takeWord();
    const state = stateTok.value.toLowerCase();
    if (!RESOLUTION_STATES.has(state)) {
      throw new LanguageError(
        "SEMANTIC",
        `unknown resolution state "${stateTok.value}"`,
        { line: stateTok.line, column: stateTok.column },
        "supported: resolved, ambiguous, unresolved, external",
      );
    }
    return state as ResolutionStateName;
  }

  function parseImpact(): QueryStage {
    const tok = consume("IMPACT", 'expected "impact"');
    let along: ImpactAlongRelation = "imports";
    let resolution: ResolutionStateName | undefined;

    if (at("ALONG")) {
      advance();
      const relTok = takeWord();
      const rel = relTok.value.toLowerCase();
      if (!IMPACT_ALONG.has(rel)) {
        throw new LanguageError(
          "SEMANTIC",
          `unsupported impact relation "${relTok.value}"`,
          { line: relTok.line, column: relTok.column },
          "supported: along imports, along calls",
        );
      }
      along = rel as ImpactAlongRelation;
    }

    resolution = parseOptionalResolution();
    if (along === "imports" && resolution !== undefined) {
      throw new LanguageError(
        "SEMANTIC",
        "resolution filter is not applicable to import impact (already resolved-internal)",
        { line: tok.line, column: tok.column },
        'use: impact along calls [resolution …]',
      );
    }
    if (along === "calls" && resolution === undefined) {
      resolution = "resolved";
    }

    return {
      type: "impact",
      along,
      ...(resolution !== undefined ? { resolution } : {}),
      span: { line: tok.line, column: tok.column },
    };
  }

  function parseAlong(): PathAlongRelation {
    if (!at("ALONG")) {
      return "imports";
    }
    advance();
    const relTok = takeWord();
    const rel = relTok.value.toLowerCase();
    if (!PATH_ALONG.has(rel)) {
      throw new LanguageError(
        "SEMANTIC",
        `unsupported path relation "${relTok.value}"`,
        { line: relTok.line, column: relTok.column },
        "v0.3 path supports only: along imports",
      );
    }
    return rel as PathAlongRelation;
  }

  function parsePath(): QueryStage {
    const tok = consume("PATH", 'expected "path"');

    // path from "A" to "B" [along imports]
    if (at("FROM")) {
      advance();
      const from = consume("STRING", 'expected string after "from"').value;
      consume("TO", 'expected "to" after path from');
      const to = consume("STRING", 'expected string after "to"').value;
      const along = parseAlong();
      return {
        type: "path",
        from,
        to,
        along,
        span: { line: tok.line, column: tok.column },
      };
    }

    // path to "B" [along imports]  OR  path "B" … OR path "A" "B"
    if (at("TO")) {
      advance();
      const to = consume("STRING", 'expected string after "to"').value;
      const along = parseAlong();
      return {
        type: "path",
        to,
        along,
        span: { line: tok.line, column: tok.column },
      };
    }

    const first = consume("STRING", 'expected string after "path"').value;
    if (at("STRING")) {
      const to = advance().value;
      const along = parseAlong();
      return {
        type: "path",
        from: first,
        to,
        along,
        span: { line: tok.line, column: tok.column },
      };
    }

    const along = parseAlong();
    return {
      type: "path",
      to: first,
      along,
      span: { line: tok.line, column: tok.column },
    };
  }
}

export function parse(source: string): QueryAst {
  return parseQuery(source);
}

function describeToken(token: Token): string {
  if (token.kind === "STRING") {
    return `"${token.value}"`;
  }
  if (token.kind === "EOF") {
    return "end of input";
  }
  return token.value || token.kind.toLowerCase();
}

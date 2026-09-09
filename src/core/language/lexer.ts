import { LanguageError } from "./errors.js";

export type TokenKind =
  | "SELECT"
  | "WHERE"
  | "SEARCH"
  | "TRAVERSE"
  | "DESCRIBE"
  | "PATH"
  | "IMPACT"
  | "TO"
  | "FROM"
  | "ALONG"
  | "RESOLUTION"
  | "RESOLVED"
  | "AMBIGUOUS"
  | "UNRESOLVED"
  | "EXTERNAL"
  | "KIND"
  | "NAME"
  | "CONTAINS"
  | "EQ"
  | "PREFIX"
  | "INBOUND"
  | "OUTBOUND"
  | "IDENT"
  | "STRING"
  | "EQUALS"
  | "EOF";

export interface Token {
  kind: TokenKind;
  value: string;
  line: number;
  column: number;
}

const KEYWORDS: Record<string, TokenKind> = {
  select: "SELECT",
  where: "WHERE",
  search: "SEARCH",
  traverse: "TRAVERSE",
  describe: "DESCRIBE",
  path: "PATH",
  impact: "IMPACT",
  to: "TO",
  from: "FROM",
  along: "ALONG",
  resolution: "RESOLUTION",
  resolved: "RESOLVED",
  ambiguous: "AMBIGUOUS",
  unresolved: "UNRESOLVED",
  external: "EXTERNAL",
  kind: "KIND",
  name: "NAME",
  contains: "CONTAINS",
  eq: "EQ",
  prefix: "PREFIX",
  inbound: "INBOUND",
  outbound: "OUTBOUND",
};

export function lex(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let column = 1;

  const peek = (): string => source[i] ?? "";
  const advance = (): string => {
    const ch = source[i] ?? "";
    i += 1;
    if (ch === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
    return ch;
  };

  while (i < source.length) {
    const ch = peek();

    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      advance();
      continue;
    }

    if (ch === "=") {
      tokens.push({ kind: "EQUALS", value: "=", line, column });
      advance();
      continue;
    }

    if (ch === '"') {
      const startLine = line;
      const startCol = column;
      advance(); // opening "
      let value = "";
      while (i < source.length && peek() !== '"') {
        if (peek() === "\\") {
          advance();
          const esc = peek();
          if (esc === '"' || esc === "\\") {
            value += esc;
            advance();
          } else if (esc === "n") {
            value += "\n";
            advance();
          } else {
            throw new LanguageError(
              "LEXICAL",
              `invalid escape sequence \\${esc}`,
              { line, column },
              'supported escapes: \\", \\\\, \\n',
            );
          }
          continue;
        }
        if (peek() === "\n") {
          throw new LanguageError("LEXICAL", "unterminated string", {
            line: startLine,
            column: startCol,
          });
        }
        value += advance();
      }
      if (peek() !== '"') {
        throw new LanguageError("LEXICAL", "unterminated string", {
          line: startLine,
          column: startCol,
        });
      }
      advance(); // closing "
      tokens.push({ kind: "STRING", value, line: startLine, column: startCol });
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      const startLine = line;
      const startCol = column;
      let value = "";
      while (/[A-Za-z0-9_./-]/.test(peek())) {
        value += advance();
      }
      const lower = value.toLowerCase();
      const kw = KEYWORDS[lower];
      if (kw) {
        tokens.push({ kind: kw, value: lower, line: startLine, column: startCol });
      } else {
        tokens.push({ kind: "IDENT", value, line: startLine, column: startCol });
      }
      continue;
    }

    throw new LanguageError(
      "LEXICAL",
      `unexpected character '${ch}'`,
      { line, column },
      "expected keyword, identifier, string, or =",
    );
  }

  tokens.push({ kind: "EOF", value: "", line, column });
  return tokens;
}

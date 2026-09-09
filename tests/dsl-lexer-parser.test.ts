import { describe, expect, it } from "vitest";

import { LanguageError, lex, parse, parseQuery } from "../src/core/language/index.js";

describe("DSL lexer", () => {
  it("tokenizes keywords, strings, equals, and EOF", () => {
    const tokens = lex('select functions where name contains "resolve" describe');
    expect(tokens.map((t) => t.kind)).toEqual([
      "SELECT",
      "IDENT",
      "WHERE",
      "NAME",
      "CONTAINS",
      "STRING",
      "DESCRIBE",
      "EOF",
    ]);
    expect(tokens.find((t) => t.kind === "STRING")?.value).toBe("resolve");
  });

  it("recognizes = as EQUALS", () => {
    const tokens = lex('where name = "X"');
    expect(tokens.map((t) => t.kind)).toContain("EQUALS");
  });

  it("rejects invalid characters", () => {
    expect(() => lex("select functions @")).toThrow(LanguageError);
  });

  it("rejects unterminated strings", () => {
    expect(() => lex('search "oops')).toThrow(LanguageError);
  });
});

describe("DSL parser", () => {
  it("parses select where traverse describe", () => {
    const ast = parseQuery(
      'select functions where name contains "resolve" traverse callers describe',
    );
    expect(ast.languageVersion).toBe("1.0");
    expect(ast.stages.map((s) => s.type)).toEqual(["select", "where", "traverse", "describe"]);
  });

  it("parses search with kind", () => {
    const ast = parse('search "safeParse" kind function describe');
    expect(ast.stages[0]).toMatchObject({ type: "search", needle: "safeParse", kind: "function" });
  });

  it("parses where name =", () => {
    const ast = parse('select modules where name = "common" describe');
    expect(ast.stages[1]).toMatchObject({
      type: "where",
      field: "name",
      op: "eq",
      value: "common",
    });
  });

  it("errors on incomplete where", () => {
    expect(() => parse("select functions where")).toThrow(LanguageError);
  });

  it("errors on unknown entity kind", () => {
    try {
      parse("select foobar");
      expect.fail("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(LanguageError);
      expect((error as LanguageError).kind).toBe("SEMANTIC");
    }
  });

  it("errors on unknown relation", () => {
    try {
      parse("select functions traverse nonexistentRelation");
      expect.fail("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(LanguageError);
      expect((error as LanguageError).kind).toBe("SEMANTIC");
    }
  });
});

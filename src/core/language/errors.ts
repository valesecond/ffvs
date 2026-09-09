import { FfvsError } from "../domain/errors.js";

export type LanguageErrorKind = "LEXICAL" | "PARSE" | "SEMANTIC" | "EXECUTION";

export class LanguageError extends FfvsError {
  readonly kind: LanguageErrorKind;
  readonly line: number;
  readonly column: number;
  readonly hint?: string;

  constructor(
    kind: LanguageErrorKind,
    message: string,
    position: { line: number; column: number },
    hint?: string,
  ) {
    const loc = `line ${position.line}, column ${position.column}`;
    const full = hint
      ? `${kind === "LEXICAL" ? "Lexical" : kind === "PARSE" ? "Parse" : kind === "SEMANTIC" ? "Semantic" : "Execution"} error at ${loc}:\n${message}\nHint: ${hint}`
      : `${kind === "LEXICAL" ? "Lexical" : kind === "PARSE" ? "Parse" : kind === "SEMANTIC" ? "Semantic" : "Execution"} error at ${loc}:\n${message}`;
    super(full, 1);
    this.name = "LanguageError";
    this.kind = kind;
    this.line = position.line;
    this.column = position.column;
    if (hint !== undefined) {
      this.hint = hint;
    }
  }
}

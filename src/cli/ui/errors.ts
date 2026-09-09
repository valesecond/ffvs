import { LanguageError } from "../../core/language/errors.js";
import { FfvsError } from "../../core/domain/errors.js";
import { icons } from "./icons.js";
import { indent, joinBlocks } from "./layout.js";
import { theme } from "./theme.js";

function kindTitle(kind: LanguageError["kind"]): string {
  switch (kind) {
    case "LEXICAL":
      return "Lexical error";
    case "PARSE":
      return "Parse error";
    case "SEMANTIC":
      return "Semantic error";
    default:
      return "Execution error";
  }
}

export function renderLanguageError(error: LanguageError): string {
  const body = error.message
    .replace(/^(Lexical|Parse|Semantic|Execution) error at line \d+, column \d+:\n?/, "")
    .trim();
  const parts = body.split(/\nHint:\s*/);
  const main = parts[0] ?? body;
  const hint = error.hint ?? parts[1];

  return joinBlocks(
    `${theme.error(icons().fail)} ${theme.error("Query failed")}`,
    "",
    ...indent([theme.warning(kindTitle(error.kind))]),
    "",
    ...indent(main.split("\n")),
    "",
    ...indent([theme.muted(`Line ${error.line}, column ${error.column}`)]),
    hint ? ["", ...indent([theme.muted(hint)])].join("\n") : null,
  );
}

export function renderCliError(error: unknown): string {
  if (error instanceof LanguageError) {
    return renderLanguageError(error);
  }
  if (error instanceof FfvsError) {
    const multiline = error.message.includes("\n");
    if (multiline) {
      return joinBlocks(
        `${theme.error(icons().fail)} ${theme.error("Error")}`,
        "",
        ...indent(error.message.split("\n")),
      );
    }
    return `${theme.error(icons().fail)} ${error.message}`;
  }
  const message = error instanceof Error ? error.message : String(error);
  return `${theme.error(icons().fail)} unexpected failure: ${message}`;
}

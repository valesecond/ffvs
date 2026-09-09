/**
 * Parse in-session command lines (FFVS › …).
 * Pure — no I/O. Used by InteractiveSession and tests.
 */

export type ParsedCommand =
  | { type: "quit" }
  | { type: "help" }
  | { type: "search"; query: string }
  | { type: "inspect"; target: string }
  | { type: "list"; kind: "files" | "modules" | "functions" | "classes" | "variables" }
  | {
      type: "relation";
      relation: "dependencies" | "dependents" | "calls" | "callers";
      target: string;
    }
  | { type: "impact"; target: string }
  | { type: "path"; from: string; to: string }
  | { type: "query"; source: string }
  | { type: "project" }
  | { type: "palette" }
  | { type: "unknown"; raw: string; hint: string };

export function parseSessionCommand(line: string): ParsedCommand {
  const trimmed = line.trim();
  if (!trimmed) {
    return { type: "unknown", raw: line, hint: "Empty command" };
  }

  const lower = trimmed.toLowerCase();
  if (lower === "q" || lower === "quit" || lower === "exit") {
    return { type: "quit" };
  }
  if (lower === "?" || lower === "help") {
    return { type: "help" };
  }
  if (lower === "project" || lower === "status") {
    return { type: "project" };
  }
  if (lower === "palette" || lower === "p") {
    return { type: "palette" };
  }

  for (const kind of ["files", "modules", "functions", "classes", "variables"] as const) {
    if (lower === kind) {
      return { type: "list", kind };
    }
  }

  const firstSpace = trimmed.indexOf(" ");
  const cmd = (firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)).toLowerCase();
  const rest = firstSpace === -1 ? "" : trimmed.slice(firstSpace + 1).trim();

  if (cmd === "search" || cmd === "s") {
    if (!rest) {
      return { type: "unknown", raw: line, hint: "Usage: search <query>" };
    }
    return { type: "search", query: unquote(rest) };
  }

  if (cmd === "inspect" || cmd === "i") {
    if (!rest) {
      return { type: "unknown", raw: line, hint: "Usage: inspect <entity>" };
    }
    return { type: "inspect", target: unquote(rest) };
  }

  const relationMap: Record<string, "dependencies" | "dependents" | "calls" | "callers"> = {
    dependencies: "dependencies",
    deps: "dependencies",
    dependents: "dependents",
    calls: "calls",
    callers: "callers",
  };
  if (cmd in relationMap) {
    const relation = relationMap[cmd]!;
    if (!rest) {
      return { type: "unknown", raw: line, hint: `Usage: ${relation} <entity>` };
    }
    return { type: "relation", relation, target: unquote(rest) };
  }

  if (cmd === "impact") {
    if (!rest) {
      return { type: "unknown", raw: line, hint: "Usage: impact <entity>" };
    }
    return { type: "impact", target: unquote(rest) };
  }

  if (cmd === "path") {
    const parts = splitArgs(rest);
    if (parts.length < 2) {
      return { type: "unknown", raw: line, hint: "Usage: path <from> <to>" };
    }
    return { type: "path", from: parts[0]!, to: parts[1]! };
  }

  if (cmd === "query") {
    if (!rest) {
      return { type: "unknown", raw: line, hint: "Usage: query <dsl>" };
    }
    return { type: "query", source: unquote(rest) };
  }

  return {
    type: "unknown",
    raw: line,
    hint: `Unknown command "${cmd}". Try help or : for the prompt.`,
  };
}

function unquote(s: string): string {
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1);
  }
  return s;
}

function splitArgs(s: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote: string | null = null;
  for (const ch of s) {
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (cur) {
        out.push(cur);
        cur = "";
      }
      continue;
    }
    cur += ch;
  }
  if (cur) {
    out.push(cur);
  }
  return out;
}

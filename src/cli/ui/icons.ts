import { getCaps } from "./terminal.js";
import { theme } from "./theme.js";

export type ResolutionVisual = "RESOLVED" | "AMBIGUOUS" | "UNRESOLVED" | "EXTERNAL" | "unknown";

interface IconSet {
  project: string;
  entity: string;
  file: string;
  module: string;
  fn: string;
  klass: string;
  ok: string;
  fail: string;
  warn: string;
  external: string;
  arrowOut: string;
  arrowIn: string;
  arrowDown: string;
  pipe: string;
  branch: string;
  last: string;
  space: string;
}

const UNICODE: IconSet = {
  project: "◆",
  entity: "●",
  file: "▪",
  module: "▣",
  fn: "ƒ",
  klass: "◆",
  ok: "✓",
  fail: "×",
  warn: "?",
  external: "○",
  arrowOut: "→",
  arrowIn: "←",
  arrowDown: "↓",
  pipe: "│",
  branch: "├─",
  last: "└─",
  space: "  ",
};

const ASCII: IconSet = {
  project: "*",
  entity: "*",
  file: "*",
  module: "#",
  fn: "f",
  klass: "*",
  ok: "[ok]",
  fail: "[x]",
  warn: "[?]",
  external: "[ext]",
  arrowOut: "->",
  arrowIn: "<-",
  arrowDown: "v",
  pipe: "|",
  branch: "|-",
  last: "`-",
  space: "  ",
};

export function icons(): IconSet {
  return getCaps().unicode ? UNICODE : ASCII;
}

export function kindIcon(kind: string): string {
  const i = icons();
  switch (kind) {
    case "FUNCTION":
    case "METHOD":
      return theme.accent(i.fn);
    case "CLASS":
      return theme.heading(i.klass);
    case "MODULE":
      return theme.accent(i.module);
    case "FILE":
      return theme.muted(i.file);
    default:
      return theme.accent(i.entity);
  }
}

export function resolutionIcon(state: ResolutionVisual): string {
  const i = icons();
  switch (state) {
    case "RESOLVED":
      return theme.resolved(i.ok);
    case "AMBIGUOUS":
      return theme.ambiguous(i.warn);
    case "UNRESOLVED":
      return theme.unresolved(i.fail);
    case "EXTERNAL":
      return theme.external(i.external);
    default:
      return theme.muted("·");
  }
}

export function resolutionLabel(state: ResolutionVisual): string {
  const i = icons();
  switch (state) {
    case "RESOLVED":
      return `${theme.resolved(i.ok)} Resolved`;
    case "AMBIGUOUS":
      return `${theme.ambiguous(i.warn)} Ambiguous`;
    case "UNRESOLVED":
      return `${theme.unresolved(i.fail)} Unresolved`;
    case "EXTERNAL":
      return `${theme.external(i.external)} External`;
    default:
      return theme.muted("Unknown");
  }
}

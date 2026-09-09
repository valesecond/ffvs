import { getCaps } from "./terminal.js";

const ANSI = {
  reset: "\u001b[0m",
  bold: "\u001b[1m",
  dim: "\u001b[2m",
  cyan: "\u001b[36m",
  blue: "\u001b[34m",
  blueBright: "\u001b[94m",
  green: "\u001b[32m",
  greenBright: "\u001b[92m",
  yellow: "\u001b[33m",
  red: "\u001b[31m",
  magenta: "\u001b[35m",
  whiteBright: "\u001b[97m",
  /** Subtle header strip (dark gray) */
  bgHeader: "\u001b[48;5;236m",
} as const;

function paint(code: string, text: string): string {
  if (!getCaps().color) {
    return text;
  }
  return `${code}${text}${ANSI.reset}`;
}

/** FFVS color system — cyan brand, semantic resolution colors. */
export const theme = {
  title: (s: string) => paint(ANSI.bold + ANSI.cyan, s),
  heading: (s: string) => paint(ANSI.cyan, s),
  accent: (s: string) => paint(ANSI.blueBright, s),
  muted: (s: string) => paint(ANSI.dim, s),
  text: (s: string) => s,
  bold: (s: string) => paint(ANSI.bold, s),
  success: (s: string) => paint(ANSI.green, s),
  successBright: (s: string) => paint(ANSI.greenBright, s),
  warning: (s: string) => paint(ANSI.yellow, s),
  error: (s: string) => paint(ANSI.red, s),
  entity: (s: string) => paint(ANSI.whiteBright, s),
  /** Paths / locations — soft cyan, secondary to names */
  path: (s: string) => paint(ANSI.dim + ANSI.cyan, s),
  relation: (s: string) => paint(ANSI.blue, s),
  resolved: (s: string) => paint(ANSI.green, s),
  ambiguous: (s: string) => paint(ANSI.yellow, s),
  unresolved: (s: string) => paint(ANSI.red, s),
  external: (s: string) => paint(ANSI.magenta, s),
  badge: (s: string) => paint(ANSI.bold + ANSI.blueBright, s),
  /** Table header row background */
  headerRow: (s: string) => {
    if (!getCaps().color) {
      return s;
    }
    return `${ANSI.bgHeader}${ANSI.bold}${s}${ANSI.reset}`;
  },
  flag: (s: string) => paint(ANSI.green, s),
};

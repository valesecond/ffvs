/**
 * Terminal capability detection for FFVS CLI presentation.
 * Never used for --json paths.
 */
export interface TerminalCaps {
  isTty: boolean;
  color: boolean;
  unicode: boolean;
  animate: boolean;
  columns: number;
  ci: boolean;
}

export function detectTerminal(
  stream: NodeJS.WriteStream = process.stdout,
  env: NodeJS.ProcessEnv = process.env,
): TerminalCaps {
  const ci = env["CI"] === "true" || env["CI"] === "1";
  const isTty = Boolean(stream.isTTY);
  const noColor = env["NO_COLOR"] !== undefined && env["NO_COLOR"] !== "";
  const forceColor = env["FORCE_COLOR"] !== undefined && env["FORCE_COLOR"] !== "0";
  const color = forceColor || (!noColor && isTty && !ci);
  // Prefer Unicode unless explicitly forced to ASCII or TERM=dumb.
  // Modern Windows (Terminal / ConPTY / VS Code) renders box-drawing fine.
  const unicodeSafe = env["FFVS_ASCII"] === "1" ? false : env["TERM"] === "dumb" ? false : true;

  const columns = stream.columns && stream.columns > 0 ? stream.columns : 80;

  return {
    isTty,
    color,
    unicode: unicodeSafe,
    animate: isTty && !ci && !noColor,
    columns: Math.max(40, Math.min(columns, 120)),
    ci,
  };
}

let cached: TerminalCaps | null = null;

/** Mutable for tests. */
export function getCaps(): TerminalCaps {
  if (!cached) {
    cached = detectTerminal();
  }
  return cached;
}

export function setCapsForTests(caps: TerminalCaps | null): void {
  cached = caps;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  if (max <= 1) {
    return "…";
  }
  return `${text.slice(0, max - 1)}…`;
}

export function padEnd(text: string, width: number): string {
  if (text.length >= width) {
    return text;
  }
  return text + " ".repeat(width - text.length);
}

export function padStart(text: string, width: number): string {
  if (text.length >= width) {
    return text;
  }
  return " ".repeat(width - text.length) + text;
}

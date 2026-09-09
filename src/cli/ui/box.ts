import { getCaps } from "./terminal.js";
import { theme } from "./theme.js";

/** Visible length ignoring ANSI escape sequences. */
export function stripAnsi(text: string): string {
  return text.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g"), "");
}

export function visibleWidth(text: string): number {
  return stripAnsi(text).length;
}

export function padVisible(text: string, width: number): string {
  const plain = visibleWidth(text);
  if (plain >= width) {
    return text;
  }
  return text + " ".repeat(width - plain);
}

export type BoxAccent = "cyan" | "green" | "muted";

function borderPaint(accent: BoxAccent): (s: string) => string {
  if (accent === "green") {
    return theme.success;
  }
  if (accent === "cyan") {
    return theme.heading;
  }
  return theme.muted;
}

/**
 * Draw a rounded (or ASCII) panel. Rows are padded to inner width.
 * Empty rows become blank interior lines.
 */
export function drawBox(
  rows: string[],
  opts?: { width?: number; accent?: BoxAccent; title?: string },
): string {
  const caps = getCaps();
  const maxInner = Math.min(opts?.width ?? Math.min(62, caps.columns - 2), caps.columns - 2);
  const accent = opts?.accent ?? "cyan";
  const paint = borderPaint(accent);
  const u = caps.unicode;
  const h = u ? "─" : "-";
  const v = u ? "│" : "|";
  const tl = u ? "╭" : "+";
  const tr = u ? "╮" : "+";
  const bl = u ? "╰" : "+";
  const br = u ? "╯" : "+";

  let contentWidth = 0;
  if (opts?.title) {
    contentWidth = Math.max(contentWidth, visibleWidth(opts.title) + 4);
  }
  for (const row of rows) {
    contentWidth = Math.max(contentWidth, visibleWidth(row));
  }
  if (contentWidth === 0) {
    contentWidth = Math.min(40, maxInner);
  }
  contentWidth = Math.min(Math.max(contentWidth, 20), maxInner);

  const edge = h.repeat(contentWidth);
  const lines: string[] = [];
  if (opts?.title) {
    const label = ` ${opts.title} `;
    const fill = Math.max(0, contentWidth - visibleWidth(label));
    const left = Math.floor(fill / 2);
    const right = fill - left;
    lines.push(
      paint(`${tl}${h.repeat(left)}`) + theme.title(label) + paint(`${h.repeat(right)}${tr}`),
    );
  } else {
    lines.push(paint(`${tl}${edge}${tr}`));
  }
  for (const row of rows) {
    const clipped = visibleWidth(row) > contentWidth ? truncateVisible(row, contentWidth) : row;
    lines.push(`${paint(v)}${padVisible(clipped, contentWidth)}${paint(v)}`);
  }
  lines.push(paint(`${bl}${edge}${br}`));
  return lines.join("\n");
}

function truncateVisible(text: string, max: number): string {
  if (visibleWidth(text) <= max) {
    return text;
  }
  // Prefer plain truncate when no ANSI
  const plain = stripAnsi(text);
  if (plain.length === text.length) {
    return max <= 1 ? "…" : `${plain.slice(0, max - 1)}…`;
  }
  // Fallback: strip and re-append ellipsis (lose color on overflow)
  return max <= 1 ? "…" : `${plain.slice(0, max - 1)}…`;
}

export function tip(text: string): string {
  return theme.muted(`Tip  ${text}`);
}

/** Footer hint with --json highlighted (command-mode lists). */
export function tipJson(): string {
  return `${theme.muted("Use ")}${theme.flag("--json")}${theme.muted(" for machine-readable output.")}`;
}

export function commandPrompt(cmd: string): string {
  const arrow = getCaps().unicode ? "→" : ">";
  return `${theme.accent(arrow)} ${theme.muted(cmd)}`;
}

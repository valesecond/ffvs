import { icons } from "./icons.js";
import { getCaps, truncate } from "./terminal.js";
import { theme } from "./theme.js";

export function sectionTitle(title: string): string {
  return `${theme.heading(icons().project)} ${theme.title(title)}`;
}

export function rule(): string {
  const width = Math.min(48, getCaps().columns - 2);
  const ch = getCaps().unicode ? "─" : "-";
  return theme.muted(ch.repeat(Math.max(12, width)));
}

export function indent(lines: string[], spaces = 2): string[] {
  const pad = " ".repeat(spaces);
  return lines.map((line) => (line.length === 0 ? line : `${pad}${line}`));
}

export function outboundTree(
  items: Array<{ label: string; suffix?: string; path?: string }>,
  opts?: { max?: number },
): string[] {
  const max = opts?.max ?? 40;
  const i = icons();
  const slice = items.slice(0, max);
  const lines = slice.map((item, idx) => {
    const last = idx === slice.length - 1 && items.length <= max;
    const prefix = last ? i.last : i.branch;
    const arrow = theme.relation(i.arrowOut);
    const suf = item.suffix ? `  ${item.suffix}` : "";
    const path = item.path ? `  ${theme.path(item.path)}` : "";
    return `${prefix}${arrow} ${item.label}${path}${suf}`;
  });
  if (items.length > max) {
    lines.push(
      `${i.last}${theme.relation(i.arrowOut)} ${theme.muted(`… ${items.length - max} more`)}`,
    );
  }
  return lines;
}

export function inboundTree(
  items: Array<{ label: string; suffix?: string; path?: string }>,
  opts?: { max?: number },
): string[] {
  const max = opts?.max ?? 40;
  const i = icons();
  const slice = items.slice(0, max);
  const lines = slice.map((item, idx) => {
    const last = idx === slice.length - 1 && items.length <= max;
    const prefix = last ? i.last : i.branch;
    const arrow = theme.relation(i.arrowIn);
    const suf = item.suffix ? `  ${item.suffix}` : "";
    const path = item.path ? `  ${theme.path(item.path)}` : "";
    return `${prefix}${arrow} ${item.label}${path}${suf}`;
  });
  if (items.length > max) {
    lines.push(
      `${i.last}${theme.relation(i.arrowIn)} ${theme.muted(`… ${items.length - max} more`)}`,
    );
  }
  return lines;
}

export function kv(label: string, value: string, labelWidth = 14): string {
  const padded = label.length >= labelWidth ? label : label + " ".repeat(labelWidth - label.length);
  return `${theme.muted(padded)}  ${value}`;
}

export function summaryLine(text: string): string {
  return theme.muted(text);
}

export function joinBlocks(...blocks: Array<string | string[] | null | undefined>): string {
  const parts: string[] = [];
  for (const block of blocks) {
    if (block === null || block === undefined) {
      continue;
    }
    const text = Array.isArray(block) ? block.join("\n") : block;
    if (text.length === 0) {
      continue;
    }
    parts.push(text);
  }
  return parts.join("\n");
}

export function clampPath(path: string, max = 56): string {
  return truncate(path, max);
}

/** Simple aligned table: header + rows of cells. */
export function renderTable(headers: string[], rows: string[][], widths: number[]): string[] {
  const head = headers.map((h, i) => theme.muted(padCell(h, widths[i] ?? 12))).join("  ");
  const sepLen = widths.reduce((a, b) => a + b, 0) + (widths.length - 1) * 2;
  const ch = getCaps().unicode ? "─" : "-";
  const out = [head, theme.muted(ch.repeat(Math.min(sepLen, getCaps().columns - 4)))];
  for (const row of rows) {
    out.push(row.map((cell, i) => padCell(cell, widths[i] ?? 12)).join("  "));
  }
  return out;
}

function padCell(text: string, width: number): string {
  const plain = text.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g"), "");
  if (plain.length > width) {
    const cut = Math.max(1, width - 1);
    if (plain.length === text.length) {
      return `${text.slice(0, cut)}…`;
    }
    return `${plain.slice(0, cut)}…`;
  }
  return text + " ".repeat(width - plain.length);
}

import { drawBox, tipJson } from "./box.js";
import { clampPath, joinBlocks } from "./layout.js";
import { getCaps } from "./terminal.js";
import { theme } from "./theme.js";
import { stripAnsi } from "./box.js";

export const TABLE_SHOW_MAX = 8;

export interface TableColumn {
  key: string;
  header: string;
  width: number;
}

export interface TableRow {
  cells: string[];
  selected?: boolean;
}

export function padPlain(text: string, width: number): string {
  const plain = stripAnsi(text);
  if (plain.length > width) {
    return width <= 1 ? "…" : `${plain.slice(0, width - 1)}…`;
  }
  return plain + " ".repeat(width - plain.length);
}

/**
 * Shared premium table for Command Mode and Interactive Explorer.
 * Boxed panel · header strip · aligned columns · optional › selection.
 */
export function renderPremiumTable(opts: {
  columns: TableColumn[];
  rows: TableRow[];
  total: number;
  summaryLabel: string;
  showJsonTip?: boolean;
  interactive?: boolean;
  maxRows?: number;
}): string {
  const termCols = getCaps().columns;
  const maxRows = opts.maxRows ?? (opts.interactive ? opts.rows.length : TABLE_SHOW_MAX);
  const shown = opts.rows.slice(0, maxRows);
  const widths = opts.columns.map((c) => c.width);
  const innerW = widths.reduce((a, b) => a + b, 0) + Math.max(0, widths.length - 1) * 2;

  const header = theme.headerRow(
    opts.columns.map((c, i) => padPlain(c.header, widths[i]!)).join("  "),
  );

  const body = shown.map((row) => formatDataRow(row, opts.columns, widths, opts.interactive === true));

  if (!opts.interactive && opts.total > maxRows) {
    body.push(opts.columns.map((_, i) => theme.muted(padPlain(i < 2 ? "…" : "", widths[i]!))).join("  "));
  }

  const panel = drawBox([header, ...body], {
    accent: "muted",
    width: Math.min(Math.max(innerW, 48), termCols - 2),
  });

  const truncated = !opts.interactive && opts.total > maxRows;
  const summary = truncated
    ? `${theme.entity(String(opts.total))} ${theme.text(opts.summaryLabel)} ${theme.muted(`(showing ${maxRows})`)}`
    : `${theme.entity(String(opts.total))} ${theme.text(opts.summaryLabel)}`;

  return joinBlocks(panel, "", summary, opts.showJsonTip === false ? null : tipJson());
}

function formatDataRow(
  row: TableRow,
  columns: TableColumn[],
  widths: number[],
  interactive: boolean,
): string {
  const selected = row.selected === true;
  return columns
    .map((col, i) => {
      const raw = row.cells[i] ?? "";
      if (interactive && i === 0) {
        const marker = selected ? (getCaps().unicode ? "›" : ">") : " ";
        const num = selected ? " " : raw;
        return `${theme.accent(marker)}${theme.muted(padPlain(num, Math.max(1, widths[i]! - 1)))}`;
      }
      const plain = padPlain(raw, widths[i]!);
      if (col.key === "name" || col.key === "label") {
        return selected ? theme.bold(theme.entity(plain)) : theme.entity(plain);
      }
      if (col.key === "location" || col.key === "path" || col.key === "hint") {
        return theme.path(plain);
      }
      if (col.key === "kind") {
        return theme.muted(plain);
      }
      return theme.muted(plain);
    })
    .join("  ");
}

export function entityTableColumns(): TableColumn[] {
  const cols = getCaps().columns;
  const numW = 3;
  const nameW = Math.min(28, Math.max(16, Math.floor(cols * 0.28)));
  const locW = Math.min(40, Math.max(20, cols - numW - nameW - 14));
  return [
    { key: "num", header: "#", width: numW },
    { key: "name", header: "Name", width: nameW },
    { key: "location", header: "Location", width: locW },
  ];
}

/** Search / mixed lists: # Name Kind Location */
export function searchTableColumns(): TableColumn[] {
  const cols = getCaps().columns;
  const numW = 3;
  const nameW = Math.min(22, Math.max(14, Math.floor(cols * 0.22)));
  const kindW = 10;
  const locW = Math.min(36, Math.max(16, cols - numW - nameW - kindW - 16));
  return [
    { key: "num", header: "#", width: numW },
    { key: "name", header: "Name", width: nameW },
    { key: "kind", header: "Kind", width: kindW },
    { key: "location", header: "Location", width: locW },
  ];
}

export function entityTableRows(
  items: Array<{ name: string; location: string; selected?: boolean }>,
  startIndex = 0,
): TableRow[] {
  return items.map((item, i) => {
    const row: TableRow = {
      cells: [String(startIndex + i + 1), item.name, clampPath(item.location, 40)],
    };
    if (item.selected) {
      row.selected = true;
    }
    return row;
  });
}

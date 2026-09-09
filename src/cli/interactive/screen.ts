import { icons } from "../ui/icons.js";
import { renderSplashBrand } from "../ui/logo.js";
import {
  entityTableColumns,
  entityTableRows,
  renderPremiumTable,
  searchTableColumns,
} from "../ui/table.js";
import { getCaps, truncate } from "../ui/terminal.js";
import { theme } from "../ui/theme.js";
import type { MenuItem, ViewState } from "./types.js";

const CLEAR = "\u001b[2J\u001b[H";

export function clearScreen(): void {
  if (getCaps().isTty) {
    process.stdout.write(CLEAR);
  }
}

const TABLE_VIEWS = new Set([
  "entity-list",
  "search",
  "neighborhood",
  "impact",
  "path-result",
  "query-result",
]);

export function renderFrame(opts: {
  packageVersion: string;
  projectName: string;
  crumbs: string[];
  view: ViewState;
  footerExtra?: string;
  indexed?: boolean;
  fileCount?: number;
  edgeCount?: number;
}): string {
  const i = icons();
  const width = getCaps().columns;
  const crumb = opts.crumbs.join(getCaps().unicode ? " › " : " > ");
  const lines: string[] = [];

  lines.push(theme.muted(rule(width)));
  lines.push(`${theme.heading(`${i.project} FFVS`)}  ${theme.muted(crumb)}`);
  lines.push(theme.muted(rule(width)));
  lines.push("");
  lines.push(theme.title(opts.view.title));
  if (opts.view.message && !isEntityTableView(opts.view)) {
    lines.push("");
    lines.push(theme.muted(opts.view.message));
  }
  lines.push("");

  const items = opts.view.items ?? [];
  const cursor = opts.view.cursor ?? 0;

  if (isEntityTableView(opts.view) && !opts.view.meta?.["exploreKinds"]) {
    lines.push(renderInteractiveEntityTable(opts.view, items, cursor));
  } else {
    const window = visibleWindow(items, cursor, 14);
    for (let idx = window.start; idx < window.end; idx += 1) {
      const item = items[idx]!;
      const selected = idx === cursor;
      const marker = selected ? theme.accent(getCaps().unicode ? "›" : ">") : " ";
      const label = selected ? theme.entity(item.label) : item.label;
      const hint = item.hint
        ? theme.path(`  ${truncate(item.hint, Math.max(12, width - 28))}`)
        : "";
      lines.push(`  ${marker} ${label}${hint}`);
    }
    if (items.length === 0 && !opts.view.message) {
      lines.push(theme.muted("  (empty)"));
    }
  }

  lines.push("");
  lines.push(theme.muted(rule(width)));
  const statusBits = [
    `FFVS ${opts.packageVersion}`,
    opts.projectName,
    opts.indexed ? `${i.ok} indexed` : `${i.warn} not indexed`,
  ];
  if (opts.fileCount !== undefined) {
    statusBits.push(`${opts.fileCount} files`);
  }
  if (opts.edgeCount !== undefined) {
    statusBits.push(`${opts.edgeCount} edges`);
  }
  lines.push(theme.muted(statusBits.join("   ")));
  lines.push(
    theme.muted(
      opts.footerExtra ??
        "↑↓ navigate   Enter select   Esc back   / search   : command   p palette   ? help   q quit",
    ),
  );
  lines.push(theme.muted(rule(width)));
  return lines.join("\n");
}

function isEntityTableView(view: ViewState): boolean {
  return TABLE_VIEWS.has(view.kind);
}

function renderInteractiveEntityTable(
  view: ViewState,
  items: MenuItem[],
  cursor: number,
): string {
  if (items.length === 0) {
    return theme.muted("  (empty)");
  }

  const window = visibleWindow(items, cursor, 12);
  const useSearchCols = view.kind === "search" || view.kind === "query-result";

  if (useSearchCols) {
    const columns = searchTableColumns();
    const rows = items.slice(window.start, window.end).map((item, i) => {
      const abs = window.start + i;
      const kind =
        typeof (item.data as { kind?: string } | undefined)?.kind === "string"
          ? ((item.data as { kind: string }).kind)
          : (item.hint?.split(/\s/)[0] ?? "");
      const loc = item.hint ?? "";
      return {
        cells: [String(abs + 1), item.label, kind, loc],
        selected: abs === cursor,
      };
    });
    return renderPremiumTable({
      columns,
      rows,
      total: items.length,
      summaryLabel: items.length === 1 ? "result" : "results",
      showJsonTip: false,
      interactive: true,
    });
  }

  const columns = entityTableColumns();
  const rows = entityTableRows(
    items.slice(window.start, window.end).map((item, i) => {
      const abs = window.start + i;
      return {
        name: item.label,
        location: item.hint ?? "",
        selected: abs === cursor,
      };
    }),
    window.start,
  );

  return renderPremiumTable({
    columns,
    rows,
    total: items.length,
    summaryLabel: summaryForView(view),
    showJsonTip: false,
    interactive: true,
  });
}

function summaryForView(view: ViewState): string {
  switch (view.kind) {
    case "neighborhood":
      return "related";
    case "impact":
      return "affected";
    case "path-result":
      return "nodes";
    default:
      return "items";
  }
}

function rule(width: number): string {
  const ch = getCaps().unicode ? "─" : "-";
  return ch.repeat(Math.max(40, Math.min(width, 78)));
}

function visibleWindow(
  items: MenuItem[],
  cursor: number,
  size: number,
): { start: number; end: number } {
  if (items.length <= size) {
    return { start: 0, end: items.length };
  }
  let start = Math.max(0, cursor - Math.floor(size / 2));
  let end = start + size;
  if (end > items.length) {
    end = items.length;
    start = end - size;
  }
  return { start, end };
}

export function renderBoxMessage(title: string, body: string[]): string {
  const width = Math.min(62, getCaps().columns);
  const u = getCaps().unicode;
  const top = u ? `╭${"─".repeat(width - 2)}╮` : `+${"-".repeat(width - 2)}+`;
  const bot = u ? `╰${"─".repeat(width - 2)}╯` : `+${"-".repeat(width - 2)}+`;
  const v = u ? "│" : "|";
  const rows = [` ${theme.title(title)}`, "", ...body.map((b) => ` ${b}`)];
  return [
    theme.muted(top),
    ...rows.map((r) => `${theme.muted(v)}${pad(r, width - 2)}${theme.muted(v)}`),
    theme.muted(bot),
  ].join("\n");
}

function pad(text: string, width: number): string {
  const plain = text.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g"), "");
  if (plain.length >= width) {
    return text;
  }
  return text + " ".repeat(width - plain.length);
}

export function renderStartupBanner(version: string): string {
  return [
    renderSplashBrand(version, "A semantic view of your software"),
    "",
    theme.muted("Enter your software. Explore its structure."),
  ].join("\n");
}

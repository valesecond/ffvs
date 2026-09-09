import type {
  EntityInspection,
  ImportRelationView,
  ProjectSummary,
} from "../../application/explore.js";
import type { DiagnosticsResult } from "../../application/diagnostics.js";
import type { IndexedFile } from "../../core/domain/types.js";
import { drawBox, padVisible, visibleWidth } from "./box.js";
import { entityLabel } from "./entity.js";
import { icons, kindIcon } from "./icons.js";
import { clampPath, joinBlocks, kv, outboundTree, sectionTitle, summaryLine } from "./layout.js";
import { getCaps } from "./terminal.js";
import { TABLE_SHOW_MAX, renderPremiumTable } from "./table.js";
import { theme } from "./theme.js";

/** Flat file list — same premium table as functions/classes. */
export function renderFilesFlat(files: IndexedFile[]): string {
  if (files.length === 0) {
    return joinBlocks(
      drawBox([theme.muted("(none)")], { accent: "muted", width: 48, title: "Files" }),
    );
  }
  const cols = getCaps().columns;
  const numW = 3;
  const pathW = Math.min(48, Math.max(24, Math.floor(cols * 0.5)));
  const langW = 12;
  const rows = files.slice(0, TABLE_SHOW_MAX).map((f, idx) => ({
    cells: [String(idx + 1), f.path, f.language ?? "unknown"],
  }));
  return renderPremiumTable({
    columns: [
      { key: "num", header: "#", width: numW },
      { key: "name", header: "Path", width: pathW },
      { key: "kind", header: "Lang", width: langW },
    ],
    rows,
    total: files.length,
    summaryLabel: "files",
    showJsonTip: true,
    maxRows: TABLE_SHOW_MAX,
  });
}

export function renderImports(imports: ImportRelationView[]): string {
  if (imports.length === 0) {
    return joinBlocks(sectionTitle("IMPORTS"), "", theme.muted("(none)"));
  }
  const body = imports.slice(0, 40).map((item) => {
    const mark = item.external ? `  ${theme.external(icons().external)}` : "";
    return [
      `  ${theme.entity(item.fromName ?? item.from)}`,
      `  ${icons().last}${theme.relation(icons().arrowOut)} ${String(item.specifier ?? item.toName ?? item.to)}${mark}`,
      "",
    ].join("\n");
  });
  return joinBlocks(
    sectionTitle("IMPORTS"),
    "",
    body.join("\n").trimEnd(),
    "",
    summaryLine(`${imports.length} imports`),
  );
}

export function renderInspection(view: EntityInspection): string {
  const entity = view.entity;
  const name = entityLabel(entity);
  const loc = view.file
    ? `${view.file}${entity.location ? `:${entity.location.startLine}` : ""}`
    : entity.id;
  const moduleHint =
    typeof entity.properties["module"] === "string"
      ? (entity.properties["module"] as string)
      : null;

  const headerLeft = `${kindIcon(entity.kind)}  ${theme.entity(name)}`;
  const badge = theme.badge(entity.kind);
  const headerWidth = 54;
  const gap = Math.max(2, headerWidth - visibleWidth(headerLeft) - visibleWidth(badge));
  const header = `${headerLeft}${" ".repeat(gap)}${badge}`;

  const meta = [
    kv("Path", theme.path(clampPath(loc, 40))),
    moduleHint ? kv("Module", theme.entity(moduleHint)) : null,
    entity.location
      ? kv("Lines", theme.muted(`${entity.location.startLine}–${entity.location.endLine}`))
      : null,
  ].filter((x): x is string => Boolean(x));

  const imports = view.imports.map(
    (item) =>
      `${theme.relation(icons().arrowOut)} ${theme.entity(String(item.specifier ?? item.toName ?? item.to))}${item.external ? theme.muted(" (ext)") : ""}`,
  );
  const usedBy = view.usedBy.map((n) => {
    const label =
      typeof n.properties["path"] === "string" ? n.properties["path"] : (n.name ?? n.id);
    return `${theme.relation("≫")} ${theme.entity(String(label))}`;
  });

  const wide = getCaps().columns >= 72;
  let relations: string[];
  if (wide && (imports.length > 0 || usedBy.length > 0)) {
    relations = twoColumn("IMPORTS", imports, "USED BY", usedBy, 24);
  } else {
    relations = [];
    if (imports.length) {
      relations.push(theme.muted("IMPORTS"), ...imports.map((l) => `  ${l}`), "");
    }
    if (usedBy.length) {
      relations.push(theme.muted("USED BY"), ...usedBy.map((l) => `  ${l}`));
    }
  }

  const extraGroups: string[] = [];
  const pushGroup = (title: string, labels: string[]) => {
    if (labels.length === 0) {
      return;
    }
    extraGroups.push(
      "",
      theme.muted(title),
      ...outboundTree(labels.map((label) => ({ label: theme.entity(label) }))).map((l) => `  ${l}`),
    );
  };
  pushGroup(
    "EXTENDS",
    view.extends.map((n) => n.name ?? n.id),
  );
  pushGroup(
    "IMPLEMENTS",
    view.implements.map((n) => n.name ?? n.id),
  );
  pushGroup(
    "METHODS",
    view.methods.map((n) => `${n.name ?? n.id}()`),
  );
  if (entity.kind === "MODULE" || entity.kind === "FILE") {
    pushGroup(
      "CONTAINS",
      view.contained.filter((n) => n.kind !== "METHOD").map((n) => `${n.kind}: ${n.name ?? n.id}`),
    );
    pushGroup(
      "EXPORTS",
      view.exports.map((n) => `${n.kind}: ${n.name ?? n.id}`),
    );
  }

  const rows = [
    header,
    "",
    ...meta,
    relations.length || extraGroups.length ? "" : null,
    ...relations,
    ...extraGroups,
  ].filter((x): x is string => x !== null);

  return joinBlocks(drawBox(rows, { accent: "cyan", width: headerWidth + 2 }));
}

function twoColumn(
  leftTitle: string,
  left: string[],
  rightTitle: string,
  right: string[],
  col: number,
): string[] {
  const rows = Math.max(left.length, right.length, 1);
  const out = [`${padVisible(theme.muted(leftTitle), col)}  ${theme.muted(rightTitle)}`];
  for (let i = 0; i < rows; i += 1) {
    const l = left[i] ?? "";
    const r = right[i] ?? "";
    out.push(`${padVisible(l || " ", col)}  ${r}`);
  }
  return out;
}

export function renderProjectSummary(summary: ProjectSummary): string {
  return joinBlocks(
    sectionTitle("PROJECT"),
    "",
    drawBox(
      [
        theme.entity(summary.name),
        theme.path(summary.projectRoot),
        "",
        kv("Files", String(summary.files)),
        kv("Indexed", summary.indexedAt),
      ],
      { accent: "cyan", width: 48 },
    ),
  );
}

export function renderDiagnostics(result: DiagnosticsResult): string {
  const rate =
    result.counts.internalResolutionRate === null
      ? "n/a"
      : `${(result.counts.internalResolutionRate * 100).toFixed(1)}%`;

  const lines = [
    `${theme.success(icons().ok)}  Resolved     ${result.counts.resolvedInternal}`,
    `${theme.warning(icons().warn)}  Ambiguous    ${result.counts.ambiguous}`,
    `${theme.error(icons().fail)}  Unresolved   ${result.counts.unresolved}`,
    `${theme.external(icons().external)}  External     ${result.counts.external}`,
    theme.muted(`Internal rate ${rate}`),
  ];

  const entries = [...result.unresolved, ...result.ambiguous];
  const body = [...lines];
  if (entries.length === 0) {
    body.push("", theme.muted("No unresolved or ambiguous relative imports."));
  } else {
    body.push("", theme.muted("References"), "");
    for (const entry of entries.slice(0, 40)) {
      body.push(theme.entity(entry.fromPath ?? entry.fromModule));
      body.push(
        `  ${icons().last} import "${entry.specifier}"  ${theme.muted(`[${entry.status}]`)}`,
      );
    }
    if (entries.length > 40) {
      body.push(theme.muted(`… ${entries.length - 40} more`));
    }
  }

  return joinBlocks(sectionTitle("DIAGNOSTICS"), "", drawBox(body, { accent: "cyan", width: 56 }));
}

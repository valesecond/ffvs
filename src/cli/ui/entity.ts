import type { GraphNode } from "../../core/domain/types.js";
import type { EntityRef } from "../../application/views.js";
import { drawBox } from "./box.js";
import { kindIcon } from "./icons.js";
import { clampPath, joinBlocks } from "./layout.js";
import { theme } from "./theme.js";
import {
  TABLE_SHOW_MAX,
  entityTableColumns,
  entityTableRows,
  renderPremiumTable,
  searchTableColumns,
} from "./table.js";

export function entityLabel(entity: Pick<EntityRef, "name" | "path" | "id"> | GraphNode): string {
  if ("name" in entity && entity.name) {
    return entity.name;
  }
  if ("path" in entity && typeof entity.path === "string" && entity.path) {
    return entity.path;
  }
  if ("properties" in entity && typeof entity.properties?.["path"] === "string") {
    return entity.properties["path"] as string;
  }
  return entity.id;
}

export function entityLocation(entity: GraphNode | EntityRef): string | null {
  if ("location" in entity && entity.location) {
    const file =
      typeof (entity as GraphNode).properties?.["path"] === "string"
        ? ((entity as GraphNode).properties["path"] as string)
        : null;
    const line = entity.location.startLine;
    return file ? `${file}:${line}` : `:${line}`;
  }
  if ("path" in entity && entity.path) {
    return entity.path;
  }
  if ("properties" in entity && typeof entity.properties?.["path"] === "string") {
    return entity.properties["path"] as string;
  }
  return null;
}

export function renderEntityBlock(entity: GraphNode): string {
  const loc = entityLocation(entity);
  const lines = [
    `${kindIcon(entity.kind)} ${theme.muted(entity.kind)}`,
    "",
    `  ${theme.entity(entityLabel(entity))}`,
  ];
  if (loc) {
    lines.push(`  ${theme.path(clampPath(loc))}`);
  }
  return lines.join("\n");
}

/**
 * Command-mode entity list — shared premium table (# / Name / Location).
 * Used by functions, classes, modules, search (via formatEntityList).
 */
export function renderEntityList(nodes: GraphNode[], kindLabel: string): string {
  const plural = kindLabel.toLowerCase();
  if (nodes.length === 0) {
    return joinBlocks(
      drawBox([theme.muted("(none)")], { accent: "muted", width: 48, title: kindLabel }),
    );
  }

  const isSearch = kindLabel.toLowerCase().startsWith("search");
  if (isSearch) {
    const columns = searchTableColumns();
    const locW = columns[3]?.width ?? 36;
    const rows = nodes.slice(0, TABLE_SHOW_MAX).map((node, idx) => ({
      cells: [
        String(idx + 1),
        entityLabel(node),
        node.kind,
        clampPath(entityLocation(node) ?? node.id, locW),
      ],
    }));
    return renderPremiumTable({
      columns,
      rows,
      total: nodes.length,
      summaryLabel: nodes.length === 1 ? "result" : "results",
      showJsonTip: true,
      maxRows: TABLE_SHOW_MAX,
    });
  }

  const columns = entityTableColumns();
  const locW = columns[2]?.width ?? 40;
  const rows = entityTableRows(
    nodes.slice(0, TABLE_SHOW_MAX).map((node) => ({
      name: entityLabel(node),
      location: entityLocation(node) ?? node.id,
    })),
  ).map((row, i) => {
    // Re-clamp location to column width
    const loc = clampPath(entityLocation(nodes[i]!) ?? nodes[i]!.id, locW);
    return { cells: [row.cells[0]!, row.cells[1]!, loc] };
  });

  return renderPremiumTable({
    columns,
    rows,
    total: nodes.length,
    summaryLabel: plural,
    showJsonTip: true,
    maxRows: TABLE_SHOW_MAX,
  });
}

import type { NeighborhoodResult, RelationRef } from "../../application/views.js";
import { drawBox } from "./box.js";
import { entityLabel } from "./entity.js";
import { icons, kindIcon } from "./icons.js";
import {
  clampPath,
  inboundTree,
  joinBlocks,
  outboundTree,
  sectionTitle,
  summaryLine,
} from "./layout.js";
import { resolutionSuffix, tallyResolutions } from "./resolution.js";
import { theme } from "./theme.js";

export function renderNeighborhood(result: NeighborhoodResult, title: string): string {
  const seed = entityLabel(result.entity);
  const isInbound =
    title.toLowerCase() === "callers" ||
    title.toLowerCase() === "dependents" ||
    title.toLowerCase() === "parents";

  if (result.relations.length === 0) {
    return joinBlocks(
      drawBox(
        [
          `${kindIcon(result.entity.kind)}  ${theme.entity(seed)}`,
          "",
          theme.muted(`(no ${title.toLowerCase()})`),
        ],
        { accent: "cyan", width: 48, title: title.toUpperCase() },
      ),
    );
  }

  const items = result.relations.map((rel) => {
    const other = rel.from.id === result.entity.id ? rel.to : rel.from;
    const suffix = resolutionSuffix(rel.properties);
    const path = other.path ? clampPath(other.path, 32) : undefined;
    return {
      label: `${kindIcon(other.kind)} ${theme.entity(entityLabel(other))}`,
      ...(path ? { path } : {}),
      ...(suffix !== undefined ? { suffix } : {}),
    };
  });

  const tree = isInbound ? inboundTree(items) : outboundTree(items);
  const counts = tallyResolutions(result.relations.map((r) => r.properties));
  const resSummary =
    counts.RESOLVED + counts.AMBIGUOUS + counts.UNRESOLVED + counts.EXTERNAL > 0
      ? `${counts.RESOLVED} resolved · ${counts.AMBIGUOUS} ambiguous · ${counts.UNRESOLVED} unresolved`
      : null;

  return joinBlocks(
    drawBox(
      [
        `${kindIcon(result.entity.kind)}  ${theme.entity(seed)}`,
        result.entity.path ? theme.path(clampPath(result.entity.path)) : "",
        "",
        ...tree,
        "",
        summaryLine(`${result.relations.length} ${title.toLowerCase()}`),
        resSummary ? summaryLine(resSummary) : "",
      ].filter((l) => l !== ""),
      { accent: "cyan", width: 56, title: title.toUpperCase() },
    ),
  );
}

export function renderRelationsList(
  relations: RelationRef[],
  entityLabelText: string | null,
): string {
  if (relations.length === 0) {
    return joinBlocks(sectionTitle("RELATIONS"), "", theme.muted("(none)"));
  }
  const i = icons();
  const lines: string[] = [];
  if (entityLabelText) {
    lines.push(theme.entity(entityLabelText), "");
  }
  const max = 40;
  for (const rel of relations.slice(0, max)) {
    const from = entityLabel(rel.from);
    const to = entityLabel(rel.to);
    const mark = resolutionSuffix(rel.properties);
    lines.push(`  ${theme.entity(from)}`);
    lines.push(
      `  ${i.last}${theme.relation(i.arrowOut)} ${theme.muted(rel.kind)} ${theme.entity(to)}${mark ? `  ${mark}` : ""}`,
    );
    lines.push("");
  }
  if (relations.length > max) {
    lines.push(theme.muted(`  … ${relations.length - max} more`));
  }
  lines.push(summaryLine(`${relations.length} relations`));
  return joinBlocks(drawBox(lines, { accent: "cyan", width: 56, title: "RELATIONS" }));
}

import type { ImpactResult } from "../../application/views.js";
import { drawBox } from "./box.js";
import { entityLabel } from "./entity.js";
import { kindIcon } from "./icons.js";
import { clampPath, joinBlocks, outboundTree, summaryLine } from "./layout.js";
import { theme } from "./theme.js";

export function renderImpact(result: ImpactResult): string {
  const seed = entityLabel(result.entity);

  if (result.affected.length === 0) {
    return joinBlocks(
      drawBox(
        [
          `${kindIcon(result.entity.kind)}  ${theme.entity(seed)}`,
          "",
          theme.muted("(no dependents)"),
          "",
          summaryLine(`along ${result.relationKinds.join(", ")}`),
        ],
        { accent: "cyan", width: 52, title: "IMPACT" },
      ),
    );
  }

  const direct = result.affected.filter((a) => a.depth === 1);
  const indirect = result.affected.filter((a) => a.depth > 1);

  const rows: string[] = [
    `${kindIcon(result.entity.kind)}  ${theme.entity(seed)}`,
    result.entity.path ? theme.path(clampPath(result.entity.path)) : "",
    "",
    theme.muted(`Along  ${result.relationKinds.join(", ")}`),
  ];

  if (direct.length > 0) {
    rows.push(
      "",
      theme.heading("Direct impact"),
      ...outboundTree(
        direct.map((a) => ({
          label: `${kindIcon(a.kind)} ${theme.entity(entityLabel(a))}`,
          ...(a.path ? { path: clampPath(a.path, 28) } : {}),
        })),
      ),
    );
  }
  if (indirect.length > 0) {
    rows.push(
      "",
      theme.heading("Indirect impact"),
      ...outboundTree(
        indirect.map((a) => ({
          label: `${kindIcon(a.kind)} ${theme.entity(entityLabel(a))}`,
          ...(a.path ? { path: clampPath(a.path, 28) } : {}),
        })),
      ),
    );
  }

  rows.push("", summaryLine(`${result.affected.length} affected entities`));

  return joinBlocks(
    drawBox(
      rows.filter((l) => l !== ""),
      { accent: "cyan", width: 56, title: "IMPACT" },
    ),
  );
}

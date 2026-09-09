import type { PathExploreResult } from "../../application/views.js";
import { drawBox } from "./box.js";
import { entityLabel } from "./entity.js";
import { icons, kindIcon } from "./icons.js";
import { clampPath, joinBlocks, summaryLine } from "./layout.js";
import { getCaps } from "./terminal.js";
import { theme } from "./theme.js";

export function renderPath(result: PathExploreResult): string {
  const from = entityLabel(result.from);
  const to = entityLabel(result.to);
  const kinds = result.relationKinds.join(", ");
  const i = icons();

  if (!result.found) {
    const gap = getCaps().unicode ? "─ ─ ─ ─ ─ ─ ─" : "- - - - - - -";
    return joinBlocks(
      drawBox(
        [
          `${theme.entity(from)} ${theme.muted(gap)} ${theme.entity(to)}`,
          "",
          `${theme.error(i.fail)}  No path found`,
          "",
          summaryLine(`via ${kinds}`),
        ],
        { accent: "cyan", width: 52, title: "PATH" },
      ),
    );
  }

  const body: string[] = [];
  for (let idx = 0; idx < result.nodes.length; idx += 1) {
    const node = result.nodes[idx]!;
    const label = `${kindIcon(node.kind)}  ${theme.entity(entityLabel(node))}`;
    const path = node.path ? theme.path(clampPath(node.path, 40)) : "";
    body.push(label);
    if (path) {
      body.push(`     ${path}`);
    }
    if (idx < result.nodes.length - 1) {
      const edge = result.relations[idx];
      const kind = edge ? theme.muted(edge.kind) : "";
      body.push(`     ${theme.relation(i.arrowDown)} ${kind}`);
    }
  }

  body.push("", summaryLine(`${result.nodes.length} nodes · ${kinds}`));

  return joinBlocks(drawBox(body, { accent: "cyan", width: 52, title: "PATH" }));
}

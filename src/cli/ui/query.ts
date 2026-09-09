import type { QueryResultSet } from "../../core/language/result-set.js";
import { entityLabel } from "./entity.js";
import { icons } from "./icons.js";
import { indent, joinBlocks, outboundTree, rule, sectionTitle, summaryLine } from "./layout.js";
import { renderPath } from "./path.js";
import { theme } from "./theme.js";

export function renderQuery(result: QueryResultSet, source?: string): string {
  const stageLines = (result.stagesApplied.length ? result.stagesApplied : ["(empty)"]).map((s) =>
    theme.accent(s),
  );

  const blocks: Array<string | string[] | null> = [
    sectionTitle("QUERY"),
    "",
    source
      ? indent(source.split(/\s+/).length > 12 ? [theme.muted(source)] : stageLines)
      : indent(stageLines),
    "",
    rule(),
  ];

  if (result.paths && result.paths.length > 0) {
    for (const p of result.paths) {
      // adapt PathExploreResult-like minimal render
      const fake = {
        operation: "path" as const,
        from: { id: p.fromId, kind: "MODULE" as const, name: p.fromId, path: null },
        to: { id: p.toId, kind: "MODULE" as const, name: p.toId, path: null },
        found: p.found,
        relationKinds: p.relationKinds as "IMPORTS"[],
        nodes: p.nodeIds.map((id) => ({ id, kind: "MODULE" as const, name: id, path: null })),
        relations: [],
      };
      blocks.push("", renderPath(fake));
    }
  }

  if (result.impact) {
    const along = (result.impact.along ?? "imports").toUpperCase();
    blocks.push(
      "",
      sectionTitle("IMPACT"),
      "",
      ...indent(
        [
          `Along: ${theme.accent(along)}`,
          result.impact.resolution ? `Resolution: ${result.impact.resolution}` : null,
          `Affected: ${result.impact.affectedCount}`,
        ].filter((x): x is string => Boolean(x)),
      ),
    );
    if (result.entities.length > 0 && result.impact.affectedCount > 0) {
      blocks.push(
        "",
        ...indent(
          outboundTree(
            result.entities.slice(0, 40).map((e) => ({ label: theme.entity(entityLabel(e)) })),
          ),
        ),
      );
    }
  }

  if (result.descriptions && result.descriptions.length > 0) {
    blocks.push("", sectionTitle("RESULTS"), "");
    for (const d of result.descriptions.slice(0, 50)) {
      blocks.push(
        ...indent([
          `${theme.accent(icons().entity)} ${theme.entity(d.name ?? d.id)}`,
          d.path
            ? theme.path(`  ${d.path}${d.startLine !== null ? `:${d.startLine}` : ""}`)
            : theme.muted(`  ${d.id}`),
          "",
        ]),
      );
    }
    if (result.descriptions.length > 50) {
      blocks.push(theme.muted(`  … ${result.descriptions.length - 50} more`));
    }
  } else if (!result.impact && !(result.paths && result.paths.length > 0)) {
    blocks.push("", sectionTitle("RESULTS"), "");
    if (result.entities.length === 0) {
      blocks.push(...indent([theme.muted("(none)")]));
    } else {
      for (const entity of result.entities.slice(0, 50)) {
        const path =
          typeof entity.properties["path"] === "string" ? entity.properties["path"] : null;
        blocks.push(
          ...indent([
            `${theme.accent(icons().entity)} ${theme.entity(entityLabel(entity))}`,
            path ? theme.path(`  ${path}`) : theme.muted(`  ${entity.id}`),
            "",
          ]),
        );
      }
      if (result.entities.length > 50) {
        blocks.push(theme.muted(`  … ${result.entities.length - 50} more`));
      }
    }
  }

  const rc = result.diagnostics.resolutionCounts;
  const hasRes = result.relations.length > 0;
  blocks.push(
    "",
    rule(),
    "",
    summaryLine(`${result.entities.length} results`),
    hasRes
      ? summaryLine(
          `relations ${result.relations.length} · ✓ ${rc.RESOLVED} · ? ${rc.AMBIGUOUS} · × ${rc.UNRESOLVED}`,
        )
      : null,
  );

  return joinBlocks(...blocks);
}

import type { StatusResult } from "../../application/status.js";
import { drawBox, tip } from "./box.js";
import { icons } from "./icons.js";
import { joinBlocks, kv, sectionTitle } from "./layout.js";
import { theme } from "./theme.js";

export function renderStatus(status: StatusResult): string {
  const indexed = Boolean(status.index);
  const indexLine = indexed
    ? `${theme.success(icons().ok)} Up to date`
    : `${theme.warning(icons().warn)} Not indexed — run ffvs index .`;

  const counts = status.nodeCounts;
  const entityLines = [
    kv("Files", String(counts["FILE"] ?? status.index?.files.length ?? 0)),
    kv("Modules", String(counts["MODULE"] ?? 0)),
    kv("Functions", String(counts["FUNCTION"] ?? 0)),
    kv("Classes", String(counts["CLASS"] ?? 0)),
  ];
  if ((counts["METHOD"] ?? 0) > 0) {
    entityLines.push(kv("Methods", String(counts["METHOD"])));
  }

  const callCount = status.graph?.edges.filter((e) => e.kind === "CALLS").length ?? 0;
  const relationLines = [
    kv("Imports", String(status.importEdgeCount)),
    kv("Calls", String(callCount)),
    kv("All edges", String(status.edgeCount)),
  ];

  const res = status.resolution;
  const resolutionLines = res
    ? [
        `${theme.success(icons().ok)}  ${pad("Resolved", 12)}${res.resolvedInternal}`,
        `${theme.warning(icons().warn)}  ${pad("Ambiguous", 12)}${res.ambiguous}`,
        `${theme.error(icons().fail)}  ${pad("Unresolved", 12)}${res.unresolved}`,
        `${theme.external(icons().external)}  ${pad("External", 12)}${res.external}`,
      ]
    : [];

  const body = [
    theme.heading("Project"),
    `  ${theme.entity(status.config.name)}`,
    `  ${theme.path(status.projectRoot)}`,
    `  ${theme.muted("Index")}  ${indexLine}`,
    status.config.lastIndexedAt
      ? `  ${theme.muted(`Last indexed ${status.config.lastIndexedAt}`)}`
      : "",
    "",
    theme.heading("Entities"),
    ...entityLines.map((l) => `  ${l}`),
    "",
    theme.heading("Relations"),
    ...relationLines.map((l) => `  ${l}`),
  ];

  if (resolutionLines.length > 0) {
    body.push("", theme.heading("Resolution"), ...resolutionLines.map((l) => `  ${l}`));
  }

  if (status.index?.parseErrors?.length) {
    body.push(
      "",
      theme.warning(`  ${icons().warn} Parse errors: ${status.index.parseErrors.length}`),
    );
  }

  return joinBlocks(
    sectionTitle("STATUS"),
    "",
    drawBox(
      body.filter((l) => l !== ""),
      { accent: "cyan", width: 56 },
    ),
    "",
    tip("Try ffvs search <name> or ffvs inspect <entity>"),
  );
}

function pad(label: string, width: number): string {
  return label.length >= width ? `${label} ` : `${label}${" ".repeat(width - label.length)}`;
}

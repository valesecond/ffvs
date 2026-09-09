import type { IndexResult } from "../../application/index-project.js";
import { drawBox } from "./box.js";
import { icons } from "./icons.js";
import { indent, joinBlocks, kv, sectionTitle } from "./layout.js";
import { theme } from "./theme.js";

export function renderIndexComplete(result: IndexResult, opts?: { durationMs?: number }): string {
  const counts = Object.fromEntries(result.index.entities.map((e) => [e.kind, e.count]));
  const calls = result.graph.edges.filter((e) => e.kind === "CALLS").length;
  const i = icons();

  const steps = [
    `${theme.success(i.ok)}  Scanning project`,
    `${theme.success(i.ok)}  Parsing sources`,
    `${theme.success(i.ok)}  Building graph`,
    `${theme.success(i.ok)}  Resolving imports`,
    calls > 0 ? `${theme.success(i.ok)}  Analyzing calls` : null,
  ].filter((x): x is string => Boolean(x));

  const stats = [
    kv("Files", String(result.index.files.length)),
    kv("Modules", String(counts["MODULE"] ?? 0)),
    kv("Functions", String(counts["FUNCTION"] ?? 0)),
    kv("Classes", String(counts["CLASS"] ?? 0)),
    kv("Imports", String(result.index.resolution?.importsTotal ?? 0)),
    kv("Calls", String(calls)),
  ];

  const duration =
    opts?.durationMs !== undefined ? `${(opts.durationMs / 1000).toFixed(1)}s` : null;

  const completeRows = [
    duration
      ? `${theme.success(theme.bold("Index complete"))}          ${theme.muted(duration)}`
      : theme.success(theme.bold("Index complete")),
    "",
    ...stats,
  ];

  const res = result.index.resolution;
  if (res) {
    completeRows.push(
      "",
      theme.muted(
        `imports  ${i.ok} ${res.resolvedInternal}  ${i.external} ${res.external}  ${i.fail} ${res.unresolved}  ${i.warn} ${res.ambiguous}`,
      ),
    );
  }

  return joinBlocks(
    sectionTitle("INDEX"),
    "",
    ...indent(steps),
    "",
    drawBox(completeRows, { accent: "green", width: 48 }),
    result.index.parseErrors.length
      ? ["", theme.warning(`${i.warn} Parse errors: ${result.index.parseErrors.length}`)].join("\n")
      : null,
  );
}

export function renderInit(projectRoot: string, name: string): string {
  return joinBlocks(
    sectionTitle("INIT"),
    "",
    drawBox(
      [
        `${theme.success(icons().ok)}  Initialized ${theme.entity(name)}`,
        theme.path(`${projectRoot}/.ffvs/`),
      ],
      { accent: "cyan", width: 48 },
    ),
  );
}

import fs from "node:fs/promises";

import { loadModel } from "./explore.js";
import { toEntityRef, toRelationRef } from "./views.js";
import {
  executeQuery,
  LANGUAGE_VERSION,
  parseQuery,
  type QueryResultSet,
} from "../core/language/index.js";
import type { GraphEdge, GraphNode } from "../core/domain/types.js";

export interface QueryJsonPayload {
  languageVersion: typeof LANGUAGE_VERSION;
  stagesApplied: string[];
  entities: ReturnType<typeof toEntityRef>[];
  relations: ReturnType<typeof toRelationRef>[];
  descriptions?: QueryResultSet["descriptions"];
  diagnostics: QueryResultSet["diagnostics"];
}

export interface RunQueryResult {
  astStages: number;
  result: QueryResultSet;
  json: QueryJsonPayload;
}

export async function runQuery(startDir: string, source: string): Promise<RunQueryResult> {
  const model = await loadModel(startDir);
  const ast = parseQuery(source);
  const result = executeQuery(ast, { graph: model.graph, index: model.index });
  return {
    astStages: ast.stages.length,
    result,
    json: toJsonPayload(model.graph.nodes, result),
  };
}

export async function runQueryFromFile(
  startDir: string,
  filePath: string,
): Promise<RunQueryResult> {
  const source = await fs.readFile(filePath, "utf8");
  return runQuery(startDir, source);
}

export function formatQueryResult(result: QueryResultSet): string {
  const lines: string[] = [];
  lines.push(`FFVS Query Language ${LANGUAGE_VERSION}`);
  lines.push(`Stages: ${result.stagesApplied.join(" → ") || "(none)"}`);
  lines.push(`Entities: ${result.entities.length}`);
  lines.push(`Relations: ${result.relations.length}`);

  const rc = result.diagnostics.resolutionCounts;
  if (result.relations.length > 0) {
    lines.push(
      `Resolution: RESOLVED=${rc.RESOLVED} AMBIGUOUS=${rc.AMBIGUOUS} UNRESOLVED=${rc.UNRESOLVED} EXTERNAL=${rc.EXTERNAL}`,
    );
  }

  if (result.descriptions && result.descriptions.length > 0) {
    lines.push("", "Describe");
    for (const d of result.descriptions.slice(0, 50)) {
      lines.push(`├── ${d.kind} ${d.name ?? d.id}`);
      lines.push(`│     id: ${d.id}`);
      if (d.path) {
        lines.push(`│     path: ${d.path}`);
      }
      lines.push(`│     relations: ${d.relationCount} (${d.edgeKinds.join(", ") || "none"})`);
    }
    if (result.descriptions.length > 50) {
      lines.push(`├── … ${result.descriptions.length - 50} more`);
    }
  } else {
    lines.push("", "Entities");
    for (const entity of result.entities.slice(0, 50)) {
      lines.push(formatEntityLine(entity));
    }
    if (result.entities.length > 50) {
      lines.push(`├── … ${result.entities.length - 50} more`);
    }
  }

  if (result.relations.length > 0 && (!result.descriptions || result.descriptions.length === 0)) {
    lines.push("", "Relations (sample)");
    for (const edge of result.relations.slice(0, 20)) {
      lines.push(formatEdgeLine(edge));
    }
    if (result.relations.length > 20) {
      lines.push(`├── … ${result.relations.length - 20} more`);
    }
  }

  return lines.join("\n");
}

function toJsonPayload(allNodes: GraphNode[], result: QueryResultSet): QueryJsonPayload {
  const byId = new Map(allNodes.map((n) => [n.id, n]));
  const relations = [];
  for (const edge of result.relations) {
    const from = byId.get(edge.from) ?? stubNode(edge.from);
    const to = byId.get(edge.to) ?? stubNode(edge.to);
    relations.push(toRelationRef(edge, from, to));
  }

  return {
    languageVersion: LANGUAGE_VERSION,
    stagesApplied: result.stagesApplied,
    entities: result.entities.map(toEntityRef),
    relations,
    ...(result.descriptions !== undefined ? { descriptions: result.descriptions } : {}),
    diagnostics: result.diagnostics,
  };
}

function stubNode(id: string): GraphNode {
  return {
    id,
    kind: "MODULE",
    name: null,
    location: null,
    properties: {},
  };
}

function formatEntityLine(entity: GraphNode): string {
  const path =
    typeof entity.properties["path"] === "string"
      ? entity.properties["path"]
      : entity.location?.file;
  return `├── ${entity.kind} ${entity.name ?? "(anonymous)"}  ${entity.id}${path ? `  (${path})` : ""}`;
}

function formatEdgeLine(edge: GraphEdge): string {
  const res =
    typeof edge.properties?.["resolution"] === "string"
      ? ` [${edge.properties["resolution"]}]`
      : "";
  return `├── ${edge.kind}${res}  ${edge.from} → ${edge.to}`;
}

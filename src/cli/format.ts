/**
 * Human-facing formatters — thin adapters over src/cli/ui.
 * --json never calls these.
 */
import type {
  EntityInspection,
  ImportRelationView,
  ProjectSummary,
} from "../application/explore.js";
import type { DiagnosticsResult } from "../application/diagnostics.js";
import type {
  ImpactResult,
  NeighborhoodResult,
  PathExploreResult,
  RelationRef,
} from "../application/views.js";
import type { GraphEdge, GraphNode, IndexedFile } from "../core/domain/types.js";
import type { QueryResultSet } from "../core/language/result-set.js";
import {
  printJson as printJsonUi,
  renderDiagnostics,
  renderEntityList,
  renderFilesFlat,
  renderImpact,
  renderImports,
  renderInspection,
  renderNeighborhood,
  renderPath,
  renderProjectSummary,
  renderQuery,
  renderRelationsList,
} from "./ui/index.js";

export function printJson(value: unknown): void {
  printJsonUi(value);
}

export function formatProjectSummary(summary: ProjectSummary): string {
  return renderProjectSummary(summary);
}

export function formatEntityList(nodes: GraphNode[], kindLabel: string): string {
  return renderEntityList(nodes, kindLabel);
}

export function formatFiles(files: IndexedFile[]): string {
  return renderFilesFlat(files);
}

export function formatImports(imports: ImportRelationView[]): string {
  return renderImports(imports);
}

export function formatInspection(view: EntityInspection): string {
  return renderInspection(view);
}

export function formatGraphView(entity: GraphNode, edges: GraphEdge[], nodes: GraphNode[]): string {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const relations = edges.map((edge) => {
    const from = byId.get(edge.from) ?? entity;
    const to = byId.get(edge.to) ?? entity;
    return {
      id: edge.id,
      kind: edge.kind,
      from: {
        id: from.id,
        kind: from.kind,
        name: from.name,
        path: typeof from.properties["path"] === "string" ? from.properties["path"] : null,
      },
      to: {
        id: to.id,
        kind: to.kind,
        name: to.name,
        path: typeof to.properties["path"] === "string" ? to.properties["path"] : null,
      },
      properties: edge.properties ?? {},
    } satisfies RelationRef;
  });
  return renderRelationsList(relations, entity.name ?? entity.id);
}

export function formatNeighborhood(result: NeighborhoodResult, title: string): string {
  return renderNeighborhood(result, title);
}

export function formatRelationsList(relations: RelationRef[], entityLabel: string | null): string {
  return renderRelationsList(relations, entityLabel);
}

export function formatPathResult(result: PathExploreResult): string {
  return renderPath(result);
}

export function formatImpact(result: ImpactResult): string {
  return renderImpact(result);
}

export function formatDiagnostics(result: DiagnosticsResult): string {
  return renderDiagnostics(result);
}

export function formatQueryResultUi(result: QueryResultSet, source?: string): string {
  return renderQuery(result, source);
}

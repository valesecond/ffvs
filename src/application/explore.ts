import path from "node:path";

import * as store from "../adapters/storage/ffvs-store.js";
import { findNodesByKind, getNode, incoming, outgoing } from "../core/domain/graph.js";
import { StateError, UsageError } from "../core/domain/errors.js";
import {
  children as graphChildren,
  incomingNeighbors,
  outgoingNeighbors,
  parents as graphParents,
} from "../core/graph/navigate.js";
import type {
  EntityKind,
  GraphEdge,
  GraphNode,
  ProjectIndex,
  RelationKind,
  SemanticGraph,
} from "../core/domain/types.js";
import { selectFiles, selectNodes, type SelectPredicate } from "../core/query/select.js";
import { searchEntities, type SearchOptions } from "../core/query/search.js";
import {
  computeImpact,
  computePath,
  isResolvedInternalImport,
  resolveModuleAnchor,
} from "../core/query/path-impact.js";
import {
  type EntityRef,
  type ImpactResult,
  type NeighborhoodResult,
  type PathExploreResult,
  type RelationRef,
  toEntityRef,
  toRelationRef,
} from "./views.js";

export type { SelectPredicate, SearchOptions };

export interface LoadedModel {
  projectRoot: string;
  index: ProjectIndex;
  graph: SemanticGraph;
}

export async function loadModel(startDir: string): Promise<LoadedModel> {
  const absoluteStart = path.resolve(startDir);
  const projectRoot = await store.findProjectRoot(absoluteStart);
  if (!projectRoot) {
    throw new StateError(
      `No FFVS project found near ${absoluteStart}. Run \`ffvs init\` and \`ffvs index .\`.`,
    );
  }

  const index = await store.readIndex(projectRoot);
  const graph = await store.readGraph(projectRoot);
  if (!index || !graph) {
    throw new StateError(`Project is not indexed. Run \`ffvs index .\`.`);
  }

  return { projectRoot, index, graph };
}

export interface ProjectSummary {
  projectRoot: string;
  name: string;
  indexedAt: string;
  files: number;
  languages: ProjectIndex["languages"];
  entities: ProjectIndex["entities"];
  parseErrors: ProjectIndex["parseErrors"];
  edgeCounts: Record<string, number>;
}

export async function summarizeProject(startDir: string): Promise<ProjectSummary> {
  const model = await loadModel(startDir);
  const config = await store.readConfig(model.projectRoot);
  const edgeCounts: Record<string, number> = {};
  for (const edge of model.graph.edges) {
    edgeCounts[edge.kind] = (edgeCounts[edge.kind] ?? 0) + 1;
  }
  return {
    projectRoot: model.projectRoot,
    name: config.name,
    indexedAt: model.index.indexedAt,
    files: model.index.files.length,
    languages: model.index.languages,
    entities: model.index.entities,
    parseErrors: model.index.parseErrors,
    edgeCounts,
  };
}

export function listEntities(
  graph: SemanticGraph,
  kind: EntityKind,
  predicate: SelectPredicate = {},
): GraphNode[] {
  const base = findNodesByKind(graph, kind).filter(
    (node) => node.properties["external"] !== true && node.properties["unresolved"] !== true,
  );
  return selectNodes(base, predicate).sort((a, b) =>
    (a.name ?? a.id).localeCompare(b.name ?? b.id),
  );
}

export function listFiles(
  index: ProjectIndex,
  predicate: SelectPredicate = {},
): ProjectIndex["files"] {
  return selectFiles(index.files, predicate).sort((a, b) => a.path.localeCompare(b.path));
}

/** SEARCH: find candidate entities by free-text needle (distinct from FILTER). */
export function searchModel(graph: SemanticGraph, options: SearchOptions): GraphNode[] {
  return searchEntities(graph, options);
}

export interface ImportRelationView {
  from: string;
  fromName: string | null;
  to: string;
  toName: string | null;
  specifier: unknown;
  external: boolean;
}

export function listImports(graph: SemanticGraph): ImportRelationView[] {
  return graph.edges
    .filter((edge) => edge.kind === "IMPORTS")
    .map((edge) => {
      const fromNode = getNode(graph, edge.from);
      const toNode = getNode(graph, edge.to);
      return {
        from: edge.from,
        fromName: fromNode?.name ?? null,
        to: edge.to,
        toName: toNode?.name ?? null,
        specifier: edge.properties?.["specifier"] ?? null,
        external: edge.properties?.["external"] === true,
      };
    })
    .sort(
      (a, b) =>
        a.from.localeCompare(b.from) || String(a.specifier).localeCompare(String(b.specifier)),
    );
}

export interface EntityInspection {
  entity: GraphNode;
  file: string | null;
  methods: GraphNode[];
  contained: GraphNode[];
  imports: ImportRelationView[];
  exports: GraphNode[];
  usedBy: GraphNode[];
  extends: GraphNode[];
  implements: GraphNode[];
  relations: GraphEdge[];
}

export function resolveEntity(graph: SemanticGraph, query: string): GraphNode {
  const exactId = getNode(graph, query);
  if (exactId) {
    return exactId;
  }

  const byName = graph.nodes.filter(
    (node) =>
      node.name === query &&
      node.properties["external"] !== true &&
      node.properties["unresolved"] !== true,
  );
  const preferredName = preferModule(byName);
  if (preferredName.length === 1) {
    return preferredName[0]!;
  }
  if (preferredName.length > 1) {
    const preview = preferredName
      .slice(0, 8)
      .map((n) => `  - ${n.id}`)
      .join("\n");
    throw new UsageError(
      `Ambiguous entity "${query}". Candidates:\n${preview}${preferredName.length > 8 ? "\n  ..." : ""}`,
    );
  }

  const byPath = graph.nodes.filter(
    (node) =>
      node.properties["path"] === query &&
      node.properties["external"] !== true &&
      node.properties["unresolved"] !== true,
  );
  const preferredPath = preferModule(byPath);
  if (preferredPath.length === 1) {
    return preferredPath[0]!;
  }
  if (preferredPath.length > 1) {
    const preview = preferredPath
      .slice(0, 8)
      .map((n) => `  - ${n.id}`)
      .join("\n");
    throw new UsageError(
      `Ambiguous entity "${query}". Candidates:\n${preview}${preferredPath.length > 8 ? "\n  ..." : ""}`,
    );
  }

  const bySuffix = graph.nodes.filter(
    (node) =>
      (node.id.endsWith(`:${query}`) ||
        node.id.includes(`/${query}`) ||
        node.id.includes(`:${query}.`)) &&
      node.properties["external"] !== true &&
      node.properties["unresolved"] !== true,
  );
  const preferredSuffix = preferModule(bySuffix);
  if (preferredSuffix.length === 1) {
    return preferredSuffix[0]!;
  }
  if (preferredSuffix.length > 1) {
    const preview = preferredSuffix
      .slice(0, 8)
      .map((n) => `  - ${n.id}`)
      .join("\n");
    throw new UsageError(
      `Ambiguous entity "${query}". Candidates:\n${preview}${preferredSuffix.length > 8 ? "\n  ..." : ""}`,
    );
  }

  throw new UsageError(`Entity not found: ${query}`);
}

/** Prefer MODULE when FILE and MODULE both match (ADR-0010). */
function preferModule(nodes: GraphNode[]): GraphNode[] {
  if (nodes.length <= 1) {
    return nodes;
  }
  const modules = nodes.filter((n) => n.kind === "MODULE");
  if (modules.length === 1) {
    return modules;
  }
  if (modules.length > 1) {
    return modules;
  }
  return nodes;
}

/**
 * Map a class/function/file entity to its module node for dependency-oriented queries.
 */
export { resolveModuleAnchor };

export function inspectEntity(graph: SemanticGraph, query: string): EntityInspection {
  const entity = resolveEntity(graph, query);
  const file =
    (typeof entity.properties["path"] === "string" ? entity.properties["path"] : null) ??
    entity.location?.file ??
    null;

  const anchored = resolveModuleAnchor(graph, entity);
  const moduleId = anchored.kind === "MODULE" ? anchored.id : file ? `module:${file}` : null;
  const methods = outgoing(graph, entity.id, "CONTAINS")
    .map((edge) => getNode(graph, edge.to))
    .filter((node): node is GraphNode => !!node && node.kind === "METHOD");

  const contained = outgoing(graph, entity.id, "CONTAINS")
    .map((edge) => getNode(graph, edge.to))
    .filter((node): node is GraphNode => !!node);

  const imports =
    moduleId !== null ? listImports(graph).filter((item) => item.from === moduleId) : [];

  const exports = moduleId
    ? outgoing(graph, moduleId, "EXPORTS")
        .map((edge) => getNode(graph, edge.to))
        .filter((node): node is GraphNode => !!node)
    : [];

  const usedByModules =
    moduleId !== null
      ? incoming(graph, moduleId, "IMPORTS")
          .map((edge) => getNode(graph, edge.from))
          .filter((node): node is GraphNode => !!node)
      : [];

  const extendsNodes = outgoing(graph, entity.id, "EXTENDS")
    .map((edge) => getNode(graph, edge.to))
    .filter((node): node is GraphNode => !!node);

  const implementsNodes = outgoing(graph, entity.id, "IMPLEMENTS")
    .map((edge) => getNode(graph, edge.to))
    .filter((node): node is GraphNode => !!node);

  const relations = [...outgoing(graph, entity.id), ...incoming(graph, entity.id)];

  return {
    entity,
    file,
    methods,
    contained,
    imports,
    exports,
    usedBy: usedByModules,
    extends: extendsNodes,
    implements: implementsNodes,
    relations,
  };
}

export function entityGraphView(
  graph: SemanticGraph,
  query: string,
): { entity: GraphNode; edges: GraphEdge[]; nodes: GraphNode[] } {
  const entity = resolveEntity(graph, query);
  const edges = [...outgoing(graph, entity.id), ...incoming(graph, entity.id)];
  const nodeIds = new Set<string>([entity.id]);
  for (const edge of edges) {
    nodeIds.add(edge.from);
    nodeIds.add(edge.to);
  }
  const nodes = [...nodeIds]
    .map((id) => getNode(graph, id))
    .filter((node): node is GraphNode => !!node);

  return { entity, edges, nodes };
}

function relationsFromEdges(graph: SemanticGraph, edges: GraphEdge[]): RelationRef[] {
  const result: RelationRef[] = [];
  for (const edge of edges) {
    const from = getNode(graph, edge.from);
    const to = getNode(graph, edge.to);
    if (!from || !to) {
      continue;
    }
    result.push(toRelationRef(edge, from, to));
  }
  return result.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
}

function neighborhood(
  graph: SemanticGraph,
  entity: GraphNode,
  operation: string,
  edges: GraphEdge[],
  kinds: RelationKind[],
): NeighborhoodResult {
  const relations = relationsFromEdges(graph, edges);
  const nodeMap = new Map<string, EntityRef>();
  for (const rel of relations) {
    nodeMap.set(rel.from.id, rel.from);
    nodeMap.set(rel.to.id, rel.to);
  }
  nodeMap.delete(entity.id);
  return {
    entity: toEntityRef(entity),
    operation,
    relationKinds: kinds,
    relations,
    nodes: [...nodeMap.values()].sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id)),
  };
}

/** What this entity (module-anchored) imports / depends on. */
export function exploreDependencies(graph: SemanticGraph, query: string): NeighborhoodResult {
  const entity = resolveEntity(graph, query);
  const anchor = resolveModuleAnchor(graph, entity);
  const kinds: RelationKind[] = ["IMPORTS"];
  const edges = outgoingNeighbors(graph, anchor.id, { kinds });
  return neighborhood(graph, anchor, "dependencies", edges, kinds);
}

/** Who depends on this entity (reverse IMPORTS). */
export function exploreDependents(graph: SemanticGraph, query: string): NeighborhoodResult {
  const entity = resolveEntity(graph, query);
  const anchor = resolveModuleAnchor(graph, entity);
  const kinds: RelationKind[] = ["IMPORTS"];
  const edges = incomingNeighbors(graph, anchor.id, { kinds }).filter(isResolvedInternalImport);
  return neighborhood(graph, anchor, "dependents", edges, kinds);
}

/** Structural children via CONTAINS. */
export function exploreChildren(graph: SemanticGraph, query: string): NeighborhoodResult {
  const entity = resolveEntity(graph, query);
  const kinds: RelationKind[] = ["CONTAINS"];
  const childNodes = graphChildren(graph, entity.id, kinds);
  const edges = outgoingNeighbors(graph, entity.id, { kinds }).filter((edge) =>
    childNodes.some((node) => node.id === edge.to),
  );
  return neighborhood(graph, entity, "children", edges, kinds);
}

/** Structural parents via CONTAINS. */
export function exploreParents(graph: SemanticGraph, query: string): NeighborhoodResult {
  const entity = resolveEntity(graph, query);
  const kinds: RelationKind[] = ["CONTAINS"];
  const parentNodes = graphParents(graph, entity.id, kinds);
  const edges = incomingNeighbors(graph, entity.id, { kinds }).filter((edge) =>
    parentNodes.some((node) => node.id === edge.from),
  );
  return neighborhood(graph, entity, "parents", edges, kinds);
}

/** First-class relations incident to an entity (or all IMPORTS if omitted). */
export function exploreRelations(
  graph: SemanticGraph,
  query?: string,
  kinds?: RelationKind[],
): { operation: "relations"; entity: EntityRef | null; relations: RelationRef[] } {
  const filterKinds = kinds && kinds.length > 0 ? kinds : undefined;
  let edges: GraphEdge[];
  let entity: GraphNode | null = null;

  if (query) {
    entity = resolveEntity(graph, query);
    const anchor = resolveModuleAnchor(graph, entity);
    const ids = new Set<string>([entity.id, anchor.id]);
    const collected: GraphEdge[] = [];
    const seen = new Set<string>();
    for (const id of ids) {
      const navOpts = filterKinds ? { kinds: filterKinds } : {};
      for (const edge of [
        ...outgoingNeighbors(graph, id, navOpts),
        ...incomingNeighbors(graph, id, navOpts),
      ]) {
        if (seen.has(edge.id)) {
          continue;
        }
        seen.add(edge.id);
        collected.push(edge);
      }
    }
    edges = collected;
  } else {
    edges = graph.edges.filter((edge) => !filterKinds || filterKinds.includes(edge.kind));
  }

  return {
    operation: "relations",
    entity: entity ? toEntityRef(entity) : null,
    relations: relationsFromEdges(graph, edges),
  };
}

/** Shortest directed path over IMPORTS by default (module-anchored). */
export function explorePath(
  graph: SemanticGraph,
  fromQuery: string,
  toQuery: string,
  kinds: RelationKind[] = ["IMPORTS"],
): PathExploreResult {
  const fromEntity = resolveEntity(graph, fromQuery);
  const toEntity = resolveEntity(graph, toQuery);
  const core = computePath(graph, fromEntity, toEntity, kinds);
  return {
    operation: "path",
    from: toEntityRef(core.from),
    to: toEntityRef(core.to),
    found: core.found,
    relationKinds: core.relationKinds,
    nodes: core.nodes.map(toEntityRef),
    relations: core.edges
      .map((edge) => {
        const from = getNode(graph, edge.from);
        const to = getNode(graph, edge.to);
        if (!from || !to) {
          return null;
        }
        return toRelationRef(edge, from, to);
      })
      .filter((rel): rel is NonNullable<typeof rel> => rel !== null),
  };
}

/**
 * Impact = transitive dependents via IMPORTS (who may break if this module changes).
 * Depth 1 is direct dependents.
 */
export function exploreImpact(graph: SemanticGraph, query: string): ImpactResult {
  const entity = resolveEntity(graph, query);
  const core = computeImpact(graph, entity);
  return {
    operation: "impact",
    entity: toEntityRef(core.anchor),
    relationKinds: core.relationKinds,
    affected: core.affected.map((item) => ({
      ...toEntityRef(item.node),
      depth: item.depth,
    })),
  };
}

/** Outgoing CALLS from a function/method (or module for top-level calls). */
export function exploreCalls(graph: SemanticGraph, query: string): NeighborhoodResult {
  const entity = resolveEntity(graph, query);
  const kinds: RelationKind[] = ["CALLS"];
  const edges = outgoingNeighbors(graph, entity.id, { kinds });
  return neighborhood(graph, entity, "calls", edges, kinds);
}

/** Incoming CALLS — who calls this entity (CALLED_BY). */
export function exploreCallers(graph: SemanticGraph, query: string): NeighborhoodResult {
  const entity = resolveEntity(graph, query);
  const kinds: RelationKind[] = ["CALLS"];
  const edges = incomingNeighbors(graph, entity.id, { kinds });
  return neighborhood(graph, entity, "callers", edges, kinds);
}

export type { GraphEdge, GraphNode, RelationKind };
export type { EntityRef, ImpactResult, NeighborhoodResult, PathExploreResult, RelationRef };

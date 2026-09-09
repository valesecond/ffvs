import path from "node:path";

import * as store from "../adapters/storage/ffvs-store.js";
import { findNodesByKind, getNode, incoming, outgoing } from "../core/domain/graph.js";
import { StateError, UsageError } from "../core/domain/errors.js";
import type {
  EntityKind,
  GraphEdge,
  GraphNode,
  ProjectIndex,
  RelationKind,
  SemanticGraph,
} from "../core/domain/types.js";

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

export function listEntities(graph: SemanticGraph, kind: EntityKind): GraphNode[] {
  return findNodesByKind(graph, kind)
    .filter(
      (node) => node.properties["external"] !== true && node.properties["unresolved"] !== true,
    )
    .sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));
}

export function listFiles(index: ProjectIndex): ProjectIndex["files"] {
  return [...index.files].sort((a, b) => a.path.localeCompare(b.path));
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
  if (byName.length === 1) {
    return byName[0]!;
  }
  if (byName.length > 1) {
    const preview = byName
      .slice(0, 8)
      .map((n) => `  - ${n.id}`)
      .join("\n");
    throw new UsageError(
      `Ambiguous entity "${query}". Candidates:\n${preview}${byName.length > 8 ? "\n  ..." : ""}`,
    );
  }

  const bySuffix = graph.nodes.filter(
    (node) =>
      (node.id.endsWith(`:${query}`) ||
        node.id.includes(`/${query}`) ||
        node.id.includes(`:${query}.`)) &&
      node.properties["external"] !== true,
  );
  if (bySuffix.length === 1) {
    return bySuffix[0]!;
  }
  if (bySuffix.length > 1) {
    const preview = bySuffix
      .slice(0, 8)
      .map((n) => `  - ${n.id}`)
      .join("\n");
    throw new UsageError(
      `Ambiguous entity "${query}". Candidates:\n${preview}${bySuffix.length > 8 ? "\n  ..." : ""}`,
    );
  }

  throw new UsageError(`Entity not found: ${query}`);
}

export function inspectEntity(graph: SemanticGraph, query: string): EntityInspection {
  const entity = resolveEntity(graph, query);
  const file =
    (typeof entity.properties["path"] === "string" ? entity.properties["path"] : null) ??
    entity.location?.file ??
    null;

  const moduleId = file ? `module:${file}` : findOwningModule(graph, entity.id);
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

function findOwningModule(graph: SemanticGraph, entityId: string): string | null {
  const declared = incoming(graph, entityId, "DECLARES")[0];
  if (declared) {
    return declared.from;
  }
  const contained = incoming(graph, entityId, "CONTAINS")[0];
  if (contained?.from.startsWith("module:")) {
    return contained.from;
  }
  // method → class → module
  const parent = incoming(graph, entityId, "CONTAINS")[0];
  if (parent) {
    const grand = incoming(graph, parent.from, "DECLARES")[0];
    if (grand) {
      return grand.from;
    }
  }
  return null;
}

export type { GraphEdge, GraphNode, RelationKind };

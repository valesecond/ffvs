import { getNode, incoming, outgoing } from "../domain/graph.js";
import type {
  EntityKind,
  GraphEdge,
  GraphNode,
  ProjectIndex,
  SemanticGraph,
} from "../domain/types.js";
import { incomingNeighbors, outgoingNeighbors } from "../graph/navigate.js";
import { matchesNode, type SelectPredicate } from "../query/select.js";
import { searchEntities } from "../query/search.js";
import type { EntityKindName, QueryAst, WhereStage } from "./ast.js";
import { LanguageError } from "./errors.js";
import {
  emptyResultSet,
  tallyResolutions,
  type QueryResultSet,
} from "./result-set.js";
import { resolveTraverse } from "./traverse-map.js";

export interface ExecuteContext {
  graph: SemanticGraph;
  index: ProjectIndex;
}

const KIND_MAP: Record<Exclude<EntityKindName, "entities">, EntityKind> = {
  functions: "FUNCTION",
  function: "FUNCTION",
  classes: "CLASS",
  class: "CLASS",
  files: "FILE",
  file: "FILE",
  modules: "MODULE",
  module: "MODULE",
  methods: "METHOD",
  method: "METHOD",
  variables: "VARIABLE",
  variable: "VARIABLE",
};

/**
 * Execute a Query AST against an already-loaded semantic graph.
 * Reuses core select/search/navigate — does not reimplement graph logic.
 */
export function executeQuery(ast: QueryAst, ctx: ExecuteContext): QueryResultSet {
  let state = emptyResultSet();
  let hasSeed = false;

  for (const stage of ast.stages) {
    switch (stage.type) {
      case "select": {
        state = applySelect(ctx, stage.kind);
        hasSeed = true;
        state.stagesApplied.push(`select ${stage.kind}`);
        break;
      }
      case "search": {
        const kind =
          stage.kind && stage.kind !== "entities" ? KIND_MAP[stage.kind] : undefined;
        state.entities = searchEntities(ctx.graph, {
          needle: stage.needle,
          ...(kind !== undefined ? { kind } : {}),
          ...(stage.path !== undefined ? { path: stage.path } : {}),
        });
        state.relations = [];
        delete state.descriptions;
        hasSeed = true;
        state.stagesApplied.push(`search "${stage.needle}"`);
        break;
      }
      case "where": {
        if (!hasSeed) {
          throw new LanguageError(
            "SEMANTIC",
            "where requires a prior select or search",
            stage.span,
          );
        }
        state.entities = state.entities.filter((node) =>
          matchesNode(node, whereToPredicate(stage)),
        );
        delete state.descriptions;
        state.stagesApplied.push(`where ${stage.field} ${stage.op} "${stage.value}"`);
        break;
      }
      case "traverse": {
        if (!hasSeed) {
          throw new LanguageError(
            "SEMANTIC",
            "traverse requires a prior select or search",
            stage.span,
          );
        }
        const resolved = resolveTraverse(stage.relation, stage.direction);
        const { entities, relations } = traverseEntities(ctx.graph, state.entities, resolved);
        state.entities = entities;
        state.relations = relations;
        state.diagnostics.resolutionCounts = tallyResolutions(relations);
        delete state.descriptions;
        hasSeed = true;
        state.stagesApplied.push(
          `traverse ${stage.relation}${stage.direction ? ` ${stage.direction}` : ""}`,
        );
        break;
      }
      case "describe": {
        if (!hasSeed) {
          throw new LanguageError(
            "SEMANTIC",
            "describe requires a prior select or search",
            stage.span,
          );
        }
        state.descriptions = state.entities.map((entity) => describeEntity(ctx.graph, entity));
        state.stagesApplied.push("describe");
        break;
      }
    }
  }

  if (state.relations.length > 0) {
    state.diagnostics.resolutionCounts = tallyResolutions(state.relations);
  }

  return state;
}

function applySelect(ctx: ExecuteContext, kindName: EntityKindName): QueryResultSet {
  const state = emptyResultSet();
  const base = ctx.graph.nodes.filter(
    (node) => node.properties["external"] !== true && node.properties["unresolved"] !== true,
  );
  if (kindName === "entities") {
    state.entities = [...base].sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));
  } else {
    const kind = KIND_MAP[kindName];
    state.entities = base
      .filter((node) => node.kind === kind)
      .sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));
  }
  return state;
}

function whereToPredicate(stage: WhereStage): SelectPredicate {
  const mode = stage.op === "eq" ? "equals" : stage.op;
  if (stage.field === "name") {
    return { name: stage.value, nameMode: mode };
  }
  return { path: stage.value, pathMode: mode };
}

function traverseEntities(
  graph: SemanticGraph,
  seeds: GraphNode[],
  spec: ReturnType<typeof resolveTraverse>,
): { entities: GraphNode[]; relations: GraphEdge[] } {
  const entityMap = new Map<string, GraphNode>();
  const relationMap = new Map<string, GraphEdge>();

  for (const seed of seeds) {
    const origin = spec.moduleAnchor ? resolveModuleAnchor(graph, seed) : seed;
    const kinds = [spec.relationKind] as const;
    let edges =
      spec.direction === "inbound"
        ? incomingNeighbors(graph, origin.id, { kinds })
        : outgoingNeighbors(graph, origin.id, { kinds });

    if (spec.resolvedImportsOnly) {
      edges = edges.filter(isResolvedInternalImport);
    }

    for (const edge of edges) {
      relationMap.set(edge.id, edge);
      const neighborId = spec.direction === "inbound" ? edge.from : edge.to;
      const neighbor = getNode(graph, neighborId);
      if (neighbor) {
        entityMap.set(neighbor.id, neighbor);
      }
    }
  }

  return {
    entities: [...entityMap.values()].sort((a, b) =>
      (a.name ?? a.id).localeCompare(b.name ?? b.id),
    ),
    relations: [...relationMap.values()],
  };
}

function describeEntity(
  graph: SemanticGraph,
  entity: GraphNode,
): NonNullable<QueryResultSet["descriptions"]>[number] {
  const edges = [...outgoing(graph, entity.id), ...incoming(graph, entity.id)];
  const edgeKinds = [...new Set(edges.map((e) => e.kind))].sort();
  return {
    id: entity.id,
    kind: entity.kind,
    name: entity.name,
    path: typeof entity.properties["path"] === "string" ? entity.properties["path"] : null,
    relationCount: edges.length,
    edgeKinds,
  };
}

function resolveModuleAnchor(graph: SemanticGraph, entity: GraphNode): GraphNode {
  if (entity.kind === "MODULE") {
    return entity;
  }
  if (entity.kind === "FILE") {
    const module = graph.nodes.find(
      (node) =>
        node.kind === "MODULE" &&
        node.properties["path"] === entity.properties["path"] &&
        node.properties["external"] !== true,
    );
    if (module) {
      return module;
    }
  }
  const declared = incoming(graph, entity.id, "DECLARES")[0];
  if (declared) {
    const module = getNode(graph, declared.from);
    if (module) {
      return module;
    }
  }
  const contained = incoming(graph, entity.id, "CONTAINS")[0];
  if (contained?.from.startsWith("module:")) {
    const module = getNode(graph, contained.from);
    if (module) {
      return module;
    }
  }
  return entity;
}

function isResolvedInternalImport(edge: GraphEdge): boolean {
  if (edge.kind !== "IMPORTS") {
    return false;
  }
  if (edge.properties?.["resolution"] === "RESOLVED") {
    return true;
  }
  return (
    edge.properties?.["resolution"] === undefined &&
    edge.properties?.["external"] !== true &&
    edge.properties?.["unresolved"] !== true &&
    edge.to.startsWith("module:")
  );
}

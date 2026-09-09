import { getNode, incoming, outgoing } from "../domain/graph.js";
import type {
  EntityKind,
  GraphEdge,
  GraphNode,
  ProjectIndex,
  SemanticGraph,
} from "../domain/types.js";
import { incomingNeighbors, outgoingNeighbors } from "../graph/navigate.js";
import {
  computeCallImpact,
  computeImpact,
  computePath,
  isResolvedInternalImport,
  resolveModuleAnchor,
} from "../query/path-impact.js";
import { matchesResolution, type ResolutionState } from "../query/resolution.js";
import { matchesNode, type SelectPredicate } from "../query/select.js";
import { searchEntities } from "../query/search.js";
import type {
  EntityKindName,
  QueryAst,
  ResolutionStateName,
  SourceSpan,
  WhereStage,
} from "./ast.js";
import { LanguageError } from "./errors.js";
import { compareEdges, compareEntities } from "./ordering.js";
import {
  emptyResultSet,
  tallyResolutions,
  type PathRecord,
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
 * PATH/IMPACT reuse `computePath` / `computeImpact` (same as CLI).
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
        const kind = stage.kind && stage.kind !== "entities" ? KIND_MAP[stage.kind] : undefined;
        state.entities = searchEntities(ctx.graph, {
          needle: stage.needle,
          ...(kind !== undefined ? { kind } : {}),
          ...(stage.path !== undefined ? { path: stage.path } : {}),
        });
        clearHopState(state);
        hasSeed = true;
        state.stagesApplied.push(`search "${stage.needle}"`);
        break;
      }
      case "where": {
        if (!hasSeed) {
          throw new LanguageError(
            "SEMANTIC",
            "where requires a prior select, search, or path",
            stage.span,
          );
        }
        state.entities = state.entities.filter((node) =>
          matchesNode(node, whereToPredicate(stage)),
        );
        clearHopState(state);
        state.stagesApplied.push(`where ${stage.field} ${stage.op} "${stage.value}"`);
        break;
      }
      case "traverse": {
        if (!hasSeed) {
          throw new LanguageError(
            "SEMANTIC",
            "traverse requires a prior select, search, or path",
            stage.span,
          );
        }
        const resolved = resolveTraverse(stage.relation, stage.direction);
        const { entities, relations } = traverseEntities(
          ctx.graph,
          state.entities,
          resolved,
          stage.resolution,
        );
        state.entities = entities;
        state.relations = relations;
        state.diagnostics.resolutionCounts = tallyResolutions(relations);
        delete state.descriptions;
        delete state.paths;
        delete state.impact;
        hasSeed = true;
        const resSuffix = stage.resolution ? ` resolution ${stage.resolution}` : "";
        state.stagesApplied.push(
          `traverse ${stage.relation}${stage.direction ? ` ${stage.direction}` : ""}${resSuffix}`,
        );
        break;
      }
      case "path": {
        const result = applyPath(ctx.graph, state, stage, hasSeed);
        state = result.state;
        hasSeed = result.hasSeed;
        break;
      }
      case "impact": {
        if (!hasSeed) {
          throw new LanguageError(
            "SEMANTIC",
            "impact requires a prior select, search, or path",
            stage.span,
          );
        }
        state = applyImpact(ctx.graph, state, stage);
        const alongLabel =
          stage.along === "calls"
            ? `impact along calls${stage.resolution ? ` resolution ${stage.resolution}` : ""}`
            : "impact";
        state.stagesApplied.push(alongLabel);
        hasSeed = true;
        break;
      }
      case "describe": {
        if (!hasSeed) {
          throw new LanguageError(
            "SEMANTIC",
            "describe requires a prior select, search, path, or impact",
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

function clearHopState(state: QueryResultSet): void {
  state.relations = [];
  resetResolutionDiagnostics(state);
  delete state.descriptions;
  delete state.paths;
  delete state.impact;
}

function applyPath(
  graph: SemanticGraph,
  state: QueryResultSet,
  stage: Extract<QueryAst["stages"][number], { type: "path" }>,
  hasSeed: boolean,
): { state: QueryResultSet; hasSeed: boolean } {
  let fromEntity: GraphNode;
  if (stage.from !== undefined) {
    fromEntity = lookupEntity(graph, stage.from, stage.span, "path source");
  } else {
    if (!hasSeed) {
      throw new LanguageError(
        "SEMANTIC",
        'path "target" requires a prior select/search seed (or use path "A" "B")',
        stage.span,
      );
    }
    const anchors = uniqueAnchors(graph, state.entities);
    if (anchors.length === 0) {
      throw new LanguageError("SEMANTIC", "path requires a non-empty source set", stage.span);
    }
    if (anchors.length > 1) {
      const preview = anchors
        .slice(0, 8)
        .map((n) => `  - ${n.id}`)
        .join("\n");
      throw new LanguageError(
        "SEMANTIC",
        `path requires exactly one source entity after module anchoring, got ${anchors.length}`,
        stage.span,
        `Candidates:\n${preview}`,
      );
    }
    fromEntity = anchors[0]!;
  }

  const toEntity = lookupEntity(graph, stage.to, stage.span, "path target");
  const core = computePath(graph, fromEntity, toEntity, ["IMPORTS"]);

  const next = emptyResultSet();
  next.stagesApplied = [...state.stagesApplied];
  const record: PathRecord = {
    found: core.found,
    fromId: core.from.id,
    toId: core.to.id,
    nodeIds: core.nodes.map((n) => n.id),
    length: core.length,
    relationKinds: core.relationKinds,
  };
  next.paths = [record];
  if (core.found) {
    next.entities = [...core.nodes];
    next.relations = [...core.edges].sort(compareEdges);
    next.diagnostics.resolutionCounts = tallyResolutions(next.relations);
  }
  next.stagesApplied.push(
    stage.from !== undefined ? `path "${stage.from}" "${stage.to}"` : `path "${stage.to}"`,
  );
  return { state: next, hasSeed: true };
}

function applyImpact(
  graph: SemanticGraph,
  state: QueryResultSet,
  stage: Extract<QueryAst["stages"][number], { type: "impact" }>,
): QueryResultSet {
  const entityMap = new Map<string, GraphNode>();
  const relationMap = new Map<string, GraphEdge>();
  const seedIds: string[] = [];

  if (stage.along === "calls") {
    const resolution = toResolutionState(stage.resolution ?? "resolved");
    for (const seed of [...state.entities].sort(compareEntities)) {
      seedIds.push(seed.id);
      const core = computeCallImpact(graph, seed, { resolution });
      for (const hit of core.affected) {
        entityMap.set(hit.node.id, hit.node);
        relationMap.set(hit.via.id, hit.via);
      }
    }
    const next = emptyResultSet();
    next.stagesApplied = [...state.stagesApplied];
    next.entities = [...entityMap.values()].sort(compareEntities);
    next.relations = [...relationMap.values()].sort(compareEdges);
    next.diagnostics.resolutionCounts = tallyResolutions(next.relations);
    next.impact = {
      seedIds: [...seedIds].sort((a, b) => a.localeCompare(b, "en")),
      affectedCount: next.entities.length,
      relationKinds: ["CALLS"],
      along: "calls",
      resolution,
    };
    return next;
  }

  const anchors = uniqueAnchors(graph, state.entities);
  for (const anchor of anchors) {
    seedIds.push(anchor.id);
    const core = computeImpact(graph, anchor);
    for (const hit of core.affected) {
      entityMap.set(hit.node.id, hit.node);
      relationMap.set(hit.via.id, hit.via);
    }
  }

  const next = emptyResultSet();
  next.stagesApplied = [...state.stagesApplied];
  next.entities = [...entityMap.values()].sort(compareEntities);
  next.relations = [...relationMap.values()].sort(compareEdges);
  next.diagnostics.resolutionCounts = tallyResolutions(next.relations);
  next.impact = {
    seedIds: [...seedIds].sort((a, b) => a.localeCompare(b, "en")),
    affectedCount: next.entities.length,
    relationKinds: ["IMPORTS"],
    along: "imports",
  };
  return next;
}

function toResolutionState(name: ResolutionStateName): ResolutionState {
  return name.toUpperCase() as ResolutionState;
}

function uniqueAnchors(graph: SemanticGraph, entities: GraphNode[]): GraphNode[] {
  const map = new Map<string, GraphNode>();
  for (const entity of entities) {
    const anchor = resolveModuleAnchor(graph, entity);
    map.set(anchor.id, anchor);
  }
  return [...map.values()].sort(compareEntities);
}

function lookupEntity(
  graph: SemanticGraph,
  query: string,
  span: SourceSpan,
  label: string,
): GraphNode {
  const exact = getNode(graph, query);
  if (exact && exact.properties["external"] !== true && exact.properties["unresolved"] !== true) {
    return exact;
  }

  const byName = graph.nodes.filter(
    (node) =>
      node.name === query &&
      node.properties["external"] !== true &&
      node.properties["unresolved"] !== true,
  );
  const preferred = preferModule(byName);
  if (preferred.length === 1) {
    return preferred[0]!;
  }
  if (preferred.length > 1) {
    const preview = preferred
      .slice(0, 8)
      .map((n) => `  - ${n.id}`)
      .join("\n");
    throw new LanguageError(
      "SEMANTIC",
      `ambiguous ${label} "${query}"`,
      span,
      `Candidates:\n${preview}`,
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
    throw new LanguageError(
      "SEMANTIC",
      `ambiguous ${label} "${query}"`,
      span,
      `Candidates:\n${preview}`,
    );
  }

  throw new LanguageError("SEMANTIC", `unknown ${label} "${query}"`, span);
}

function preferModule(nodes: GraphNode[]): GraphNode[] {
  if (nodes.length <= 1) {
    return nodes;
  }
  const modules = nodes.filter((n) => n.kind === "MODULE");
  if (modules.length >= 1) {
    return modules;
  }
  return nodes;
}

function applySelect(ctx: ExecuteContext, kindName: EntityKindName): QueryResultSet {
  const state = emptyResultSet();
  const base = ctx.graph.nodes.filter(
    (node) => node.properties["external"] !== true && node.properties["unresolved"] !== true,
  );
  if (kindName === "entities") {
    state.entities = [...base].sort(compareEntities);
  } else {
    const kind = KIND_MAP[kindName];
    state.entities = base.filter((node) => node.kind === kind).sort(compareEntities);
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
  resolution?: ResolutionStateName,
): { entities: GraphNode[]; relations: GraphEdge[] } {
  const entityMap = new Map<string, GraphNode>();
  const relationMap = new Map<string, GraphEdge>();
  const wanted = resolution ? toResolutionState(resolution) : undefined;

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
    if (wanted) {
      edges = edges.filter((edge) => matchesResolution(edge, wanted));
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
    entities: [...entityMap.values()].sort(compareEntities),
    relations: [...relationMap.values()].sort(compareEdges),
  };
}

function describeEntity(
  graph: SemanticGraph,
  entity: GraphNode,
): NonNullable<QueryResultSet["descriptions"]>[number] {
  const edges = [...outgoing(graph, entity.id), ...incoming(graph, entity.id)].sort(compareEdges);
  const edgeKinds = [...new Set(edges.map((e) => e.kind))].sort((a, b) => a.localeCompare(b, "en"));
  const moduleEdge =
    incoming(graph, entity.id, "DECLARES")[0] ?? incoming(graph, entity.id, "CONTAINS")[0];
  const moduleId =
    moduleEdge?.from.startsWith("module:") === true
      ? moduleEdge.from
      : entity.kind === "MODULE"
        ? entity.id
        : null;
  return {
    id: entity.id,
    kind: entity.kind,
    name: entity.name,
    path: typeof entity.properties["path"] === "string" ? entity.properties["path"] : null,
    module: moduleId,
    startLine: entity.location?.startLine ?? null,
    endLine: entity.location?.endLine ?? null,
    relationCount: edges.length,
    edgeKinds,
  };
}

function resetResolutionDiagnostics(state: QueryResultSet): void {
  state.diagnostics.resolutionCounts = {
    RESOLVED: 0,
    EXTERNAL: 0,
    UNRESOLVED: 0,
    AMBIGUOUS: 0,
    unknown: 0,
  };
}

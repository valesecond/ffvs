import { getNode } from "../../core/domain/graph.js";
import {
  exploreCallers,
  exploreCalls,
  exploreDependencies,
  exploreDependents,
  exploreImpact,
  explorePath,
  inspectEntity,
  listEntities,
  searchModel,
  type LoadedModel,
} from "../../application/explore.js";
import type { EntityKind } from "../../core/domain/types.js";
import { nodeMenuItem, type MenuItem, type ViewState } from "./types.js";

export function homeView(
  projectName: string,
  overview: string | null,
  hasModel: boolean,
): ViewState {
  const items: MenuItem[] = hasModel
    ? [
        { id: "explore", label: "Explore", hint: "Browse by kind" },
        { id: "search", label: "Search", hint: "Find entities" },
        { id: "files", label: "Files" },
        { id: "modules", label: "Modules" },
        { id: "functions", label: "Functions" },
        { id: "classes", label: "Classes" },
        { id: "paths", label: "Paths", hint: "IMPORTS path between modules" },
        { id: "query", label: "Query", hint: "FFVS Query Language" },
        { id: "project", label: "Project", hint: "Status overview" },
        { id: "help", label: "Help" },
        { id: "quit", label: "Quit" },
      ]
    : [
        { id: "help", label: "Help" },
        { id: "quit", label: "Quit" },
      ];

  return {
    kind: "home",
    title: "What do you want to explore?",
    crumb: ["FFVS", projectName],
    cursor: 0,
    items,
    ...(overview ? { message: overview } : {}),
  };
}

export function exploreKindsView(projectName: string): ViewState {
  return {
    kind: "entity-list",
    title: "Explore",
    crumb: ["FFVS", projectName, "Explore"],
    cursor: 0,
    items: [
      { id: "files", label: "Files" },
      { id: "modules", label: "Modules" },
      { id: "functions", label: "Functions" },
      { id: "classes", label: "Classes" },
      { id: "variables", label: "Variables" },
    ],
    meta: { exploreKinds: true },
  };
}

export function entityListView(
  model: LoadedModel,
  kind: EntityKind,
  projectName: string,
  title: string,
): ViewState {
  const nodes = listEntities(model.graph, kind).slice(0, 500);
  return {
    kind: "entity-list",
    title: `${title}  (${nodes.length}${nodes.length >= 500 ? "+" : ""})`,
    crumb: ["FFVS", projectName, title],
    cursor: 0,
    items: nodes.map(nodeMenuItem),
    meta: { listKind: kind },
  };
}

export function entityDetailView(
  model: LoadedModel,
  entityId: string,
  crumbs: string[],
): ViewState {
  const inspection = inspectEntity(model.graph, entityId);
  const e = inspection.entity;
  const path =
    inspection.file ??
    (typeof e.properties["path"] === "string" ? (e.properties["path"] as string) : null);
  const line = e.location?.startLine;
  const loc = path ? (line ? `${path}:${line}` : path) : "";
  const moduleName =
    typeof e.properties["module"] === "string" ? (e.properties["module"] as string) : null;
  const resolution =
    typeof e.properties["resolution"] === "string" ? (e.properties["resolution"] as string) : null;

  const message = [
    e.kind,
    loc,
    moduleName ? `Module     ${moduleName}` : null,
    resolution ? `Resolution ${resolution}` : null,
  ]
    .filter(Boolean)
    .join("\n  ");

  return {
    kind: "entity",
    title: e.name ?? e.id,
    crumb: [...crumbs, e.name ?? e.id],
    cursor: 0,
    entityId: e.id,
    message,
    items: [
      { id: "calls", label: "Calls", data: { entityId: e.id } },
      { id: "callers", label: "Callers", data: { entityId: e.id } },
      { id: "dependencies", label: "Dependencies", data: { entityId: e.id } },
      { id: "dependents", label: "Dependents", data: { entityId: e.id } },
      { id: "path", label: "Path", hint: "from this entity", data: { entityId: e.id } },
      { id: "impact", label: "Impact", data: { entityId: e.id } },
      { id: "source", label: "Source location", data: { entityId: e.id } },
    ],
  };
}

export function neighborhoodView(
  model: LoadedModel,
  entityId: string,
  relation: "calls" | "callers" | "dependencies" | "dependents",
  crumbs: string[],
): ViewState {
  const explorers = {
    calls: exploreCalls,
    callers: exploreCallers,
    dependencies: exploreDependencies,
    dependents: exploreDependents,
  } as const;
  const result = explorers[relation](model.graph, entityId);
  const title = relation.charAt(0).toUpperCase() + relation.slice(1);
  const items = result.nodes.map((n) => {
    const node = getNode(model.graph, n.id);
    return node ? nodeMenuItem(node) : { id: n.id, label: n.name ?? n.id, hint: n.kind };
  });
  return {
    kind: "neighborhood",
    title: `${title} of ${result.entity.name ?? result.entity.id}`,
    crumb: [...crumbs, title],
    cursor: 0,
    entityId,
    items,
    message: `${items.length} related`,
    meta: { relation },
  };
}

export function searchResultsView(
  model: LoadedModel,
  query: string,
  projectName: string,
): ViewState {
  const nodes = searchModel(model.graph, { needle: query }).slice(0, 100);
  return {
    kind: "search",
    title: `Search  "${query}"`,
    crumb: ["FFVS", projectName, "Search"],
    cursor: 0,
    items: nodes.map(nodeMenuItem),
    message: `${nodes.length} result${nodes.length === 1 ? "" : "s"}`,
    meta: { query },
  };
}

export function impactView(model: LoadedModel, entityId: string, crumbs: string[]): ViewState {
  const result = exploreImpact(model.graph, entityId);
  const items: MenuItem[] = result.affected.map((a) => {
    const node = getNode(model.graph, a.id);
    const base = node
      ? nodeMenuItem(node)
      : { id: a.id, label: a.name ?? a.id, hint: undefined as string | undefined };
    return {
      ...base,
      hint: [base.hint, `depth ${a.depth}`].filter(Boolean).join(" · "),
    };
  });
  return {
    kind: "impact",
    title: `Impact  ${result.entity.name ?? result.entity.id}`,
    crumb: [...crumbs, "Impact"],
    cursor: 0,
    entityId,
    items,
    message: `${result.affected.length} affected (IMPORTS)`,
  };
}

export function pathResultView(
  model: LoadedModel,
  fromQuery: string,
  toQuery: string,
  crumbs: string[],
): ViewState {
  const result = explorePath(model.graph, fromQuery, toQuery);
  const items: MenuItem[] = [];
  if (result.found && result.nodes.length > 0) {
    for (let i = 0; i < result.nodes.length; i += 1) {
      const n = result.nodes[i]!;
      const node = getNode(model.graph, n.id);
      const edge = result.relations[i];
      if (node) {
        const item = nodeMenuItem(node);
        items.push(edge ? { ...item, hint: edge.kind } : item);
      } else {
        items.push({ id: n.id, label: n.name ?? n.id });
      }
    }
  }
  return {
    kind: "path-result",
    title: `Path  ${fromQuery} -> ${toQuery}`,
    crumb: [...crumbs, "Path"],
    cursor: 0,
    items,
    message: result.found ? `${result.nodes.length} nodes (IMPORTS)` : "No IMPORTS path found",
  };
}

export function helpView(projectName: string): ViewState {
  return {
    kind: "help",
    title: "Help",
    crumb: ["FFVS", projectName, "Help"],
    cursor: 0,
    items: [{ id: "back", label: "Back" }],
    message: [
      "NAVIGATION",
      "  Up/Down    Navigate",
      "  Enter      Select",
      "  Esc / b    Back",
      "  /          Search",
      "  :          Command prompt",
      "  p          Command palette",
      "  ?          Help",
      "  q          Quit",
      "",
      "COMMANDS (at FFVS >)",
      "  search <q>   inspect <id>",
      "  dependencies|dependents|calls|callers <id>",
      "  impact <id>  path <from> <to>",
      "  query <dsl>  files|functions|classes|modules",
      "  help         quit",
    ].join("\n"),
  };
}

export function paletteView(projectName: string, filter = ""): ViewState {
  const all: MenuItem[] = [
    { id: "search", label: "search", hint: "Find entities" },
    { id: "functions", label: "functions", hint: "List functions" },
    { id: "classes", label: "classes", hint: "List classes" },
    { id: "modules", label: "modules", hint: "List modules" },
    { id: "files", label: "files", hint: "List files" },
    { id: "paths", label: "path", hint: "Find IMPORTS path" },
    { id: "query", label: "query", hint: "Run query language" },
    { id: "project", label: "project", hint: "Overview" },
    { id: "help", label: "help" },
    { id: "quit", label: "quit" },
  ];
  const q = filter.trim().toLowerCase();
  const items = q
    ? all.filter((m) => m.label.includes(q) || (m.hint ?? "").toLowerCase().includes(q))
    : all;
  return {
    kind: "palette",
    title: "Command Palette",
    crumb: ["FFVS", projectName, "Palette"],
    cursor: 0,
    items,
    message: filter ? `filter: ${filter}` : "Select a command",
    meta: { filter },
  };
}

export function messageView(title: string, message: string, crumbs: string[]): ViewState {
  return {
    kind: "message",
    title,
    crumb: crumbs,
    cursor: 0,
    items: [{ id: "back", label: "Continue" }],
    message,
  };
}

export function projectOverviewMessage(
  name: string,
  root: string,
  entities: Array<{ kind: string; count: number }> | undefined,
  files: number | undefined,
  edges: number | undefined,
): string {
  const parts = [`Project  ${name}`, root, "", "Overview"];
  if (files !== undefined) {
    parts.push(`${files} files`);
  }
  if (entities && entities.length > 0) {
    const bits = entities.map((e) => `${e.count} ${e.kind.toLowerCase()}s`).join("   ");
    parts.push(bits);
  }
  if (edges !== undefined) {
    parts.push(`${edges} relations`);
  }
  return parts.join("\n  ");
}

export function kindFromListAction(id: string): EntityKind | null {
  switch (id) {
    case "files":
      return "FILE";
    case "modules":
      return "MODULE";
    case "functions":
      return "FUNCTION";
    case "classes":
      return "CLASS";
    case "variables":
      return "VARIABLE";
    default:
      return null;
  }
}

export function titleForKind(kind: EntityKind): string {
  switch (kind) {
    case "FILE":
      return "Files";
    case "MODULE":
      return "Modules";
    case "FUNCTION":
      return "Functions";
    case "CLASS":
      return "Classes";
    case "VARIABLE":
      return "Variables";
    case "METHOD":
      return "Methods";
    default:
      return kind;
  }
}

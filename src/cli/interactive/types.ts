import type { GraphNode } from "../../core/domain/types.js";
import type { LoadedModel } from "../../application/explore.js";
import type { StatusResult } from "../../application/status.js";

export type ViewKind =
  | "home"
  | "entity-list"
  | "entity"
  | "neighborhood"
  | "search"
  | "impact"
  | "path-form"
  | "path-result"
  | "query"
  | "query-result"
  | "help"
  | "palette"
  | "message";

export interface MenuItem {
  id: string;
  label: string;
  hint?: string;
  /** Opaque payload for navigation */
  data?: unknown;
}

export interface ViewState {
  kind: ViewKind;
  title: string;
  crumb: string[];
  items?: MenuItem[];
  cursor?: number;
  entityId?: string;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface SessionContext {
  cwd: string;
  packageVersion: string;
  languageVersion: string;
  model: LoadedModel | null;
  status: StatusResult | null;
  loadError: string | null;
}

export function nodeMenuItem(node: GraphNode): MenuItem {
  const path =
    typeof node.properties["path"] === "string" ? (node.properties["path"] as string) : null;
  const loc =
    path && node.location?.startLine ? `${path}:${node.location.startLine}` : path;
  return {
    id: node.id,
    label: node.name ?? node.id,
    ...(loc ? { hint: loc } : {}),
    data: { entityId: node.id, kind: node.kind },
  };
}

import type {
  EntityInspection,
  ImportRelationView,
  ProjectSummary,
} from "../application/explore.js";
import type { GraphEdge, GraphNode, IndexedFile } from "../core/domain/types.js";

export function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export function formatProjectSummary(summary: ProjectSummary): string {
  const lines = [
    summary.name,
    "",
    `Root: ${summary.projectRoot}`,
    `Indexed: ${summary.indexedAt}`,
    `Files: ${summary.files}`,
  ];

  if (summary.languages.length > 0) {
    lines.push(
      `Languages: ${summary.languages.map((l) => `${l.language} (${l.fileCount})`).join(", ")}`,
    );
  }

  lines.push("", "Entities");
  for (const entity of summary.entities) {
    lines.push(`├── ${entity.kind}: ${entity.count}`);
  }

  lines.push("", "Relations");
  const edgeEntries = Object.entries(summary.edgeCounts).sort(([a], [b]) => a.localeCompare(b));
  for (const [kind, count] of edgeEntries) {
    lines.push(`├── ${kind}: ${count}`);
  }

  if (summary.parseErrors.length > 0) {
    lines.push("", `Parse errors: ${summary.parseErrors.length}`);
    for (const err of summary.parseErrors.slice(0, 5)) {
      lines.push(`├── ${err.path}: ${err.message.split("\n")[0]}`);
    }
  }

  return lines.join("\n");
}

export function formatEntityList(nodes: GraphNode[], kindLabel: string): string {
  if (nodes.length === 0) {
    return `No ${kindLabel} found.`;
  }
  const lines = [`${kindLabel} (${nodes.length})`, ""];
  for (const node of nodes) {
    const file = typeof node.properties["path"] === "string" ? node.properties["path"] : "";
    const loc = node.location ? `:${node.location.startLine}` : "";
    lines.push(`${node.name ?? "(anonymous)"}`);
    lines.push(`  ${node.id}`);
    if (file) {
      lines.push(`  ${file}${loc}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function formatFiles(files: IndexedFile[]): string {
  if (files.length === 0) {
    return "No files indexed.";
  }
  const lines = [`Files (${files.length})`, ""];
  for (const file of files) {
    const lang = file.language ?? "unknown";
    lines.push(`${file.path}`);
    lines.push(`  language=${lang} size=${file.sizeBytes}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function formatImports(imports: ImportRelationView[]): string {
  if (imports.length === 0) {
    return "No import relations found.";
  }
  const lines = [`Imports (${imports.length})`, ""];
  for (const item of imports) {
    const mark = item.external ? " (external)" : "";
    lines.push(`${item.fromName ?? item.from}`);
    lines.push(`  └─ IMPORTS ${item.specifier ?? item.toName ?? item.to}${mark}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function formatInspection(view: EntityInspection): string {
  const entity = view.entity;
  const lines = [
    entity.name ?? entity.id,
    "",
    `Type: ${titleCase(entity.kind)}`,
    `Id: ${entity.id}`,
  ];
  if (view.file) {
    const loc = entity.location ? `:${entity.location.startLine}` : "";
    lines.push(`File: ${view.file}${loc}`);
  }
  if (entity.properties["exported"] === true) {
    lines.push(`Exported: yes`);
  }

  if (view.extends.length > 0) {
    lines.push("", "Extends");
    for (const node of view.extends) {
      lines.push(`├── ${node.name ?? node.id}`);
    }
  }

  if (view.implements.length > 0) {
    lines.push("", "Implements");
    for (const node of view.implements) {
      lines.push(`├── ${node.name ?? node.id}`);
    }
  }

  if (view.methods.length > 0) {
    lines.push("", "Methods");
    for (const method of view.methods) {
      lines.push(`├── ${method.name ?? method.id}()`);
    }
  } else if (entity.kind === "CLASS") {
    lines.push("", "Methods", "├── (none)");
  }

  if (entity.kind === "MODULE" || entity.kind === "FILE") {
    const members = view.contained.filter((n) => n.kind !== "METHOD");
    if (members.length > 0) {
      lines.push("", "Contains");
      for (const member of members) {
        lines.push(`├── ${member.kind}: ${member.name ?? member.id}`);
      }
    }
  }

  if (view.imports.length > 0) {
    lines.push("", "Imports");
    for (const item of view.imports) {
      const label = item.specifier ?? item.toName ?? item.to;
      lines.push(`├── ${label}${item.external ? " (external)" : ""}`);
    }
  }

  if (view.usedBy.length > 0) {
    lines.push("", "Used by");
    for (const node of view.usedBy) {
      const pathProp =
        typeof node.properties["path"] === "string" ? node.properties["path"] : node.name;
      lines.push(`├── ${pathProp ?? node.id}`);
    }
  }

  if (view.exports.length > 0 && (entity.kind === "MODULE" || entity.kind === "FILE")) {
    lines.push("", "Exports");
    for (const node of view.exports) {
      lines.push(`├── ${node.kind}: ${node.name ?? node.id}`);
    }
  }

  return lines.join("\n");
}

export function formatGraphView(entity: GraphNode, edges: GraphEdge[], nodes: GraphNode[]): string {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const lines = [`${entity.name ?? entity.id}`, `Type: ${entity.kind}`, "", "Relations", ""];
  if (edges.length === 0) {
    lines.push("(none)");
    return lines.join("\n");
  }
  for (const edge of edges) {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    const fromLabel = from?.name ?? edge.from;
    const toLabel = to?.name ?? edge.to;
    if (edge.from === entity.id) {
      lines.push(`${fromLabel}`);
      lines.push(`  └─ ${edge.kind} → ${toLabel}`);
    } else {
      lines.push(`${fromLabel}`);
      lines.push(`  └─ ${edge.kind} → ${toLabel}  (incoming)`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function titleCase(kind: string): string {
  return kind.charAt(0) + kind.slice(1).toLowerCase();
}

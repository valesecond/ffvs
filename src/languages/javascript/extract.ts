import type {
  ClassDeclaration,
  ClassExpression,
  ClassMethod,
  ClassPrivateMethod,
  File as BabelFile,
  Node,
  TSDeclareMethod,
} from "@babel/types";
import * as t from "@babel/types";

import type { SourceLocation } from "../../core/domain/types.js";
import type {
  ExtractedEntity,
  ExtractedImport,
  ExtractedRelation,
  FileExtraction,
} from "../types.js";
import { parseJavaScriptSource } from "./parse.js";

export function extractFromJavaScript(source: string, filePath: string): FileExtraction {
  let ast: BabelFile;
  try {
    ast = parseJavaScriptSource(source, filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      entities: [],
      relations: [],
      imports: [],
      parseError: message,
    };
  }

  const entities: ExtractedEntity[] = [];
  const relations: ExtractedRelation[] = [];
  const imports: ExtractedImport[] = [];
  const nameCounts = new Map<string, number>();

  const moduleLocalId = "module:self";

  function uniqueLocal(kind: string, name: string, line: number): string {
    const base = `${kind}:${name}`;
    const count = nameCounts.get(base) ?? 0;
    nameCounts.set(base, count + 1);
    return count === 0 ? `${kind}:${name}` : `${kind}:${name}:${line}`;
  }

  function locOf(node: Node): SourceLocation | null {
    if (!node.loc) {
      return null;
    }
    return {
      file: filePath,
      startLine: node.loc.start.line,
      startColumn: node.loc.start.column,
      endLine: node.loc.end.line,
      endColumn: node.loc.end.column,
    };
  }

  function declare(
    entity: ExtractedEntity,
    opts: { exported?: boolean; exportNames?: string[] } = {},
  ): void {
    if (opts.exported) {
      entity.exported = true;
    }
    if (opts.exportNames) {
      entity.exportNames = opts.exportNames;
    }
    entities.push(entity);
    relations.push({
      kind: "DECLARES",
      fromLocalId: moduleLocalId,
      toLocalId: entity.localId,
    });
    relations.push({
      kind: "CONTAINS",
      fromLocalId: moduleLocalId,
      toLocalId: entity.localId,
    });
    if (entity.exported || (entity.exportNames && entity.exportNames.length > 0)) {
      relations.push({
        kind: "EXPORTS",
        fromLocalId: moduleLocalId,
        toLocalId: entity.localId,
        properties: {
          names: entity.exportNames ?? (entity.name ? [entity.name] : ["default"]),
        },
      });
    }
  }

  function declareOpts(
    exported: boolean,
    exportNames?: string[],
  ): { exported?: boolean; exportNames?: string[] } {
    return {
      ...(exported ? { exported: true } : {}),
      ...(exportNames !== undefined ? { exportNames } : {}),
    };
  }

  function addClassMembers(
    classLocalId: string,
    className: string | null,
    body: ClassDeclaration["body"] | ClassExpression["body"],
  ): void {
    for (const member of body.body) {
      if (
        !t.isClassMethod(member) &&
        !t.isClassPrivateMethod(member) &&
        !t.isTSDeclareMethod(member)
      ) {
        continue;
      }
      const method = member as ClassMethod | ClassPrivateMethod | TSDeclareMethod;
      let methodName: string;
      if (method.kind === "constructor") {
        methodName = "constructor";
      } else if (t.isIdentifier(method.key)) {
        methodName = method.key.name;
      } else if (t.isStringLiteral(method.key)) {
        methodName = method.key.value;
      } else if (t.isPrivateName(method.key) && t.isIdentifier(method.key.id)) {
        methodName = `#${method.key.id.name}`;
      } else {
        methodName = "<computed>";
      }

      const display = className ? `${className}.${methodName}` : methodName;
      const localId = uniqueLocal("method", display, method.loc?.start.line ?? 0);
      entities.push({
        localId,
        kind: "METHOD",
        name: methodName,
        location: locOf(method),
        parentLocalId: classLocalId,
        properties: {
          className,
          kind: method.kind,
          static: method.static === true,
          async: "async" in method && method.async === true,
        },
      });
      relations.push({
        kind: "CONTAINS",
        fromLocalId: classLocalId,
        toLocalId: localId,
      });
      relations.push({
        kind: "DECLARES",
        fromLocalId: classLocalId,
        toLocalId: localId,
      });
    }
  }

  function extractClass(
    node: ClassDeclaration | ClassExpression,
    nameOverride: string | null,
    exported: boolean,
    exportNames?: string[],
  ): void {
    const name =
      nameOverride ?? (node.id && t.isIdentifier(node.id) ? node.id.name : null) ?? "anonymous";
    const localId = uniqueLocal("class", name, node.loc?.start.line ?? 0);
    declare(
      {
        localId,
        kind: "CLASS",
        name,
        location: locOf(node),
        properties: {
          superClass: t.isIdentifier(node.superClass) ? node.superClass.name : null,
        },
      },
      declareOpts(exported, exportNames),
    );

    if (t.isIdentifier(node.superClass)) {
      relations.push({
        kind: "EXTENDS",
        fromLocalId: localId,
        toName: node.superClass.name,
        properties: { unresolved: true },
      });
    }

    for (const impl of node.implements ?? []) {
      let implName: string | null = null;
      if ("expression" in impl && t.isIdentifier(impl.expression)) {
        implName = impl.expression.name;
      } else if ("id" in impl && t.isIdentifier(impl.id)) {
        implName = impl.id.name;
      }
      if (!implName) {
        continue;
      }
      relations.push({
        kind: "IMPLEMENTS",
        fromLocalId: localId,
        toName: implName,
        properties: { unresolved: true },
      });
    }

    addClassMembers(localId, name === "anonymous" ? null : name, node.body);
  }

  function extractFunction(
    name: string,
    node: Node,
    exported: boolean,
    exportNames?: string[],
    properties?: Record<string, unknown>,
  ): void {
    const localId = uniqueLocal("function", name, node.loc?.start.line ?? 0);
    declare(
      {
        localId,
        kind: "FUNCTION",
        name,
        location: locOf(node),
        properties: properties ?? {},
      },
      declareOpts(exported, exportNames),
    );
  }

  function extractVariable(
    name: string,
    node: Node,
    exported: boolean,
    exportNames?: string[],
  ): void {
    const localId = uniqueLocal("variable", name, node.loc?.start.line ?? 0);
    declare(
      {
        localId,
        kind: "VARIABLE",
        name,
        location: locOf(node),
      },
      declareOpts(exported, exportNames),
    );
  }

  function handleImport(node: t.ImportDeclaration): void {
    const namedImports: string[] = [];
    let defaultImport: string | undefined;
    let namespaceImport: string | undefined;

    for (const spec of node.specifiers) {
      if (t.isImportDefaultSpecifier(spec)) {
        defaultImport = spec.local.name;
      } else if (t.isImportNamespaceSpecifier(spec)) {
        namespaceImport = spec.local.name;
      } else if (t.isImportSpecifier(spec)) {
        namedImports.push(t.isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value);
      }
    }

    imports.push({
      specifier: node.source.value,
      kind: "esm",
      ...(defaultImport !== undefined ? { defaultImport } : {}),
      ...(namespaceImport !== undefined ? { namespaceImport } : {}),
      namedImports,
      location: locOf(node),
    });
  }

  function handleRequire(node: t.VariableDeclarator): void {
    if (!t.isIdentifier(node.id)) {
      return;
    }
    if (
      !t.isCallExpression(node.init) ||
      !t.isIdentifier(node.init.callee) ||
      node.init.callee.name !== "require" ||
      node.init.arguments.length === 0
    ) {
      return;
    }
    const arg = node.init.arguments[0];
    if (!t.isStringLiteral(arg)) {
      return;
    }
    recordCjsImport(arg.value, node, node.id.name);
  }

  function recordCjsImport(specifier: string, node: Node, defaultImport?: string): void {
    if (imports.some((i) => i.specifier === specifier && i.kind === "cjs")) {
      return;
    }
    imports.push({
      specifier,
      kind: "cjs",
      ...(defaultImport !== undefined ? { defaultImport } : {}),
      namedImports: [],
      location: locOf(node),
    });
  }

  function walkRequires(node: Node): void {
    if (t.isCallExpression(node) && t.isIdentifier(node.callee) && node.callee.name === "require") {
      const arg = node.arguments[0];
      if (t.isStringLiteral(arg)) {
        recordCjsImport(arg.value, node);
      }
    }
    for (const key of t.VISITOR_KEYS[node.type] ?? []) {
      const value = (node as unknown as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === "object" && "type" in child) {
            walkRequires(child as Node);
          }
        }
      } else if (value && typeof value === "object" && "type" in value) {
        walkRequires(value as Node);
      }
    }
  }

  for (const stmt of ast.program.body) {
    if (t.isImportDeclaration(stmt)) {
      handleImport(stmt);
      continue;
    }

    if (t.isFunctionDeclaration(stmt) && stmt.id) {
      extractFunction(stmt.id.name, stmt, false, undefined, {
        async: stmt.async,
        generator: stmt.generator,
      });
      continue;
    }

    if (t.isClassDeclaration(stmt)) {
      extractClass(stmt, null, false);
      continue;
    }

    if (t.isVariableDeclaration(stmt)) {
      for (const decl of stmt.declarations) {
        handleRequire(decl);
        if (t.isIdentifier(decl.id)) {
          if (t.isFunctionExpression(decl.init) || t.isArrowFunctionExpression(decl.init)) {
            extractFunction(decl.id.name, decl.init, false, undefined, {
              async: decl.init.async,
              arrow: t.isArrowFunctionExpression(decl.init),
            });
          } else if (t.isClassExpression(decl.init)) {
            extractClass(decl.init, decl.id.name, false);
          } else {
            extractVariable(decl.id.name, decl, false);
          }
        }
      }
      continue;
    }

    if (t.isExportNamedDeclaration(stmt)) {
      if (t.isFunctionDeclaration(stmt.declaration) && stmt.declaration.id) {
        extractFunction(
          stmt.declaration.id.name,
          stmt.declaration,
          true,
          [stmt.declaration.id.name],
          {
            async: stmt.declaration.async,
            generator: stmt.declaration.generator,
          },
        );
      } else if (t.isClassDeclaration(stmt.declaration)) {
        const name = stmt.declaration.id?.name ?? "anonymous";
        extractClass(stmt.declaration, null, true, [name]);
      } else if (t.isVariableDeclaration(stmt.declaration)) {
        for (const decl of stmt.declaration.declarations) {
          if (!t.isIdentifier(decl.id)) {
            continue;
          }
          if (t.isFunctionExpression(decl.init) || t.isArrowFunctionExpression(decl.init)) {
            extractFunction(decl.id.name, decl.init, true, [decl.id.name], {
              async: decl.init.async,
              arrow: t.isArrowFunctionExpression(decl.init),
            });
          } else if (t.isClassExpression(decl.init)) {
            extractClass(decl.init, decl.id.name, true, [decl.id.name]);
          } else {
            extractVariable(decl.id.name, decl, true, [decl.id.name]);
          }
        }
      } else if (stmt.source) {
        imports.push({
          specifier: stmt.source.value,
          kind: "esm",
          namedImports: stmt.specifiers
            .filter((s): s is t.ExportSpecifier => t.isExportSpecifier(s))
            .map((s) => (t.isIdentifier(s.local) ? s.local.name : String(s.local))),
          location: locOf(stmt),
        });
      }
      continue;
    }

    if (t.isExportDefaultDeclaration(stmt)) {
      const decl = stmt.declaration;
      if (t.isFunctionDeclaration(decl)) {
        const name = decl.id?.name ?? "default";
        extractFunction(name, decl, true, ["default"], {
          async: decl.async,
          generator: decl.generator,
        });
      } else if (t.isClassDeclaration(decl)) {
        const name = decl.id?.name ?? "default";
        extractClass(decl, name === "default" ? "default" : null, true, ["default"]);
      } else if (t.isFunctionExpression(decl) || t.isArrowFunctionExpression(decl)) {
        extractFunction("default", decl, true, ["default"], {
          async: decl.async,
          arrow: t.isArrowFunctionExpression(decl),
        });
      } else if (t.isClassExpression(decl)) {
        extractClass(decl, decl.id?.name ?? "default", true, ["default"]);
      } else if (t.isIdentifier(decl)) {
        // export default existingName — mark via EXPORTS to name if we find it later; record stub
        relations.push({
          kind: "EXPORTS",
          fromLocalId: moduleLocalId,
          toName: decl.name,
          properties: { names: ["default"], reexportIdentifier: true },
        });
      }
      continue;
    }

    if (t.isExportAllDeclaration(stmt) && stmt.source) {
      imports.push({
        specifier: stmt.source.value,
        kind: "esm",
        namedImports: ["*"],
        location: locOf(stmt),
      });
    }
  }

  // Collect all require("...") sites (including nested / expression forms).
  walkRequires(ast);

  // CALLS: best-effort call graph (Phase 2.0). Not sound for dynamic JS.
  walkCalls(ast, moduleLocalId, byNameLookup());

  // Resolve export-default-identifier and EXTENDS/IMPLEMENTS to local entities when possible.
  const byName = byNameLookup();

  for (const rel of relations) {
    if (rel.toLocalId) {
      continue;
    }
    if (!rel.toName) {
      continue;
    }
    // Do not force same-file binding for member/dynamic CALLS — indexer handles ambiguity.
    if (rel.kind === "CALLS" && rel.properties?.["form"] !== "identifier") {
      continue;
    }
    const target = byName.get(rel.toName);
    if (target) {
      rel.toLocalId = target;
      if (rel.properties) {
        rel.properties = {
          ...rel.properties,
          unresolved: false,
          ...(rel.kind === "CALLS" ? { resolution: "RESOLVED" } : {}),
        };
      }
    }
  }

  return { entities, relations, imports };

  function byNameLookup(): Map<string, string> {
    const map = new Map<string, string>();
    for (const entity of entities) {
      if (entity.name && !map.has(entity.name)) {
        map.set(entity.name, entity.localId);
      }
    }
    return map;
  }

  function walkCalls(node: Node, enclosingLocalId: string, localByName: Map<string, string>): void {
    let nextEnclosing = enclosingLocalId;

    if (t.isFunctionDeclaration(node) && node.id) {
      const localId = entities.find(
        (e) =>
          e.kind === "FUNCTION" &&
          e.name === node.id!.name &&
          e.location?.startLine === node.loc?.start.line,
      )?.localId;
      if (localId) {
        nextEnclosing = localId;
      }
    } else if (
      (t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) &&
      node.loc
    ) {
      const match = entities.find(
        (e) =>
          e.kind === "FUNCTION" &&
          e.location?.startLine === node.loc!.start.line &&
          e.location.startColumn === node.loc!.start.column,
      );
      if (match) {
        nextEnclosing = match.localId;
      }
    } else if (
      (t.isClassMethod(node) || t.isClassPrivateMethod(node)) &&
      node.loc
    ) {
      const match = entities.find(
        (e) =>
          e.kind === "METHOD" &&
          e.location?.startLine === node.loc!.start.line &&
          e.location.startColumn === node.loc!.start.column,
      );
      if (match) {
        nextEnclosing = match.localId;
      }
    }

    if (t.isCallExpression(node)) {
      recordCall(node, nextEnclosing, localByName);
    }

    for (const key of t.VISITOR_KEYS[node.type] ?? []) {
      const value = (node as unknown as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === "object" && "type" in child) {
            walkCalls(child as Node, nextEnclosing, localByName);
          }
        }
      } else if (value && typeof value === "object" && "type" in value) {
        walkCalls(value as Node, nextEnclosing, localByName);
      }
    }
  }

  function recordCall(
    node: t.CallExpression,
    fromLocalId: string,
    localByName: Map<string, string>,
  ): void {
    if (t.isIdentifier(node.callee) && node.callee.name === "require") {
      return;
    }

    let calleeName: string | null = null;
    let form: "identifier" | "member" | "other" = "other";

    if (t.isIdentifier(node.callee)) {
      calleeName = node.callee.name;
      form = "identifier";
    } else if (t.isMemberExpression(node.callee) && !node.callee.computed) {
      if (t.isIdentifier(node.callee.property)) {
        calleeName = node.callee.property.name;
        form = "member";
      }
    } else if (t.isOptionalMemberExpression(node.callee) && !node.callee.computed) {
      if (t.isIdentifier(node.callee.property)) {
        calleeName = node.callee.property.name;
        form = "member";
      }
    }

    if (!calleeName) {
      relations.push({
        kind: "CALLS",
        fromLocalId,
        toName: "<dynamic>",
        properties: {
          resolution: "UNRESOLVED",
          form: "other",
          unresolved: true,
        },
      });
      return;
    }

    const localTarget = localByName.get(calleeName);
    if (localTarget && form === "identifier") {
      relations.push({
        kind: "CALLS",
        fromLocalId,
        toLocalId: localTarget,
        properties: {
          resolution: "RESOLVED",
          form,
          calleeName,
          unresolved: false,
        },
      });
      return;
    }

    // Cross-file / member: defer name resolution to indexer (may be AMBIGUOUS).
    relations.push({
      kind: "CALLS",
      fromLocalId,
      toName: calleeName,
      properties: {
        resolution: form === "member" ? "AMBIGUOUS" : "UNRESOLVED",
        form,
        calleeName,
        unresolved: true,
      },
    });
  }
}

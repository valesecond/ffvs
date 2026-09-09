import { Command } from "commander";

import {
  entityGraphView,
  exploreChildren,
  exploreDependencies,
  exploreDependents,
  exploreImpact,
  exploreParents,
  explorePath,
  exploreRelations,
  inspectEntity,
  listEntities,
  listFiles,
  listImports,
  loadModel,
  summarizeProject,
} from "../application/explore.js";
import { getDiagnostics } from "../application/diagnostics.js";
import { indexProject } from "../application/index-project.js";
import { initProject } from "../application/init.js";
import { getStatus } from "../application/status.js";
import { FfvsError } from "../core/domain/errors.js";
import type { RelationKind } from "../core/domain/types.js";
import {
  formatDiagnostics,
  formatEntityList,
  formatFiles,
  formatGraphView,
  formatImpact,
  formatInspection,
  formatImports,
  formatNeighborhood,
  formatPathResult,
  formatProjectSummary,
  formatRelationsList,
  printJson,
} from "./format.js";

interface JsonOption {
  json?: boolean;
}

function parseKinds(raw?: string): RelationKind[] | undefined {
  if (!raw) {
    return undefined;
  }
  return raw.split(",").map((part) => part.trim().toUpperCase()) as RelationKind[];
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("ffvs")
    .description("FFVS — local-first CLI for exploring software projects as semantic structures")
    .version("0.4.0");

  program
    .command("init")
    .description("Initialize an FFVS project in the current directory")
    .option("-f, --force", "Reinitialize if .ffvs already exists", false)
    .option("-n, --name <name>", "Project name (defaults to directory name)")
    .action(async (options: { force?: boolean; name?: string }) => {
      const result = await initProject(process.cwd(), {
        force: options.force === true,
        ...(options.name !== undefined ? { name: options.name } : {}),
      });
      console.log(`Initialized FFVS project in ${result.projectRoot}/.ffvs/`);
      console.log(`Name: ${result.config.name}`);
    });

  program
    .command("index")
    .description("Index a directory and build a semantic software graph under .ffvs/")
    .argument("[path]", "Directory to index relative to the FFVS project", ".")
    .action(async (scanPath: string) => {
      const result = await indexProject(process.cwd(), scanPath);
      const languageSummary =
        result.index.languages.length === 0
          ? "no known languages detected"
          : result.index.languages.map((l) => `${l.language}=${l.fileCount}`).join(", ");

      console.log(`Indexed ${result.index.files.length} files (${languageSummary})`);
      console.log(`Project: ${result.projectRoot}`);
      console.log(`Scan root: ${result.scanRoot}`);
      console.log(`Wrote .ffvs/index.json and .ffvs/graph.json`);
      console.log(`Graph: ${result.graph.nodes.length} nodes, ${result.graph.edges.length} edges`);

      const interesting = result.index.entities.filter((e) =>
        ["FUNCTION", "CLASS", "METHOD", "MODULE"].includes(e.kind),
      );
      if (interesting.length > 0) {
        console.log(
          `Entities: ${interesting.map((e) => `${e.kind.toLowerCase()}=${e.count}`).join(", ")}`,
        );
      }
      if (result.index.parseErrors.length > 0) {
        console.log(`Parse errors: ${result.index.parseErrors.length}`);
      }
      if (result.index.resolution) {
        const rate =
          result.index.resolution.internalResolutionRate === null
            ? "n/a"
            : `${(result.index.resolution.internalResolutionRate * 100).toFixed(1)}%`;
        console.log(
          `Imports: resolved=${result.index.resolution.resolvedInternal} external=${result.index.resolution.external} unresolved=${result.index.resolution.unresolved} ambiguous=${result.index.resolution.ambiguous} (internal rate ${rate})`,
        );
      }
    });

  program
    .command("status")
    .description("Show FFVS project status")
    .option("--json", "Emit JSON", false)
    .action(async (options: JsonOption) => {
      const status = await getStatus(process.cwd());
      if (options.json) {
        printJson(status);
        return;
      }
      console.log(`FFVS project: initialized`);
      console.log(`Root: ${status.projectRoot}`);
      console.log(`Name: ${status.config.name}`);
      console.log(`Created: ${status.config.createdAt}`);
      console.log(`Last indexed: ${status.config.lastIndexedAt ?? "(never)"}`);
      console.log(`Index root: ${status.config.indexRoot}`);

      if (!status.index) {
        console.log(`Files: (not indexed yet — run \`ffvs index .\`)`);
        return;
      }

      console.log(`Files: ${status.index.files.length}`);
      if (status.index.languages.length > 0) {
        console.log(
          `Languages: ${status.index.languages
            .map((l) => `${l.language} (${l.fileCount})`)
            .join(", ")}`,
        );
      }
      console.log(`Graph nodes: ${status.graph?.nodes.length ?? 0}`);
      console.log(`Graph edges: ${status.edgeCount}`);
      console.log(`IMPORTS edges: ${status.importEdgeCount}`);
      if (status.resolution) {
        const rate =
          status.resolution.internalResolutionRate === null
            ? "n/a"
            : `${(status.resolution.internalResolutionRate * 100).toFixed(1)}%`;
        console.log(`Imports resolved (internal): ${status.resolution.resolvedInternal}`);
        console.log(`Imports external: ${status.resolution.external}`);
        console.log(`Imports unresolved: ${status.resolution.unresolved}`);
        console.log(`Imports ambiguous: ${status.resolution.ambiguous}`);
        console.log(`Internal resolution rate: ${rate}`);
      }
      if (Object.keys(status.nodeCounts).length > 0) {
        console.log(
          `Nodes by kind: ${Object.entries(status.nodeCounts)
            .map(([kind, count]) => `${kind}=${count}`)
            .join(", ")}`,
        );
      }
    });

  program
    .command("inspect")
    .description("Summarize the project or inspect a named entity")
    .argument("[entity]", "Entity name or id (omit for project summary)")
    .option("--json", "Emit JSON", false)
    .action(async (entity: string | undefined, options: JsonOption) => {
      if (!entity) {
        const summary = await summarizeProject(process.cwd());
        if (options.json) {
          printJson(summary);
          return;
        }
        console.log(formatProjectSummary(summary));
        return;
      }

      const model = await loadModel(process.cwd());
      const view = inspectEntity(model.graph, entity);
      if (options.json) {
        printJson(view);
        return;
      }
      console.log(formatInspection(view));
    });

  program
    .command("files")
    .description("List indexed files")
    .option("--json", "Emit JSON", false)
    .action(async (options: JsonOption) => {
      const model = await loadModel(process.cwd());
      const files = listFiles(model.index);
      if (options.json) {
        printJson(files);
        return;
      }
      console.log(formatFiles(files));
    });

  program
    .command("functions")
    .description("List extracted functions")
    .option("--json", "Emit JSON", false)
    .action(async (options: JsonOption) => {
      const model = await loadModel(process.cwd());
      const nodes = listEntities(model.graph, "FUNCTION");
      if (options.json) {
        printJson(nodes);
        return;
      }
      console.log(formatEntityList(nodes, "Functions"));
    });

  program
    .command("classes")
    .description("List extracted classes")
    .option("--json", "Emit JSON", false)
    .action(async (options: JsonOption) => {
      const model = await loadModel(process.cwd());
      const nodes = listEntities(model.graph, "CLASS");
      if (options.json) {
        printJson(nodes);
        return;
      }
      console.log(formatEntityList(nodes, "Classes"));
    });

  program
    .command("imports")
    .description("List module import relations")
    .option("--json", "Emit JSON", false)
    .action(async (options: JsonOption) => {
      const model = await loadModel(process.cwd());
      const imports = listImports(model.graph);
      if (options.json) {
        printJson(imports);
        return;
      }
      console.log(formatImports(imports));
    });

  program
    .command("graph")
    .description("Show incident relations for an entity")
    .argument("<entity>", "Entity name or id")
    .option("--json", "Emit JSON", false)
    .action(async (entity: string, options: JsonOption) => {
      const model = await loadModel(process.cwd());
      const view = entityGraphView(model.graph, entity);
      if (options.json) {
        printJson(view);
        return;
      }
      console.log(formatGraphView(view.entity, view.edges, view.nodes));
    });

  program
    .command("dependencies")
    .alias("deps")
    .description("List what an entity depends on (module IMPORTS)")
    .argument("<entity>", "Entity name or id")
    .option("--json", "Emit JSON", false)
    .action(async (entity: string, options: JsonOption) => {
      const model = await loadModel(process.cwd());
      const result = exploreDependencies(model.graph, entity);
      if (options.json) {
        printJson(result);
        return;
      }
      console.log(formatNeighborhood(result, "Dependencies"));
    });

  program
    .command("dependents")
    .description("List who depends on an entity (reverse IMPORTS)")
    .argument("<entity>", "Entity name or id")
    .option("--json", "Emit JSON", false)
    .action(async (entity: string, options: JsonOption) => {
      const model = await loadModel(process.cwd());
      const result = exploreDependents(model.graph, entity);
      if (options.json) {
        printJson(result);
        return;
      }
      console.log(formatNeighborhood(result, "Dependents"));
    });

  program
    .command("children")
    .description("List structural children (CONTAINS)")
    .argument("<entity>", "Entity name or id")
    .option("--json", "Emit JSON", false)
    .action(async (entity: string, options: JsonOption) => {
      const model = await loadModel(process.cwd());
      const result = exploreChildren(model.graph, entity);
      if (options.json) {
        printJson(result);
        return;
      }
      console.log(formatNeighborhood(result, "Children"));
    });

  program
    .command("parents")
    .description("List structural parents (CONTAINS)")
    .argument("<entity>", "Entity name or id")
    .option("--json", "Emit JSON", false)
    .action(async (entity: string, options: JsonOption) => {
      const model = await loadModel(process.cwd());
      const result = exploreParents(model.graph, entity);
      if (options.json) {
        printJson(result);
        return;
      }
      console.log(formatNeighborhood(result, "Parents"));
    });

  program
    .command("path")
    .description("Find a shortest IMPORTS path between two entities")
    .argument("<from>", "Source entity")
    .argument("<to>", "Target entity")
    .option("--json", "Emit JSON", false)
    .action(async (from: string, to: string, options: JsonOption) => {
      const model = await loadModel(process.cwd());
      const result = explorePath(model.graph, from, to);
      if (options.json) {
        printJson(result);
        return;
      }
      console.log(formatPathResult(result));
    });

  program
    .command("impact")
    .description("List transitive dependents (who may be affected by changes)")
    .argument("<entity>", "Entity name or id")
    .option("--json", "Emit JSON", false)
    .action(async (entity: string, options: JsonOption) => {
      const model = await loadModel(process.cwd());
      const result = exploreImpact(model.graph, entity);
      if (options.json) {
        printJson(result);
        return;
      }
      console.log(formatImpact(result));
    });

  program
    .command("relations")
    .description("List relations as first-class objects (optional entity filter)")
    .argument("[entity]", "Entity name or id")
    .option("--kind <kinds>", "Comma-separated relation kinds (e.g. IMPORTS,CONTAINS)")
    .option("--json", "Emit JSON", false)
    .action(async (entity: string | undefined, options: JsonOption & { kind?: string }) => {
      const model = await loadModel(process.cwd());
      const kinds = parseKinds(options.kind);
      const result = exploreRelations(model.graph, entity, kinds);
      if (options.json) {
        printJson(result);
        return;
      }
      console.log(
        formatRelationsList(
          result.relations,
          result.entity ? (result.entity.name ?? result.entity.id) : null,
        ),
      );
    });

  program
    .command("diagnostics")
    .alias("unresolved")
    .description("Show unresolved/ambiguous import resolution diagnostics")
    .option("--json", "Emit JSON", false)
    .action(async (options: JsonOption) => {
      const result = await getDiagnostics(process.cwd());
      if (options.json) {
        printJson(result);
        return;
      }
      console.log(formatDiagnostics(result));
    });

  return program;
}

export async function runCli(argv: string[]): Promise<number> {
  const program = createProgram();
  program.exitOverride();

  try {
    await program.parseAsync(argv);
    return 0;
  } catch (error) {
    if (error instanceof FfvsError) {
      console.error(`error: ${error.message}`);
      return error.exitCode;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
    ) {
      const code = (error as { code: string }).code;
      if (code === "commander.helpDisplayed" || code === "commander.version") {
        return 0;
      }
      if (code.startsWith("commander.")) {
        const message =
          "message" in error && typeof (error as { message?: unknown }).message === "string"
            ? (error as { message: string }).message
            : "Invalid command usage";
        console.error(`error: ${message}`);
        return 1;
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: unexpected failure: ${message}`);
    return 2;
  }
}

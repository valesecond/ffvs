import { Command } from "commander";

import {
  entityGraphView,
  inspectEntity,
  listEntities,
  listFiles,
  listImports,
  loadModel,
  summarizeProject,
} from "../application/explore.js";
import { indexProject } from "../application/index-project.js";
import { initProject } from "../application/init.js";
import { getStatus } from "../application/status.js";
import { FfvsError } from "../core/domain/errors.js";
import {
  formatEntityList,
  formatFiles,
  formatGraphView,
  formatInspection,
  formatImports,
  formatProjectSummary,
  printJson,
} from "./format.js";

interface JsonOption {
  json?: boolean;
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("ffvs")
    .description("FFVS — local-first CLI for exploring software projects as semantic structures")
    .version("0.2.0");

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
    .description("Show relations for an entity")
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

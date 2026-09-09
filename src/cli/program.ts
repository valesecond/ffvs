import { Command } from "commander";

import { indexProject } from "../application/index-project.js";
import { initProject } from "../application/init.js";
import { getStatus } from "../application/status.js";
import { FfvsError } from "../core/domain/errors.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("ffvs")
    .description("FFVS — local-first CLI for exploring software projects as semantic structures")
    .version("0.1.0");

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
    .description("Index a directory and persist inventory + graph under .ffvs/")
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
    });

  program
    .command("status")
    .description("Show FFVS project status")
    .action(async () => {
      const status = await getStatus(process.cwd());
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

    // Commander throws CommanderError for help/version and user errors.
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

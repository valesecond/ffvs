import { createRequire } from "node:module";
import { Command } from "commander";

import {
  entityGraphView,
  exploreCallers,
  exploreCalls,
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
  searchModel,
  summarizeProject,
  type SelectPredicate,
} from "../application/explore.js";
import { runQuery, runQueryFromFile } from "../application/query.js";
import { getDiagnostics } from "../application/diagnostics.js";
import { indexProject } from "../application/index-project.js";
import { initProject } from "../application/init.js";
import { getStatus } from "../application/status.js";
import { FfvsError } from "../core/domain/errors.js";
import { LANGUAGE_VERSION } from "../core/language/index.js";
import type { EntityKind, RelationKind } from "../core/domain/types.js";
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
  formatQueryResultUi,
  formatRelationsList,
  printJson,
} from "./format.js";
import {
  renderCliError,
  renderCommanderHelpBody,
  renderIndexComplete,
  renderInit,
  renderStatus,
  withSpinner,
} from "./ui/index.js";
import { startInteractiveExplorer } from "./interactive/index.js";

const require = createRequire(import.meta.url);
const PACKAGE_VERSION = (require("../../package.json") as { version: string }).version;

interface JsonOption {
  json?: boolean;
}

interface FilterOptions extends JsonOption {
  name?: string;
  path?: string;
}

function parseKinds(raw?: string): RelationKind[] | undefined {
  if (!raw) {
    return undefined;
  }
  return raw.split(",").map((part) => part.trim().toUpperCase()) as RelationKind[];
}

function toPredicate(options: FilterOptions): SelectPredicate {
  return {
    ...(options.name !== undefined ? { name: options.name, nameMode: "contains" as const } : {}),
    ...(options.path !== undefined ? { path: options.path, pathMode: "contains" as const } : {}),
  };
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("ffvs")
    .description("FFVS — Semantic Software Explorer")
    .version(`FFVS ${PACKAGE_VERSION}`, "-V, --version", "Show version")
    .addHelpText("before", `\n${renderCommanderHelpBody()}\n`)
    .action(async () => {
      await startInteractiveExplorer(process.cwd());
    });

  program
    .command("explore")
    .description("Start the Interactive Explorer (same as bare `ffvs`)")
    .action(async () => {
      await startInteractiveExplorer(process.cwd());
    });

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
      console.log(renderInit(result.projectRoot, result.config.name));
    });

  program
    .command("index")
    .description("Index a directory and build a semantic software graph under .ffvs/")
    .argument("[path]", "Directory to index relative to the FFVS project", ".")
    .option(
      "--exclude <pattern>",
      "Exclude path/directory (repeatable; also persisted in config)",
      (value: string, previous: string[]) => [...previous, value],
      [] as string[],
    )
    .option(
      "--include <pattern>",
      "Restrict indexing to matching path prefixes (repeatable)",
      (value: string, previous: string[]) => [...previous, value],
      [] as string[],
    )
    .action(async (scanPath: string, options: { exclude?: string[]; include?: string[] }) => {
      const started = Date.now();
      const result = await withSpinner("Indexing project…", () =>
        indexProject(process.cwd(), scanPath, {
          ...(options.exclude?.length ? { exclude: options.exclude } : {}),
          ...(options.include?.length ? { include: options.include } : {}),
        }),
      );
      console.log(renderIndexComplete(result, { durationMs: Date.now() - started }));
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
      console.log(renderStatus(status));
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
    .description("List indexed files (FILTER with --name / --path)")
    .option("--name <substring>", "Filter by file name substring")
    .option("--path <substring>", "Filter by path substring")
    .option("--json", "Emit JSON", false)
    .action(async (options: FilterOptions) => {
      const model = await loadModel(process.cwd());
      const files = listFiles(model.index, toPredicate(options));
      if (options.json) {
        printJson(files);
        return;
      }
      console.log(formatFiles(files));
    });

  program
    .command("functions")
    .description("List extracted functions (FILTER with --name / --path)")
    .option("--name <substring>", "Filter by name substring")
    .option("--path <substring>", "Filter by path substring")
    .option("--json", "Emit JSON", false)
    .action(async (options: FilterOptions) => {
      const model = await loadModel(process.cwd());
      const nodes = listEntities(model.graph, "FUNCTION", toPredicate(options));
      if (options.json) {
        printJson(nodes);
        return;
      }
      console.log(formatEntityList(nodes, "Functions"));
    });

  program
    .command("classes")
    .description("List extracted classes (FILTER with --name / --path)")
    .option("--name <substring>", "Filter by name substring")
    .option("--path <substring>", "Filter by path substring")
    .option("--json", "Emit JSON", false)
    .action(async (options: FilterOptions) => {
      const model = await loadModel(process.cwd());
      const nodes = listEntities(model.graph, "CLASS", toPredicate(options));
      if (options.json) {
        printJson(nodes);
        return;
      }
      console.log(formatEntityList(nodes, "Classes"));
    });

  program
    .command("search")
    .description("SEARCH candidate entities by free-text (distinct from FILTER)")
    .argument("<needle>", "Text to search in names, paths, and ids")
    .option("--kind <kind>", "Restrict to entity kind (function, class, module, …)")
    .option("--path <substring>", "Restrict to path substring")
    .option("--limit <n>", "Max results", "50")
    .option("--json", "Emit JSON", false)
    .action(
      async (
        needle: string,
        options: JsonOption & { kind?: string; path?: string; limit?: string },
      ) => {
        const model = await loadModel(process.cwd());
        const kind = options.kind ? (options.kind.toUpperCase() as EntityKind) : undefined;
        const nodes = searchModel(model.graph, {
          needle,
          ...(kind !== undefined ? { kind } : {}),
          ...(options.path !== undefined ? { path: options.path } : {}),
          limit: Number(options.limit ?? 50),
        });
        if (options.json) {
          printJson(nodes);
          return;
        }
        console.log(formatEntityList(nodes, `Search: ${needle}`));
      },
    );

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
    .command("calls")
    .description("List outgoing CALLS from a function/method")
    .argument("<entity>", "Entity name or id")
    .option("--json", "Emit JSON", false)
    .action(async (entity: string, options: JsonOption) => {
      const model = await loadModel(process.cwd());
      const result = exploreCalls(model.graph, entity);
      if (options.json) {
        printJson(result);
        return;
      }
      console.log(formatNeighborhood(result, "Calls"));
    });

  program
    .command("callers")
    .description("List who CALLS an entity (CALLED_BY)")
    .argument("<entity>", "Entity name or id")
    .option("--json", "Emit JSON", false)
    .action(async (entity: string, options: JsonOption) => {
      const model = await loadModel(process.cwd());
      const result = exploreCallers(model.graph, entity);
      if (options.json) {
        printJson(result);
        return;
      }
      console.log(formatNeighborhood(result, "Callers"));
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
    .description("Shortest path via resolved-internal IMPORTS (not CALLS)")
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
    .description(
      "Transitive dependents via IMPORTS. For CALL impact: ffvs query '… impact along calls'",
    )
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
    .option("--kind <kinds>", "Comma-separated relation kinds (e.g. IMPORTS,CALLS)")
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
    .command("query")
    .description(
      `Run a Query Language ${LANGUAGE_VERSION} pipeline (select/where/search/traverse/path/impact/describe)`,
    )
    .argument("[query]", "DSL query string")
    .option("-f, --file <path>", "Read query from file")
    .option("--json", "Emit JSON ResultSet", false)
    .addHelpText(
      "after",
      `
Examples:
  $ ffvs query 'select modules describe'
  $ ffvs query 'search "UserService" traverse callers resolution resolved describe'
  $ ffvs query 'select modules where name = "Database.js" impact describe'
`,
    )
    .action(async (queryText: string | undefined, options: JsonOption & { file?: string }) => {
      if (options.file) {
        const ran = await runQueryFromFile(process.cwd(), options.file);
        if (options.json) {
          printJson(ran.json);
          return;
        }
        console.log(formatQueryResultUi(ran.result));
        return;
      }
      if (!queryText || queryText.trim() === "") {
        throw new FfvsError(
          [
            "Missing query.",
            "",
            "Usage:",
            "  ffvs query 'select functions where name contains \"x\" describe'",
            "  ffvs query --file path/to/query.ffvs",
            "",
            `Docs: docs/language/overview.md (Query Language ${LANGUAGE_VERSION})`,
          ].join("\n"),
        );
      }
      const ran = await runQuery(process.cwd(), queryText);
      if (options.json) {
        printJson(ran.json);
        return;
      }
      console.log(formatQueryResultUi(ran.result, queryText));
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
        console.error(renderCliError(new FfvsError(message)));
        return 1;
      }
    }

    console.error(renderCliError(error));
    if (error instanceof FfvsError) {
      return error.exitCode;
    }
    return 2;
  }
}

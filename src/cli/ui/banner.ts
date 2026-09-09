import { drawBox, tip } from "./box.js";
import { joinBlocks } from "./layout.js";
import { renderSplashBrand } from "./logo.js";
import { theme } from "./theme.js";

export function renderBanner(version: string, _languageVersion: string): string {
  return renderSplashBrand(version, "A semantic view of your software");
}

export function renderWelcomeHelp(version: string, languageVersion: string): string {
  const quick = [
    "",
    theme.heading("Quick start"),
    "",
    helpRow("init", "Initialize FFVS in this directory"),
    helpRow("index .", "Build the semantic graph"),
    helpRow("status", "Project health and counts"),
    helpRow("search <name>", "Find entities"),
    helpRow("inspect <entity>", "Open an entity"),
    helpRow("query '<dsl>'", "Run Query Language"),
    "",
    helpRow("ffvs", "Interactive Explorer (TTY)"),
    "",
  ];

  return joinBlocks(
    renderSplashBrand(version, "A semantic view of your software"),
    "",
    drawBox(quick, { accent: "cyan", width: 56 }),
    "",
    tip(`See 'ffvs --help' · QL ${languageVersion} · docs/cli.md`),
  );
}

function helpRow(cmd: string, desc: string): string {
  const width = 18;
  const pad = Math.max(2, width - cmd.length);
  return `  ${theme.accent(cmd)}${" ".repeat(pad)}${theme.muted(desc)}`;
}

/** Compact help used by Commander --help */
export function renderCommanderHelpBody(): string {
  return joinBlocks(
    theme.muted("A semantic view of your software."),
    "",
    theme.heading("START"),
    "  ffvs | explore   Interactive Explorer (TTY)",
    "",
    theme.heading("CORE"),
    "  init, index, status, diagnostics, search",
    "",
    theme.heading("EXPLORE"),
    "  inspect, files, functions, classes, imports",
    "  dependencies, dependents, calls, callers",
    "  path, impact, relations, children, parents",
    "",
    theme.heading("QUERY"),
    "  query   Run select / where / search / traverse / path / impact / describe",
    "",
    theme.heading("GLOBAL"),
    "  --json   Pure JSON (no colors, banners, or spinners)",
    "  --help, --version",
  );
}

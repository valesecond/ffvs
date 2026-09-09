import { createRequire } from "node:module";

import { loadModel } from "../../application/explore.js";
import { getStatus } from "../../application/status.js";
import { LANGUAGE_VERSION } from "../../core/language/index.js";
import { renderWelcomeHelp } from "../ui/index.js";
import { detectTerminal } from "../ui/terminal.js";
import { theme } from "../ui/theme.js";
import { InteractiveSession } from "./session.js";
import type { SessionContext } from "./types.js";

const require = createRequire(import.meta.url);
const PACKAGE_VERSION = (require("../../../package.json") as { version: string }).version;

export function shouldStartInteractive(
  env: NodeJS.ProcessEnv = process.env,
  stdout: NodeJS.WriteStream = process.stdout,
): boolean {
  const caps = detectTerminal(stdout, env);
  if (caps.ci) {
    return false;
  }
  if (!caps.isTty) {
    return false;
  }
  if (env["FFVS_NO_INTERACTIVE"] === "1") {
    return false;
  }
  return true;
}

export async function startInteractiveExplorer(cwd: string = process.cwd()): Promise<void> {
  if (!shouldStartInteractive()) {
    console.log(renderNonInteractiveFallback(PACKAGE_VERSION, LANGUAGE_VERSION));
    return;
  }

  const ctx = await buildSessionContext(cwd);
  const session = new InteractiveSession(ctx);
  await session.run();
}

export async function buildSessionContext(cwd: string): Promise<SessionContext> {
  let status = null;
  let model = null;
  let loadError: string | null = null;

  try {
    status = await getStatus(cwd);
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  if (status?.index && status.graph) {
    try {
      model = await loadModel(cwd);
    } catch (err) {
      loadError = err instanceof Error ? err.message : String(err);
    }
  } else if (status && !status.index) {
    loadError = "Project is not indexed. Run `ffvs index .` then relaunch `ffvs`.";
  }

  return {
    cwd,
    packageVersion: PACKAGE_VERSION,
    languageVersion: LANGUAGE_VERSION,
    model,
    status,
    loadError,
  };
}

export function renderNonInteractiveFallback(
  packageVersion: string,
  languageVersion: string,
): string {
  return [
    theme.heading("FFVS Explorer"),
    theme.muted("Interactive mode requires a TTY (and is disabled in CI)."),
    "",
    "Use Command Mode:",
    "  ffvs status",
    "  ffvs search <name>",
    "  ffvs inspect <entity>",
    "",
    "Or open a terminal and run:",
    "  ffvs",
    "",
    renderWelcomeHelp(packageVersion, languageVersion),
  ].join("\n");
}

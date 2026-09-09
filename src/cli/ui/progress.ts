import ora, { type Ora } from "ora";

import { getCaps } from "./terminal.js";
import { theme } from "./theme.js";

export async function withSpinner<T>(label: string, work: () => Promise<T>): Promise<T> {
  const caps = getCaps();
  if (!caps.animate) {
    if (caps.isTty || !caps.ci) {
      console.error(theme.muted(label));
    }
    return work();
  }

  const spinner: Ora = ora({
    text: label,
    color: "cyan",
    discardStdin: false,
  }).start();

  try {
    const result = await work();
    spinner.succeed(theme.success(label.replace(/\.\.\.$/, "") || label));
    return result;
  } catch (error) {
    spinner.fail(theme.error(label));
    throw error;
  }
}

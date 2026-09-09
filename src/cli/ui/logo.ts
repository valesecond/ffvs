import { getCaps } from "./terminal.js";
import { theme } from "./theme.js";
import { padVisible, visibleWidth } from "./box.js";

/**
 * Compact isometric cube wordmark — modern CLI splash (gh/docker vibe, original mark).
 * Kept small: never dominates half the screen.
 */
export function renderLogoCube(): string {
  const u = getCaps().unicode;
  if (!u) {
    return [
      theme.heading("      +-----+"),
      theme.heading("     /#####/|"),
      theme.accent("    +-----+ |"),
      theme.heading("    |#####|/"),
      theme.heading("    +-----+"),
    ].join("\n");
  }
  // Layered isometric cube in cyan / bright blue
  return [
    theme.heading("       ╭─────╮"),
    theme.heading("      ╱ ▓▓▓ ╱│"),
    theme.accent("     ╭─────╮ │"),
    theme.heading("     │ ▓▓▓ │╱"),
    theme.heading("     ╰─────╯"),
  ].join("\n");
}

/** Logo + brand line side-by-side when width allows. */
export function renderSplashBrand(version: string, tagline: string): string {
  const cubeLines = renderLogoCube().split("\n");
  const brand = ["", theme.title(`FFVS  v${version}`), theme.muted(tagline), ""];
  const gap = "   ";
  const lines: string[] = [];
  const rows = Math.max(cubeLines.length, brand.length);
  for (let i = 0; i < rows; i += 1) {
    const left = cubeLines[i] ?? " ".repeat(visibleWidth(cubeLines[0] ?? ""));
    const right = brand[i] ?? "";
    lines.push(`${padVisible(left, 18)}${gap}${right}`.trimEnd());
  }
  return lines.join("\n");
}

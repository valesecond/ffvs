import { executeQuery, parseQuery } from "../../core/language/index.js";
import { theme } from "../ui/theme.js";
import { parseSessionCommand, type ParsedCommand } from "./commands.js";
import { readKey, readLine } from "./keyboard.js";
import { NavigationStack } from "./navigation.js";
import { clearScreen, renderFrame, renderStartupBanner } from "./screen.js";
import type { MenuItem, SessionContext, ViewState } from "./types.js";
import {
  entityDetailView,
  entityListView,
  exploreKindsView,
  helpView,
  homeView,
  impactView,
  kindFromListAction,
  messageView,
  neighborhoodView,
  paletteView,
  pathResultView,
  projectOverviewMessage,
  searchResultsView,
  titleForKind,
} from "./views.js";

export interface SessionIo {
  write: (text: string) => void;
  clear: () => void;
  readKey: typeof readKey;
  readLine: typeof readLine;
}

const defaultIo: SessionIo = {
  write: (text) => {
    process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
  },
  clear: clearScreen,
  readKey,
  readLine,
};

/**
 * Continuous Interactive Explorer session.
 * Loads the model once; navigation stays in-process.
 */
export class InteractiveSession {
  private readonly stack = new NavigationStack();
  private quit = false;
  private readonly io: SessionIo;
  private ctrlCArmed = false;

  constructor(
    private readonly ctx: SessionContext,
    io: Partial<SessionIo> = {},
  ) {
    this.io = { ...defaultIo, ...io };
  }

  /** Exposed for unit tests */
  get navigation(): NavigationStack {
    return this.stack;
  }

  get context(): SessionContext {
    return this.ctx;
  }

  async run(): Promise<void> {
    this.io.clear();
    this.io.write(renderStartupBanner(this.ctx.packageVersion));
    this.io.write("");
    this.stack.push(this.buildHome());

    while (!this.quit) {
      const view = this.stack.current();
      if (!view) {
        break;
      }
      this.render(view);
      const key = await this.io.readKey();
      await this.handleKey(key, view);
    }

    this.io.clear();
    this.io.write(theme.muted("Leaving FFVS Explorer."));
  }

  /** Test / scripted: apply a parsed command without keyboard. */
  async applyCommand(cmd: ParsedCommand): Promise<void> {
    await this.dispatchCommand(cmd);
  }

  /** Test: select current menu item by id action. */
  async selectItem(item: MenuItem): Promise<void> {
    await this.onSelect(item);
  }

  private buildHome(): ViewState {
    const name = this.projectName();
    if (!this.ctx.model) {
      return homeView(
        name,
        this.ctx.loadError ??
          "No index loaded. Run `ffvs init` and `ffvs index .` in Command Mode, then return.",
        false,
      );
    }
    const overview = projectOverviewMessage(
      name,
      this.ctx.model.projectRoot,
      this.ctx.model.index.entities,
      this.ctx.model.index.files.length,
      this.ctx.model.graph.edges.length,
    );
    return homeView(name, overview, true);
  }

  private projectName(): string {
    return this.ctx.status?.config.name ?? "project";
  }

  private render(view: ViewState): void {
    this.io.clear();
    const frameOpts: {
      packageVersion: string;
      projectName: string;
      crumbs: string[];
      view: ViewState;
      indexed?: boolean;
      fileCount?: number;
      edgeCount?: number;
    } = {
      packageVersion: this.ctx.packageVersion,
      projectName: this.projectName(),
      crumbs: view.crumb,
      view,
      indexed: Boolean(this.ctx.model),
    };
    if (this.ctx.model) {
      frameOpts.fileCount = this.ctx.model.index.files.length;
      frameOpts.edgeCount = this.ctx.model.graph.edges.length;
    }
    this.io.write(renderFrame(frameOpts));
  }

  private async handleKey(
    key: Awaited<ReturnType<typeof readKey>>,
    view: ViewState,
  ): Promise<void> {
    if (key.type === "ctrl_c") {
      if (this.ctrlCArmed) {
        this.quit = true;
        return;
      }
      this.ctrlCArmed = true;
      this.io.write(theme.warning("\nPress Ctrl+C again to quit, or Esc to cancel.\n"));
      return;
    }
    this.ctrlCArmed = false;

    if (key.type === "char" && (key.value === "q" || key.value === "Q")) {
      this.quit = true;
      return;
    }

    if (
      key.type === "escape" ||
      key.type === "backspace" ||
      (key.type === "char" && key.value === "b")
    ) {
      if (view.kind === "home") {
        return;
      }
      this.stack.back();
      return;
    }

    if (key.type === "up") {
      this.moveCursor(view, -1);
      return;
    }
    if (key.type === "down") {
      this.moveCursor(view, 1);
      return;
    }

    if (key.type === "char" && key.value === "?") {
      this.stack.push(helpView(this.projectName()));
      return;
    }

    if (key.type === "char" && key.value === "/") {
      await this.promptSearch();
      return;
    }

    if (key.type === "char" && key.value === ":") {
      await this.promptCommand();
      return;
    }

    if (key.type === "char" && (key.value === "p" || key.value === "P")) {
      this.stack.push(paletteView(this.projectName()));
      return;
    }

    if (key.type === "enter") {
      const items = view.items ?? [];
      const item = items[view.cursor ?? 0];
      if (item) {
        await this.onSelect(item);
      }
      return;
    }
  }

  private moveCursor(view: ViewState, delta: number): void {
    const items = view.items ?? [];
    if (items.length === 0) {
      return;
    }
    const next = Math.max(0, Math.min(items.length - 1, (view.cursor ?? 0) + delta));
    this.stack.replace({ ...view, cursor: next });
  }

  private async onSelect(item: MenuItem): Promise<void> {
    const view = this.stack.current();
    if (!view) {
      return;
    }

    try {
      if (item.id === "quit") {
        this.quit = true;
        return;
      }
      if (item.id === "back" || item.id === "continue") {
        this.stack.back();
        return;
      }
      if (item.id === "help") {
        this.stack.push(helpView(this.projectName()));
        return;
      }

      if (view.kind === "home" || view.kind === "palette") {
        await this.handleHomeOrPalette(item.id);
        return;
      }

      if (view.kind === "entity-list" && view.meta?.["exploreKinds"]) {
        const kind = kindFromListAction(item.id);
        if (kind) {
          this.requireModel();
          this.stack.push(
            entityListView(this.ctx.model!, kind, this.projectName(), titleForKind(kind)),
          );
        }
        return;
      }

      if (
        view.kind === "entity-list" ||
        view.kind === "search" ||
        view.kind === "neighborhood" ||
        view.kind === "impact" ||
        view.kind === "path-result" ||
        view.kind === "query-result"
      ) {
        const entityId = (item.data as { entityId?: string } | undefined)?.entityId ?? item.id;
        this.openEntity(entityId);
        return;
      }

      if (view.kind === "entity") {
        await this.handleEntityAction(item);
        return;
      }

      if (view.kind === "help" || view.kind === "message") {
        this.stack.back();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.stack.push(messageView("Error", msg, [...(view.crumb ?? ["FFVS"]), "Error"]));
    }
  }

  private async handleHomeOrPalette(id: string): Promise<void> {
    if (id === "explore") {
      this.stack.push(exploreKindsView(this.projectName()));
      return;
    }
    if (id === "search") {
      await this.promptSearch();
      return;
    }
    if (id === "query") {
      await this.promptQuery();
      return;
    }
    if (id === "paths" || id === "path") {
      await this.promptPath();
      return;
    }
    if (id === "project") {
      this.stack.push(this.buildHome());
      return;
    }
    const kind = kindFromListAction(id);
    if (kind) {
      this.requireModel();
      this.stack.push(
        entityListView(this.ctx.model!, kind, this.projectName(), titleForKind(kind)),
      );
      return;
    }
    if (id === "help") {
      this.stack.push(helpView(this.projectName()));
    }
  }

  private async handleEntityAction(item: MenuItem): Promise<void> {
    const entityId =
      (item.data as { entityId?: string } | undefined)?.entityId ?? this.stack.current()?.entityId;
    if (!entityId) {
      return;
    }
    const crumbs = this.stack.current()?.crumb ?? ["FFVS"];
    this.requireModel();
    const model = this.ctx.model!;

    switch (item.id) {
      case "calls":
      case "callers":
      case "dependencies":
      case "dependents":
        this.stack.push(neighborhoodView(model, entityId, item.id, crumbs));
        return;
      case "impact":
        this.stack.push(impactView(model, entityId, crumbs));
        return;
      case "path":
        await this.promptPath(entityId);
        return;
      case "source": {
        const detail = entityDetailView(model, entityId, crumbs.slice(0, -1));
        this.stack.push(messageView("Source", detail.message ?? entityId, [...crumbs, "Source"]));
        return;
      }
      default:
        return;
    }
  }

  private openEntity(entityId: string): void {
    this.requireModel();
    const crumbs = this.stack.current()?.crumb ?? ["FFVS", this.projectName()];
    this.stack.push(entityDetailView(this.ctx.model!, entityId, crumbs));
  }

  private requireModel(): LoadedModelAssert {
    if (!this.ctx.model) {
      throw new Error(this.ctx.loadError ?? "Project is not indexed.");
    }
    return true;
  }

  private async promptSearch(): Promise<void> {
    this.io.write("");
    const q = await this.io.readLine(theme.accent("Search › "));
    if (!q.trim()) {
      return;
    }
    try {
      this.requireModel();
      this.stack.push(searchResultsView(this.ctx.model!, q.trim(), this.projectName()));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.stack.push(messageView("Error", msg, ["FFVS", "Search"]));
    }
  }

  private async promptCommand(): Promise<void> {
    this.io.write("");
    const line = await this.io.readLine(theme.accent("FFVS › "));
    if (!line.trim()) {
      return;
    }
    try {
      await this.dispatchCommand(parseSessionCommand(line));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.stack.push(messageView("Error", msg, ["FFVS", "Command"]));
    }
  }

  private async promptQuery(): Promise<void> {
    this.io.write("");
    const source = await this.io.readLine(theme.accent("Query › "));
    if (!source.trim()) {
      return;
    }
    await this.runQueryLine(source.trim());
  }

  private async promptPath(fromPreset?: string): Promise<void> {
    this.io.write("");
    let from = fromPreset;
    if (!from) {
      from = (await this.io.readLine(theme.accent("Path from › "))).trim();
    }
    if (!from) {
      return;
    }
    const to = (await this.io.readLine(theme.accent("Path to   › "))).trim();
    if (!to) {
      return;
    }
    try {
      this.requireModel();
      this.stack.push(
        pathResultView(this.ctx.model!, from, to, ["FFVS", this.projectName(), "Path"]),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.stack.push(messageView("Error", msg, ["FFVS", "Path"]));
    }
  }

  private async dispatchCommand(cmd: ParsedCommand): Promise<void> {
    if (cmd.type === "quit") {
      this.quit = true;
      return;
    }
    if (cmd.type === "help") {
      this.stack.push(helpView(this.projectName()));
      return;
    }
    if (cmd.type === "palette") {
      this.stack.push(paletteView(this.projectName()));
      return;
    }
    if (cmd.type === "project") {
      this.stack.push(this.buildHome());
      return;
    }
    if (cmd.type === "unknown") {
      this.stack.push(messageView("Command", cmd.hint, ["FFVS", "Command"]));
      return;
    }

    this.requireModel();
    const model = this.ctx.model!;
    const name = this.projectName();

    if (cmd.type === "search") {
      this.stack.push(searchResultsView(model, cmd.query, name));
      return;
    }
    if (cmd.type === "inspect") {
      this.openEntity(cmd.target);
      return;
    }
    if (cmd.type === "list") {
      const kind = kindFromListAction(cmd.kind)!;
      this.stack.push(entityListView(model, kind, name, titleForKind(kind)));
      return;
    }
    if (cmd.type === "relation") {
      this.stack.push(
        neighborhoodView(model, cmd.target, cmd.relation, ["FFVS", name, cmd.target]),
      );
      return;
    }
    if (cmd.type === "impact") {
      this.stack.push(impactView(model, cmd.target, ["FFVS", name, cmd.target]));
      return;
    }
    if (cmd.type === "path") {
      this.stack.push(pathResultView(model, cmd.from, cmd.to, ["FFVS", name, "Path"]));
      return;
    }
    if (cmd.type === "query") {
      await this.runQueryLine(cmd.source);
    }
  }

  private async runQueryLine(source: string): Promise<void> {
    try {
      this.requireModel();
      const model = this.ctx.model!;
      const ast = parseQuery(source);
      const result = executeQuery(ast, { graph: model.graph, index: model.index });
      const items: MenuItem[] = result.entities.slice(0, 100).map((e) => {
        const path =
          typeof e.properties["path"] === "string"
            ? (e.properties["path"] as string)
            : (e.location?.file ?? null);
        const loc =
          path && e.location?.startLine ? `${path}:${e.location.startLine}` : (path ?? "");
        return {
          id: e.id,
          label: e.name ?? e.id,
          ...(loc ? { hint: loc } : {}),
          data: { entityId: e.id, kind: e.kind },
        };
      });
      this.stack.push({
        kind: "query-result",
        title: "Query results",
        crumb: ["FFVS", this.projectName(), "Query"],
        cursor: 0,
        items,
        message: `${result.entities.length} entities\n  ${source}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.stack.push(messageView("Query error", msg, ["FFVS", "Query"]));
    }
  }
}

type LoadedModelAssert = true;

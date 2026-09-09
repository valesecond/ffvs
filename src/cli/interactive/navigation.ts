import type { ViewState } from "./types.js";

/** Immutable-ish navigation stack for Explorer mode. */
export class NavigationStack {
  private frames: ViewState[] = [];

  get depth(): number {
    return this.frames.length;
  }

  current(): ViewState | null {
    return this.frames[this.frames.length - 1] ?? null;
  }

  push(view: ViewState): void {
    this.frames.push(view);
  }

  replace(view: ViewState): void {
    if (this.frames.length === 0) {
      this.frames.push(view);
      return;
    }
    this.frames[this.frames.length - 1] = view;
  }

  /** Pop current; return previous or null if at root. */
  back(): ViewState | null {
    if (this.frames.length <= 1) {
      return this.current();
    }
    this.frames.pop();
    return this.current();
  }

  crumbs(): string[] {
    const cur = this.current();
    return cur?.crumb ?? ["FFVS"];
  }

  /** Test helper */
  snapshot(): ViewState[] {
    return this.frames.map((f) => {
      const copy: ViewState = {
        kind: f.kind,
        title: f.title,
        crumb: [...f.crumb],
      };
      if (f.items) {
        copy.items = [...f.items];
      }
      if (f.cursor !== undefined) {
        copy.cursor = f.cursor;
      }
      if (f.entityId !== undefined) {
        copy.entityId = f.entityId;
      }
      if (f.message !== undefined) {
        copy.message = f.message;
      }
      if (f.meta !== undefined) {
        copy.meta = { ...f.meta };
      }
      return copy;
    });
  }
}

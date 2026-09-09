export type KeyEvent =
  | { type: "up" }
  | { type: "down" }
  | { type: "enter" }
  | { type: "escape" }
  | { type: "backspace" }
  | { type: "char"; value: string }
  | { type: "ctrl_c" };

/**
 * Read a single key in raw mode. Restores cooked mode after.
 * Not used when stdin is not a TTY.
 */
export async function readKey(): Promise<KeyEvent> {
  if (!process.stdin.isTTY) {
    throw new Error("Interactive keyboard requires a TTY");
  }

  return new Promise((resolve) => {
    const wasRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const onData = (chunk: string | Buffer) => {
      const s = typeof chunk === "string" ? chunk : chunk.toString("utf8");
      cleanup();
      resolve(decodeKey(s));
    };

    const cleanup = () => {
      process.stdin.off("data", onData);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(wasRaw);
      }
    };

    process.stdin.once("data", onData);
  });
}

export function decodeKey(s: string): KeyEvent {
  if (s === "\u0003") {
    return { type: "ctrl_c" };
  }
  if (s === "\r" || s === "\n") {
    return { type: "enter" };
  }
  if (s === "\u001b" || s === "\u001b\u001b") {
    return { type: "escape" };
  }
  if (s === "\u007f" || s === "\b") {
    return { type: "backspace" };
  }
  // CSI sequences
  if (s === "\u001b[A" || s === "\u001bOA") {
    return { type: "up" };
  }
  if (s === "\u001b[B" || s === "\u001bOB") {
    return { type: "down" };
  }
  if (s.startsWith("\u001b")) {
    // ignore other escapes
    return { type: "escape" };
  }
  return { type: "char", value: s };
}

/** Line editor for search / query / commands. */
export async function readLine(promptText: string): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new Error("Interactive input requires a TTY");
  }

  const readline = await import("node:readline");
  if (process.stdin.isTTY && process.stdin.isRaw) {
    process.stdin.setRawMode(false);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

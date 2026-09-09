import { javascriptAdapter } from "./javascript/adapter.js";
import type { LanguageAdapter } from "./types.js";

const adapters: LanguageAdapter[] = [javascriptAdapter];

export function listLanguageAdapters(): readonly LanguageAdapter[] {
  return adapters;
}

export function detectLanguage(filePath: string): string | null {
  for (const adapter of adapters) {
    if (adapter.matches(filePath)) {
      return adapter.detectLanguage(filePath);
    }
  }
  return null;
}

export function findAdapter(filePath: string): LanguageAdapter | null {
  for (const adapter of adapters) {
    if (adapter.matches(filePath)) {
      return adapter;
    }
  }
  return null;
}

export interface ExtractionImport {
  specifier: string;
  kind: "esm" | "cjs";
}

export interface ExtractionResult {
  imports: ExtractionImport[];
}

export interface LanguageAdapter {
  readonly id: string;
  readonly displayName: string;
  matches(filePath: string): boolean;
  detectLanguage(filePath: string): string;
  extract?(source: string, filePath: string): ExtractionResult;
}

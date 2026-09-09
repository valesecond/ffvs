import type { EntityKind, RelationKind, SourceLocation } from "../core/domain/types.js";

export interface ExtractedEntity {
  localId: string;
  kind: EntityKind;
  name: string | null;
  location: SourceLocation | null;
  exported?: boolean;
  exportNames?: string[];
  properties?: Record<string, unknown>;
  parentLocalId?: string;
}

export interface ExtractedRelation {
  kind: RelationKind;
  fromLocalId: string;
  toLocalId?: string;
  toName?: string;
  properties?: Record<string, unknown>;
}

export interface ExtractedImport {
  specifier: string;
  kind: "esm" | "cjs";
  defaultImport?: string;
  namespaceImport?: string;
  namedImports: string[];
  location: SourceLocation | null;
}

export interface FileExtraction {
  entities: ExtractedEntity[];
  relations: ExtractedRelation[];
  imports: ExtractedImport[];
  parseError?: string;
}

export interface LanguageAdapter {
  readonly id: string;
  readonly displayName: string;
  matches(filePath: string): boolean;
  detectLanguage(filePath: string): string;
  extract(source: string, filePath: string): FileExtraction;
}

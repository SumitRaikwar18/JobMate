/**
 * AST Code Intelligence - Core Type Definitions
 * Strict structural representations of parsed code facts across 6 core languages.
 */

export type SupportedLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "java"
  | "go"
  | "rust";

export interface SourceRange {
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

export type ASTSymbolKind =
  | "function"
  | "async_function"
  | "class"
  | "interface"
  | "type_alias"
  | "struct"
  | "trait"
  | "impl_block"
  | "method"
  | "react_component"
  | "react_hook"
  | "route_handler"
  | "test_suite"
  | "test_case";

export interface ASTSymbol {
  name: string;
  kind: ASTSymbolKind;
  isAsync?: boolean | undefined;
  isExported?: boolean | undefined;
  visibility?: ("public" | "private" | "protected" | "package") | undefined;
  returnType?: string | undefined;
  parameters?: string[] | undefined;
  annotationsOrDecorators?: string[] | undefined;
  range: SourceRange;
}

export interface ImportFact {
  module: string;
  symbols: string[];
  isDefault?: boolean;
  isWildcard?: boolean;
  range: SourceRange;
}

export interface DatabaseFact {
  technology:
    | "Supabase"
    | "Postgres"
    | "Prisma"
    | "Drizzle"
    | "SQLAlchemy"
    | "MongoDB"
    | "Redis"
    | "SQLx"
    | "GORM"
    | "SpringData"
    | "SQL";
  operation: "query" | "mutation" | "client_init" | "schema_definition";
  detail: string;
  tableOrModel?: string;
  range: SourceRange;
}

export interface HttpEndpointFact {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "ALL" | "CUSTOM";
  path: string;
  handlerSymbol?: string;
  framework:
    | "Express"
    | "Next.js"
    | "TanStack Start"
    | "Hono"
    | "FastAPI"
    | "Flask"
    | "Spring"
    | "Gin"
    | "Actix"
    | "Axum";
  range: SourceRange;
}

export interface TestFact {
  framework: "Vitest" | "Jest" | "Pytest" | "JUnit" | "GoTest" | "RustTest";
  testType: "unit" | "integration" | "e2e";
  testNames: string[];
  assertionsCount: number;
  range: SourceRange;
}

export interface FrameworkFact {
  name: string;
  category: "frontend" | "backend" | "testing" | "orm" | "ai" | "database";
  confidence: number;
  detectedVia: "ast_import" | "ast_call" | "decorator" | "annotation" | "structure";
}

export interface CodeFacts {
  symbols: ASTSymbol[];
  imports: ImportFact[];
  databaseCalls: DatabaseFact[];
  httpEndpoints: HttpEndpointFact[];
  tests: TestFact[];
  frameworks: FrameworkFact[];
  errorHandlingCount: number;
  rawLineCount: number;
}

export interface ASTParseResult {
  filePath: string;
  language: SupportedLanguage;
  status: "success" | "failed" | "unsupported";
  error?: string;
  facts: CodeFacts;
  contentHash: string;
  parseDurationMs: number;
}

export interface ASTIncrementalCacheEntry {
  contentHash: string;
  lastParsedAt: string;
  result: ASTParseResult;
}

/**
 * Rust AST & Structural Syntax Tree Parser
 * Extracts Rust structs, traits, impl blocks, functions, Actix/Axum routes, SQLx/Diesel DB queries, and tests.
 */

import type {
  ASTSymbol,
  CodeFacts,
  DatabaseFact,
  FrameworkFact,
  HttpEndpointFact,
  ImportFact,
  TestFact,
} from "../types";

export class RustASTQuery {
  public static parse(filePath: string, sourceCode: string): CodeFacts {
    const lines = sourceCode.split(/\r?\n/);
    const symbols: ASTSymbol[] = [];
    const imports: ImportFact[] = [];
    const databaseCalls: DatabaseFact[] = [];
    const httpEndpoints: HttpEndpointFact[] = [];
    const testNames: string[] = [];
    const tests: TestFact[] = [];
    let assertionsCount = 0;
    let errorHandlingCount = 0;
    const frameworksMap = new Map<string, FrameworkFact>();

    const addFramework = (name: string, category: FrameworkFact["category"], detectedVia: FrameworkFact["detectedVia"]) => {
      if (!frameworksMap.has(name)) {
        frameworksMap.set(name, { name, category, confidence: 0.95, detectedVia });
      }
    };

    const findMatchingBrace = (startIdx: number): number => {
      let openBraces = 0;
      let foundFirst = false;
      for (let i = startIdx; i < lines.length; i++) {
        const l = lines[i]!;
        for (const char of l) {
          if (char === "{") {
            openBraces++;
            foundFirst = true;
          } else if (char === "}") {
            openBraces--;
            if (foundFirst && openBraces <= 0) {
              return i + 1;
            }
          }
        }
      }
      return lines.length;
    };

    let pendingAttributes: Array<{ name: string; line: number; col: number }> = [];

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const lineNum = lineIdx + 1;
      const rawLine = lines[lineIdx]!;
      const trimmed = rawLine.trim();

      if (trimmed === "" || trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
        continue;
      }

      const col = rawLine.search(/\S/) + 1;

      // 1. Attributes & Macros: `#[get("/users")]`, `#[tokio::test]`, `#[derive(...)]`
      if (trimmed.startsWith("#[")) {
        pendingAttributes.push({
          name: trimmed,
          line: lineNum,
          col,
        });

        // Actix-web route attribute
        const actixRoute = trimmed.match(/^#\[(get|post|put|delete|patch)\((?:["']([^"']+)["'])?\)/i);
        if (actixRoute) {
          const method = actixRoute[1]!.toUpperCase() as any;
          const path = actixRoute[2] || "/";
          httpEndpoints.push({
            method,
            path,
            framework: "Actix",
            range: { startLine: lineNum, endLine: lineNum, startColumn: col, endColumn: rawLine.length + 1 },
          });
          addFramework("Actix", "backend", "decorator");
        }
        continue;
      }

      // 2. Uses (Imports): `use actix_web::{get, web, App};`, `use sqlx::PgPool;`
      if (trimmed.startsWith("use ")) {
        const cleanMod = trimmed.replace("use ", "").replace(";", "").trim();
        imports.push({
          module: cleanMod,
          symbols: [cleanMod.split("::").pop() || cleanMod],
          range: { startLine: lineNum, endLine: lineNum, startColumn: col, endColumn: rawLine.length + 1 },
        });

        const modLower = cleanMod.toLowerCase();
        if (modLower.includes("actix_web")) addFramework("Actix", "backend", "ast_import");
        if (modLower.includes("axum")) addFramework("Axum", "backend", "ast_import");
        if (modLower.includes("sqlx")) addFramework("SQLx", "database", "ast_import");
        if (modLower.includes("tokio")) addFramework("Tokio", "backend", "ast_import");
        continue;
      }

      // 3. Structs & Enums: `pub struct UserProfile {`, `enum Status {`
      const structMatch = trimmed.match(/^(pub(?:\([^)]+\))?\s+)?(struct|enum)\s+([a-zA-Z0-9_]+)/);
      if (structMatch) {
        const isPub = !!structMatch[1];
        const kind = structMatch[2] === "struct" ? "struct" : "type_alias";
        const name = structMatch[3]!;
        const endLine = findMatchingBrace(lineIdx);
        const startLine = pendingAttributes.length > 0 ? pendingAttributes[0]!.line : lineNum;

        symbols.push({
          name,
          kind,
          isExported: isPub,
          annotationsOrDecorators: pendingAttributes.map((a) => a.name),
          range: { startLine, endLine, startColumn: col, endColumn: rawLine.length + 1 },
        });

        pendingAttributes = [];
        continue;
      }

      // 4. Traits: `pub trait Repository {`
      const traitMatch = trimmed.match(/^(pub(?:\([^)]+\))?\s+)?trait\s+([a-zA-Z0-9_]+)/);
      if (traitMatch) {
        const isPub = !!traitMatch[1];
        const name = traitMatch[2]!;
        const endLine = findMatchingBrace(lineIdx);
        const startLine = pendingAttributes.length > 0 ? pendingAttributes[0]!.line : lineNum;

        symbols.push({
          name,
          kind: "trait",
          isExported: isPub,
          range: { startLine, endLine, startColumn: col, endColumn: rawLine.length + 1 },
        });

        pendingAttributes = [];
        continue;
      }

      // 5. Impl Blocks: `impl UserService for UserServiceImpl {` or `impl User {`
      const implMatch = trimmed.match(/^impl(?:<[^>]+>)?\s+(?:([a-zA-Z0-9_]+)\s+for\s+)?([a-zA-Z0-9_]+)/);
      if (implMatch) {
        const traitName = implMatch[1];
        const targetType = implMatch[2]!;
        const name = traitName ? `impl ${traitName} for ${targetType}` : `impl ${targetType}`;
        const endLine = findMatchingBrace(lineIdx);

        symbols.push({
          name,
          kind: "impl_block",
          range: { startLine: lineNum, endLine, startColumn: col, endColumn: rawLine.length + 1 },
        });
        continue;
      }

      // 6. Functions & Async Functions: `pub async fn create_user(...) -> Result<...>`
      const fnMatch = trimmed.match(/^(pub(?:\([^)]+\))?\s+)?(async\s+)?fn\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)(?:\s*->\s*([^{]+))?/);
      if (fnMatch) {
        const isPub = !!fnMatch[1];
        const isAsync = !!fnMatch[2];
        const name = fnMatch[3]!;
        const paramsRaw = fnMatch[4] || "";
        const returnType = fnMatch[5]?.trim();
        const endLine = findMatchingBrace(lineIdx);
        const startLine = pendingAttributes.length > 0 ? pendingAttributes[0]!.line : lineNum;
        const attrs = pendingAttributes.map((a) => a.name);

        const isTest = attrs.some((a) => a.includes("#[test]") || a.includes("#[tokio::test]")) || name.startsWith("test_");
        if (isTest) {
          testNames.push(name);
          addFramework("RustTest", "testing", "decorator");
        }

        symbols.push({
          name,
          kind: isTest ? "test_case" : isAsync ? "async_function" : "function",
          isAsync,
          isExported: isPub,
          returnType,
          parameters: paramsRaw.split(",").map((p) => p.trim()).filter(Boolean),
          annotationsOrDecorators: attrs,
          range: { startLine, endLine, startColumn: col, endColumn: rawLine.length + 1 },
        });

        pendingAttributes = [];
        continue;
      }

      // 7. Database Calls: `sqlx::query`, `sqlx::query_as`
      if (trimmed.includes("sqlx::query") || trimmed.includes("sqlx::query_as")) {
        databaseCalls.push({
          technology: "SQLx",
          operation: "query",
          detail: `SQLx type-safe query execution: ${trimmed.slice(0, 45)}`,
          range: { startLine: lineNum, endLine: lineNum, startColumn: col, endColumn: rawLine.length + 1 },
        });
        addFramework("SQLx", "database", "ast_call");
      }

      // 8. Assertions
      if (trimmed.includes("assert_eq!") || trimmed.includes("assert!") || trimmed.includes("assert_ne!")) {
        assertionsCount++;
      }

      // 9. Error Handling
      if (trimmed.includes("match ") && trimmed.includes("Err(") || trimmed.includes(".map_err(") || trimmed.endsWith("?")) {
        errorHandlingCount++;
      }

      pendingAttributes = [];
    }

    if (testNames.length > 0 || assertionsCount > 0) {
      tests.push({
        framework: "RustTest",
        testType: filePath.includes("tests/") ? "integration" : "unit",
        testNames,
        assertionsCount,
        range: { startLine: 1, endLine: lines.length, startColumn: 1, endColumn: 1 },
      });
      addFramework("RustTest", "testing", "structure");
    }

    return {
      symbols,
      imports,
      databaseCalls,
      httpEndpoints,
      tests,
      frameworks: Array.from(frameworksMap.values()),
      errorHandlingCount,
      rawLineCount: lines.length,
    };
  }
}

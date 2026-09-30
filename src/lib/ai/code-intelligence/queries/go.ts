/**
 * Go AST & Structural Syntax Tree Parser
 * Extracts Go packages, structs, interfaces, methods, functions, HTTP routes (Gin/net/http), SQL/GORM, and tests.
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

export class GoASTQuery {
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

    let inImportBlock = false;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const lineNum = lineIdx + 1;
      const rawLine = lines[lineIdx]!;
      const trimmed = rawLine.trim();

      if (trimmed === "" || trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
        continue;
      }

      const col = rawLine.search(/\S/) + 1;

      // 1. Multi-line or single-line imports
      if (trimmed === "import (") {
        inImportBlock = true;
        continue;
      }
      if (inImportBlock) {
        if (trimmed === ")") {
          inImportBlock = false;
          continue;
        }
        const cleanMod = trimmed.replace(/"/g, "").trim();
        if (cleanMod) {
          imports.push({
            module: cleanMod,
            symbols: [cleanMod.split("/").pop() || cleanMod],
            range: { startLine: lineNum, endLine: lineNum, startColumn: col, endColumn: rawLine.length + 1 },
          });
          checkGoModuleFramework(cleanMod, addFramework);
        }
        continue;
      }

      if (trimmed.startsWith("import ")) {
        const cleanMod = trimmed.replace("import ", "").replace(/"/g, "").trim();
        imports.push({
          module: cleanMod,
          symbols: [cleanMod.split("/").pop() || cleanMod],
          range: { startLine: lineNum, endLine: lineNum, startColumn: col, endColumn: rawLine.length + 1 },
        });
        checkGoModuleFramework(cleanMod, addFramework);
        continue;
      }

      // 2. Structs & Interfaces: `type User struct {`, `type UserService interface {`
      const typeMatch = trimmed.match(/^type\s+([a-zA-Z0-9_]+)\s+(struct|interface)\b/);
      if (typeMatch) {
        const name = typeMatch[1]!;
        const kindRaw = typeMatch[2]!;
        const isExported = /^[A-Z]/.test(name);
        const endLine = findMatchingBrace(lineIdx);

        symbols.push({
          name,
          kind: kindRaw === "struct" ? "struct" : "interface",
          isExported,
          range: { startLine: lineNum, endLine, startColumn: col, endColumn: rawLine.length + 1 },
        });
        continue;
      }

      // 3. Methods on receiver: `func (s *Server) HandleUsers(w http.ResponseWriter, r *http.Request) {`
      const methodMatch = trimmed.match(/^func\s+\(([^)]+)\)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)(?:\s*\(?([^){]+)\)?)?/);
      if (methodMatch) {
        const name = methodMatch[2]!;
        const isExported = /^[A-Z]/.test(name);
        const endLine = findMatchingBrace(lineIdx);

        symbols.push({
          name,
          kind: "method",
          isExported,
          range: { startLine: lineNum, endLine, startColumn: col, endColumn: rawLine.length + 1 },
        });
        continue;
      }

      // 4. Regular Functions: `func CreateUser(...) error {` or `func TestCreateUser(t *testing.T) {`
      const funcMatch = trimmed.match(/^func\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)(?:\s*\(?([^){]+)\)?)?/);
      if (funcMatch) {
        const name = funcMatch[1]!;
        const isExported = /^[A-Z]/.test(name);
        const isTest = name.startsWith("Test") || name.startsWith("Benchmark");
        const endLine = findMatchingBrace(lineIdx);

        if (isTest) {
          testNames.push(name);
          addFramework("GoTest", "testing", "structure");
        }

        symbols.push({
          name,
          kind: isTest ? "test_case" : "function",
          isExported,
          range: { startLine: lineNum, endLine, startColumn: col, endColumn: rawLine.length + 1 },
        });
        continue;
      }

      // 5. HTTP Endpoints: Gin / net/http
      const ginRouteMatch = trimmed.match(/(?:router|r|engine|api|g)\.(GET|POST|PUT|DELETE|PATCH)\((?:["']([^"']+)["'])/i);
      if (ginRouteMatch) {
        const method = ginRouteMatch[1]!.toUpperCase() as any;
        const path = ginRouteMatch[2] || "/";
        httpEndpoints.push({
          method,
          path,
          framework: "Gin",
          range: { startLine: lineNum, endLine: lineNum, startColumn: col, endColumn: rawLine.length + 1 },
        });
        addFramework("Gin", "backend", "ast_call");
      } else if (trimmed.includes("http.HandleFunc(") || trimmed.includes("http.Handle(")) {
        const netHttpMatch = trimmed.match(/http\.Handle(?:Func)?\((?:["']([^"']+)["'])/);
        const path = netHttpMatch ? netHttpMatch[1]! : "/";
        httpEndpoints.push({
          method: "ALL",
          path,
          framework: "Gin", // net/http standard
          range: { startLine: lineNum, endLine: lineNum, startColumn: col, endColumn: rawLine.length + 1 },
        });
      }

      // 6. Database Operations: `db.Query`, `db.Exec`, `gorm`, `pgx`
      if (trimmed.includes("db.Query") || trimmed.includes("db.Exec") || trimmed.includes("db.Find") || trimmed.includes("gorm.")) {
        const tech = trimmed.includes("gorm") ? "GORM" : "SQL";
        databaseCalls.push({
          technology: tech,
          operation: "query",
          detail: `Go database query execution: ${trimmed.slice(0, 45)}`,
          range: { startLine: lineNum, endLine: lineNum, startColumn: col, endColumn: rawLine.length + 1 },
        });
        addFramework(tech, "database", "ast_call");
      }

      // 7. Error Handling: `if err != nil`
      if (trimmed.startsWith("if err != nil")) {
        errorHandlingCount++;
      }

      // 8. Assertions in tests: `assert.Equal`, `t.Errorf`
      if (trimmed.includes("assert.") || trimmed.includes("t.Error") || trimmed.includes("t.Fatal") || trimmed.includes("require.")) {
        assertionsCount++;
      }
    }

    if (testNames.length > 0 || assertionsCount > 0) {
      tests.push({
        framework: "GoTest",
        testType: filePath.includes("integration") ? "integration" : "unit",
        testNames,
        assertionsCount,
        range: { startLine: 1, endLine: lines.length, startColumn: 1, endColumn: 1 },
      });
      addFramework("GoTest", "testing", "structure");
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

function checkGoModuleFramework(
  module: string,
  addFramework: (name: string, cat: FrameworkFact["category"], via: FrameworkFact["detectedVia"]) => void
) {
  const m = module.toLowerCase();
  if (m.includes("gin-gonic")) addFramework("Gin", "backend", "ast_import");
  if (m.includes("gorm.io")) addFramework("GORM", "orm", "ast_import");
  if (m.includes("pgx") || m.includes("lib/pq")) addFramework("Postgres", "database", "ast_import");
  if (m.includes("stretchr/testify")) addFramework("GoTest", "testing", "ast_import");
}

/**
 * Python AST & Structural Syntax Tree Parser
 * Parses Python source code into structural AST facts (functions, async defs, classes, decorators, routes, DB, tests).
 */

import type {
  ASTSymbol,
  CodeFacts,
  DatabaseFact,
  FrameworkFact,
  HttpEndpointFact,
  ImportFact,
  SourceRange,
  TestFact,
} from "../types";

export class PythonASTQuery {
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

    let pendingDecorators: Array<{ name: string; line: number; col: number; raw: string }> = [];

    // Helper to find block end line based on indentation
    const findBlockEnd = (startIdx: number, baseIndent: number): number => {
      for (let i = startIdx + 1; i < lines.length; i++) {
        const line = lines[i]!;
        if (line.trim() === "" || line.trim().startsWith("#")) continue;
        const currentIndent = line.search(/\S/);
        if (currentIndent !== -1 && currentIndent <= baseIndent) {
          return i; // previous non-empty line was end
        }
      }
      return lines.length;
    };

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const lineNum = lineIdx + 1;
      const rawLine = lines[lineIdx]!;
      const trimmed = rawLine.trim();

      if (trimmed === "" || trimmed.startsWith("#")) {
        continue;
      }

      const indent = rawLine.search(/\S/);

      // 1. Decorators (@app.get("/users"), @router.post, @pytest.fixture)
      if (trimmed.startsWith("@")) {
        pendingDecorators.push({
          name: trimmed.slice(1),
          line: lineNum,
          col: indent + 1,
          raw: trimmed,
        });

        // Check FastAPI / Flask Route Decorator
        const routeMatch = trimmed.match(/^@(app|router|api|bp)\.(get|post|put|delete|patch)\((?:["']([^"']+)["'])?/i);
        if (routeMatch) {
          const framework = trimmed.includes("bp") ? "Flask" : "FastAPI";
          const method = routeMatch[2]!.toUpperCase() as any;
          const path = routeMatch[3] || "/";
          httpEndpoints.push({
            method,
            path,
            framework,
            range: {
              startLine: lineNum,
              endLine: lineNum,
              startColumn: indent + 1,
              endColumn: rawLine.length + 1,
            },
          });
          addFramework(framework, "backend", "decorator");
        }

        const flaskRoute = trimmed.match(/^@(app|bp)\.route\((?:["']([^"']+)["'])?(?:.*methods=\[([^\]]+)\])?/i);
        if (flaskRoute) {
          const path = flaskRoute[2] || "/";
          const methods = flaskRoute[3] ? flaskRoute[3].replace(/['"\s]/g, "") : "GET";
          httpEndpoints.push({
            method: (methods.split(",")[0] || "GET").toUpperCase() as any,
            path,
            framework: "Flask",
            range: {
              startLine: lineNum,
              endLine: lineNum,
              startColumn: indent + 1,
              endColumn: rawLine.length + 1,
            },
          });
          addFramework("Flask", "backend", "decorator");
        }
        continue;
      }

      // 2. Imports: `import foo`, `from foo import bar, baz`
      if (trimmed.startsWith("import ") || trimmed.startsWith("from ")) {
        const importFact = parsePythonImport(trimmed, lineNum, indent, rawLine.length);
        if (importFact) {
          imports.push(importFact);
          const mod = importFact.module.toLowerCase();
          if (mod.includes("fastapi")) addFramework("FastAPI", "backend", "ast_import");
          if (mod.includes("flask")) addFramework("Flask", "backend", "ast_import");
          if (mod.includes("sqlalchemy") || mod.includes("sqlmodel")) addFramework("SQLAlchemy", "orm", "ast_import");
          if (mod.includes("psycopg") || mod.includes("asyncpg")) addFramework("Postgres", "database", "ast_import");
          if (mod.includes("pytest")) addFramework("Pytest", "testing", "ast_import");
          if (mod.includes("django")) addFramework("Django", "backend", "ast_import");
          if (mod.includes("openai") || mod.includes("langchain")) addFramework("OpenAI / AI", "ai", "ast_import");
        }
        pendingDecorators = [];
        continue;
      }

      // 3. Functions & Async Functions: `def foo(...)`, `async def foo(...)`
      const funcMatch = trimmed.match(/^(async\s+)?def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?:/);
      if (funcMatch) {
        const isAsync = !!funcMatch[1];
        const funcName = funcMatch[2]!;
        const rawParams = funcMatch[3] || "";
        const returnType = funcMatch[4]?.trim();
        const endLine = findBlockEnd(lineIdx, indent);

        const decoratorsList = pendingDecorators.map((d) => d.name);
        const startLine = pendingDecorators.length > 0 ? pendingDecorators[0]!.line : lineNum;

        const isTest = funcName.startsWith("test_") || filePath.includes("test");
        if (isTest) {
          testNames.push(funcName);
          addFramework("Pytest", "testing", "structure");
        }

        symbols.push({
          name: funcName,
          kind: isTest ? "test_case" : isAsync ? "async_function" : "function",
          isAsync,
          isExported: !funcName.startsWith("_"),
          parameters: rawParams.split(",").map((p) => p.trim()).filter(Boolean),
          returnType,
          annotationsOrDecorators: decoratorsList,
          range: {
            startLine,
            endLine,
            startColumn: indent + 1,
            endColumn: rawLine.length + 1,
          },
        });

        pendingDecorators = [];
        continue;
      }

      // 4. Classes: `class Foo(Bar):`
      const classMatch = trimmed.match(/^class\s+([a-zA-Z0-9_]+)(?:\(([^)]*)\))?:/);
      if (classMatch) {
        const className = classMatch[1]!;
        const endLine = findBlockEnd(lineIdx, indent);
        const decoratorsList = pendingDecorators.map((d) => d.name);
        const startLine = pendingDecorators.length > 0 ? pendingDecorators[0]!.line : lineNum;

        const isTest = className.startsWith("Test") || filePath.includes("test");
        if (isTest) {
          testNames.push(className);
        }

        symbols.push({
          name: className,
          kind: isTest ? "test_suite" : "class",
          isExported: !className.startsWith("_"),
          annotationsOrDecorators: decoratorsList,
          range: {
            startLine,
            endLine,
            startColumn: indent + 1,
            endColumn: rawLine.length + 1,
          },
        });

        pendingDecorators = [];
        continue;
      }

      // 5. Database Calls: `session.query(...)`, `db.session.add(...)`, `select(...)`
      if (trimmed.includes("session.query") || trimmed.includes("session.execute") || trimmed.includes("db.session")) {
        databaseCalls.push({
          technology: "SQLAlchemy",
          operation: "query",
          detail: `SQLAlchemy session execution: ${trimmed.slice(0, 50)}`,
          range: {
            startLine: lineNum,
            endLine: lineNum,
            startColumn: indent + 1,
            endColumn: rawLine.length + 1,
          },
        });
        addFramework("SQLAlchemy", "orm", "ast_call");
      } else if (trimmed.includes("cursor.execute") || trimmed.includes("connection.execute")) {
        databaseCalls.push({
          technology: "Postgres",
          operation: "query",
          detail: `Direct SQL database query execution`,
          range: {
            startLine: lineNum,
            endLine: lineNum,
            startColumn: indent + 1,
            endColumn: rawLine.length + 1,
          },
        });
        addFramework("Postgres", "database", "ast_call");
      }

      // 6. Assertions
      if (trimmed.startsWith("assert ") || trimmed.startsWith("assert(")) {
        assertionsCount++;
      }

      // 7. Error Handling
      if (trimmed.startsWith("try:") || trimmed.startsWith("except ") || trimmed.startsWith("except:")) {
        errorHandlingCount++;
      }

      pendingDecorators = [];
    }

    if (testNames.length > 0 || assertionsCount > 0) {
      tests.push({
        framework: "Pytest",
        testType: filePath.includes("e2e") ? "e2e" : filePath.includes("integration") ? "integration" : "unit",
        testNames,
        assertionsCount,
        range: {
          startLine: 1,
          endLine: lines.length,
          startColumn: 1,
          endColumn: 1,
        },
      });
      addFramework("Pytest", "testing", "structure");
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

function parsePythonImport(line: string, lineNum: number, col: number, lineLen: number): ImportFact | null {
  if (line.startsWith("import ")) {
    const mod = line.replace("import ", "").split("#")[0]!.trim();
    return {
      module: mod,
      symbols: [mod],
      range: { startLine: lineNum, endLine: lineNum, startColumn: col + 1, endColumn: lineLen + 1 },
    };
  }
  if (line.startsWith("from ")) {
    const match = line.match(/^from\s+([a-zA-Z0-9_\.]+)\s+import\s+(.+)$/);
    if (match) {
      const module = match[1]!;
      const symbols = match[2]!.split(",").map((s) => s.trim().split(" as ")[0]!);
      return {
        module,
        symbols,
        range: { startLine: lineNum, endLine: lineNum, startColumn: col + 1, endColumn: lineLen + 1 },
      };
    }
  }
  return null;
}

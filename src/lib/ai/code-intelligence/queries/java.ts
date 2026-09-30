/**
 * Java AST & Structural Syntax Tree Parser
 * Extracts Java classes, interfaces, Spring annotations, REST endpoints, JPA/JDBC calls, and JUnit tests.
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

export class JavaASTQuery {
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

    let pendingAnnotations: Array<{ name: string; line: number; col: number; raw: string }> = [];

    // Helper to find block end matching braces
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

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const lineNum = lineIdx + 1;
      const rawLine = lines[lineIdx]!;
      const trimmed = rawLine.trim();

      if (trimmed === "" || trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
        continue;
      }

      const col = rawLine.search(/\S/) + 1;

      // 1. Imports
      if (trimmed.startsWith("import ")) {
        const clean = trimmed.replace("import ", "").replace(";", "").trim();
        const parts = clean.split(".");
        const sym = parts[parts.length - 1]!;
        imports.push({
          module: clean,
          symbols: [sym],
          range: { startLine: lineNum, endLine: lineNum, startColumn: col, endColumn: rawLine.length + 1 },
        });

        const modLower = clean.toLowerCase();
        if (modLower.includes("springframework")) addFramework("Spring", "backend", "ast_import");
        if (modLower.includes("junit") || modLower.includes("org.junit")) addFramework("JUnit", "testing", "ast_import");
        if (modLower.includes("hibernate") || modLower.includes("jpa")) addFramework("SpringData", "orm", "ast_import");
        continue;
      }

      // 2. Annotations: `@RestController`, `@GetMapping("/api/users")`, `@Test`
      if (trimmed.startsWith("@")) {
        pendingAnnotations.push({
          name: trimmed,
          line: lineNum,
          col,
          raw: trimmed,
        });

        // Spring REST endpoint annotations
        const springRoute = trimmed.match(/^@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\((?:(?:value|path)\s*=\s*)?["']?([^"')\s]+)?/i);
        if (springRoute) {
          const methodMap: Record<string, HttpEndpointFact["method"]> = {
            getmapping: "GET",
            postmapping: "POST",
            putmapping: "PUT",
            deletemapping: "DELETE",
            patchmapping: "PATCH",
            requestmapping: "ALL",
          };
          const rawMethod = springRoute[1]!.toLowerCase();
          const method = methodMap[rawMethod] || "GET";
          const path = springRoute[2] || "/";

          httpEndpoints.push({
            method,
            path,
            framework: "Spring",
            range: { startLine: lineNum, endLine: lineNum, startColumn: col, endColumn: rawLine.length + 1 },
          });
          addFramework("Spring", "backend", "annotation");
        }
        continue;
      }

      // 3. Class or Interface Declarations: `public class UserService {`, `public interface UserRepository {`
      const classMatch = trimmed.match(/^(?:public\s+|protected\s+|private\s+)?(?:abstract\s+|final\s+)?(class|interface|record|enum)\s+([a-zA-Z0-9_]+)/);
      if (classMatch) {
        const kindRaw = classMatch[1]!;
        const name = classMatch[2]!;
        const endLine = findMatchingBrace(lineIdx);
        const startLine = pendingAnnotations.length > 0 ? pendingAnnotations[0]!.line : lineNum;

        const annotations = pendingAnnotations.map((a) => a.name);
        const isTest = name.endsWith("Test") || annotations.some((a) => a.includes("SpringBootTest"));
        if (isTest) {
          addFramework("JUnit", "testing", "structure");
        }

        symbols.push({
          name,
          kind: kindRaw === "interface" ? "interface" : isTest ? "test_suite" : "class",
          isExported: trimmed.startsWith("public"),
          visibility: trimmed.startsWith("public") ? "public" : trimmed.startsWith("protected") ? "protected" : "package",
          annotationsOrDecorators: annotations,
          range: { startLine, endLine, startColumn: col, endColumn: rawLine.length + 1 },
        });

        pendingAnnotations = [];
        continue;
      }

      // 4. Method Declarations: `public ResponseEntity<User> getUser(...)` or `void testUser(...)`
      const methodMatch = trimmed.match(/^(?:(?:public|protected|private)\s+)?(?:static\s+)?(?:final\s+)?([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
      if (methodMatch && !trimmed.startsWith("if ") && !trimmed.startsWith("while ") && !trimmed.startsWith("for ")) {
        const returnType = methodMatch[1]!;
        const name = methodMatch[2]!;
        const paramsRaw = methodMatch[3] || "";
        const endLine = findMatchingBrace(lineIdx);
        const startLine = pendingAnnotations.length > 0 ? pendingAnnotations[0]!.line : lineNum;
        const annotations = pendingAnnotations.map((a) => a.name);

        const isTest = annotations.some((a) => a.includes("@Test")) || name.startsWith("test");
        if (isTest) {
          testNames.push(name);
          addFramework("JUnit", "testing", "annotation");
        }

        symbols.push({
          name,
          kind: isTest ? "test_case" : "method",
          isExported: trimmed.startsWith("public"),
          visibility: trimmed.startsWith("public") ? "public" : trimmed.startsWith("protected") ? "protected" : "package",
          returnType,
          parameters: paramsRaw.split(",").map((p) => p.trim()).filter(Boolean),
          annotationsOrDecorators: annotations,
          range: { startLine, endLine, startColumn: col, endColumn: rawLine.length + 1 },
        });

        pendingAnnotations = [];
        continue;
      }

      // 5. Database Calls
      const dbMatch = trimmed.match(/(?:[a-zA-Z0-9_]*repository|jdbcTemplate|entityManager)\.(save|find|delete|count|exists|query|persist|merge)/i);
      if (dbMatch || trimmed.includes("jdbcTemplate.") || trimmed.includes("entityManager.")) {
        databaseCalls.push({
          technology: "SpringData",
          operation: "query",
          detail: `JPA/JDBC query operation: ${trimmed.slice(0, 50)}`,
          range: { startLine: lineNum, endLine: lineNum, startColumn: col, endColumn: rawLine.length + 1 },
        });
        addFramework("SpringData", "database", "ast_call");
      }

      // 6. Assertions
      if (trimmed.includes("assert") || trimmed.includes("assertThat(") || trimmed.includes("assertEquals(")) {
        assertionsCount++;
      }

      // 7. Error Handling
      if (trimmed.startsWith("try ") || trimmed.startsWith("try{") || trimmed.includes("catch (") || trimmed.includes("catch(")) {
        errorHandlingCount++;
      }

      pendingAnnotations = [];
    }

    if (testNames.length > 0 || assertionsCount > 0) {
      tests.push({
        framework: "JUnit",
        testType: filePath.includes("integration") || filePath.includes("IT") ? "integration" : "unit",
        testNames,
        assertionsCount,
        range: { startLine: 1, endLine: lines.length, startColumn: 1, endColumn: 1 },
      });
      addFramework("JUnit", "testing", "structure");
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

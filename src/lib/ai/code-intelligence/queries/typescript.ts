/**
 * TypeScript / JavaScript AST Query Extractor
 * Uses the official TypeScript Compiler API to walk syntax trees and extract structural code facts.
 */

import ts from "typescript";
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

export class TypeScriptASTQuery {
  public static parse(filePath: string, sourceCode: string, isTypeScript: boolean = true): CodeFacts {
    const scriptKind = filePath.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : filePath.endsWith(".jsx")
      ? ts.ScriptKind.JSX
      : filePath.endsWith(".js")
      ? ts.ScriptKind.JS
      : ts.ScriptKind.TS;

    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
      scriptKind
    );

    const symbols: ASTSymbol[] = [];
    const imports: ImportFact[] = [];
    const databaseCalls: DatabaseFact[] = [];
    const httpEndpoints: HttpEndpointFact[] = [];
    const tests: TestFact[] = [];
    const frameworksMap = new Map<string, FrameworkFact>();
    let errorHandlingCount = 0;

    const lines = sourceCode.split("\n");
    const rawLineCount = lines.length;

    const getRange = (node: ts.Node): SourceRange => {
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
      return {
        startLine: start.line + 1,
        endLine: end.line + 1,
        startColumn: start.character + 1,
        endColumn: end.character + 1,
      };
    };

    const addFramework = (name: string, category: FrameworkFact["category"], detectedVia: FrameworkFact["detectedVia"]) => {
      if (!frameworksMap.has(name)) {
        frameworksMap.set(name, {
          name,
          category,
          confidence: 0.95,
          detectedVia,
        });
      }
    };

    const testNamesFound: string[] = [];
    let testAssertions = 0;

    // Recursive AST visitor
    const visit = (node: ts.Node) => {
      // 1. Imports
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
        const importedSymbols: string[] = [];
        let isDefault = false;

        if (node.importClause) {
          if (node.importClause.name) {
            importedSymbols.push(node.importClause.name.text);
            isDefault = true;
          }
          if (node.importClause.namedBindings) {
            if (ts.isNamedImports(node.importClause.namedBindings)) {
              for (const elem of node.importClause.namedBindings.elements) {
                importedSymbols.push(elem.name.text);
              }
            } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
              importedSymbols.push(`* as ${node.importClause.namedBindings.name.text}`);
            }
          }
        }

        imports.push({
          module: moduleSpecifier,
          symbols: importedSymbols,
          isDefault,
          range: getRange(node),
        });

        // Detect Frameworks from Imports
        const mod = moduleSpecifier.toLowerCase();
        if (mod.includes("react")) addFramework("React", "frontend", "ast_import");
        if (mod.includes("next")) addFramework("Next.js", "frontend", "ast_import");
        if (mod.includes("express")) addFramework("Express", "backend", "ast_import");
        if (mod.includes("hono")) addFramework("Hono", "backend", "ast_import");
        if (mod.includes("@supabase")) addFramework("Supabase", "database", "ast_import");
        if (mod.includes("@prisma")) addFramework("Prisma", "orm", "ast_import");
        if (mod.includes("drizzle")) addFramework("Drizzle", "orm", "ast_import");
        if (mod.includes("vitest")) addFramework("Vitest", "testing", "ast_import");
        if (mod.includes("jest")) addFramework("Jest", "testing", "ast_import");
        if (mod.includes("@tanstack/react-start") || mod.includes("@tanstack/react-router")) {
          addFramework("TanStack Start", "frontend", "ast_import");
        }
      }

      // 2. Interfaces & Types
      if (ts.isInterfaceDeclaration(node)) {
        symbols.push({
          name: node.name.text,
          kind: "interface",
          isExported: hasModifier(node, ts.SyntaxKind.ExportKeyword),
          range: getRange(node),
        });
      } else if (ts.isTypeAliasDeclaration(node)) {
        symbols.push({
          name: node.name.text,
          kind: "type_alias",
          isExported: hasModifier(node, ts.SyntaxKind.ExportKeyword),
          range: getRange(node),
        });
      }

      // 3. Classes
      if (ts.isClassDeclaration(node) && node.name) {
        symbols.push({
          name: node.name.text,
          kind: "class",
          isExported: hasModifier(node, ts.SyntaxKind.ExportKeyword),
          range: getRange(node),
        });
      }

      // 4. Function Declarations
      if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.text;
        const isAsync = hasModifier(node, ts.SyntaxKind.AsyncKeyword);
        const isExported = hasModifier(node, ts.SyntaxKind.ExportKeyword);

        let kind: ASTSymbol["kind"] = isAsync ? "async_function" : "function";
        if (name.startsWith("use") && name.length > 3 && /^[A-Z]/.test(name.charAt(3))) {
          kind = "react_hook";
          addFramework("React", "frontend", "structure");
        } else if (/^[A-Z]/.test(name) && returnsJsx(node)) {
          kind = "react_component";
          addFramework("React", "frontend", "structure");
        }

        // Check for Next.js route handlers: export async function GET/POST
        if (isExported && ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(name)) {
          httpEndpoints.push({
            method: name as any,
            path: filePath,
            handlerSymbol: name,
            framework: "Next.js",
            range: getRange(node),
          });
          kind = "route_handler";
        }

        symbols.push({
          name,
          kind,
          isAsync,
          isExported,
          parameters: node.parameters.map((p) => p.name.getText(sourceFile)),
          returnType: node.type ? node.type.getText(sourceFile) : undefined,
          range: getRange(node),
        });
      }

      // 5. Variable Statements (Arrow Functions, TanStack createServerFn, React Components)
      if (ts.isVariableStatement(node)) {
        const isExported = hasModifier(node, ts.SyntaxKind.ExportKeyword);
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name) && decl.initializer) {
            const varName = decl.name.text;
            const init = decl.initializer;

            // Check arrow function or function expression
            if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
              const isAsync = hasModifier(init, ts.SyntaxKind.AsyncKeyword);
              let kind: ASTSymbol["kind"] = isAsync ? "async_function" : "function";

              if (varName.startsWith("use") && varName.length > 3 && /^[A-Z]/.test(varName.charAt(3))) {
                kind = "react_hook";
                addFramework("React", "frontend", "structure");
              } else if (/^[A-Z]/.test(varName)) {
                kind = "react_component";
                addFramework("React", "frontend", "structure");
              }

              symbols.push({
                name: varName,
                kind,
                isAsync,
                isExported,
                parameters: init.parameters.map((p) => p.name.getText(sourceFile)),
                range: getRange(node),
              });
            }

            // Check TanStack Start / Next.js Server Actions
            if (ts.isCallExpression(init)) {
              const callText = init.expression.getText(sourceFile);
              if (callText.includes("createServerFn")) {
                httpEndpoints.push({
                  method: "POST",
                  path: filePath,
                  handlerSymbol: varName,
                  framework: "TanStack Start",
                  range: getRange(node),
                });
                symbols.push({
                  name: varName,
                  kind: "route_handler",
                  isAsync: true,
                  isExported,
                  range: getRange(node),
                });
                addFramework("TanStack Start", "backend", "ast_call");
              }
            }
          }
        }
      }

      // 6. Call Expressions (Route Registrations, Database Queries, Test Blocks)
      if (ts.isCallExpression(node)) {
        const exprText = node.expression.getText(sourceFile);

        // Express / Hono routes: app.get('/users', ...), router.post('/login', ...)
        const routeMatch = exprText.match(/(?:app|router|api|server)\.(get|post|put|delete|patch)\b/i);
        if (routeMatch && routeMatch[1] && node.arguments.length > 0) {
          const method = routeMatch[1].toUpperCase() as any;
          const firstArg = node.arguments[0];
          const path = firstArg && ts.isStringLiteral(firstArg) ? firstArg.text : "/";
          const framework = exprText.includes("hono") ? "Hono" : "Express";

          httpEndpoints.push({
            method,
            path,
            framework,
            range: getRange(node),
          });
          addFramework(framework, "backend", "ast_call");
        }

        // Database calls: Supabase (.from("table"))
        if (
          (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "from") ||
          exprText.endsWith(".from")
        ) {
          const caller = ts.isPropertyAccessExpression(node.expression)
            ? node.expression.expression.getText(sourceFile)
            : exprText;
          if (caller.toLowerCase().includes("supabase") || caller.toLowerCase().includes("db")) {
            let table = "";
            const firstArg = node.arguments[0];
            if (firstArg && ts.isStringLiteral(firstArg)) {
              table = firstArg.text;
            }
            databaseCalls.push({
              technology: "Supabase",
              operation: "query",
              detail: `Supabase query on table "${table || "unknown"}"`,
              tableOrModel: table,
              range: getRange(node),
            });
            addFramework("Supabase", "database", "ast_call");
          }
        } else if (exprText.startsWith("prisma.") || exprText.includes("prisma.")) {
          databaseCalls.push({
            technology: "Prisma",
            operation: "query",
            detail: `Prisma ORM invocation: ${exprText.slice(0, 40)}`,
            range: getRange(node),
          });
          addFramework("Prisma", "orm", "ast_call");
        } else if (exprText.includes("db.select") || exprText.includes("db.insert")) {
          databaseCalls.push({
            technology: "Drizzle",
            operation: "query",
            detail: `Drizzle ORM query: ${exprText.slice(0, 40)}`,
            range: getRange(node),
          });
          addFramework("Drizzle", "orm", "ast_call");
        } else if (exprText.includes("pool.query") || exprText.includes("client.query")) {
          databaseCalls.push({
            technology: "Postgres",
            operation: "query",
            detail: `Direct Postgres SQL query execution`,
            range: getRange(node),
          });
          addFramework("Postgres", "database", "ast_call");
        }

        // Testing: describe, it, test, expect
        if (["describe", "it", "test"].includes(exprText)) {
          const firstArg = node.arguments[0];
          if (firstArg && ts.isStringLiteral(firstArg)) {
            testNamesFound.push(firstArg.text);
          }
        }
        if (exprText === "expect" || exprText.startsWith("expect(")) {
          testAssertions++;
        }
      }

      // 7. Error Handling
      if (ts.isTryStatement(node)) {
        errorHandlingCount++;
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Build TestFact if tests were detected
    if (testNamesFound.length > 0 || testAssertions > 0) {
      const framework = frameworksMap.has("Vitest") ? "Vitest" : "Jest";
      tests.push({
        framework,
        testType: filePath.includes("e2e") ? "e2e" : filePath.includes("integration") ? "integration" : "unit",
        testNames: testNamesFound,
        assertionsCount: testAssertions,
        range: {
          startLine: 1,
          endLine: rawLineCount,
          startColumn: 1,
          endColumn: 1,
        },
      });
      addFramework(framework, "testing", "structure");
    }

    return {
      symbols,
      imports,
      databaseCalls,
      httpEndpoints,
      tests,
      frameworks: Array.from(frameworksMap.values()),
      errorHandlingCount,
      rawLineCount,
    };
  }
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return (
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((mod) => mod.kind === kind) === true
  );
}

function returnsJsx(node: ts.Node): boolean {
  let hasJsx = false;
  const check = (n: ts.Node) => {
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) {
      hasJsx = true;
      return;
    }
    ts.forEachChild(n, check);
  };
  check(node);
  return hasJsx;
}

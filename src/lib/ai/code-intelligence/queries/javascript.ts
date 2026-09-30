/**
 * JavaScript AST Query Extractor
 * Delegates to TypeScript AST query with JavaScript script kind.
 */

import { TypeScriptASTQuery } from "./typescript";
import type { CodeFacts } from "../types";

export class JavaScriptASTQuery {
  public static parse(filePath: string, sourceCode: string): CodeFacts {
    return TypeScriptASTQuery.parse(filePath, sourceCode, false);
  }
}

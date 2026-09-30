/**
 * Master AST Analyzer
 * Dispatches source files to language-specific AST engines with incremental hashing and safe error isolation.
 */

import { LanguageDetector } from "./language-detector";
import { TypeScriptASTQuery } from "./queries/typescript";
import { JavaScriptASTQuery } from "./queries/javascript";
import { PythonASTQuery } from "./queries/python";
import { JavaASTQuery } from "./queries/java";
import { GoASTQuery } from "./queries/go";
import { RustASTQuery } from "./queries/rust";
import type {
  ASTIncrementalCacheEntry,
  ASTParseResult,
  CodeFacts,
  SupportedLanguage,
} from "./types";

export class ASTAnalyzer {
  private static incrementalCache = new Map<string, ASTIncrementalCacheEntry>();

  /**
   * Parses a single source code file into structured AST facts.
   */
  public static async analyzeFile(
    filePath: string,
    sourceCode: string,
    forcedLanguage?: SupportedLanguage
  ): Promise<ASTParseResult> {
    const startTime = Date.now();
    const contentHash = this.computeHash(sourceCode);

    // 1. Check Incremental Cache
    const cached = this.incrementalCache.get(filePath);
    if (cached && cached.contentHash === contentHash) {
      return cached.result;
    }

    // 2. Detect Language
    const detected = forcedLanguage
      ? { language: forcedLanguage, confidence: 1.0, detectedBy: "heuristic" as const }
      : LanguageDetector.detectLanguage(filePath);

    if (detected.language === "unsupported") {
      const emptyFacts: CodeFacts = {
        symbols: [],
        imports: [],
        databaseCalls: [],
        httpEndpoints: [],
        tests: [],
        frameworks: [],
        errorHandlingCount: 0,
        rawLineCount: sourceCode.split(/\r?\n/).length,
      };

      const result: ASTParseResult = {
        filePath,
        language: "typescript", // fallback placeholder
        status: "unsupported",
        error: `Unsupported language for file: ${filePath}`,
        facts: emptyFacts,
        contentHash,
        parseDurationMs: Date.now() - startTime,
      };
      return result;
    }

    const language = detected.language;

    // 3. Dispatch to Parser with Error Isolation
    try {
      let facts: CodeFacts;

      switch (language) {
        case "typescript":
          facts = TypeScriptASTQuery.parse(filePath, sourceCode, true);
          break;
        case "javascript":
          facts = JavaScriptASTQuery.parse(filePath, sourceCode);
          break;
        case "python":
          facts = PythonASTQuery.parse(filePath, sourceCode);
          break;
        case "java":
          facts = JavaASTQuery.parse(filePath, sourceCode);
          break;
        case "go":
          facts = GoASTQuery.parse(filePath, sourceCode);
          break;
        case "rust":
          facts = RustASTQuery.parse(filePath, sourceCode);
          break;
      }

      const result: ASTParseResult = {
        filePath,
        language,
        status: "success",
        facts,
        contentHash,
        parseDurationMs: Date.now() - startTime,
      };

      // Store in memory cache
      this.incrementalCache.set(filePath, {
        contentHash,
        lastParsedAt: new Date().toISOString(),
        result,
      });

      return result;
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[ASTAnalyzer] Parse failed for ${filePath} (${language}):`, errorMsg);

      const failedResult: ASTParseResult = {
        filePath,
        language,
        status: "failed",
        error: errorMsg,
        facts: {
          symbols: [],
          imports: [],
          databaseCalls: [],
          httpEndpoints: [],
          tests: [],
          frameworks: [],
          errorHandlingCount: 0,
          rawLineCount: sourceCode.split(/\r?\n/).length,
        },
        contentHash,
        parseDurationMs: Date.now() - startTime,
      };

      return failedResult;
    }
  }

  /**
   * Batch analysis of multiple repository source files.
   */
  public static async analyzeRepository(
    files: Array<{ filePath: string; content: string }>
  ): Promise<ASTParseResult[]> {
    const results: ASTParseResult[] = [];
    for (const file of files) {
      const res = await this.analyzeFile(file.filePath, file.content);
      results.push(res);
    }
    return results;
  }

  /**
   * Invalidate or clear cache for removed files
   */
  public static invalidate(filePath: string) {
    this.incrementalCache.delete(filePath);
  }

  public static clearCache() {
    this.incrementalCache.clear();
  }

  private static computeHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

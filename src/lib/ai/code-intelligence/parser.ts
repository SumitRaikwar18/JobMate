/**
 * Code Intelligence - Real Multi-Language AST Parser Entry Point
 * Public API for language detection, syntax tree parsing, and evidence generation.
 */

export * from "./types";
export { LanguageDetector } from "./language-detector";
export { ASTAnalyzer } from "./ast-analyzer";
export { ASTEvidenceExtractor } from "./evidence-extractor";

import { LanguageDetector } from "./language-detector";
import { ASTAnalyzer } from "./ast-analyzer";
import { ASTEvidenceExtractor } from "./evidence-extractor";
import type { ASTParseResult, SupportedLanguage } from "./types";
import type { EvidenceItem } from "../evidence/evidence-types";

export class CodeIntelligence {
  /**
   * Complete pipeline: Detects language, parses AST, extracts structured code facts.
   */
  public static async parseSourceFile(
    filePath: string,
    sourceCode: string,
    forcedLanguage?: SupportedLanguage
  ): Promise<ASTParseResult> {
    return ASTAnalyzer.analyzeFile(filePath, sourceCode, forcedLanguage);
  }

  /**
   * End-to-end extraction from source code directly to verifiable EvidenceItems.
   */
  public static async extractEvidenceFromSource(
    filePath: string,
    sourceCode: string,
    context: {
      candidateId: string;
      repository: string;
      commitSha?: string;
      author?: string;
    }
  ): Promise<{ parseResult: ASTParseResult; evidenceItems: EvidenceItem[] }> {
    const parseResult = await ASTAnalyzer.analyzeFile(filePath, sourceCode);
    const evidenceItems = ASTEvidenceExtractor.extractEvidence(parseResult, context);
    return { parseResult, evidenceItems };
  }
}

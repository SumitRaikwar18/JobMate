/**
 * Language Detector
 * Accurately determines language using file extensions, paths, and manifest associations.
 */

import type { SupportedLanguage } from "./types";

const EXTENSION_MAP: Record<string, SupportedLanguage> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".mts": "typescript",
  ".cts": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".py": "python",
  ".pyw": "python",
  ".java": "java",
  ".go": "go",
  ".rs": "rust",
};

export interface LanguageDetectionResult {
  language: SupportedLanguage | "unsupported";
  confidence: number;
  detectedBy: "extension" | "filename" | "manifest_hint" | "heuristic";
}

export class LanguageDetector {
  /**
   * Detects the programming language for a given file path.
   */
  public static detectLanguage(
    filePath: string,
    fallbackHint?: string
  ): LanguageDetectionResult {
    const normalized = filePath.toLowerCase().trim();
    const ext = this.getFileExtension(normalized);

    if (ext && EXTENSION_MAP[ext]) {
      return {
        language: EXTENSION_MAP[ext],
        confidence: 0.99,
        detectedBy: "extension",
      };
    }

    // Check special filenames
    if (normalized.endsWith("dockerfile")) {
      return { language: "unsupported", confidence: 0.9, detectedBy: "filename" };
    }

    if (fallbackHint && this.isValidLanguage(fallbackHint)) {
      return {
        language: fallbackHint,
        confidence: 0.7,
        detectedBy: "manifest_hint",
      };
    }

    return {
      language: "unsupported",
      confidence: 0.0,
      detectedBy: "heuristic",
    };
  }

  /**
   * Analyzes an entire repository file tree to report language distribution.
   */
  public static detectRepositoryLanguages(
    fileTree: string[]
  ): Array<{ language: SupportedLanguage; fileCount: number; files: string[] }> {
    const langMap = new Map<SupportedLanguage, string[]>();

    for (const file of fileTree) {
      const cleanPath = file.replace(/^[📁📄\s]+/, "");
      const res = this.detectLanguage(cleanPath);
      if (res.language !== "unsupported") {
        const list = langMap.get(res.language) || [];
        list.push(cleanPath);
        langMap.set(res.language, list);
      }
    }

    const results: Array<{ language: SupportedLanguage; fileCount: number; files: string[] }> = [];
    for (const [language, files] of langMap.entries()) {
      results.push({
        language,
        fileCount: files.length,
        files,
      });
    }

    return results.sort((a, b) => b.fileCount - a.fileCount);
  }

  private static getFileExtension(path: string): string {
    const lastDot = path.lastIndexOf(".");
    if (lastDot === -1) return "";
    return path.substring(lastDot);
  }

  private static isValidLanguage(lang: string): lang is SupportedLanguage {
    const valid: SupportedLanguage[] = [
      "typescript",
      "javascript",
      "python",
      "java",
      "go",
      "rust",
    ];
    return valid.includes(lang.toLowerCase() as SupportedLanguage);
  }
}

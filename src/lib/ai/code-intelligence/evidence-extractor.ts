/**
 * AST Evidence Extractor
 * Converts structural AST code facts into verifiable, provenance-retaining EvidenceItem records.
 */

import type { EvidenceItem } from "../evidence/evidence-types";
import { EvidenceService } from "../evidence/evidence-service";
import type { ASTParseResult } from "./types";

export interface ASTEvidenceContext {
  candidateId: string;
  repository: string;
  commitSha?: string | undefined;
  author?: string | undefined;
  observedAt?: string | undefined;
}

export class ASTEvidenceExtractor {
  /**
   * Transforms an AST parse result into strongly typed, provenance-backed EvidenceItems.
   */
  public static extractEvidence(
    parseResult: ASTParseResult,
    context: ASTEvidenceContext
  ): EvidenceItem[] {
    if (parseResult.status !== "success") {
      return [];
    }

    const { filePath, facts, language, contentHash } = parseResult;
    const { candidateId, repository, commitSha, observedAt } = context;
    const now = observedAt || new Date().toISOString();
    const repoSlug = repository.replace(/\//g, "_");
    const fileSlug = filePath.replace(/[^a-zA-Z0-9]/g, "_");

    const evidenceItems: EvidenceItem[] = [];

    // 1. Extract HTTP Route Handlers (L4_SOURCE_CODE)
    for (const ep of facts.httpEndpoints) {
      const epSlug = `${ep.method}_${ep.path.replace(/[^a-zA-Z0-9]/g, "_")}`;
      evidenceItems.push({
        id: `ev_${repoSlug}_ast_route_${fileSlug}_${epSlug}`.slice(0, 80),
        candidateId,
        sourceType: "github",
        evidenceLevel: "L4_SOURCE_CODE",
        verificationStatus: "verified",
        title: `API Route: [${ep.method}] ${ep.path}`,
        content: `AST structural analysis confirmed HTTP route handler with framework ${ep.framework} in ${filePath}:${ep.range.startLine}-${ep.range.endLine}.`,
        sourceUri: `https://github.com/${repository}/blob/${commitSha || "main"}/${filePath}#L${ep.range.startLine}-L${ep.range.endLine}`,
        repository,
        filePath,
        commitSha,
        technologies: [language, ep.framework, "REST API"],
        concepts: ["API Engineering", "Backend Routing", "HTTP Handlers"],
        metrics: [],
        confidence: EvidenceService.calculateConfidence("L4_SOURCE_CODE", 2),
        observedAt: now,
      });
    }

    // 2. Extract Database / ORM Invocations (L4_SOURCE_CODE)
    for (const db of facts.databaseCalls) {
      const dbSlug = `${db.technology}_${db.operation}`;
      evidenceItems.push({
        id: `ev_${repoSlug}_ast_db_${fileSlug}_${dbSlug}`.slice(0, 80),
        candidateId,
        sourceType: "github",
        evidenceLevel: "L4_SOURCE_CODE",
        verificationStatus: "verified",
        title: `Database Operations: ${db.technology}`,
        content: `AST syntax analysis detected ${db.technology} (${db.operation}) in ${filePath}:${db.range.startLine}-${db.range.endLine}. Detail: ${db.detail}.`,
        sourceUri: `https://github.com/${repository}/blob/${commitSha || "main"}/${filePath}#L${db.range.startLine}-L${db.range.endLine}`,
        repository,
        filePath,
        commitSha,
        technologies: [language, db.technology],
        concepts: ["Database Persistence", "Data Access Layer", "ORM"],
        metrics: [],
        confidence: EvidenceService.calculateConfidence("L4_SOURCE_CODE", 2),
        observedAt: now,
      });
    }

    // 3. Extract Test Declarations & Assertions (L6_TEST_CI or L4_SOURCE_CODE)
    for (const test of facts.tests) {
      if (test.testNames.length > 0 || test.assertionsCount > 0) {
        evidenceItems.push({
          id: `ev_${repoSlug}_ast_test_${fileSlug}`.slice(0, 80),
          candidateId,
          sourceType: "github",
          evidenceLevel: "L6_TEST_CI",
          verificationStatus: "verified",
          title: `Automated Test Suite: ${test.framework}`,
          content: `AST analysis confirmed ${test.testType} test suite using ${test.framework} in ${filePath} containing ${test.testNames.length} test cases and ${test.assertionsCount} assertion checks.`,
          sourceUri: `https://github.com/${repository}/blob/${commitSha || "main"}/${filePath}#L${test.range.startLine}-L${test.range.endLine}`,
          repository,
          filePath,
          commitSha,
          technologies: [language, test.framework],
          concepts: ["Automated Testing", "Test-Driven Development", "Code Quality"],
          metrics: [
            { metricName: "test_case_count", observedValue: test.testNames.length, isQuantified: true },
            { metricName: "assertion_count", observedValue: test.assertionsCount, isQuantified: true },
          ],
          confidence: EvidenceService.calculateConfidence("L6_TEST_CI", 2),
          observedAt: now,
        });
      }
    }

    // 4. Extract Key Exported Symbols / Components / Structs (L4_SOURCE_CODE)
    for (const sym of facts.symbols) {
      if (!sym.isExported && sym.kind !== "react_component" && sym.kind !== "react_hook" && sym.kind !== "trait") {
        continue; // focus on core exported structural symbols
      }

      const symSlug = `${sym.kind}_${sym.name}`;
      const isReact = sym.kind === "react_component" || sym.kind === "react_hook";
      const techList: string[] = [language];
      if (isReact) techList.push("React");

      evidenceItems.push({
        id: `ev_${repoSlug}_ast_sym_${fileSlug}_${symSlug}`.slice(0, 80),
        candidateId,
        sourceType: "github",
        evidenceLevel: "L4_SOURCE_CODE",
        verificationStatus: "verified",
        title: `Structural Definition: ${sym.name} (${sym.kind})`,
        content: `AST verified ${sym.kind} "${sym.name}" in ${filePath}:${sym.range.startLine}-${sym.range.endLine} (hash: ${contentHash.slice(0, 8)}).`,
        sourceUri: `https://github.com/${repository}/blob/${commitSha || "main"}/${filePath}#L${sym.range.startLine}-L${sym.range.endLine}`,
        repository,
        filePath,
        commitSha,
        technologies: techList,
        concepts: isReact
          ? ["Frontend Architecture", "React Component Lifecycle"]
          : ["Software Architecture", "Type Systems", "Modular Design"],
        metrics: [],
        confidence: EvidenceService.calculateConfidence("L4_SOURCE_CODE", 1),
        observedAt: now,
      });
    }

    return evidenceItems;
  }
}

import { supabase } from "@/lib/supabase";
import type {
  EvidenceItem,
  EvidenceLevel,
  VerificationStatus,
  MetricEvidence,
} from "./evidence-types";
import { EVIDENCE_LEVEL_WEIGHTS } from "./evidence-types";

/**
 * Service for Managing Persistent Candidate Evidence Graph & DB Operations
 */
export class EvidenceService {
  /**
   * Computes truthful, evidence-derived confidence score based on tier, signals, and freshness.
   */
  public static calculateConfidence(
    level: EvidenceLevel,
    sourcesCount: number = 1,
    isStale: boolean = false
  ): number {
    const baseWeight = EVIDENCE_LEVEL_WEIGHTS[level] || 0.5;
    const diversityBoost = Math.min(0.12, (sourcesCount - 1) * 0.04);
    const stalenessPenalty = isStale ? 0.25 : 0.0;

    const rawScore = baseWeight + diversityBoost - stalenessPenalty;
    return Number(Math.max(0.1, Math.min(0.99, rawScore)).toFixed(2));
  }

  /**
   * Deterministic Temporal Freshness Evaluator
   * Fresh: <= 18 months
   * Aging: 18 months - 36 months
   * Stale: > 36 months (3 years)
   */
  public static evaluateFreshness(observedDate?: string): "FRESH" | "AGING" | "STALE" {
    if (!observedDate) return "FRESH";
    const date = new Date(observedDate);
    if (isNaN(date.getTime())) return "FRESH";

    const ageInMonths = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
    if (ageInMonths > 36) return "STALE";
    if (ageInMonths > 18) return "AGING";
    return "FRESH";
  }

  /**
   * Deterministic SHA-256 or string hash for idempotent deduplication
   */
  public static computeContentHash(content: string, repo: string = "", path: string = ""): string {
    const raw = `${repo}:${path}:${content.trim().toLowerCase()}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Persists an evidence item into Supabase candidate_evidence table with strict candidate isolation.
   */
  public static async saveEvidenceItem(item: Omit<EvidenceItem, "id"> & { id?: string }): Promise<EvidenceItem> {
    const contentHash = item.contentHash || this.computeContentHash(item.content, item.repository, item.filePath);
    const confidence = item.confidence || this.calculateConfidence(item.evidenceLevel);

    const record = {
      candidate_id: item.candidateId,
      source_type: item.sourceType,
      evidence_level: item.evidenceLevel,
      verification_status: item.verificationStatus,
      title: item.title,
      content: item.content,
      source_uri: item.sourceUri || null,
      repository: item.repository || null,
      file_path: item.filePath || null,
      line_start: item.lineStart || null,
      line_end: item.lineEnd || null,
      commit_sha: item.commitSha || null,
      pull_request_number: item.pullRequestNumber || null,
      technologies: item.technologies || [],
      concepts: item.concepts || [],
      metrics: item.metrics || [],
      confidence,
      content_hash: contentHash,
      metadata: item.metadata || {},
      observed_at: item.observedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("candidate_evidence")
        .upsert(record as any)
        .select()
        .single();

      if (error) {
        console.warn("[EvidenceService] Upsert error in DB:", error.message);
      }

      return {
        id: data ? (data as any).id : `ev_local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        candidateId: item.candidateId,
        sourceType: item.sourceType,
        evidenceLevel: item.evidenceLevel,
        verificationStatus: item.verificationStatus,
        title: item.title,
        content: item.content,
        sourceUri: item.sourceUri,
        repository: item.repository,
        filePath: item.filePath,
        lineStart: item.lineStart,
        lineEnd: item.lineEnd,
        commitSha: item.commitSha,
        pullRequestNumber: item.pullRequestNumber,
        technologies: item.technologies,
        concepts: item.concepts,
        metrics: item.metrics,
        confidence,
        contentHash,
        metadata: item.metadata,
        observedAt: item.observedAt,
      };
    } catch {
      return {
        id: `ev_local_${Date.now()}`,
        ...item,
        confidence,
        contentHash,
      };
    }
  }

  /**
   * Retrieves all evidence items for a given candidate with RLS isolation.
   */
  public static async getCandidateEvidence(candidateId: string): Promise<EvidenceItem[]> {
    try {
      const { data, error } = await supabase
        .from("candidate_evidence")
        .select("*")
        .eq("candidate_id", candidateId);

      if (error || !data) {
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        candidateId: row.candidate_id,
        sourceType: row.source_type,
        evidenceLevel: row.evidence_level,
        verificationStatus: row.verification_status,
        title: row.title,
        content: row.content,
        sourceUri: row.source_uri,
        repository: row.repository,
        filePath: row.file_path,
        lineStart: row.line_start,
        lineEnd: row.line_end,
        commitSha: row.commit_sha,
        pullRequestNumber: row.pull_request_number,
        technologies: row.technologies || [],
        concepts: row.concepts || [],
        metrics: row.metrics || [],
        confidence: row.confidence,
        contentHash: row.content_hash,
        metadata: row.metadata || {},
        observedAt: row.observed_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Evaluates skill freshness (marks technologies not observed in 12+ months as stale).
   */
  public static assessFreshness(evidenceList: EvidenceItem[]): Map<string, { lastObserved: string; isStale: boolean }> {
    const freshnessMap = new Map<string, { lastObserved: string; isStale: boolean }>();
    const oneYearAgoMs = Date.now() - 365 * 24 * 60 * 60 * 1000;

    for (const item of evidenceList) {
      const itemTime = new Date(item.observedAt).getTime();
      for (const tech of item.technologies) {
        const key = tech.toLowerCase();
        const existing = freshnessMap.get(key);
        if (!existing || itemTime > new Date(existing.lastObserved).getTime()) {
          freshnessMap.set(key, {
            lastObserved: item.observedAt,
            isStale: itemTime < oneYearAgoMs,
          });
        }
      }
    }

    return freshnessMap;
  }
}

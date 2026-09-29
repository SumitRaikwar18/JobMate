import type { EvidenceItem, SourceType } from "../schemas/evidence-schema";

export interface ChunkOptions {
  maxChunkSize?: number | undefined; // in characters, default 600
  chunkOverlap?: number | undefined; // in characters, default 100
}

export interface RawDocumentInput {
  candidateId: string;
  sourceType: SourceType;
  sourceId?: string | undefined;
  sourceUrl?: string | undefined;
  title?: string | undefined;
  rawText: string;
  metadata?: Record<string, unknown> | undefined;
}

const COMMON_TECH_PATTERNS = [
  "typescript", "javascript", "python", "golang", "go", "rust", "c++", "c#", "java", "sql",
  "react", "next.js", "node.js", "express", "fastapi", "vue", "angular", "tailwind",
  "postgresql", "postgres", "supabase", "mongodb", "redis", "mysql", "dynamodb",
  "docker", "kubernetes", "aws", "gcp", "azure", "graphql", "rest", "grpc", "ci/cd",
  "rag", "llm", "embeddings", "pgvector", "langchain", "langgraph", "pytorch", "tensorflow",
  "vitest", "jest", "playwright", "cypress", "kafka", "rabbitmq", "linux"
];

const METRIC_REGEX = /(\b\d+(?:\.\d+)?%|\$\d+(?:\.\d+)?(?:k|m|b)?|\b\d+(?:k|m|b|\+)\b|\b\d+\s*(?:ms|seconds|minutes|hours|days|requests|users|rps|tps|req\/s))/gi;

/**
 * Extracts recognized technology tags from text
 */
export function extractTechnologiesFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const matched = new Set<string>();

  for (const tech of COMMON_TECH_PATTERNS) {
    const escaped = tech.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(?:^|[^a-z0-9_])${escaped}(?:$|[^a-z0-9_])`, "i");
    if (regex.test(lower)) {
      matched.add(tech);
    }
  }

  return Array.from(matched);
}

/**
 * Extracts quantifiable metrics mentioned in the text
 */
export function extractMetricsFromText(text: string): Array<{ metricName: string; metricValue: string; context?: string | undefined }> {
  const metrics: Array<{ metricName: string; metricValue: string; context?: string | undefined }> = [];
  const matches = text.match(METRIC_REGEX);

  if (matches) {
    for (const match of matches) {
      metrics.push({
        metricName: "quantifiable_metric",
        metricValue: match.trim(),
        context: text.slice(0, 150),
      });
    }
  }

  return metrics;
}

/**
 * Chunks a raw document into semantic EvidenceItems
 */
export function chunkDocument(doc: RawDocumentInput, options: ChunkOptions = {}): EvidenceItem[] {
  const maxChunkSize = options.maxChunkSize || 600;
  const chunkOverlap = options.chunkOverlap || 100;
  const text = doc.rawText.trim();

  if (!text) return [];

  // If text is short enough, keep it as a single chunk
  if (text.length <= maxChunkSize) {
    const technologies = extractTechnologiesFromText(text);
    const metrics = extractMetricsFromText(text);

    return [
      {
        id: `chunk-${doc.sourceType}-${Math.random().toString(36).slice(2, 9)}`,
        candidateId: doc.candidateId,
        sourceType: doc.sourceType,
        sourceId: doc.sourceId,
        sourceUrl: doc.sourceUrl,
        title: doc.title || `${doc.sourceType} evidence`,
        content: text,
        technologies,
        concepts: [],
        metrics,
        verified: true,
        confidence: 1.0,
        metadata: doc.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  // Split by double newlines or bullet points first
  const sections = text.split(/\n\s*\n|(?:\r?\n)(?=[•\-\*]|\d+\.)/);
  const chunks: EvidenceItem[] = [];
  let currentBuffer = "";

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    if (currentBuffer.length + trimmed.length + 1 <= maxChunkSize) {
      currentBuffer = currentBuffer ? `${currentBuffer}\n${trimmed}` : trimmed;
    } else {
      if (currentBuffer) {
        const technologies = extractTechnologiesFromText(currentBuffer);
        const metrics = extractMetricsFromText(currentBuffer);
        chunks.push({
          id: `chunk-${doc.sourceType}-${Math.random().toString(36).slice(2, 9)}`,
          candidateId: doc.candidateId,
          sourceType: doc.sourceType,
          sourceId: doc.sourceId,
          sourceUrl: doc.sourceUrl,
          title: doc.title || `${doc.sourceType} evidence`,
          content: currentBuffer,
          technologies,
          concepts: [],
          metrics,
          verified: true,
          confidence: 1.0,
          metadata: doc.metadata || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // If single section exceeds maxChunkSize, sliding window chunking
      if (trimmed.length > maxChunkSize) {
        let start = 0;
        while (start < trimmed.length) {
          const end = Math.min(start + maxChunkSize, trimmed.length);
          const subText = trimmed.slice(start, end).trim();
          if (subText) {
            const technologies = extractTechnologiesFromText(subText);
            const metrics = extractMetricsFromText(subText);
            chunks.push({
              id: `chunk-${doc.sourceType}-${Math.random().toString(36).slice(2, 9)}`,
              candidateId: doc.candidateId,
              sourceType: doc.sourceType,
              sourceId: doc.sourceId,
              sourceUrl: doc.sourceUrl,
              title: doc.title || `${doc.sourceType} evidence`,
              content: subText,
              technologies,
              concepts: [],
              metrics,
              verified: true,
              confidence: 1.0,
              metadata: doc.metadata || {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
          start += maxChunkSize - chunkOverlap;
        }
        currentBuffer = "";
      } else {
        currentBuffer = trimmed;
      }
    }
  }

  if (currentBuffer) {
    const technologies = extractTechnologiesFromText(currentBuffer);
    const metrics = extractMetricsFromText(currentBuffer);
    chunks.push({
      id: `chunk-${doc.sourceType}-${Math.random().toString(36).slice(2, 9)}`,
      candidateId: doc.candidateId,
      sourceType: doc.sourceType,
      sourceId: doc.sourceId,
      sourceUrl: doc.sourceUrl,
      title: doc.title || `${doc.sourceType} evidence`,
      content: currentBuffer,
      technologies,
      concepts: [],
      metrics,
      verified: true,
      confidence: 1.0,
      metadata: doc.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return chunks;
}

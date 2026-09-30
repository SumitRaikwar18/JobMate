import { supabase } from "@/lib/supabase";
import { chunkDocument, type RawDocumentInput } from "./chunker";
import { generateBatchEmbeddingsServerFn } from "./embedding-service";
import type { EvidenceItem, SourceType } from "../schemas/evidence-schema";

export interface IngestCandidateDataInput {
  userId: string;
  sourceType: SourceType;
  sourceId?: string | undefined;
  sourceUrl?: string | undefined;
  title: string;
  rawText: string;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Ingests raw candidate documents/experiences/projects into Supabase candidate_evidence
 * Chunks text, generates vector embeddings, and stores with RLS.
 */
export async function ingestCandidateEvidence(
  input: IngestCandidateDataInput
): Promise<EvidenceItem[]> {
  const doc: RawDocumentInput = {
    candidateId: input.userId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    sourceUrl: input.sourceUrl,
    title: input.title,
    rawText: input.rawText,
    metadata: input.metadata,
  };

  const chunks = chunkDocument(doc, { maxChunkSize: 600, chunkOverlap: 80 });
  if (chunks.length === 0) return [];

  // Generate vector embeddings in batch
  const textsToEmbed = chunks.map((c) => `${c.title || ""} ${c.content}`);
  let embeddings: number[][] = [];

  try {
    const embResult = await generateBatchEmbeddingsServerFn({
      data: { texts: textsToEmbed, model: "openai/text-embedding-3-small" },
    });
    embeddings = embResult.embeddings;
  } catch (err) {
    console.warn("[EvidenceIngestion] Embedding generation fallback:", err);
  }

  // Upsert into Supabase candidate_evidence table
  const rowsToInsert = chunks.map((chunk, idx) => ({
    candidate_id: input.userId,
    user_id: input.userId,
    source_type: chunk.sourceType,
    source_id: chunk.sourceId,
    source_url: chunk.sourceUrl,
    title: chunk.title,
    content: chunk.content,
    technologies: chunk.technologies,
    concepts: chunk.concepts,
    metrics: chunk.metrics,
    embedding: embeddings[idx] || null,
    verified: chunk.verified,
    confidence: chunk.confidence,
    metadata: chunk.metadata,
  }));

  try {
    const { data, error } = await supabase
      .from("candidate_evidence")
      .insert(rowsToInsert)
      .select();

    if (error) {
      console.warn("[EvidenceIngestion] Supabase candidate_evidence insert error:", error);
    }
  } catch (err) {
    console.warn("[EvidenceIngestion] Failed storing evidence to Supabase:", err);
  }

  return chunks;
}

/**
 * Fetch all candidate evidence items for a given user from Supabase
 */
export async function fetchUserCandidateEvidence(userId: string): Promise<EvidenceItem[]> {
  try {
    const { data, error } = await supabase
      .from("candidate_evidence")
      .select("*")
      .or(`candidate_id.eq.${userId},user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      candidateId: row.candidate_id || row.user_id,
      sourceType: row.source_type,
      sourceId: row.source_id,
      sourceUrl: row.source_url,
      title: row.title,
      content: row.content,
      technologies: row.technologies || [],
      concepts: row.concepts || [],
      metrics: row.metrics || [],
      verified: row.verified ?? false,
      confidence: row.confidence ?? 0.5,
      metadata: {
        ...(row.metadata || {}),
        embedding: row.embedding,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch {
    return [];
  }
}

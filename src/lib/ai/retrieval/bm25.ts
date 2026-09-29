import type { EvidenceItem } from "../schemas/evidence-schema";

export interface BM25Doc {
  id: string;
  tokens: string[];
  original: EvidenceItem;
}

export interface BM25SearchResult {
  item: EvidenceItem;
  bm25Score: number;
}

/**
 * Tokenizes text into lowercase alphanumeric tokens with stopword filtering
 */
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with",
  "by", "about", "against", "between", "into", "through", "during", "before",
  "after", "above", "below", "from", "up", "down", "is", "are", "was", "were",
  "be", "been", "being", "have", "has", "had", "having", "do", "does", "did",
  "doing", "can", "could", "should", "would", "shall", "will", "this", "that",
  "these", "those", "it", "its", "they", "them", "their", "we", "our", "you"
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#_.-]/g, " ")
    .split(/\s+/)
    .filter((tok) => tok.length > 1 && !STOPWORDS.has(tok));
}

/**
 * BM25 Okapi Lexical Retriever
 * k1 = 1.5, b = 0.75
 */
export class BM25Index {
  private docs: BM25Doc[] = [];
  private avgDocLength = 0;
  private docFrequencies = new Map<string, number>();
  private totalDocs = 0;
  private k1: number;
  private b: number;

  constructor(items: EvidenceItem[], k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
    this.index(items);
  }

  public index(items: EvidenceItem[]) {
    this.docs = [];
    this.docFrequencies.clear();
    let totalTokens = 0;

    for (const item of items) {
      const fullText = `${item.title || ""} ${item.content} ${(item.technologies || []).join(" ")} ${(item.concepts || []).join(" ")}`;
      const tokens = tokenize(fullText);
      totalTokens += tokens.length;

      const uniqueTokensInDoc = new Set(tokens);
      for (const tok of uniqueTokensInDoc) {
        this.docFrequencies.set(tok, (this.docFrequencies.get(tok) || 0) + 1);
      }

      this.docs.push({
        id: item.id,
        tokens,
        original: item,
      });
    }

    this.totalDocs = this.docs.length;
    this.avgDocLength = this.totalDocs > 0 ? totalTokens / this.totalDocs : 0;
  }

  public search(query: string, topK = 10): BM25SearchResult[] {
    if (this.totalDocs === 0) return [];

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const scores: Array<{ doc: BM25Doc; score: number }> = [];

    for (const doc of this.docs) {
      let score = 0;
      const docLength = doc.tokens.length;

      // Count term frequencies in this doc
      const tfMap = new Map<string, number>();
      for (const tok of doc.tokens) {
        tfMap.set(tok, (tfMap.get(tok) || 0) + 1);
      }

      for (const qTok of queryTokens) {
        const tf = tfMap.get(qTok) || 0;
        if (tf === 0) continue;

        const df = this.docFrequencies.get(qTok) || 0;
        // IDF calculation with floor of 0
        const idf = Math.max(0, Math.log((this.totalDocs - df + 0.5) / (df + 0.5) + 1));

        // Okapi BM25 TF component
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / (this.avgDocLength || 1)));

        score += idf * (numerator / denominator);
      }

      if (score > 0) {
        scores.push({ doc, score });
      }
    }

    scores.sort((a, b) => b.score - a.score);

    const maxScore = scores[0]?.score || 1;
    return scores.slice(0, topK).map(({ doc, score }) => ({
      item: doc.original,
      bm25Score: Math.min(1, score / maxScore), // normalized 0..1
    }));
  }
}

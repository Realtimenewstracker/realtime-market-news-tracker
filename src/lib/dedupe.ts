const STOPWORDS = new Set([
  "the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "at", "by", "with",
  "as", "is", "are", "was", "were", "be", "from", "after", "over", "amid", "its",
  "it", "that", "this", "than", "up", "down", "new", "says", "say", "said", "will",
]);

/** Normalized significant-word set for a headline. */
function tokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

/** Jaccard-style overlap, normalized by the shorter headline. */
function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

export type DedupeRow = {
  title: string;
  source?: string | null;
  impact?: number | null;
  published_at?: string | null;
};

/**
 * Collapses near-identical headlines coming from different wires.
 * Keeps the first (most recent, since input is sorted) occurrence of each story
 * and records how many other sources carried it.
 */
export function dedupeByTitle<T extends DedupeRow>(
  rows: T[],
  threshold = 0.62,
): (T & { duplicate_count: number; duplicate_sources: string[] })[] {
  const kept: {
    row: T & { duplicate_count: number; duplicate_sources: string[] };
    words: Set<string>;
  }[] = [];

  for (const row of rows) {
    const words = tokens(row.title ?? "");
    const match = kept.find((k) => similarity(k.words, words) >= threshold);
    if (match) {
      match.row.duplicate_count += 1;
      const src = row.source ?? null;
      if (src && !match.row.duplicate_sources.includes(src)) {
        match.row.duplicate_sources.push(src);
      }
      // Prefer the strongest impact signal across the cluster.
      if ((row.impact ?? 0) > (match.row.impact ?? 0)) {
        match.row.impact = row.impact;
      }
      continue;
    }
    kept.push({ row: { ...row, duplicate_count: 0, duplicate_sources: [] }, words });
  }

  return kept.map((k) => k.row);
}

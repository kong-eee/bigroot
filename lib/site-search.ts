import { getSiteSearchIndex, type SiteSearchEntry } from '@/lib/site-search-index';

export type SiteSearchResult = {
  id: string;
  pageLabel: string;
  section: string;
  snippet: string;
  href: string;
  source: 'page' | 'community';
  score: number;
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function tokenize(query: string): string[] {
  const q = normalize(query);
  if (!q) return [];
  return [...new Set(q.split(/[\s,]+/).filter((t) => t.length >= 1))];
}

function scoreEntry(entry: SiteSearchEntry, tokens: string[], rawQuery: string): number {
  const haystack = normalize(
    [entry.pageLabel, entry.section, entry.text, ...(entry.keywords ?? [])].join(' ')
  );
  const q = normalize(rawQuery);
  let score = 0;

  if (haystack.includes(q)) score += 12;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 4;
    if (entry.pageLabel.toLowerCase().includes(token)) score += 3;
    if (entry.section.toLowerCase().includes(token)) score += 2;
  }
  return score;
}

function makeSnippet(text: string, query: string, maxLen = 120): string {
  const q = query.trim();
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!q) return compact.slice(0, maxLen) + (compact.length > maxLen ? '…' : '');

  const lower = compact.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) {
    for (const token of tokenize(q)) {
      const tIdx = lower.indexOf(token);
      if (tIdx !== -1) {
        const start = Math.max(0, tIdx - 30);
        const slice = compact.slice(start, start + maxLen);
        return (start > 0 ? '…' : '') + slice + (start + maxLen < compact.length ? '…' : '');
      }
    }
    return compact.slice(0, maxLen) + (compact.length > maxLen ? '…' : '');
  }

  const start = Math.max(0, idx - 28);
  const slice = compact.slice(start, start + maxLen);
  return (start > 0 ? '…' : '') + slice + (start + maxLen < compact.length ? '…' : '');
}

export function searchSiteIndex(query: string, limit = 20): SiteSearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  const tokens = tokenize(trimmed);
  const index = getSiteSearchIndex();

  const scored = index
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, tokens, trimmed),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ entry, score }) => ({
    id: entry.id,
    pageLabel: entry.pageLabel,
    section: entry.section,
    snippet: makeSnippet(entry.text, trimmed),
    href: entry.href,
    source: 'page' as const,
    score,
  }));
}

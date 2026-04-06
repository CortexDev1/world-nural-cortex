import type { KnowledgeData } from './types';

export interface SearchResult {
  id: string;
  name: string;
  description: string;
  domain: string;
  type: 'skill' | 'agent' | 'report' | 'course';
  score: number;
}

/**
 * Client-side full-text search over the flat knowledge data.
 * Falls back gracefully when data is not loaded yet.
 */
export function searchArticles(
  data: KnowledgeData | null,
  query: string,
): SearchResult[] {
  if (!data || !query.trim()) return [];

  const q = query.toLowerCase();

  const allItems: SearchResult[] = [
    ...data.skills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      domain: s.domain,
      type: 'skill' as const,
      score: 0,
    })),
    ...data.agents.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      domain: a.domain,
      type: 'agent' as const,
      score: 0,
    })),
    ...data.reports.map((r) => ({
      id: r.id,
      name: r.title,
      description: r.type,
      domain: r.domain,
      type: 'report' as const,
      score: 0,
    })),
  ];

  return allItems
    .map((item) => {
      let score = 0;
      const nameLower = item.name.toLowerCase();
      const descLower = item.description.toLowerCase();
      // Exact name match gets highest score
      if (nameLower === q) score += 10;
      else if (nameLower.startsWith(q)) score += 6;
      else if (nameLower.includes(q)) score += 4;
      // Description match
      if (descLower.includes(q)) score += 2;
      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

import type { KnowledgeData } from './types';

let cachedData: KnowledgeData | null = null;

export async function getKnowledgeData(): Promise<KnowledgeData> {
  if (cachedData) return cachedData;
  const res = await fetch('/data/knowledge.json');
  cachedData = await res.json();
  return cachedData!;
}

// For server components - read from filesystem
import { readFileSync } from 'fs';
import { join } from 'path';

export function getKnowledgeDataSync(): KnowledgeData {
  const filePath = join(process.cwd(), 'public', 'data', 'knowledge.json');
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

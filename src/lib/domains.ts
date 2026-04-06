import type { DomainId } from './types';

export interface DomainConfig {
  id: DomainId;
  label: string;
  color: string;
  icon: string;
}

export const DOMAINS: DomainConfig[] = [
  { id: 'ai',          label: 'Artificial Intelligence', color: '#3B82F6', icon: '\u{1F9E0}' },
  { id: 'fashion',     label: 'Fashion & Design',        color: '#C9A84C', icon: '\u{1F451}' },
  { id: 'academic',    label: 'Academic Research',       color: '#22C55E', icon: '\u{1F393}' },
  { id: 'business',    label: 'Business & Strategy',     color: '#A855F7', icon: '\u{1F4C8}' },
  { id: 'career',      label: 'Career Development',      color: '#EF4444', icon: '\u{1F680}' },
  { id: 'engineering', label: 'Software Engineering',    color: '#06B6D4', icon: '\u2699\uFE0F' },
];

export const DOMAIN_MAP: Record<DomainId, DomainConfig> = Object.fromEntries(
  DOMAINS.map((d) => [d.id, d])
) as Record<DomainId, DomainConfig>;

export function getDomain(id: DomainId): DomainConfig {
  return DOMAIN_MAP[id] ?? DOMAINS[0];
}
